import os
import requests
import json
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

# --- DB 연결 라이브러리 ---
import mysql.connector

# --- OCR/분석 라이브러리 ---
from PIL import Image
import pytesseract
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import cv2
import numpy as np

load_dotenv()

# --- 환경 변수 설정 ---
FRONT_ORIGIN = os.getenv("FRONT_ORIGIN", "*")
# 주의: B 서버(Gemini)의 IP가 바뀌었으면 여기를 꼭 수정해야 합니다.
AI_BASE_URL = os.getenv("AI_BASE_URL", "http://0.0.0.0:5002") 
AI_API_KEY = os.getenv("AI_API_KEY", "")
PORT = int(os.getenv("PORT", "4000"))

# --- DB 환경 변수 ---
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "protect_house")

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": FRONT_ORIGIN}}, supports_credentials=True)

# --- Tesseract 경로 설정 ---
# 본인 컴퓨터의 Tesseract 설치 경로로 수정 필요
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'


# --- [함수 1] DB 연결 헬퍼 함수 ---
def get_db_connection():
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )

# --- [함수 2] 이미지에서 텍스트 추출 (OCR + 전처리) ---
def extract_text_from_image(image_path):
    try:
        # 한글 경로 파일 읽기 (cv2.imread 대신 사용)
        stream = open(image_path, "rb")
        bytes_data = bytearray(stream.read())
        numpy_array = np.asarray(bytes_data, dtype=np.uint8)
        img_cv = cv2.imdecode(numpy_array, cv2.IMREAD_UNCHANGED)
        
        if img_cv is None:
            return f"오류 발생: OpenCV가 이미지 파일을 디코딩할 수 없습니다."

        # 이미지 전처리 (흑백 변환 -> 이진화)
        img_gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        img_binary = cv2.adaptiveThreshold(
            img_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
        )
        
        img_pil = Image.fromarray(img_binary)
        text = pytesseract.image_to_string(img_pil, lang='kor')
        return text
    except Exception as e:
        return f"오류 발생: {e}"

# --- [함수 3] AI 모델로 위험도 예측 ---
def predict_risk(text):
    # saved_model 폴더가 app.py와 같은 위치에 있어야 합니다.
    model_path = "./saved_model"
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        model = AutoModelForSequenceClassification.from_pretrained(model_path)
        
        inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
        with torch.no_grad():
            logits = model(**inputs).logits
        
        prediction = torch.argmax(logits, dim=-1).item()
        label_map = {
            0: "전세 사기 위험", 1: "월세 보증금 사기 위험", 2: "매매 사기 위험",
            3: "공통 위험", 4: "안전 또는 일반 정보"
        }
        return label_map.get(prediction, "판단 불가")
    except Exception as e:
        print(f"모델 예측 중 오류 발생: {e}")
        return "분석 실패"

# --- [함수 4] 위험 키워드 찾기 ---
def find_risk_keywords(text):
    risk_keywords = ["근저당", "압류", "가압류", "신탁", "체납", "위반건축물", "이중계약"]
    found_keywords = []
    if text and isinstance(text, str):
        for keyword in risk_keywords:
            if keyword in text:
                found_keywords.append(keyword)
    return found_keywords


# ==========================================
# API 엔드포인트 (라우트)
# ==========================================

# 1. 회원가입 API (DB 저장)
@app.post("/api/signup")
def signup():
    try:
        data = request.get_json()
        
        # 프론트에서 보낸 데이터 받기 (user_id는 없으면 username으로 대체하거나 생성 로직 필요)
        # 여기서는 간단히 username을 user_id로 사용한다고 가정
        username = data.get("username")
        user_id = username 
        nickname = data.get("nickname")
        email = data.get("email")
        password = data.get("password") 
        preference = data.get("preferType") # 프론트에서 'preferType'으로 보냄

        conn = get_db_connection()
        cursor = conn.cursor()
        
        sql = """
            INSERT INTO users (user_id, nickname, email, username, password, created_at, preference)
            VALUES (%s, %s, %s, %s, %s, NOW(), %s)
        """
        cursor.execute(sql, (user_id, nickname, email, username, password, preference))
        
        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"message": "회원가입 성공"}), 201

    except mysql.connector.Error as err:
        return jsonify({"error": f"DB 오류: {err}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 2. 문서 분석 API (OCR -> AI -> Gemini -> DB 저장)
@app.post("/api/analyze-document")
def analyze_document():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    user_message = request.form.get('message', '') 

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        filename = secure_filename(file.filename)
        os.makedirs("uploads", exist_ok=True)
        temp_path = os.path.join("uploads", filename)
        file.save(temp_path)

        try:
            # 1. OCR 및 1차 분석
            extracted_text = extract_text_from_image(temp_path)
            if "오류 발생" in extracted_text:
                return jsonify({"error": extracted_text}), 500

            risk_label = predict_risk(extracted_text)
            keywords = find_risk_keywords(extracted_text)

            # 2. Gemini 프롬프트 생성
            prompt_for_gemini = (
                f"너는 부동산 위험 분석 전문가야.\n"
                f"다음은 사용자가 업로드한 부동산 서류를 OCR로 읽은 텍스트야:\n"
                f"----- 문서 시작 -----\n"
                f"{extracted_text}\n"
                f"----- 문서 끝 -----\n\n"
                f"내 시스템의 1차 분석 결과는 '{risk_label}'이고, 발견된 키워드는 '{', '.join(keywords) if keywords else '없음'}'야.\n"
                f"하지만 **가장 중요한 건 사용자의 질문**이야. 사용자가 '{user_message}'라고 물어봤어.\n\n"
                "🔴 **중요 지침**:\n"
                "1. 사용자의 질문에 맞는 거래 유형(월세/전세/매매)의 관점에서 이 서류의 위험성을 다시 판단해.\n"
                "2. 답변은 다음 형식으로 핵심만 정리해:\n"
                "   - **사용자 질문 확인**: \n"
                "   - **서류 분석 결과**: \n"
                "   - **필수 확인 사항**: 3가지 리스트\n"
            )

            # 3. Gemini 서버(B)로 전송
            payload = {
                "messages": [{"role": "user", "content": prompt_for_gemini}]
            }
            r = requests.post(
                f"{AI_BASE_URL}/v1/chat",
                json=payload,
                headers={"x-ai-key": AI_API_KEY, "Content-Type": "application/json"},
                timeout=60
            )
            
            # Gemini 응답 데이터 파싱 (DB 저장을 위해)
            if r.status_code == 200:
                gemini_response = r.json()
                reply_text = gemini_response.get("reply", "")
                
                # ★ 4. 상담 결과 DB 저장 ★
                # (주의: 실제 서비스에선 로그인된 유저 ID를 세션에서 가져와야 함. 여기선 임시 ID 사용)
                try:
                    conn = get_db_connection()
                    cursor = conn.cursor()
                    
                    # 테스트용 유저 ID (users 테이블에 'test_user_01'이 미리 있어야 에러 안 남)
                    # 실제 로그인 연동 시에는 request.headers나 토큰에서 user_id 추출 필요
                    test_user_id = 'test_user_01' 
                    
                    # user_id가 존재하는지 먼저 확인 (없으면 저장 건너뜀)
                    cursor.execute("SELECT user_id FROM users WHERE user_id = %s", (test_user_id,))
                    if cursor.fetchone():
                        sql = """
                            INSERT INTO consultations 
                            (user_id, submitted_image_url, risk_level, analysis_text, created_at, analyzed_at)
                            VALUES (%s, %s, %s, %s, NOW(), NOW())
                        """
                        # 이미지 경로는 웹 접근 가능한 경로로 저장해야 하지만, 여기선 파일명만 저장
                        cursor.execute(sql, (test_user_id, filename, risk_label, reply_text))
                        conn.commit()
                    else:
                        print(f"DB 저장 건너뜀: '{test_user_id}' 사용자가 users 테이블에 없습니다.")

                    cursor.close()
                    conn.close()
                except Exception as db_err:
                    print(f"DB 저장 중 오류 발생 (사용자 응답에는 영향 없음): {db_err}")

            # 5. 프론트엔드로 응답 반환 (투명 프록시 방식)
            return (r.content, r.status_code, r.headers.items())

        except Exception as e:
            return jsonify({"error": str(e)}), 500
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)


# 3. 텍스트 채팅 (단발)
@app.post("/api/chat")
def chat_once():
    try:
        payload = request.get_json(force=True, silent=True) or {}
        r = requests.post(
            f"{AI_BASE_URL}/v1/chat",
            json=payload,
            headers={"x-ai-key": AI_API_KEY, "Content-Type": "application/json"},
            timeout=60
        )
        return (r.content, r.status_code, r.headers.items())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 4. 텍스트 채팅 (스트리밍)
@app.get("/api/chat/stream")
def chat_stream():
    try:
        upstream = requests.get(
            f"{AI_BASE_URL}/v1/chat/stream",
            headers={"x-ai-key": AI_API_KEY},
            stream=True,
            timeout=300
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    def event_stream():
        try:
            for chunk in upstream.iter_content(chunk_size=1024):
                if chunk:
                    yield chunk
        except Exception:
            pass
    
    headers = {key: value for key, value in upstream.headers.items() if key.lower() in ['content-type', 'x-accel-buffering']}
    return Response(event_stream(), headers=headers)

# --- [추가] 사용자 목록 조회 API (테스트용) ---
@app.get("/users")
def get_users():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True) # 결과를 딕셔너리 형태로 받기
        
        # users 테이블의 모든 데이터 조회
        cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # 조회된 데이터를 JSON 형식으로 화면에 보여줌
        return jsonify(users), 200

    except Exception as e:
        logger.error(f"사용자 조회 중 오류: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, threaded=True)

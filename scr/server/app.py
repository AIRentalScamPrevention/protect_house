import os
import requests
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from dotenv import load_dotenv

from PIL import Image
import pytesseract
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import cv2
import numpy as np
from werkzeug.utils import secure_filename

load_dotenv()

FRONT_ORIGIN = os.getenv("FRONT_ORIGIN", "*")
AI_BASE_URL = os.getenv("AI_BASE_URL", "http://localhost:5002") 
AI_API_KEY = os.getenv("AI_API_KEY", "")
PORT = int(os.getenv("PORT", "4000"))

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": FRONT_ORIGIN}}, supports_credentials=True)

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def extract_text_from_image(image_path) :
    """이미지 파일을 읽고 전처리 한 뒤 텍스트 추출"""
    try :
        stream = open(image_path, "rb")
        bytes = bytearray(stream.read())
        numpy_array = np.asarray(bytes, dtype=np.uint8)
        img_cv = cv2.imdecode(numpy_array, cv2.IMREAD_UNCHANGED)

        if img_cv is None :
            return f"오류 발생: OpenCV가 이미지 파일을 디코딩할 수 없습니다."
        
        img_gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        img_binary = cv2.adaptiveThreshold(img_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2)
        img_pil = Image.fromarray(img_binary)
        text = pytesseract.image_to_string(img_pil, lang='kor')
        return text
    except Exception as e :
        return f"오류 발생 : {e}"
    
def predict_risk(text) : 
    """추출된 텍스트를 KLUE 모델로 분석하여 위험도를 판단합니다."""
    model_path = "./saved_model"
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    with torch.no_grad() :
        logits = model(**inputs).logits
    prediction = torch.argmax(logits, dim=-1).item()
    label_map = {
        0: "전세 사기 위험", 1: "월세 보증금 사기 위험", 2: "매매 사기 위험",
        3: "공통 위험", 4: "안전 또는 일반 정보"
    }
    return label_map.get(prediction, "판단 불가")

def find_risk_keywords(text) :
    """텍스트에서 위험과 관련된 핵심 키워드를 찾습니다."""
    risk_keywords = ["근저당", "압류", "가압류", "신탁", "체납", "위반건축물", "이중계약"]
    found_keywords = []
    if text and isinstance(text, str) :
        for keyword in risk_keywords :
            if keyword in text :
                found_keywords.append(keyword)
    return found_keywords

# --- 파일 분석 API ---
@app.post("/api/analyze-document")
def analyze_document() :
    if 'file' not in request.files :
        return jsonify({"error" : "No file part"}), 400
    
    file = request.files['file']
    user_message = request.form.get('message','')
    if file.filename == '' :
        return jsonify({"error" : "No selected file"}), 400
    
    if file :
        filename = secure_filename(file.filename)
        os.makedirs("uploads", exist_ok=True)
        temp_path = os.path.join("uploads", filename)
        file.save(temp_path)

        try :
            # 1. OCR 및 1차 분석 수행
            extracted_text = extract_text_from_image(temp_path)
            if "오류 발생" in extracted_text :
                return jsonify({"error" : extracted_text}), 500
            
            risk_label = predict_risk(extracted_text)
            keywords = find_risk_keywords(extracted_text)

            # 2. Gemini(B 서버) 보낼 상세한 요청 메시지 생성
            prompt_for_gemini = (
                f"너는 부동산 위험 분석 전문가야. 내가 업로드한 서류를 1차 분석한 결과, '{risk_label}'로 판단되었고, "
                f"'{', '.join(keywords) if keywords else '없음'}' 키워드가 발견되었어. "
                "이 분석 결과를 바탕으로, 부동산을 잘 모르는 사용자에게 아주 쉽고 친절한 대화체로 설명해줘. "
                "어떤 점을 조심해야 하고, 다음에는 어떤 행동을 해야 하는지도 구체적으로 알려줘."
            )

            # 3. Gemnini 서버로 분석 결과 전달하여 최종 답변 요청
            payload ={
                "messages" : [{"role" : "user", "content" : prompt_for_gemini}]
            }
            r = requests.post(
                f"{AI_BASE_URL}/v1/chat",
                json=payload,
                headers={"x-ai-key" : AI_API_KEY, "Content-Type" : "application/json"},
                timeout=60
            )
            return (r.content, r.status_code, r.headers.items())
        
        except Exception as e :
            return jsonify({"error" : str(e)}), 500
        
        finally : 
            # 4. 분석이 끝나면 임시 파일 삭제
            if os.path.exists(temp_path) : 
                os.remove(temp_path)

# 단발 응답 : POST /api/chat -> B: /v1/chat
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
        # 응답 헤더를 포함하여 그대로 반환
        return (r.content, r.status_code, r.headers.items())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# 스트리밍 : GET /api/chat/stream -> B: /v1/chat/stream (SSE 프록시)
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

    # 올바른 코드 구조: event_stream 함수를 정의하고, 
    # Response 객체를 통해 스트리밍을 반환합니다.
    def event_stream():
        try:
            for chunk in upstream.iter_content(chunk_size=1024):
                if chunk:
                    yield chunk
        except Exception:
            pass
    
    headers = {key: value for key, value in upstream.headers.items() if key.lower() in ['content-type', 'x-accel-buffering']}
    return Response(event_stream(), headers=headers)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, threaded=True)

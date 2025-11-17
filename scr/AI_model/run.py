from PIL import Image
import pytesseract
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import glob
import os
import cv2
import numpy as np

# Tesseract 설치 경로 지정 (사용자 환경에 맞게 수정)
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# --- 1. 기존 함수들 (수정 없음) ---

def extract_text_from_image(image_path):
    try:
        stream = open(image_path, "rb")
        bytes = bytearray(stream.read())
        numpy_array = np.asarray(bytes, dtype=np.uint8)
        img_cv = cv2.imdecode(numpy_array, cv2.IMREAD_UNCHANGED)
        
        if img_cv is None:
            return f"오류 발생: OpenCV가 이미지 파일({os.path.basename(image_path)})을 디코딩할 수 없습니다."

        img_gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        img_binary = cv2.adaptiveThreshold(
            img_gray, 
            maxValue=255, 
            adaptiveMethod=cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            thresholdType=cv2.THRESH_BINARY, 
            blockSize=11, 
            C=2
        )
        img_pil = Image.fromarray(img_binary)
        text = pytesseract.image_to_string(img_pil, lang='kor')
        return text
    except Exception as e:
        return f"오류 발생: {e}"

def predict_risk(text):
    model_path = "./saved_model"
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForSequenceClassification.from_pretrained(model_path)
    
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)

    with torch.no_grad():
        logits = model(**inputs).logits

    prediction = torch.argmax(logits, dim=-1).item()
    label_map = {
        0: "🚨 전세 사기 위험",
        1: "🚨 월세 보증금 사기 위험",
        2: "🚨 매매 사기 위험",
        3: "⚠️ 공통 위험 (등기부등본 확인 필수)",
        4: "✅ 안전 / 일반 정보"
    }
    result = label_map.get(prediction, "판단 불가")
    return result

# --- 2. 새로 추가할 함수 2개 ---

def find_risk_keywords(text):
    """텍스트에서 미리 정의된 위험 키워드를 찾아 리스트로 반환"""
    risk_keywords = ["근저당", "압류", "가압류", "신탁", "체납", "위반건축물", "이중계약"]
    found_keywords = []
    # 텍스트가 비어있지 않은 경우에만 키워드 검색 수행
    if text and isinstance(text, str):
        for keyword in risk_keywords:
            if keyword in text:
                found_keywords.append(keyword)
    return found_keywords

def generate_explanation(risk_label, keywords):
    """판단 결과와 키워드를 조합하여 자연스러운 설명 문장을 생성"""
    
    intro = f"해당 문서를 분석한 결과, '{risk_label}'으로 판단됩니다.\n"
    
    if not keywords:
        reason = "특별히 감지된 위험 키워드는 없지만, 계약서의 전체적인 내용을 검토할 필요가 있습니다."
    else:
        keyword_str = ", ".join(keywords)
        reason = f"특히 문서에서 '{keyword_str}' 등의 단어가 발견되었습니다. "

        if "근저당" in keywords:
            reason += "이는 집주인이 집을 담보로 대출을 받은 상태일 수 있음을 의미합니다. "
        if "압류" in keywords:
            reason += "세금 체납 등의 이유로 자산이 동결되었을 수 있어 매우 위험합니다. "

    recommendation = "\n계약 진행 전, 해당 내용에 대해 부동산 전문가나 법률 전문가와 반드시 상담하시는 것을 추천합니다."
    
    return intro + reason + recommendation

# --- 3. 수정될 메인 실행 부분 ---

if __name__ == "__main__":
    target_folder_path = r'D:\test_data'
    
    image_extensions = ('*.jpg', '*.jpeg', '*.png', '*.bmp', '*.gif')
    file_list = []
    for ext in image_extensions:
        file_list.extend(glob.glob(os.path.join(target_folder_path, ext)))

    if not file_list:
        print(f"'{target_folder_path}' 폴더에서 분석할 이미지 파일을 찾을 수 없습니다.")
    else:
        print(f"총 {len(file_list)}개의 파일을 분석합니다.")
        
        for file_path in file_list:
            print(f"\n{'='*50}\n--- 이미지 분석 시작: {os.path.basename(file_path)} ---\n")
            
            extracted_text = extract_text_from_image(file_path)
            
            # OCR 결과가 비어있거나 오류가 발생했는지 확인
            if not extracted_text or "오류 발생" in extracted_text:
                print("⚠️ 분석 오류가 발생했거나 텍스트를 추출할 수 없습니다.")
                if extracted_text:
                    print(extracted_text) # 오류 메시지 출력
            else:
                # 1. KLUE 모델로 위험도 판단
                risk_label = predict_risk(extracted_text)
                
                # 2. OCR 텍스트에서 근거 키워드 찾기
                keywords = find_risk_keywords(extracted_text)
                
                # AI가 '위험'으로 판단했으나, 명확한 키워드가 없는 경우 '주의'로 안내
                if "위험" in risk_label and not keywords:
                    print(f"해당 문서를 분석한 결과, '⚠️ 주의'가 필요합니다.\n")
                    print("AI가 위험 가능성이 있는 패턴을 감지했으나, 명확한 위험 키워드는 발견되지 않았습니다.")
                    print("계약서의 전체적인 내용을 전문가와 함께 꼼꼼히 검토해 보시는 것을 추천합니다.")

                else :
                    # 3. 자연스러운 설명 문장 생성
                    explanation = generate_explanation(risk_label, keywords)
                
                    print("--- 최종 분석 결과 ---")
                    print(explanation)
        
        print(f"\n{'='*50}\n모든 파일 분석이 완료되었습니다.")

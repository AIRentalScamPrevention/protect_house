# main.py
import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from chatbot import chat_with_gemini, JEONSE_CHECKLIST  # chatbot 모듈에서 가져오기

# 환경 변수 로드
load_dotenv()
AI_SECRET = os.getenv("AI_SECRET", "")

app = FastAPI(title="B - AI Service")

# 통신 상태 체크용
@app.get("/health")
async def health():
    return {"ok": True}

# API 키 인증
def check_key(req: Request):
    if AI_SECRET and req.headers.get("x-ai-key") != AI_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")

# POST /v1/chat - 일반 챗봇 요청
@app.post("/v1/chat")
async def chat(req: Request, body: dict):
    # 1️⃣ 인증 체크
    check_key(req)

    # 2️⃣ 요청 메시지 가져오기
    messages = body.get("messages", [])

    if not messages:
        return JSONResponse({"reply": "메시지가 없습니다."})

    # 3️⃣ 가장 최근 user 메시지 가져오기
    user_last = ""
    for m in reversed(messages):
        if m.get("role") == "user":
            user_last = m.get("content", "")
            break

    # 4️⃣ 전세 체크리스트 키워드 처리
    trigger_keywords = ["체크리스트", "확인할 사항", "확인 사항", "계약 전", "조심", "주의", "예방"]
    if '전세' in user_last and any(keyword in user_last for keyword in trigger_keywords):
        reply_text = JEONSE_CHECKLIST
    else:
        # 5️⃣ 실제 Gemini API 호출
        reply_text = chat_with_gemini(user_last)

    # 6️⃣ 반환
    return JSONResponse({"reply": reply_text})

# GET /v1/chat/stream - 스트리밍용 (필요 시)
@app.get("/v1/chat/stream")
async def chat_stream(request: Request):
    check_key(request)

    # messages를 request에서 직접 가져오는 경우 body가 필요함
    # GET이므로 query param 또는 별도 처리 필요, 여기서는 예시로 빈 메시지 처리
    messages = []

    # 가장 최근 user 메시지 가져오기
    user_last = ""
    for m in reversed(messages):
        if m.get("role") == "user":
            user_last = m.get("content", "")
            break

    # 전세 체크리스트 단어
    trigger_keywords = ["체크리스트", "확인할 사항", "확인 사항", "계약 전", "조심", "주의", "예방"]
    if '전세' in user_last and any(keyword in user_last for keyword in trigger_keywords):
        reply_text = JEONSE_CHECKLIST
    else:
        reply_text = chat_with_gemini(user_last)

    return JSONResponse({"reply": reply_text})
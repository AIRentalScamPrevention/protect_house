// CRA(.env)에서 백엔드 게이트웨이(A) 주소 읽기
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000";

/* 공통: JSON fetch (타임아웃 포함) */
async function jsonFetch(url, { method = "GET", headers = {}, body, timeoutMs = 30000 } = {}){
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);

    const res = await fetch(url, {
        method,
        headers: { "content-Type": "application/json", ...headers },
        body: body ? JSON.stringify(body) : undefined,
        signal: ctrl.signal,
        credentials: "include", // 쿠키 기반 인증 쓸 경우 대비
    }).catch((e) => {
        clearTimeout(id);
        throw e;
    });

    clearTimeout(id);
    if(!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} :: ${text}`);
    }
    return res.json();
}

/* 1) 단발 요청 : POST /api/chat */
export async function sendMessage(messages, options = {}) {
    return jsonFetch(`${API_BASE}/api/chat`, {
        method: "POST",
        body: {messages, ...(options.payload || {})},
        timeoutMs: options.timeoutMs ?? 60000,
        headers: options.headers || {}, // 필요 시 인증 헤더 등
    });
}

//이미지 파일 분석 요청
export const analyzeDocument = async (file, message) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('message', message);
    const response = await fetch(`${API_BASE}/api/analyze-document`, {
        method :'POST',
        body : formData,
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: "알 수 없는 서버 오류" }));
        throw new Error(errorBody.error || `HTTP 오류: ${response.status}`);
    }

    return response.json();
};

/**
 * 2) 스트리밍 요청(SSE): GET /api/chat/stream
 * onToken(data: string) - 'data: ...' 한 덩이씩 들어올 때 호출
 * onDone() - 서버에서 완료 이벤트 수신([DONE]) 또는 스트림 종료
 * onError(err) - 네트워크 에러 등
 * 반환: stop() 함수 (원하면 스트림 중단)
 */

export function streamMessage({ onToken, onDone, onError, query,headers } = {}) {
    // query 필요하면 여기서 조립 (예: ID 전달 등)
    const qs = query ? "?" + new  URLSearchParams(query).toString() : "";
    const url = `${API_BASE}/api/chat/stream${qs}`;

    // 기본 EventSource는 커스텀 헤더 미지원.
    // 헤더가 꼭 필요하면 A에서 쿠키 기반 인증이나, POST -> SSE 업르레이드 엔드포인트를 따로 두는 게 일반적.
    const es = new EventSource(url, { withCredentials: true });

    es.onmessage = (e) => {
        if (onToken) onToken(e.data);
        // 서버가 done을 custom event로 보내는 경우도 있어 아래처럼 수신
        if (e.data === "[DONE]") {
            try { es.close(); } catch {}
            if (onDone) onDone();
        }
    };

    es.addEventListener("done", () => {
        try { es.close(); } catch {}
        if (onDone) onDone();
    });

    es.addEventListener("error", (e) => {
        try { es.close(); } catch {}
        if (onError) onError(e);
    });

    return () => {
        try { es.close(); } catch {}
    };
}
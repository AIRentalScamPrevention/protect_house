import { createContext, useContext, useState } from "react";

// ✅ 1. 백엔드 서버 주소 설정
// (나중에 배포할 때는 환경변수 REACT_APP_API_BASE를 사용하고, 지금은 로컬 주소 사용)
const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:4000";

const STORAGE_KEY = "protect_house_user";

/** 안전한 localStorage JSON 로드 */
function loadUser() {
    if (typeof window === "undefined") return null;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

/** 안전한 localStorage JSON 저장 */
function saveUser(u) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch {
        // 무시
    }
}

/** 안전한 localStorage 제거 */
function clearUser() {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        // 무시
    }
}

const AuthCtx = createContext({
    user: null,
    login: async () => {},
    logout: () => {},
    signup: async () => {},
});

export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => loadUser());

    /** * 로그인 기능
     * (아직 백엔드에 /api/login이 없으므로, 프론트엔드에서만 처리하는 임시 코드 유지)
     * 추후 백엔드 로그인 API가 완성되면 여기도 fetch로 바꿔야 합니다.
     */
    const login = async ({ username, password }) => {
        // 임시: 입력받은 정보로 로그인 상태만 만듦
        const u = { username, nickname: "테스트유저", email: "test@example.com" };
        saveUser(u);
        setUser(u);
        return u;
    };

    /** 로그아웃 */
    const logout = () => {
        clearUser();
        setUser(null);
    };

    /** * ✅ [수정됨] 회원가입 기능 (서버 DB 연동)
     * 이제 localStorage가 아니라 실제 서버로 데이터를 보냅니다.
     */
        // src/auth/AuthContext.js

    const signup = async ({
                              nickname = "",
                              email = "",
                              username = "",
                              password = "",
                              preferType,
                              preferTypes,
                          }) => {

            // 1. 데이터 정리
            const normalizedPreferType = Array.isArray(preferTypes)
                ? preferTypes.join(",")
                : (preferType || "");

            const payload = {
                nickname,
                email,
                username,
                password,
                preferType: normalizedPreferType
            };

            // 🔍 [로그 추가 1] 내가 지금 어디로 보내려고 하는가?
            console.log("🚀 회원가입 요청 시작!");
            console.log("🔗 목표 주소 (URL):", `${API_BASE}/api/signup`);
            console.log("📦 보낼 데이터:", payload);

            try {
                // 2. 서버 전송
                const response = await fetch(`${API_BASE}/api/signup`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                // 🔍 [로그 추가 2] 서버가 전화를 받았는가?
                console.log("📡 서버 응답 상태:", response.status, response.statusText);

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    console.error("❌ 서버 에러 메시지:", errData); // 에러 내용 확인
                    throw new Error(errData.error || "회원가입 요청 실패");
                }

                const newUser = { nickname, email, username, preferType: normalizedPreferType };
                saveUser(newUser);
                setUser(newUser);

                return newUser;

            } catch (error) {
                // 🔍 [로그 추가 3] 아예 연결이 안 됐을 때 여기서 잡힘
                console.error("🚨 치명적 오류 발생 (Failed to fetch 원인):", error);
                throw error;
            }
    };

    return (
        <AuthCtx.Provider value={{ user, login, logout, signup }}>
            {children}
        </AuthCtx.Provider>
    );
}
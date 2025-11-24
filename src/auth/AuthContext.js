import { createContext, useContext, useState } from "react";

const STORAGE_KEY = "demo_user";

/** 안전한 localStorage JSON 로드 */
function loadUser() {
    if (typeof window === "undefined") return null; // SSR 가드
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
        // quota/프라이버시 모드 등으로 실패할 수 있음 → 조용히 무시
    }
}

/** 안전한 localStorage 제거 */
function clearUser() {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.removeItem(STORAGE_KEY);
    } catch {
        // 조용히 무시
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
    // lazy initializer로 초기 사용자 로드(깜빡임 최소화)
    const [user, setUser] = useState(() => loadUser());

    /** 데모용 로그인 */
    const login = async ({ email, password: _pw }) => {
        // _pw로 이름 바꿔서 no-unused-vars 경고 방지
        const u = { email };
        saveUser(u);
        setUser(u);
        return u;
    };

    /** 로그아웃 */
    const logout = () => {
        clearUser();
        setUser(null);
    };

    /** 데모용 회원가입
     *  - preferTypes 배열 또는 preferType 문자열 모두 허용
     *  - 서버로는 preferType(문자열) 기준 사용
     */
    const signup = async ({
                              nickname = "",
                              email = "",
                              username = "",
                              password: _pw, // no-unused-vars 방지용
                              preferType,
                              preferTypes,
                          }) => {
        const normalizedPreferType = Array.isArray(preferTypes)
            ? preferTypes.join(",")
            : (preferType || "");

        const u = { email, nickname, username, preferType: normalizedPreferType };
        saveUser(u);
        setUser(u);
        return u;
    };

    return (
        <AuthCtx.Provider value={{ user, login, logout, signup }}>
            {children}
        </AuthCtx.Provider>
    );
}
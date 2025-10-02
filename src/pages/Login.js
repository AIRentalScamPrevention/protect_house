import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import SignupModal from "../auth/SignupModal";
import "./Login.css";

export default function Login() {
    const { login } = useAuth();
    const nav = useNavigate();

    const [form, setForm] = useState({ username: "", password: "" });
    const [loading, setLoading] = useState(false);
    const [openSignup, setOpenSignup] = useState(false);

    const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(form);
            nav("/mypage"); // 로그인 성공 시 상담 이력(마이페이지)
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            {/* 상단 네비게이션 (요청 명칭 반영) */}
            <header className="login-header">
                <h1 className="site-title">전세사기 상담 챗봇 서비스</h1>
                <nav className="nav-menu">
                    <a href="/chat" className="nav-link">챗봇 상담</a>
                    <a href="/community" className="nav-link">커뮤니티</a>
                    <a href="/mypage" className="nav-link">마이페이지</a>
                </nav>
            </header>

            {/* 로그인 팝업: 화면 중앙 정렬 */}
            <div className="login-wrap">
                <div className="login-card" role="dialog" aria-labelledby="login-title">
                    <h2 id="login-title" className="login-title">로그인</h2>

                    <form onSubmit={onSubmit} className="login-form" autoComplete="on">
                        <input
                            name="username"
                            type="text"
                            placeholder="아이디"
                            value={form.username}
                            onChange={onChange}
                            required
                            aria-label="아이디"
                            autoComplete="username"
                        />
                        <input
                            name="password"
                            type="password"
                            placeholder="비밀번호"
                            value={form.password}
                            onChange={onChange}
                            required
                            aria-label="비밀번호"
                            autoComplete="current-password"
                        />
                        <button disabled={loading} className="login-btn" type="submit">
                            {loading ? "로그인 중..." : "로그인"}
                        </button>
                    </form>


                    <div className="login-footer">
                        <button
                            onClick={() => setOpenSignup(true)}
                            className="signup-link"
                            type="button"
                        >
                            아직 계정이 없나요? 회원가입
                        </button>
                    </div>
                </div>
            </div>

            {/* 회원가입 모달 */}
            {openSignup && <SignupModal onClose={() => setOpenSignup(false)}/>}

            <footer className="login-footbar">
                <span>© 2025 전세사기 방지 프로젝트</span>
                <span className="dot">•</span>
                <span>문의: 041-580-4573</span>
            </footer>
        </div>
    );
}

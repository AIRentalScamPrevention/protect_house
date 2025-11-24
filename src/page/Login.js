import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // ← Link 추가
import { useAuth } from "../auth/AuthContext";
import SignupModal from "../auth/SignUpModel";
import "./Login.css";
import BrandLogo from "../image/logo.png";

export default function Login() {
    const { login, user } = useAuth(); // user 가져와서 링크 노출 제어에 사용 가능
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
            nav("/chat"); // 로그인 성공 시 상담 이력(마이페이지)
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            {/* 상단 네비게이션 */}
            <header className="login-header">
                <Link to="/login" className="brand-link" aria-label="홈">
                    <img src={BrandLogo} alt="" className="site-logo" />
                </Link>

                {/* ↓↓↓ 여는 <nav>가 필요합니다 */}
                <nav className="nav-menu">
                    {/* 챗봇 라우트는 나중에 추가 예정이면 임시로 비활성/숨김 처리해도 됨 */}
                    {/* <Link to="/chatbot" className="nav-link">챗봇 상담</Link> */}
                    {user && <Link to="/mypage" className="nav-link">마이페이지</Link>}
                    <Link to="/login" className="nav-link">로그인</Link>
                </nav>
            </header>

            {/* 로그인 카드 */}
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
                            처음이라면 회원가입
                        </button>
                    </div>
                </div>
            </div>

            {/* 회원가입 모달 */}
            {openSignup && <SignupModal onClose={() => setOpenSignup(false)} />}

            <footer className="login-footbar">
                <span>© 2025 전세사기 방지 프로젝트</span>
                <span className="dot">•</span>
                <span>문의: 041-580-4573</span>
            </footer>
        </div>
    );
}
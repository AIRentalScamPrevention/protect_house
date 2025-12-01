import "./Header.css";
import BrandLogo from "../image/logo.png"
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // 2. 'handleLogout' is not defined 에러 해결을 위해 함수를 정의합니다.
    const handleLogout = () => {
        logout();           // 로그아웃 처리
        navigate("/login"); // 로그인 페이지로 이동
    };

    return (
        <header className="login-header">
            <Link to="/" className="brand-link" aria-label="홈">
                <img src={BrandLogo} alt="사이트 로고" className="site-logo"/>
            </Link>

            <nav className="nav-menu">
                {user ? (
                    <>
                        <Link to="/MyPage" className="nav-link">마이페이지</Link>
                        {/* 3. 이제 이 버튼은 정상적으로 handleLogout 함수를 호출합니다. */}
                        <button className="nav-link" onClick={handleLogout}>로그아웃</button>
                    </>
                ) : (
                    <Link to="/login" className="nav-link">로그인</Link>
                )}
                <Link to="/Guide" className="nav-link" target="_blank">가이드</Link>
            </nav>
        </header>
    );
}
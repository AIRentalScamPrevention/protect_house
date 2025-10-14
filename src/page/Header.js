import "./Header.css";
import BrandLogo from "../image/logo.png"
import {Link} from "react-router-dom";
import {useAuth} from "../auth/AuthContext";

export default function Header() {
    const {user, logout} =useAuth();

    return (
        <header className="login-header">
            <Link to={user ? "/chat":"/login"} className="brand-link" aria-label="홈">
               <img src={BrandLogo} alt="사이트 로고" className="site-logo"/>
            </Link>

            <nav className="nav-menu">
                {user ? (
                    <>
                        <Link to="/MyPage" className="nav-link">마이페이지</Link>
                        <button className="nav-link" onClick={logout} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 'inherit' }}>
                            로그아웃
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="nav-link">로그인</Link>
                )}
            </nav>
        </header>
    );
}

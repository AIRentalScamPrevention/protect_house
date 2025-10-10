import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Login from "./pages/Login";
import MyPage from "./pages/MyPage";
import "./App.css";

function PrivateRoute({ children }) {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* 기본 진입은 로그인으로 */}
                    <Route path="/" element={<Navigate to="/login" replace />} />

                    {/* 로그인 페이지 */}
                    <Route path="/login" element={<Login />} />

                    {/* 마이페이지 (보호 라우트)  ← 소문자로 통일 */}
                    <Route
                        path="/mypage"
                        element={
                            <PrivateRoute>
                                <MyPage />
                            </PrivateRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

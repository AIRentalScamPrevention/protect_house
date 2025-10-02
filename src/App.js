import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Login from "./pages/Login";      // ✅ pages 폴더
import MyPage from "./pages/MyPage";    // ✅ pages 폴더
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
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />
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

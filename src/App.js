// React Router와 인증 관련 훅/컴포넌트 불러오기
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";

// 페이지 및 컴포넌트들 불러오기
import Login from "./page/Login";
import MyPage from "./page/MyPage";
import Header from "./page/Header"; // 첫 번째 코드에서 가져옴
import Chat from "./page/chat";    // 첫 번째 코드에서 가져옴
import "./App.css";

// --- Helper Components ---

// 1. PrivateRoute는 그대로 사용합니다.
// 로그인 여부를 확인하여 접근을 제어하는 컴포넌트입니다.
function PrivateRoute({ children }) {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" replace />;
}

// 2. 채팅 페이지 레이아웃을 위한 새 컴포넌트를 만듭니다.
// 첫 번째 코드의 App 내용을 그대로 가져와 ChatPage라는 컴포넌트로 만들었습니다.
function ChatPage() {
    return (
        <>
            <Header />
            <main>
                <Chat />
            </main>
        </>
    );
}

// --- Main App Component ---

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* 기본 경로는 이제 /chat으로 보냅니다. */}
                    {/* 로그인이 안되어있으면 PrivateRoute가 알아서 /login으로 보냅니다. */}
                    <Route path="/" element={<Navigate to="/chat" replace />} />

                    {/* 로그인 페이지 */}
                    <Route path="/login" element={<Login />} />

                    {/* 3. 새로운 채팅 페이지 라우트를 추가합니다. (보호) */}
                    <Route
                        path="/chat"
                        element={
                            <PrivateRoute>
                                <ChatPage />
                            </PrivateRoute>
                        }
                    />

                    {/* 기존 마이페이지 라우트 (보호) */}
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
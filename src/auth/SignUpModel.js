import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./SignUpModel.css";

export default function SignupModal({ onClose }) {
    const nav = useNavigate();
    const { signup } = useAuth();

    // 폼 상태
    const [form, setForm] = useState({
        nickname: "",
        email: "",
        emailConfirm: "",
        username: "",
        password: "",
        passwordConfirm: "",
        preferTypes: [],
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // 👁 비밀번호 표시/숨기기 상태
    const [showPwd, setShowPwd] = useState(false);
    const [showPwd2, setShowPwd2] = useState(false);

    const onChange = (e) =>
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    // (이전 토글 방식 유지용 – 현재는 select 사용)
    const togglePrefer = (opt) =>
        setForm((prev) => {
            const list = prev.preferTypes ?? [];
            const has = list.includes(opt);
            return {
                ...prev,
                preferTypes: has ? list.filter((v) => v !== opt) : [...list, opt],
            };
        });

    const PREFER_OPTIONS = [
        "오피스텔",
        "투룸",
        "원룸",
        "빌라/다세대",
        "아파트",
        "반전세",
        "전세",
        "월세",
        "기타",
        "없음",
    ];

    // 유효성 검사
    const validate = () => {
        const next = {};
        if (!form.nickname.trim()) next.nickname = "닉네임을 입력하세요.";
        if (!form.email.trim()) next.email = "이메일을 입력하세요.";
        if (form.email && form.emailConfirm && form.email !== form.emailConfirm) {
            next.emailConfirm = "이메일이 일치하지 않습니다.";
        }
        if (!form.username.trim()) next.username = "아이디를 입력하세요.";
        if (!form.password) next.password = "비밀번호를 입력하세요.";
        if (
            form.password &&
            form.passwordConfirm &&
            form.password !== form.passwordConfirm
        ) {
            next.passwordConfirm = "비밀번호가 일치하지 않습니다.";
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    // 제출
    const onSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const payload = { ...form };
            delete payload.emailConfirm;
            delete payload.passwordConfirm;
            payload.preferType = (form.preferTypes ?? []).join(",");
            delete payload.preferTypes;

            await signup(payload);
            onClose?.();
            nav("/mypage");
        } finally {
            setLoading(false);
        }
    };

    // 인라인 스타일(아이콘 위치 조정)
    const styles = {
        pwdWrap: { position: "relative" },
        pwdInput: { paddingRight: 42 }, // 아이콘 자리 확보
        eyeBtn: {
            position: "absolute",
            top: "50%",
            right: 8,
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            padding: 6,
            cursor: "pointer",
            lineHeight: 0,
            color: "#6b7280",
        },
        eyeIcon: { width: 20, height: 20, display: "block" },
    };

    return (
        <div className="signup-backdrop" onClick={onClose}>
            <div
                className="signup-modal light"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="signup-title"
            >
                <div className="signup-header">
                    <h2 id="signup-title">회원가입</h2>
                    <button onClick={onClose} className="signup-close" aria-label="닫기">
                        ×
                    </button>
                </div>

                <form onSubmit={onSubmit} className="signup-form">
                    {/* 사용자 이름 */}
                    <div className="field full">
                        <label htmlFor="nickname">
                            사용자 이름 <span className="req">*</span>
                        </label>
                        <input
                            id="nickname"
                            name="nickname"
                            placeholder="이름 또는 닉네임"
                            value={form.nickname}
                            onChange={onChange}
                            required
                        />
                        {errors.nickname && <p className="error">{errors.nickname}</p>}
                    </div>

                    {/* 이메일 / 이메일 재확인 */}
                    <div className="field">
                        <label htmlFor="email">
                            이메일 <span className="req">*</span>
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="example@email.com"
                            value={form.email}
                            onChange={onChange}
                            required
                            autoComplete="email"
                        />
                        {errors.email && <p className="error">{errors.email}</p>}
                    </div>
                    <div className="field">
                        <label htmlFor="emailConfirm">
                            이메일 재확인 <span className="req">*</span>
                        </label>
                        <input
                            id="emailConfirm"
                            name="emailConfirm"
                            type="email"
                            placeholder="이메일을 다시 입력"
                            value={form.emailConfirm}
                            onChange={onChange}
                            required
                            autoComplete="email"
                        />
                        {errors.emailConfirm && (
                            <p className="error">{errors.emailConfirm}</p>
                        )}
                    </div>

                    {/* 아이디 / 선호 매물 유형 */}
                    <div className="field">
                        <label htmlFor="username">
                            아이디 <span className="req">*</span>
                        </label>
                        <input
                            id="username"
                            name="username"
                            placeholder="영문/숫자 조합 권장"
                            value={form.username}
                            onChange={onChange}
                            required
                            autoComplete="username"
                        />
                        {errors.username && <p className="error">{errors.username}</p>}
                    </div>

                    <div className="field">
                        <label htmlFor="preferTypeSelect">선호 매물 유형 (선택)</label>
                        <select
                            id="preferTypeSelect"
                            className="select"
                            value={form.preferTypes[0] ?? ""}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    preferTypes: e.target.value ? [e.target.value] : [],
                                }))
                            }
                        >
                            {/* ✅ '선택 안 함'을 비활성화된 안내 문구로 변경했습니다 */}
                            <option value="" disabled>선호 유형을 선택하세요</option>
                            {PREFER_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                        <input
                            type="hidden"
                            name="preferType"
                            value={(form.preferTypes ?? []).join(",")}
                        />
                    </div>

                    {/* 비밀번호 */}
                    <div className="field">
                        <label htmlFor="password">
                            비밀번호 <span className="req">*</span>
                        </label>
                        <div className="password-wrap" style={styles.pwdWrap}>
                            <input
                                id="password"
                                name="password"
                                type={showPwd ? "text" : "password"}
                                placeholder="비밀번호"
                                value={form.password}
                                onChange={onChange}
                                required
                                autoComplete="new-password"
                                style={styles.pwdInput}
                            />
                            <button
                                type="button"
                                style={styles.eyeBtn}
                                className="eye-btn"
                                aria-label={showPwd ? "비밀번호 숨기기" : "비밀번호 표시"}
                                aria-pressed={showPwd}
                                onClick={() => setShowPwd((v) => !v)}
                            >
                                {showPwd ? (
                                    // eye-off
                                    <svg viewBox="0 0 24 24" style={styles.eyeIcon} aria-hidden="true">
                                        <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        <path d="M2 12c1.2 3.3 5.1 7 10 7 1 0 2-.1 3-.4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                                        <path d="M12 5c5 0 8.8 3.7 10 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                                    </svg>
                                ) : (
                                    // eye
                                    <svg viewBox="0 0 24 24" style={styles.eyeIcon} aria-hidden="true">
                                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                        <p className={`hint ${errors.password ? "error" : ""}`}>
                            {errors.password ? errors.password : "8자 이상 입력해주세요."}
                        </p>
                    </div>

                    {/* 비밀번호 재확인 */}
                    <div className="field">
                        <label htmlFor="passwordConfirm">
                            비밀번호 재확인 <span className="req">*</span>
                        </label>
                        <div className="password-wrap" style={styles.pwdWrap}>
                            <input
                                id="passwordConfirm"
                                name="passwordConfirm"
                                type={showPwd2 ? "text" : "password"}
                                placeholder="비밀번호 확인"
                                value={form.passwordConfirm}
                                onChange={onChange}
                                required
                                autoComplete="new-password"
                                style={styles.pwdInput}
                            />
                            <button
                                type="button"
                                style={styles.eyeBtn}
                                className="eye-btn"
                                aria-label={showPwd2 ? "비밀번호 숨기기" : "비밀번호 표시"}
                                aria-pressed={showPwd2}
                                onClick={() => setShowPwd2((v) => !v)}
                            >
                                {showPwd2 ? (
                                    // eye-off
                                    <svg viewBox="0 0 24 24" style={styles.eyeIcon} aria-hidden="true">
                                        <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                        <path d="M2 12c1.2 3.3 5.1 7 10 7 1 0 2-.1 3-.4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                                        <path d="M12 5c5 0 8.8 3.7 10 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                                    </svg>
                                ) : (
                                    // eye
                                    <svg viewBox="0 0 24 24" style={styles.eyeIcon} aria-hidden="true">
                                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                        <p className={`hint ${errors.passwordConfirm ? "error" : ""}`}>
                            {errors.passwordConfirm
                                ? errors.passwordConfirm
                                : "비밀번호를 다시 입력해주세요."}
                        </p>
                    </div>

                    {/* 제출 */}
                    <div className="actions full">
                        <button disabled={loading} className="signup-btn" type="submit">
                            {loading ? "가입 중..." : "가입하기"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
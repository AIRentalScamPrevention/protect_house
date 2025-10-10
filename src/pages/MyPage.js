import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import "./MyPage.css";
import BrandLogo from "../image/logo.png";

/* =========================
   비밀번호 변경 모달 (최상단에 선언)
   ========================= */
function PasswordChangeModal({ onClose, onSaved }) {
    const { changePassword } = useAuth(); // AuthContext에 구현되어 있으면 사용, 아니면 alert로 대체
    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        newPasswordConfirm: "",
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const onChange = (e) =>
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const validate = () => {
        const next = {};
        if (!form.currentPassword)
            next.currentPassword = "현재 비밀번호를 입력하세요.";
        if (form.newPassword.length < 8)
            next.newPassword = "새 비밀번호는 8자 이상이어야 합니다.";
        if (form.newPassword !== form.newPasswordConfirm)
            next.newPasswordConfirm = "새 비밀번호가 일치하지 않습니다.";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        try {
            setLoading(true);
            if (changePassword) {
                await changePassword({
                    currentPassword: form.currentPassword,
                    newPassword: form.newPassword,
                });
            } else {
                // 데모용
                alert("데모: 비밀번호가 변경되었다고 가정합니다.");
            }
            alert("비밀번호가 변경되었습니다.");
            onSaved?.();
            onClose();
        } catch (err) {
            alert(err?.message || "비밀번호 변경 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mp-modal-backdrop" onClick={onClose}>
            <div
                className="mp-modal"
                role="dialog"
                aria-labelledby="pw-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mp-modal-head">
                    <h3 id="pw-title">비밀번호 변경</h3>
                    <button className="mp-modal-close" aria-label="닫기" onClick={onClose}>
                        ×
                    </button>
                </div>

                <form className="mp-modal-form" onSubmit={onSubmit}>
                    <div className="mp-grid-1">
                        <div className="field">
                            <label htmlFor="currentPassword">현재 비밀번호</label>
                            <input
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                value={form.currentPassword}
                                onChange={onChange}
                                placeholder="현재 비밀번호"
                            />
                            {errors.currentPassword && (
                                <p className="error">{errors.currentPassword}</p>
                            )}
                        </div>

                        <div className="field">
                            <label htmlFor="newPassword">새 비밀번호</label>
                            <input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                value={form.newPassword}
                                onChange={onChange}
                                placeholder="8자 이상"
                            />
                            {errors.newPassword && (
                                <p className="error">{errors.newPassword}</p>
                            )}
                            {!errors.newPassword &&
                                form.newPassword &&
                                form.newPassword.length < 8 && (
                                    <p className="error">8자 이상 입력해주세요.</p>
                                )}
                        </div>

                        <div className="field">
                            <label htmlFor="newPasswordConfirm">새 비밀번호 확인</label>
                            <input
                                id="newPasswordConfirm"
                                name="newPasswordConfirm"
                                type="password"
                                value={form.newPasswordConfirm}
                                onChange={onChange}
                                placeholder="새 비밀번호 재입력"
                            />
                            {errors.newPasswordConfirm && (
                                <p className="error">{errors.newPasswordConfirm}</p>
                            )}
                        </div>
                    </div>

                    <div className="mp-modal-actions">
                        <button type="button" className="btn-ghost" onClick={onClose}>
                            취소
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? "변경 중..." : "변경"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* =========================
   마이페이지
   ========================= */
export default function MyPage() {
    const { user, logout } = useAuth();
    const nav = useNavigate();
    const [openPw, setOpenPw] = useState(false);
    const [openInfo, setOpenInfo] = useState(false);

    const consultLogs = useMemo(
        () => [
            {
                id: "C-250918-001",
                date: "25/09/18 09:23",
                title: "전세계약 특약 검토",
                tags: ["임대차계약", "특약", "확인 필요"],
                address: "대전 서구 둔산동",
                risk: "중위험",
            },
            {
                id: "C-250914-002",
                date: "25/09/14 13:47",
                title: "전세권 설정 여부 확인",
                tags: ["등기부등본", "전세권", "근저당"],
                address: "대전 유성구 봉명동",
                risk: "저위험",
            },
            {
                id: "C-250909-003",
                date: "25/09/09 20:11",
                title: "보증금 반환 지연 상담",
                tags: ["반환지연", "내용증명"],
                address: "세종시 종촌동",
                risk: "주의",
            },
        ],
        []
    );

    const [q, setQ] = useState("");
    const [riskFilter, setRiskFilter] = useState("");

    const goDetail = (id) => nav(`/consult/${id}`);
    const shareLink = async (id) => {
        const url = `${window.location.origin}/consult/${id}`;
        try {
            await navigator.clipboard.writeText(url);
            alert("공유 링크가 클립보드에 복사되었습니다.");
        } catch {
            prompt("복사해서 공유하세요:", url);
        }
    };

    const filteredLogs = useMemo(() => {
        const keyword = q.trim().toLowerCase();
        return consultLogs.filter((log) => {
            const riskOk = !riskFilter || log.risk.includes(riskFilter);
            const hay = [log.title, log.address, ...(log.tags || []), log.id, log.date]
                .join(" ")
                .toLowerCase();
            const textOk = !keyword || hay.includes(keyword);
            return riskOk && textOk;
        });
    }, [consultLogs, q, riskFilter]);

    return (
        <div className="mp-layout">
            {/* 좌측 사이드바 */}
            <aside className="mp-sidebar">
                <Link to="/" className="mp-logo" aria-label="홈으로 이동">
                    <img src={BrandLogo} alt="안심하.zip" className="mp-logo-img" />
                </Link>

                <nav className="mp-nav">
                    <button onClick={() => nav("/")} className="mp-nav-item">
                        🏠 홈
                    </button>
                    <button className="mp-nav-item" onClick={() => nav("/status")}>
                        📊 검증현황
                    </button>
                    <button className="mp-nav-item active" onClick={() => nav("/mypage")}>
                        📂 상담 이력
                    </button>
                </nav>
            </aside>

            {/* 가운데: 상담 이력 */}
            <main className="mp-content">
                <div className="mp-content-head">
                    <h2 className="mp-section-title">상담 이력</h2>
                    <div />
                </div>

                <div className="mp-filters">
                    <input
                        className="mp-input"
                        placeholder="제목/주소/태그 검색"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                    <select
                        className="mp-select"
                        value={riskFilter}
                        onChange={(e) => setRiskFilter(e.target.value)}
                    >
                        <option value="">전체 위험도</option>
                        <option value="저위험">저위험</option>
                        <option value="주의">주의</option>
                        <option value="중위험">중위험</option>
                        <option value="고위험">고위험</option>
                    </select>
                    <button
                        className="btn-primary"
                        type="button"
                        onClick={() => document.activeElement?.blur()}
                    >
                        검색
                    </button>
                </div>

                <ul className="mp-card-list">
                    {filteredLogs.map((log) => (
                        <li key={log.id} className="mp-card">
                            <div className="mp-card-head">
                                <div className="mp-card-meta">
                                    <span className="mp-date">{log.date}</span>
                                    <span className={`mp-risk mp-risk-${riskClass(log.risk)}`}>
                    {log.risk}
                  </span>
                                </div>
                            </div>

                            <h3 className="mp-card-title">{log.title}</h3>
                            <div className="mp-card-sub">{log.address}</div>

                            <div className="mp-tags">
                                {log.tags.map((t) => (
                                    <span key={t} className="mp-tag">
                    {t}
                  </span>
                                ))}
                            </div>

                            <div className="mp-card-actions">
                                <button className="btn-ghost" onClick={() => goDetail(log.id)}>
                                    다시 확인
                                </button>
                                <button className="btn-outline" onClick={() => shareLink(log.id)}>
                                    공유
                                </button>
                            </div>
                        </li>
                    ))}

                    {filteredLogs.length === 0 && (
                        <li className="mp-card empty">검색 결과가 없습니다.</li>
                    )}
                </ul>
            </main>

            {/* 우측 프로필/액션 */}
            <aside className="mp-profile">
                <div className="mp-profile-card">
                    <div className="mp-avatar" aria-hidden />
                    <div className="mp-user">
                        <div className="mp-user-name">
                            {user?.nickname || user?.username || "사용자"}
                        </div>
                        <div className="mp-user-sub">{user?.email || "email@domain.com"}</div>
                    </div>

                    <hr />

                    <ul className="mp-quick">
                        <li>
                            <button
                                className="btn-outline"
                                style={{ width: "100%" }}
                                onClick={() => setOpenInfo(true)}
                            >
                                내 정보 관리
                            </button>
                        </li>
                        <li>
                            <button
                                className="btn-outline"
                                style={{ width: "100%" }}
                                onClick={() => setOpenPw(true)}
                            >
                                비밀번호 변경
                            </button>
                        </li>
                        <li>
                            <button
                                className="btn-outline"
                                style={{ width: "100%" }}
                                onClick={() => {
                                    logout();
                                    nav("/login");
                                }}
                            >
                                로그아웃
                            </button>
                        </li>
                    </ul>
                </div>
            </aside>

            {/* 모달들 */}
            {openInfo && (
                <InfoModal
                    user={user}
                    onClose={() => setOpenInfo(false)}
                    onSaved={() => setOpenInfo(false)}
                />
            )}
            {openPw && (
                <PasswordChangeModal
                    onClose={() => setOpenPw(false)}
                    onSaved={() => setOpenPw(false)}
                />
            )}
        </div>
    );
}

/* =========================
   보조 함수/모달들
   ========================= */
function riskClass(risk) {
    if (!risk) return "low";
    if (risk.includes("고")) return "high";
    if (risk.includes("중")) return "medium";
    if (risk.includes("주의")) return "warn";
    return "low";
}

/** 내 정보 관리 모달 (닉네임/이메일만) */
function InfoModal({ user, onClose, onSaved }) {
    const [form, setForm] = useState({
        nickname: user?.nickname || "",
        email: user?.email || "",
        username: user?.username || "",
    });
    const [errors, setErrors] = useState({});

    const onChange = (e) =>
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const validate = () => {
        const next = {};
        if (!form.nickname.trim()) next.nickname = "닉네임을 입력하세요.";
        if (!form.email.trim()) next.email = "이메일을 입력하세요.";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        // TODO: 실제 API 호출로 사용자 정보 업데이트
        // await api.updateProfile(form)
        alert("정보가 저장되었습니다.");
        onSaved?.();
    };

    return (
        <div className="mp-modal-backdrop" onClick={onClose}>
            <div
                className="mp-modal"
                role="dialog"
                aria-labelledby="info-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mp-modal-head">
                    <h3 id="info-title">내 정보 관리</h3>
                    <button className="mp-modal-close" aria-label="닫기" onClick={onClose}>
                        ×
                    </button>
                </div>

                <form className="mp-modal-form" onSubmit={onSubmit}>
                    <div className="mp-grid-2">
                        <div className="field">
                            <label htmlFor="username">아이디</label>
                            <input id="username" name="username" value={form.username} readOnly />
                            <p className="error">아이디는 변경할 수 없습니다.</p>
                        </div>

                        <div className="field">
                            <label htmlFor="nickname">
                                닉네임 <span className="req">*</span>
                            </label>
                            <input
                                id="nickname"
                                name="nickname"
                                value={form.nickname}
                                onChange={onChange}
                                required
                            />
                            {errors.nickname && <p className="error">{errors.nickname}</p>}
                        </div>

                        <div className="field">
                            <label htmlFor="email">
                                이메일 <span className="req">*</span>
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={onChange}
                                required
                            />
                            {errors.email && <p className="error">{errors.email}</p>}
                        </div>
                    </div>

                    <div className="mp-modal-actions">
                        <button type="button" className="btn-ghost" onClick={onClose}>
                            닫기
                        </button>
                        <button type="submit" className="btn-primary">
                            확인
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

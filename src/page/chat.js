import React, { useState, useRef } from "react";
import "./chat.css";
import ListingTypeSelector from "../components/ListingTypeSelector";
// 같은 파일에서 가져오므로 한 줄로 합쳐도 됨
import { sendMessage, streamMessage, analyzeDocument } from "../api/chatApi";

/* 채팅 화면 컴포넌트
 * - 초기: ListingTypeSelector (월세/전세/매매 선택)
 * - 이후: 대화창 + 이미지 업로드 가능
 */
export default function Chat() {
    const [messages, setMessages] = useState([]);      // [{ role, type, content }]
    const [input, setInput] = useState("");            // 입력 텍스트
    const [busy, setBusy] = useState(false);           // 전송 중인지
    const [imageFile, setImageFile] = useState(null);  // 업로드한 파일
    const fileInputRef = useRef(null);                 // 숨겨진 <input type="file" />

    // '+' 클릭 → 파일 선택창 열기
    const handleAttachClick = () => {
        if (busy) return;
        fileInputRef.current?.click();
    };

    // 파일 선택 시 상태 저장
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setInput(""); // 파일 보낼 거니까 텍스트는 비워둠
        }
    };

    // 메시지/이미지 전송
    const onSend = async () => {
        const t = input.trim();

        // ⛔ 텍스트도 없고 이미지도 없으면 전송 안 함
        if (!t && !imageFile) return;
        if (busy) return;

        setBusy(true);

        // 1) 이미지 전송 흐름
        if (imageFile) {
            // 브라우저 미리보기용 URL
            const imageUrl = URL.createObjectURL(imageFile);
            const base = [...messages, { role: "user", type: "image", content: imageUrl }];
            setMessages(base);

            try {
                // 서버로 실제 파일 보내서 분석
                const { reply } = await analyzeDocument(imageFile);
                setMessages([...base, { role: "assistant", type: "text", content: reply }]);
            } catch (e) {
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", type: "text", content: `에러: ${e.message}` },
                ]);
            } finally {
                // 파일 초기화
                setImageFile(null);
                // 파일 인풋 값 리셋
                if (fileInputRef.current) fileInputRef.current.value = null;
                // (선택) 미리보기 URL 해제
                // URL.revokeObjectURL(imageUrl);
                setBusy(false);
            }
            return; // 이미지 분기 끝
        }

        // 2) 텍스트 전송 흐름
        const base = [...messages, { role: "user", type: "text", content: t }];
        setMessages(base);

        try {
            const wireMsgs = base.map((m) => ({ role: m.role, content: m.content }));
            const { reply } = await sendMessage(wireMsgs);
            setMessages([...base, { role: "assistant", type: "text", content: reply }]);
        } catch (e) {
            setMessages([
                ...base,
                { role: "assistant", type: "text", content: `에러: ${e.message}` },
            ]);
        } finally {
            setInput("");
            setBusy(false);
        }
    };

    // Enter로 전송 (Shift+Enter는 줄바꿈)
    const onKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    // 카드(월세/전세/매매) 선택 시 첫 멘트
    const handleSelectType = (Type) => {
        setMessages([
            {
                role: "assistant",
                type: "text",
                content: `${Type} 상담을 시작할게요. 어떤 점이 궁금하신가요?`,
            },
        ]);
    };

    const hasMessages = messages.length > 0;

    return (
        <section className="chat-page">
            {/* 중앙 카드형 박스 */}
            <div className="chat-box">
                {/* 상단: 콘텐츠 영역 */}
                <div className="chat-content-area">
                    {hasMessages ? (
                        <div className="chat-stream">
                            {messages.map((m, i) => (
                                <div key={i} className={`bubble ${m.role}`}>
                                    {m.type === "image" ? (
                                        <img
                                            className="preview-image"
                                            src={m.content}
                                            alt="uploaded content"
                                        />
                                    ) : (
                                        m.content
                                    )}
                                </div>
                            ))}

                            {/* 👇 여기 추가: 챗봇 타이핑 버블 */}
                            {busy && (
                                <div className="bubble assistant typing">
                                    <span className="typing-dot" />
                                    <span className="typing-dot" />
                                    <span className="typing-dot" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <ListingTypeSelector onSelect={handleSelectType} />
                    )}
                </div>

                {/* 하단: 입력바(항상 표시) */}
                <div className="chat-input">
                    <button className="upload-btn" onClick={handleAttachClick} disabled={busy}>
                        +
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                    />

                    <textarea
                        rows={1}
                        placeholder={imageFile ? imageFile.name : "메시지를 입력하세요"}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        disabled={busy}
                    />

                    <button className="send-btn" onClick={onSend} disabled={busy}>
                        {busy ? "..." : "➤"}
                    </button>
                </div>
            </div>
        </section>
    );
}

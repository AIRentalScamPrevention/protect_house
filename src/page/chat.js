import React, { useState, useRef, useEffect } from "react";
import "./chat.css";
import ListingTypeSelector from "../components/ListingTypeSelector";
import { sendMessage, analyzeDocument } from "../api/chatApi";

export default function Chat() {
    const [messages, setMessages] = useState([]);       // [{ role, type, content }]
    const [input, setInput] = useState("");             // 텍스트
    const [busy, setBusy] = useState(false);            // 요청 중 여부
    const [isTyping, setIsTyping] = useState(false);    // 챗봇 타이핑 표시
    const [imageFile, setImageFile] = useState(null);   // 업로드 파일
    const fileInputRef = useRef(null);                  // 숨겨진 file input
    const bottomRef = useRef(null);                     // 자동 스크롤용

    // 메시지 추가될 때마다 아래로 스크롤
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // + 버튼 클릭 → 파일 선택
    const handleAttachClick = () => {
        if (busy) return;
        fileInputRef.current?.click();
    };

    // 파일 선택
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
        }
    };

    // 카드(월세/전세/매매) 선택
    const handleSelectType = (type) => {
        setMessages([
            {
                role: "assistant",
                type: "text",
                content: `${type} 상담을 시작할게요. 어떤 점이 궁금하신가요?`,
            },
        ]);
    };

    // 메시지 전송
    const onSend = async () => {
        const text = input.trim();
        if (!text && !imageFile) return;
        if (busy) return;

        setBusy(true);

        let base = [...messages];

        // 1) 사용자가 올린 이미지 미리보기용 말풍선
        if (imageFile) {
            const previewUrl = URL.createObjectURL(imageFile);
            base = [...base, { role: "user", type: "image", content: previewUrl }];
        }

        // 2) 텍스트도 같이 있으면 말풍선 추가
        if (text) {
            base = [...base, { role: "user", type: "text", content: text }];
        }

        setMessages(base);
        setInput("");

        try {
            setIsTyping(true);

            if (imageFile) {
                // 이미지 + (옵션) 텍스트 함께 분석
                const { reply } = await analyzeDocument(imageFile, text || "");
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", type: "text", content: reply },
                ]);
            } else {
                // 텍스트만 보낼 때
                const wireMsgs = base.map((m) => ({
                    role: m.role,
                    content: m.content,
                }));
                const { reply } = await sendMessage(wireMsgs);
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", type: "text", content: reply },
                ]);
            }
        } catch (e) {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", type: "text", content: `에러: ${e.message}` },
            ]);
        } finally {
            setIsTyping(false);
            setBusy(false);
            setImageFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    // Enter로 전송 (Shift+Enter는 줄바꿈)
    const onKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    const hasMessages = messages.length > 0;

    return (
        <section className="chat-page">
            {/* 위쪽: 카드 선택 or 대화 스트림 */}
            <div className="chat-content-area">
                {hasMessages ? (
                    <div className="chat-stream">
                        {messages.map((m, idx) => (
                            <div key={idx} className={`bubble ${m.role}`}>
                                {m.type === "image" ? (
                                    <div className="image-wrapper">
                                        <img
                                            className="chat-image"
                                            src={m.content}
                                            alt="uploaded content"
                                        />
                                    </div>
                                ) : (
                                    m.content
                                )}
                            </div>
                        ))}

                        {isTyping && (
                            <div className="bubble assistant typing">
                                <span className="typing-dot" />
                                <span className="typing-dot" />
                                <span className="typing-dot" />
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>
                ) : (
                    <ListingTypeSelector onSelect={handleSelectType} />
                )}
            </div>

            {/* 아래쪽: 입력 영역 */}
            <div className="chat-input-container">
                {imageFile && (
                    <div className="file-preview-chip">
                        <span>{imageFile.name}</span>
                        <button
                            type="button"
                            onClick={() => {
                                setImageFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                        >
                            ×
                        </button>
                    </div>
                )}

                <div className="chat-input">
                    <button
                        type="button"
                        className="attach-btn"
                        onClick={handleAttachClick}
                        disabled={busy}
                    >
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
                        placeholder={
                            imageFile
                                ? `${imageFile.name} (메시지를 함께 보낼 수 있어요)`
                                : "메시지를 입력하세요."
                        }
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        disabled={busy}
                    />

                    <button
                        type="button"
                        className="send-btn"
                        onClick={onSend}
                        disabled={busy}
                    >
                        {busy ? "..." : "➤"}
                    </button>
                </div>
            </div>
        </section>
    );
}

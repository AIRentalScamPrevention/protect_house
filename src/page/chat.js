import React, { useState, useRef, useEffect } from "react";
import "./chat.css";
import ListingTypeSelector from "../components/ListingTypeSelector";
import { sendMessage, analyzeDocument } from "../api/chatApi";
import ReactMarkdown from "react-markdown";

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [busy, setBusy] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const fileInputRef = useRef(null);
    const bottomRef = useRef(null);

    // ✅ 1. 상담 유형(월세/전세/매매)을 기억할 변수 추가
    const [consultType, setConsultType] = useState("");

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleAttachClick = () => {
        if (busy) return;
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
        }
    };

    // 카드 선택 함수
    const handleSelectType = (type) => {
        setConsultType(type); // ✅ 2. 사용자가 선택한 유형을 기억함
        setMessages([
            {
                role: "assistant",
                type: "text",
                content: `${type} 상담을 시작할게요. 어떤 점이 궁금하신가요?`,
            },
        ]);
    };

    const onSend = async () => {
        const text = input.trim();
        if (!text && !imageFile) return;
        if (busy) return;

        setBusy(true);

        let base = [...messages];

        if (imageFile) {
            const previewUrl = URL.createObjectURL(imageFile);
            base = [...base, { role: "user", type: "image", content: previewUrl }];
        }

        if (text) {
            base = [...base, { role: "user", type: "text", content: text }];
        }

        setMessages(base);
        setInput("");

        try {
            setIsTyping(true);

            // ✅ 3. AI에게 보낼 때 유형 정보를 몰래 붙여서 보냄
            // 예: "[전세 상담] 이 계약서 봐주세요"
            const contextMessage = `[${consultType || '일반'} 상담] ${text}`;

            if (imageFile) {
                // 이미지 분석 시에도 유형 정보 전달
                const { reply } = await analyzeDocument(imageFile, contextMessage);
                setMessages((prev) => [
                    ...prev,
                    { role: "assistant", type: "text", content: reply },
                ]);
            } else {
                // 텍스트만 보낼 때도 유형 정보 전달
                // 화면에는 사용자 입력 그대로 보여주지만, 서버로는 contextMessage를 보냄
                const wireMsgs = base.map((m) => {
                    // 방금 사용자가 입력한 텍스트 메시지를 찾아서 내용을 바꿔치기함
                    if (m.role === 'user' && m.type === 'text' && m.content === text) {
                        return { role: m.role, content: contextMessage };
                    }
                    return { role: m.role, content: m.content };
                });

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

    const onKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    const hasMessages = messages.length > 0;

    return (
        <section className="chat-page">
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
                                    <div className="markdown-content">
                                        <ReactMarkdown>{m.content}</ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        ))}

                        {isTyping && (
                            <div className="bubble assistant typing">
                                <span className="typing-dot"/>
                                <span className="typing-dot"/>
                                <span className="typing-dot"/>
                            </div>
                        )}

                        <div ref={bottomRef}/>
                    </div>
                ) : (
                    <ListingTypeSelector onSelect={handleSelectType} />
                )}
            </div>

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
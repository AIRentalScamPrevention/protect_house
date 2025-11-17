import React, { useState, useRef, useEffect } from "react";
import "./chat.css";
import ReactMarkdown from 'react-markdown'; // 마크다운 라이브러리
import ListingTypeSelector from "../components/ListingTypeSelector";
import { sendMessage, analyzeDocument } from "../api/chatApi";

export default function Chat() {
    const [messages, setMessages] = useState([]); // 대화 저장
    const [input, setInput] = useState(""); // 입력창 값
    const [busy, setBusy] = useState(false); // 전송 중 상태 표시

    // 파일 처리를 위한 새로운 상태와 ref
    const [imageFile, setImageFile] = useState(null);
    const fileInputRef = useRef(null);

    // 스크롤 자동 이동을 위한 ref
    const messagesEndRef = useRef(null);

    // 메시지가 추가될 때마다 스크롤 아래로 이동
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 파일 입력을 실행하는 함수
    const handleAttachClick = () => {
        if (busy) return;
        fileInputRef.current.click();
    };

    // 파일 선택 처리 함수
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImageFile(file);
            setInput("");
        }
    };

    // 메시지 보내기 함수
    const onSend = async () => {
        const t = input.trim();
        // 텍스트도 없고 이미지도 없으면 리턴
        if (!t && !imageFile) return;
        if (busy) return;

        setBusy(true);

        // 이미지 파일이 있을 때
        if (imageFile) {
            const imageUrl = URL.createObjectURL(imageFile);
            // 사용자 메시지 추가 (이미지 + 텍스트)
            const base = [...messages, { role: "user", type: "image", content: imageUrl }];
            if (t) {
                // 이미지만 보낼 수도 있고, 텍스트를 같이 보냈으면 텍스트 말풍선도 추가
                base.push({ role: "user", type: "text", content: t });
            }
            setMessages(base);

            try {
                // 이미지와 텍스트(t)를 함께 전송
                const { reply } = await analyzeDocument(imageFile, t);
                setMessages(prev => [...prev, { role: "assistant", type: "text", content: reply }]);
            } catch (e) {
                setMessages(prev => [
                    ...prev,
                    { role: "assistant", type: "text", content: `에러: ${e.message}` },
                ]);
            } finally {
                setImageFile(null);
            }
        }
        // 텍스트만 있을 때
        else {
            const base = [...messages, { role: "user", type: "text", content: t }];
            setMessages(base);

            try {
                const wireMsgs = base.map((m) => ({ role: m.role, content: m.content }));
                const { reply } = await sendMessage(wireMsgs);
                setMessages(prev => [...prev, { role: "assistant", type: "text", content: reply }]);
            } catch (e) {
                setMessages(prev => [
                    ...prev,
                    { role: "assistant", type: "text", content: `에러: ${e.message}` },
                ]);
            }
        }

        setInput("");
        setBusy(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
    };

    // Enter 키로 전송
    const onKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    // 카드 클릭 시, 주제에 맞는 첫 질문으로 전환
    const handleSelectType = (Type) => {
        setMessages([
            {
                role: "assistant",
                type: "text",
                content: `${Type} 상담을 시작할게요. 어떤 점이 궁금하신가요?`
            },
        ]);
    };

    const hasMessages = messages.length > 0;

    return (
        <section className="chat-page">
            {hasMessages ? (
                <div className="chat-stream">
                    {messages.map((m, i) => (
                        <div key={i} className={`bubble ${m.role}`}>
                            {/* ✅ 수정된 부분: 이미지와 텍스트(마크다운) 구분 렌더링 */}
                            {m.type === 'image' ? (
                                <img src={m.content} alt="uploaded content" className="chat-image" />
                            ) : (
                                <div className="markdown-content">
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    ))}
                    {/* 스크롤 자동 이동을 위한 더미 요소 */}
                    <div ref={messagesEndRef} />
                </div>
            ) : (
                <ListingTypeSelector onSelect={handleSelectType} />
            )}

            <div className="chat-input">
                <button className="attach-btn" onClick={handleAttachClick} disabled={busy}>+</button>

                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                />

                <textarea
                    rows={1}
                    placeholder={imageFile ? `${imageFile.name} (메시지를 함께 보낼 수 있어요)` : "메시지를 입력하세요."}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    disabled={busy}
                />
                <button className="send-btn" onClick={onSend} disabled={busy}>
                    {busy ? "..." : "➤"}
                </button>
            </div>
        </section>
    );
}
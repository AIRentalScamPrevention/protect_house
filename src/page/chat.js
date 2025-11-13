import React, { useState, useRef } from "react";
import "./chat.css";
import ListingTypeSelector from "../components/ListingTypeSelector";
import { sendMessage, streamMessage } from "../api/chatApi";
import {analyzeDocument} from "../api/chatApi";

export default function Chat() {
    const [messages, setMessages] = useState([]); // 대화 저장
    const [input, setInput] = useState(""); // 입력창 값
    const [busy, setBusy] = useState(false); // 전송 중 상태 표시

    //파일 처리를 위한 새로운 상태와 ref
    const [imageFile, setImageFile] = useState(null);
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false); // 드래그 상태

    const handleFile = (file) => {
        // <input> 태그의 accept 속성과 동일하게 파일 타입 검사
        const allowedTypes = ["image/", "application/pdf"];
        if (file && allowedTypes.some(type => file.type.startsWith(type))) {
            setImageFile(file);
            // setInput(""); // <-- 이 줄을 주석 처리하거나 삭제합니다.
            if (fileInputRef.current) {
                fileInputRef.current.value = null;
            }
        } else if (file) {
            alert("이미지(image/*) 또는 PDF 파일만 업로드할 수 있습니다.");
        }
    };

    //파일 입력을 실행하는 함수
    const handleAttachClick = () =>{
        if (busy) return;
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        handleFile(file); // 공통 함수 사용
    };

    const removeFile = () => {
        setImageFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
    };

    // 메시지 보내기 함수
    const onSend = async () => {
        const t = input.trim();

        if (!t && !imageFile) return; // 둘 다 없으면 전송 불가
        if (busy) return;

        setBusy(true);

        let currentMessages = [...messages]; // 현재 메시지 상태를 복사

        // 1. 파일이 있으면 먼저 처리
        if (imageFile) {
            const imageUrl = URL.createObjectURL(imageFile);
            // 사용자의 이미지 메시지 추가
            const userImageMsg = { role: "user", type: "image", content: imageUrl };
            currentMessages.push(userImageMsg);
            setMessages(currentMessages); // UI에 즉시 반영

            try {
                // API 호출
                const { reply } = await analyzeDocument(imageFile);
                // 봇의 응답 추가
                const botImageReply = { role: "assistant", type: "text", content: reply };
                currentMessages.push(botImageReply);
                setMessages([...currentMessages]); // 봇 응답까지 UI에 반영
            } catch (e) {
                const errorReply = { role: "assistant", type: "text", content: `에러: ${e.message}` };
                currentMessages.push(errorReply);
                setMessages([...currentMessages]); // 에러 메시지 반영
            } finally {
                setImageFile(null); // 파일 상태 비우기
            }
        }

        // 2. 텍스트가 있으면 이어서 처리 (else가 아님)
        if (t) {
            // 사용자의 텍스트 메시지 추가
            const userTextMsg = { role: "user", type: "text", content: t };
            currentMessages.push(userTextMsg);
            setMessages([...currentMessages]); // UI에 즉시 반영

            try {
                // API 전송을 위해 메시지 포맷팅 (지금까지의 모든 대화)
                const wireMsgs = currentMessages.map((m) => ({ role: m.role, content: m.content }));
                // API 호출
                const { reply } = await sendMessage(wireMsgs);
                // 봇의 응답 추가
                const botTextReply = { role: "assistant", type: "text", content: reply };
                currentMessages.push(botTextReply);
                setMessages([...currentMessages]); // 봇 응답까지 UI에 반영
            } catch (e) {
                const errorReply = { role: "assistant", type: "text", content: `에러: ${e.message}` };
                currentMessages.push(errorReply);
                setMessages([...currentMessages]); // 에러 메시지 반영
            }
        }

        // 3. 최종 정리
        setInput(""); // 입력창 비우기
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
                text: `${Type} 상담을 시작할게요. 어떤 점이 궁금하신가요?`},
        ]);
    };

    const hasMessages = messages.length > 0;

    // --- 드래그 앤 드롭 핸들러 ---
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (busy) return;

        const file = e.dataTransfer.files[0];
        handleFile(file); // 공통 함수 사용
    };

    return (
        <section
            className="chat-page"
            // ▼▼▼ 1. 감지를 위해 핸들러 4개를 최상위로 다시 이동 ▼▼▼
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* 1. 중앙 콘텐츠 영역 */}
            <div className="chat-content-area">
                {hasMessages ? (
                    <div className="chat-stream">
                        {messages.map((m, i) => (
                            <div key={i} className={`bubble ${m.role}`}>
                                {m.type === "image" ? (
                                    <img src={m.content} alt="uploaded content" />
                                ) : (
                                    m.content
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <ListingTypeSelector onSelect={handleSelectType} />
                )}
            </div>

            {/* 2. 하단 입력창 */}
            <div
                className="chat-input-container"
                // ▼▼▼ 2. 여긴 깨끗하게 비워둠 ▼▼▼
            >
                {imageFile && (
                    <div className="file-preview-chip">
                        <span>{imageFile.name}</span>
                        <button onClick={removeFile} disabled={busy}>×</button>
                    </div>
                )}

                <div
                    className="chat-input"
                    // ▼▼▼ 3. chat-input 에서는 핸들러 4개 모두 제거! ▼▼▼
                >
                    {/* ▼▼▼ 4. 하지만 오버레이(표시)는 여기 그대로 둠! ▼▼▼ */}
                    {isDragging && (
                        <div className="drop-overlay">
                            <p>파일을 여기에 놓아주세요</p>
                        </div>
                    )}

                    <button className="attach-btn" onClick={handleAttachClick} disabled={busy}>
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
                        placeholder="메시지를 입력하세요/"
                        value={input}
                        onChange={(e) => setInput(e.g.value)}
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
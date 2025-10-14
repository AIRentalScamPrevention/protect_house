import React, { useState } from "react";
import "./chat.css";
import ListingTypeSelector from "../components/ListingTypeSelector";
import { sendMessage, streamMessage } from "../api/chatApi";


/* 채팅 화면 컴포넌트
 * - 초기: 중앙 큰 입력창 + ListingTypeSelector (월세/전세/매매 선택)
 * - 메시지 입력 후: 대화창 모드로 전환
 */
export default function Chat() {
    const [messages, setMessages] = useState([]); // 대화 저장
    const [input, setInput] = useState(""); // 입력창 값
    const [busy, setBusy] = useState(false); // 전송 중 상태 표시

    // 메시지 보내기 함수
    const onSend = async () => {
        const t = input.trim();
        if (!t || busy) return;

        // 사용자 메시지 먼저 추가
        const base = [...messages, { role: "user", text: t }];
        setMessages(base);
        setInput("");
        setBusy(true);

        try {
            // 서버로 메시지 전송 (단발 응답)
            const wireMsgs = base.map((m) => ({role: m.role, content: m.text }));
            const { reply } = await sendMessage(wireMsgs); // 실제 API 응답
            setMessages([...base, { role: "assostant", text:reply }]);
        } catch (e) {
            // 에러 발생 시 표시
            setMessages([
                ...base,
                {role: "assistant", text: `에러: ${e.message}` },
            ]);
        } finally {
            setBusy(false);
        }
    };


    // Enter 키로 전송
    const onKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    // 카드 클릭 시, 주게에 맞는 첫 질문으로 전환
    const handleSelectType = (Type) => {
        setMessages([
            {
                role: "assistant",
                text: `${Type} 상담을 시작할게요. 어떤 점이 궁금하신가요?`},
        ]);
    };

    const hasMessages = messages.length > 0;

    return (
        <section className="chat-page">
            {hasMessages ? (
                <div className="chat-stream">
                    {messages.map((m, i) => (
                        <div key={i} className={`bubble ${m.role}`}>{m.text}</div>
                    ))}
                </div>
            ) : (
                <ListingTypeSelector onSelect={handleSelectType} />
            )}

            {/* 하단: 입력바는 항상 표시 */}
            <div className="chat-input">
        <textarea
            rows={2}
            placeholder="메시지를 입력하세요."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={busy} // 전송 중이면 입력 비활성화
        />
                <button className="send-btn" onClick={onSend} disabled={busy}>
                    {busy ? "..." : "➤"}
                </button>

            </div>
        </section>
    );
}
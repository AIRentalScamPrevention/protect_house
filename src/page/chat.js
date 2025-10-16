import React, { useState, useRef } from "react";
import "./chat.css";
import ListingTypeSelector from "../components/ListingTypeSelector";
import { sendMessage, streamMessage } from "../api/chatApi";
import {analyzeDocument} from "../api/chatApi";

/* 채팅 화면 컴포넌트
 * - 초기: 중앙 큰 입력창 + ListingTypeSelector (월세/전세/매매 선택)
 * - 메시지 입력 후: 대화창 모드로 전환
 */
export default function Chat() {
    const [messages, setMessages] = useState([]); // 대화 저장
    const [input, setInput] = useState(""); // 입력창 값
    const [busy, setBusy] = useState(false); // 전송 중 상태 표시

    //파일 처리를 위한 새로운 상태와 ref
    const [imageFile, setImageFile] = useState(null);
    const fileInputRef = useRef(null);

    //파일 입력을 실행하는 함수
    const handleAttachClick = () =>{
        if (busy) return;
        fileInputRef.current.click();
    };

    // 파일 선택 처리 함수
    const handleFileChange =(event)=>{
        const file = event.target.files[0];
        if (file){
            setImageFile(file);
            setInput("");
        }
    };

    // 메시지 보내기 함수
    const onSend = async () => {
        const t= input.trim();
        if (!t&&imageFile) return;
        if (busy) return;

        setBusy(true);

        //이미지
        if (imageFile){
            const imageUrl = URL.createObjectURL(imageFile);
            const base = [...messages, {role : "user", type : "image", content : imageUrl}];
            setMessages((base));
            setBusy(true);

            try {
                const {reply} =await analyzeDocument(imageFile);
                setMessages([...base, {role : "assistant", type : "text", content : reply}]);
            }
            catch (e) {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { role: "assistant", type: "text", content: `에러: ${e.message}` }, // e.message() -> e.message
                ]);
            }
            finally {
                setImageFile(null);
            }
        }
        // 텍스트
        else {
            const  base = [...messages, {role : "user", type : "text", content : t}];
            setMessages(base);

            try {
                const wireMsgs = base.map((m)=>({role : m.role, content : m.content}));
                const {reply}=await sendMessage(wireMsgs);
                setMessages([...base, {role : "assistant", type : "text", content : reply}]);
            }catch (e){
                setMessages([...base, { role: "assistant", type: "text", content: `에러: ${e.message}` }]);
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
                    {messages.map((m, i)=>(
                        <div key={i} className={`bubble ${m.role}`}>
                            {m.type === 'image' ? <img src={m.content} alt="uploaded content"/> : m.content}
                        </div>
                    ))}
                </div>
            ) : (
                <ListingTypeSelector onSelect={{handleSelectType}}/>
            )}
            <div className="chat-input">
                <button className="attach-btn" onClick={handleAttachClick} disabled={busy}>+</button>

                <input
                    type="file"
                    ref={fileInputRef}
                    style={{display : 'none'}}
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                />

                <textarea
                    rows={1}
                    placeholder={imageFile ? imageFile.name : "메시지를 입력하세요/"}
                    value={input}
                    onChange={(e)=> setInput(e.target.value)}
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
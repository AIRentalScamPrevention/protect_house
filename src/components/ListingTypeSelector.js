import React, { useState } from "react";
import "./ListingTypeSelector.css"

/*
 * 첫 화면 선택 UI
 * - 제목 + 세로 3열 카드 (월세 , 전세 , 매매 )
 * - 하나 선택하면 '다음' 버튼 활성화
 * - 카드를 클릭하면 즉시 onSelect(type) 호출
 */
// props 이름을 onConfirm에서 onSelect로 변경하여 Chat.js와 통일합니다.
export default function ListingTypeSelector({ onSelect }) {
    const [selected, setSelected] = useState(null);

    const options = [
        { key: "월세", desc: "보증금, 인상, 미납"},
        { key: "전세", desc: "사기, 보증보험, 확정일자"},
        { key: "매매", desc: "계약금, 하자, 소유권"},
    ];

    const pick = (key) => {
        setSelected(key);
        // 오타 수정: onselect -> onSelect (props로 받은 함수 사용)
        if (onSelect) {
            onSelect(key);
        }
    };

    return (
        <section className="lts-wrap">
            {/* 제목 */}
            <h1 className="lts-title">어떤 유형의 매물이신가요?</h1>

            {/* 키워드 3개 */}
            <div className="lts-grid" role="group" aria-label="매물 유형 선택">
                {options.map(opt => {
                    const active = selected === opt.key;
                    return (
                        <button
                            key={opt.key}
                            className={`lts-card ${active ? "is-active" : ""}`}
                            onClick={() => pick(opt.key)}
                            aria-pressed={active}
                        >
                            {/* 상단 영역: 선택 표시(라디오 느낌) */}
                            <span className={`lts-dot ${active ? "on" : ""}`} aria-hidden />
                            {/* 중앙 텍스트 */}
                            <div className="lts-card-body">
                                <div className="lts-card-title">{opt.key}</div>
                                <div className="lts-card-desc">{opt.desc}</div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
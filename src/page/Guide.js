import React from "react";
import "./guide.css";

/**
 * 전세사기 예방 가이드 - 필수 준비 서류 목록 + 발급 방법
 */

export default function Guide() {
    return (
        <main className="guide">
            {/* 헤더 */}
            <header className="guide-hero">
                <h1>전세사기 예방 가이드</h1>
                <p className="muted">
                    임차인이 반드시 확인해야 할 서류와 발급 절차 안내
                    실제 발급처/요건은 지역·시점에 따라 달라질 수 있으니,
                    신청 전 해당 기관 공지사항을 꼭 확인하세요.
                </p>
            </header>

            {/* 목차 */}
            <nav className="toc" aria-label="가이드 목차">
                <div className="toc-title">오늘 완성할 섹션</div>
                <ul>
                    <li><a href="#docs">필수 준비 서류 목록</a></li>
                </ul>
                <div className="toc-title next">향후 확장</div>
                <ul className="muted">
                    <li>계약 전 확인 체크리스트</li>
                    <li>계약 체결 시 확인 사항</li>
                    <li>계약 후 관리</li>
                </ul>
            </nav>

            {/* 본문 */}
            <section id="docs" className="section">
                <h2>필수 준비 서류 목록</h2>
                <p className="muted">
                    아래 각 항목을 클릭하면 <strong>어디서 발급</strong>하고 <strong>어떻게 신청</strong>하는지,
                    <strong>유의사항</strong>까지 펼쳐서 볼 수 있어요.
                </p>

                <div className="cards">
                    {/* 등기부등본 */}
                    <details className="card" open>
                        <summary>
                            <span className="card-title">등기부등본 (집전체)</span>
                            <span className="badge">핵심</span>
                        </summary>
                        <div className="card-body">
                            <div className="row">
                                <div>
                                    <h4> 어디서 발급 받나요 ?</h4>
                                    <ul>
                                        <li><strong>정부24</strong> 또는 <strong>인터넷등기소</strong>(온라인)</li>
                                        <li><strong>등기소/법원 민원실</strong>(오프라인)</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4>온라인 절차</h4>
                                    <ol>
                                        <li>인터넷등기소 접속 → ‘부동산 등기열람/발급’ 선택</li>
                                        <li>주소 검색 → 건물 선택(동·호수 확인) → 발급 유형 선택</li>
                                        <li>수수료 결제 후 PDF 출력/저장</li>
                                    </ol>
                                </div>
                            </div>
                            <h4>유의사항</h4>
                            <ul>
                                <li>갑구·을구의 <strong>소유자, 근저당, 가압류, 가처분</strong> 등 <strong>권리관계</strong>를 확인.</li>
                                <li>가능하면 <strong>집 전체(집합건물 대지권 포함) 기준</strong>으로 최신본 발급.</li>
                                <li>변동 가능성이 크니 <strong>계약 직전/당일에 재발급</strong>하여 갱신 여부 확인.</li>
                            </ul>
                        </div>
                    </details>

                    {/* 건축물대장/토지대장 */}
                    <details className="card">
                        <summary>
                            <span className="card-title">건축물대장· 토지대장</span>
                        </summary>
                        <div className="card-body">
                            <div className="row">
                                <div>
                                    <h4>어디서 발급 받나요 ?</h4>
                                    <ul>
                                        <li><strong>정부24</strong>(온라인)</li>
                                        <li><strong>구청/주민센터</strong>(오프라인)</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4>온라인 절차</h4>
                                    <ol>
                                        <li>정부24 접속 → ‘민원 신청’ → ‘건축물대장(총괄/일반) 조회’/‘토지(임야)대장’</li>
                                        <li>주소 입력 → 열람/발급 선택 → 수수료 결제</li>
                                        <li>PDF 출력/저장</li>
                                    </ol>
                                </div>
                            </div>
                            <h4>유의사항</h4>
                            <ul>
                                <li><strong>실제 용도</strong>가 주거인지 확인(근린생활시설 → 주거 불법개조 여부 점검).</li>
                                <li><strong>불법 증축/용도변경</strong> 이력, 위반건축물 표시 여부 확인.</li>
                            </ul>
                        </div>
                    </details>

                    {/* 신분증/인감증명서/위임장 */}
                    <details className="card">
                        <summary>
                            <span className="card-title">집주인 신분증 사본· 인감증명서 · 위임장(대리계약 시)</span>
                        </summary>
                        <div className="card-body">
                            <div className="row">
                                <div>
                                    <h4>어디서 발급 받나요 ?</h4>
                                    <ul>
                                        <li><strong>인감증명서/위임장</strong>: 주민센터(오프라인, 본인/대리 요건 유의)</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4>오프라인 절차</h4>
                                    <ol>
                                        <li>임대인이 주민센터 방문 → 신분증 지참</li>
                                        <li>인감도장 등록/확인 후 <strong>인감증명서 원본</strong> 발급</li>
                                        <li>대리계약 시: <strong>위임장 원본 + 인감증명서 원본</strong>을 임차인에게 제공</li>
                                    </ol>
                                </div>
                            </div>
                            <h4>유의사항</h4>
                            <ul>
                                <li>등기상 <strong>소유자와 계약 당사자 동일</strong> 여부 확인.</li>
                                <li>대리인 계약은 <strong>위임장·인감증명서 원본</strong>확인이 핵심.</li>
                            </ul>
                        </div>
                    </details>

                    {/* 임대차계약서 원본 / 확정일자 */}
                    <details className="card">
                        <summary>
                            <span className="card-title">임대차계약서 원본 · 확정일자 날인 계약서</span>
                        </summary>
                        <div className="card-body">
                            <div className="row">
                                <div>
                                    <h4>확정일자 어디서 받나요 ?</h4>
                                    <ul>
                                        <li><strong>주민센터</strong> 방문(계약서 원본 지참)</li>
                                        <li>전자계약의 경우 <strong>부동산거래관리시스템</strong> 통해 처리</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4>절차</h4>
                                    <ol>
                                        <li>계약 체결 → 계약서 원본 지참</li>
                                        <li>주민센터 방문 → <strong>확정일자 도장</strong> 받기</li>
                                        <li>전입신고와 <strong>가급적 같은 날</strong> 처리(대항력·우선변제권 확보)</li>
                                    </ol>
                                </div>
                            </div>
                            <h4>유의사항</h4>
                            <ul>
                                <li>계약서 기본 기재 항목(주소·층·호수·보증금/차임·기간) 누락 금지.</li>
                                <li>확정일자 스탬프가 <strong>원본</strong>에 찍혀 있어야함.</li>
                            </ul>
                        </div>
                    </details>

                    {/* 전입신고 완료 확인서 */}
                    <details className="card">
                        <summary>
                            <span className="card-title">전입신고 완료확인서</span>
                        </summary>
                        <div className="card-body">
                            <div className="row">
                                <div>
                                    <h4>어디서 발급 받나요 ?</h4>
                                    <ul>
                                        <li><strong>정부24</strong> (온라인) - 전입신고 접수 후 발급 가능</li>
                                        <li><strong>주민센터</strong> (오프라인)</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4>절차</h4>
                                    <ol>
                                        <li>전입신고(정부24 또는 주민센터)</li>
                                        <li>처리 후 '전입신고 사실확인서/완료확인서' 출력/수령</li>
                                    </ol>
                                </div>
                            </div>
                            <h4>유의사항</h4>
                            <ul>
                                <li><strong>계약 직후 바로</strong> 전입신고(대향력 요건 확보).</li>
                                <li>확정일자와 <strong>날짜를 가급적 맞춰</strong> 처리.</li>
                            </ul>
                        </div>
                    </details>

                    {/* 전세보증보험 가입증서 */}
                    <details className="card">
                        <summary>
                            <span className="card-title">전세보증보험 가입증서</span>
                        </summary>
                        <div className="card-body">
                            <div className="row">
                                <div>
                                    <h4>어디서 가입/발급 받나요 ?</h4>
                                    <ul>
                                        <li><strong>HUG(주택도시보증공사)</strong>,<strong>SGI서울보증</strong></li>
                                        <li>온라인 사전조회 후 창구/대행사 통해 접수</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4>절차</h4>
                                    <ol>
                                        <li>해당 기관 사전 조회: 대상 주택 <strong> 가입 가능 여부</strong> 확인</li>
                                        <li>서류 제출(계약서, 등기부등본, 전입·확정일자 등)</li>
                                        <li>심사 후 <strong>가입증서 발급</strong></li>
                                    </ol>
                                </div>
                            </div>
                            <h4>유의사항</h4>
                            <ul>
                                <li>보험료 부담 주체는 <strong>계약서에 명시</strong>.</li>
                                <li>보증금보다 <strong>선순위 권리</strong>가 큰 경우 가입 제한·거절 가능.</li>
                            </ul>
                        </div>
                    </details>
                </div>
            </section>
        </main>
    );
}
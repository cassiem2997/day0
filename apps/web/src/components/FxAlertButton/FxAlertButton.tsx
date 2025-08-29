import Swal from "sweetalert2";
import styles from "./FxAlertButton.module.css";
import { createFxAlert, type FxAlertRequest } from "../../api/fx";
import { me } from "../../api/user";

// 간단 유틸
const stripCommas = (s: string) => s.replace(/,/g, "");
const fmtKRWString = (s: string) =>
  (parseInt(s || "0", 10) || 0).toLocaleString("ko-KR");
const sanitizeKrw = (s: string) => {
  s = s.replace(/[^\d]/g, "");
  s = s.replace(/^0+(?=\d)/, "");
  if (s === "") s = "0";
  return s;
};

// 지원 통화 목록
const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "미국 달러", symbol: "$" },
  { code: "EUR", name: "유로", symbol: "€" },
  { code: "JPY", name: "일본 엔", symbol: "¥" },
  { code: "GBP", name: "영국 파운드", symbol: "£" },
  { code: "CNY", name: "중국 위안", symbol: "¥" },
  { code: "CAD", name: "캐나다 달러", symbol: "C$" },
  { code: "AUD", name: "호주 달러", symbol: "A$" },
];

export default function FxAlertButton({
  quoteCcy = "KRW",
  rates = {}, // 각 통화별 현재 환율 { USD: 1398, EUR: 1520, ... }
  userId,
}: {
  quoteCcy?: string;
  rates?: Record<string, number>;
  userId?: number;
}) {
  const openModal = async () => {
    const defaultBaseCcy = "USD";
    const initRate = rates[defaultBaseCcy] || 1398;
    const initKrw = fmtKRWString(String(Math.round(initRate)));

    const currencyOptions = SUPPORTED_CURRENCIES.map((c) => 
      `<option value="${c.code}" ${c.code === defaultBaseCcy ? "selected" : ""}>
        ${c.code}
      </option>`
    ).join("");

    await Swal.fire({
      width: 580,
      padding: 0,
      showConfirmButton: false,
      html: `
<div id="fxa" style="font-family:'EF_jejudoldam',system-ui,-apple-system,Segoe UI,Roboto,'Noto Sans KR','Apple SD Gothic Neo',sans-serif;">
  <div style="margin:18px;background:#f3f9ff;border:4px solid #111;border-radius:18px;padding:22px 22px 26px;">
    <div style="display:flex;justify-content:center;margin-bottom:16px;">
      <div style="background:#fff;border:4px solid #111;border-radius:999px;padding:10px 20px;font-weight:900;font-size:22px;">알림 신청</div>
    </div>

    <!-- 외화 선택 + 고정값 1 -->
    <div style="display:flex;align-items:center;gap:16px;margin-top:8px;">
      <!-- 드롭다운: KRW 뱃지와 동일한 사이즈로 강제 -->
      <div style="flex:0 0 160px;position:relative;">
        <select id="fxa-currency"
          style="
            width:160px;height:56px;box-sizing:border-box;
            background:#4758FC;color:#fff;border:4px solid #111;border-radius:24px;
            padding:12px 36px 12px 16px; /* 화살표 공간 확보 */
            font-weight:900;font-size:20px;letter-spacing:2px;
            text-align-last:center;line-height:1;
            appearance:none;-webkit-appearance:none;-moz-appearance:none;
            cursor:pointer;">
          ${currencyOptions}
        </select>
        <span style="
          position:absolute;right:12px;top:50%;transform:translateY(-50%);
          pointer-events:none;font-weight:900;font-size:18px;color:#fff;">▾</span>
      </div>

      <div style="flex:1;border:4px solid #111;border-radius:24px;background:#f0f0f0;padding:10px 16px;display:flex;align-items:center;justify-content:center;height:56px;box-sizing:border-box;">
        <span style="font-weight:900;font-size:26px;color:#666;">1</span>
      </div>
    </div>

    <div style="height:2px;background:#e8edf3;margin:14px 6px;"></div>

    <!-- KRW -->
    <div style="display:flex;align-items:center;gap:16px;margin-top:4px;">
      <span style="
        flex:0 0 160px;height:56px;box-sizing:border-box;
        display:flex;align-items:center;justify-content:center;
        background:#4758FC;color:#fff;border:4px solid #111;border-radius:24px;
        padding:0 14px;font-weight:900;font-size:20px;letter-spacing:2px;">
        ${quoteCcy}
      </span>
      <div style="flex:1;border:4px solid #111;border-radius:24px;background:#fff;padding:10px 16px;display:flex;align-items:center;justify-content:flex-end;height:56px;box-sizing:border-box;">
        <input id="fxa-krw" type="text" inputmode="numeric"
          value="${initKrw}"
          style="width:100%;text-align:right;border:none;outline:none;background:transparent;font-weight:900;font-size:26px;color:#4758fc;" />
      </div>
    </div>

    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:22px;">
      <!-- 왼쪽 여백 -->
      <div style="width: 120px;"></div>
      
      <!-- 신청하기 버튼 (중앙) -->
      <button id="fxa-submit"
        style="
          border:none;cursor:pointer;padding:12px 24px;border-radius:999px;
          background:#4758FC;color:#fff;font-weight:900;font-size:18px;
          box-shadow:0 4px 0 #111;border:3px solid #111;transition:all .1s ease;">
        신청하기
      </button>
      
      <!-- 알림 신청내역 텍스트 (오른쪽) -->
      <span id="fxa-history" 
        style="
          color:#4758FC; font-weight:700; font-size:16px; 
          text-decoration:underline; cursor:pointer;
          transition: all 0.1s ease; width: 120px; text-align: right;">
        알림 신청내역
      </span>
    </div>
  </div>
</div>
      `,
      didOpen: () => {
        const currencyEl = document.getElementById("fxa-currency") as HTMLSelectElement;
        const krwEl = document.getElementById("fxa-krw") as HTMLInputElement;
        const submitEl = document.getElementById("fxa-submit") as HTMLButtonElement;
        const historyEl = document.getElementById("fxa-history") as HTMLButtonElement;

        const updateKrwValue = () => {
          const selectedCcy = currencyEl.value;
          const rate = rates[selectedCcy] ?? 1398;
          krwEl.value = fmtKRWString(String(Math.round(rate)));
        };

        const onKrwInput = () => {
          const raw = stripCommas(krwEl.value);
          const s = sanitizeKrw(raw);
          krwEl.value = fmtKRWString(s);
        };

        // 알림 신청내역 보기
        const showHistory = async () => {
          try {
            // userId가 없으면 API를 호출해서 현재 사용자 정보 가져오기
            let currentUserId = userId;
            
            if (!currentUserId) {
              try {
                const userInfo = await me();
                if (!userInfo.userId) {
                  throw new Error('사용자 ID를 찾을 수 없습니다');
                }
                currentUserId = userInfo.userId;
              } catch (authError: any) {
                await Swal.fire({
                  icon: "warning", 
                  title: "로그인이 필요합니다",
                  text: `인증에 실패했습니다: ${authError.message || '알 수 없는 오류'}`,
                  confirmButtonText: "확인",
                });
                return;
              }
            }

            // 알림 내역 조회
            const { getFxAlerts } = await import('../../api/fx');
            const response = await getFxAlerts(currentUserId);

            if (!response.success) {
              throw new Error(response.message || "알림 내역을 가져올 수 없습니다.");
            }

            const alerts = response.data;
            
            // 간단한 페이지네이션 (3개씩 표시)
            const itemsPerPage = 3;
            const totalPages = Math.ceil(alerts.length / itemsPerPage);
            let currentPage = 1;
            
            const showPage = (page: number) => {
              const startIndex = (page - 1) * itemsPerPage;
              const endIndex = startIndex + itemsPerPage;
              const currentAlerts = alerts.slice(startIndex, endIndex);
              
              const alertsHtml = `
                <div id="fxa-history-view" style="font-family: 'EF_jejudoldam', system-ui, -apple-system, sans-serif;">
                  <div style="margin: 18px; background:#F3FCFF; border:4px solid #111; border-radius:18px; padding:22px 22px 26px;">
                    <div style="display:flex; justify-content:center; margin-bottom:16px;">
                      <div style="background:#fff; border:4px solid #111; border-radius:999px; padding:10px 20px; font-weight:900; font-size:22px;">알림 신청내역</div>
                    </div>
                    
                    ${currentAlerts.length > 0 ? `
                      <div style="margin-bottom:20px;">
                        ${currentAlerts.map((alert: any) => {
                          const status = alert.active ? '활성' : '비활성';  // isActive -> active
                          const statusColor = alert.active ? '#4CAF50' : '#999';  // isActive -> active
                          
                          // alertId를 여러 방법으로 시도
                          const alertId = alert.alertId || alert['alertId'] || alert.id;
                          
                          // ID가 없으면 삭제 버튼을 숨김
                          const deleteButton = alertId ? `
                            <button id="fxa-delete-${alertId}" 
                              style="
                                border:none; cursor:pointer;
                                padding:6px 12px; border-radius:999px;
                                background:#ff4444; color:#fff; font-weight:700; font-size:12px;
                                transition: all 0.1s ease;">
                              삭제
                            </button>
                          ` : `
                            <span style="
                              padding:6px 12px; border-radius:999px;
                              background:#ccc; color:#666; font-weight:700; font-size:12px;">
                              ID 없음
                            </span>
                          `;
                          
                          return `
                            <div style="background:#fff; border:2px solid #A8D5FF; border-radius:12px; padding:16px; margin-bottom:12px;">
                              <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div style="font-weight:700; font-size:16px; color:#111;">
                                  ${alert.baseCcy} 1 = ${alert.targetRate.toLocaleString("ko-KR")} ${alert.currency}
                                </div>
                                <div style="display:flex; align-items:center; gap:12px;">
                                  <span style="background:${statusColor}; color:#fff; padding:4px 8px; border-radius:999px; font-size:12px; font-weight:700;">
                                    ${status}
                                  </span>
                                  ${deleteButton}
                                </div>
                              </div>
                            </div>
                          `;
                        }).join('')}
                      </div>
                      
                      ${totalPages > 1 ? `
                        <!-- 페이지네이션 -->
                        <div style="display:flex; justify-content:center; align-items:center; gap:8px; margin-bottom:20px;">
                          <button id="fxa-prev" 
                            style="
                              border:none; cursor:pointer;
                              padding:8px 16px; border-radius:999px;
                              background:#fff; color:#111; font-weight:700; font-size:14px;
                              border:2px solid #A8D5FF; transition: all 0.1s ease;"
                            ${page === 1 ? 'disabled' : ''}>
                            이전
                          </button>
                          
                          <span style="font-weight:700; color:#111; padding:8px 16px;">
                            ${page} / ${totalPages}
                          </span>
                          
                          <button id="fxa-next"
                            style="
                              border:none; cursor:pointer;
                              padding:8px 16px; border-radius:999px;
                              background:#fff; color:#111; font-weight:700; font-size:14px;
                              border:2px solid #A8D5FF; transition: all 0.1s ease;"
                            ${page === totalPages ? 'disabled' : ''}>
                            다음
                          </button>
                        </div>
                        
                        <div style="text-align:center; margin-bottom:20px; font-size:14px; color:#666;">
                          ${alerts.length}개 중 ${startIndex + 1}-${endIndex}개 표시
                        </div>
                      ` : ''}
                    ` : `
                      <div style="text-align:center; padding:40px 20px; color:#999; font-style:italic;">
                        등록된 환율 알림이 없습니다.
                      </div>
                    `}
                    
                    <div style="display:flex; justify-content:center;">
                      <button id="fxa-back"
                        style="
                          border:none; cursor:pointer;
                          padding:12px 24px; border-radius:999px;
                          background:#A8D5FF; color:#111; font-weight:900; font-size:18px;
                          border:3px solid #111; transition: all 0.1s ease;">
                        뒤로가기
                      </button>
                    </div>
                  </div>
                </div>
              `;
              
              const container = document.getElementById('fxa');
              if (container) {
                container.innerHTML = alertsHtml;
                
                // 삭제 버튼 이벤트 리스너들 추가
                currentAlerts.forEach((alert: any) => {
                  console.log('=== 알림 데이터 상세 분석 ===');
                  console.log('전체 alert 객체:', alert);
                  console.log('alert.alertId:', alert.alertId);
                  console.log('alert.alertId 타입:', typeof alert.alertId);
                  console.log('alert.alertId === undefined:', alert.alertId === undefined);
                  console.log('alert.alertId === null:', alert.alertId === null);
                  console.log('Object.keys(alert):', Object.keys(alert));
                  console.log('========================');
                  
                  // alertId를 여러 방법으로 시도
                  const alertId = alert.alertId || alert['alertId'] || alert.id;
                  
                  if (!alertId) {
                    console.error('알림 ID를 찾을 수 없습니다:', alert);
                    return; // ID가 없으면 건너뛰기
                  }
                  
                  console.log('최종 사용할 alertId:', alertId);
                  
                  const deleteEl = document.getElementById(`fxa-delete-${alertId}`) as HTMLButtonElement;
                  if (deleteEl) {
                    deleteEl.addEventListener("click", async () => {
                      try {
                        console.log('삭제 버튼 클릭됨, alertId:', alertId); // 삭제 시도 시 ID 확인
                        
                        const result = await Swal.fire({
                          icon: "warning",
                          title: "알림 삭제",
                          text: "정말로 이 알림을 삭제하시겠습니까?",
                          showCancelButton: true,
                          confirmButtonText: "삭제",
                          cancelButtonText: "취소",
                          confirmButtonColor: "#ff4444",
                          cancelButtonColor: "#6c757d",
                        });
                        
                        if (result.isConfirmed) {
                          const { deleteFxAlert } = await import('../../api/fx');
                          console.log('삭제 API 호출 전 alertId:', alertId); // API 호출 전 최종 확인
                          await deleteFxAlert(alertId);
                          
                          await Swal.fire({
                            icon: "success",
                            title: "삭제 완료",
                            text: "알림이 성공적으로 삭제되었습니다.",
                            confirmButtonText: "확인",
                            confirmButtonColor: "#4758FC",
                          });
                          
                          showHistory();
                        }
                      } catch (error: any) {
                        console.error('알림 삭제 오류:', error);
                        console.error('삭제 시도한 alertId:', alertId); // 오류 시 ID 확인
                        await Swal.fire({
                          icon: "error",
                          title: "삭제 실패",
                          text: error.message || "알림 삭제 중 오류가 발생했습니다.",
                          confirmButtonText: "확인",
                          confirmButtonColor: "#ff4444",
                        });
                      }
                    });
                  } else {
                    console.error(`삭제 버튼을 찾을 수 없습니다: fxa-delete-${alertId}`);
                  }
                });
                
                // 페이지네이션 이벤트 리스너들
                if (totalPages > 1) {
                  const prevEl = document.getElementById("fxa-prev") as HTMLButtonElement;
                  const nextEl = document.getElementById("fxa-next") as HTMLButtonElement;
                  
                  if (prevEl && page > 1) {
                    prevEl.addEventListener("click", () => showPage(page - 1));
                  }
                  
                  if (nextEl && page < totalPages) {
                    nextEl.addEventListener("click", () => showPage(page + 1));
                  }
                }
                
                // 뒤로가기 버튼 이벤트 리스너
                const backEl = document.getElementById("fxa-back") as HTMLButtonElement;
                if (backEl) {
                  backEl.addEventListener("click", () => {
                    // 원래 알림 신청 화면으로 돌아가기
                    container.innerHTML = `
                      <div style="margin: 18px; background:#f3f9ff; border:4px solid #111; border-radius:18px; padding:22px 22px 26px;">
                        <div style="display:flex; justify-content:center; margin-bottom:16px;">
                          <div style="background:#fff; border:4px solid #111; border-radius:999px; padding:10px 20px; font-weight:900; font-size:22px;">알림 신청</div>
                        </div>
                        <!-- 외화 선택 및 고정값 1 -->
                        <div style="display:flex; align-items:center; gap:16px; margin-top:8px;">
                          <select id="fxa-currency" 
                            style="min-width:160px; text-align:center; background:#4758FC; color:#fff; border:4px solid #111; border-radius:24px; padding:12px 14px; font-weight:900; font-size:18px; cursor:pointer;">
                            ${currencyOptions}
                          </select>
                          <div style="flex:1; border:4px solid #111; border-radius:24px; background:#f0f0f0; padding:10px 16px; display:flex; align-items:center; justify-content:center;">
                            <span style="font-weight:900; font-size:26px; color:#666;">1</span>
                          </div>
                        </div>

                        <div style="height:2px; background:#e8edf3; margin:14px 6px;"></div>

                        <!-- KRW -->
                        <div style="display:flex; align-items:center; gap:16px; margin-top:4px;">
                          <span style="min-width:160px; text-align:center; background:#4758FC; color:#fff; border:4px solid #111; border-radius:24px; padding:12px 14px; font-weight:900; font-size:20px; letter-spacing:2px;">
                            ${quoteCcy}
                          </span>
                          <div style="flex:1; border:4px solid #111; border-radius:24px; background:#fff; padding:10px 16px; display:flex; align-items:center; justify-content:flex-end;">
                            <input id="fxa-krw" type="text" inputmode="numeric"
                              value="${initKrw}"
                              style="width:100%; text-align:right; border:none; outline:none; background:transparent; font-weight:900; font-size:26px; color:#4758fc;" />
                          </div>
                        </div>

                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:22px;">
                          <!-- 왼쪽 여백 -->
                          <div style="width: 120px;"></div>
                          
                          <!-- 신청하기 버튼 (중앙) -->
                          <button id="fxa-submit"
                            style="
                              border:none; cursor:pointer;
                              padding:12px 24px; border-radius:999px;
                              background:#4758FC; color:#fff; font-weight:900; font-size:18px;
                              box-shadow:0 4px 0 #111; border:3px solid #111;
                              transition: all 0.1s ease;">
                            신청하기
                          </button>
                          
                          <!-- 알림 신청내역 텍스트 (오른쪽) -->
                          <span id="fxa-history" 
                            style="
                              color:#4758FC; font-weight:700; font-size:16px; 
                              text-decoration:underline; cursor:pointer;
                              transition: all 0.1s ease; width: 120px; text-align: right;">
                            알림 신청내역
                          </span>
                        </div>
                      </div>
                    `;
                    
                    // 이벤트 리스너 다시 등록
                    const newCurrencyEl = document.getElementById("fxa-currency") as HTMLSelectElement;
                    const newKrwEl = document.getElementById("fxa-krw") as HTMLInputElement;
                    const newSubmitEl = document.getElementById("fxa-submit") as HTMLButtonElement;
                    const newHistoryEl = document.getElementById("fxa-history") as HTMLButtonElement;
                    
                    newCurrencyEl.addEventListener("change", updateKrwValue);
                    newKrwEl.addEventListener("input", onKrwInput);
                    newSubmitEl.addEventListener("click", submit);
                    newKrwEl.addEventListener("keydown", (e) => e.key === "Enter" && submit());
                    newHistoryEl.addEventListener("click", showHistory);
                  });
                }
              }
            };
            
            // 첫 페이지 표시
            showPage(1);
          } catch (error: any) {
            console.error('알림 내역 조회 오류:', error);
            await Swal.fire({
              icon: "error",
              title: "알림 내역 조회 실패",
              text: error.message || "알림 내역을 가져올 수 없습니다.",
              confirmButtonText: "확인",
              confirmButtonColor: "#ff4444",
            });
          }
        };

        const submit = async () => {
          const selectedCcy = currencyEl.value;                                  // 사용자가 고른 외화
          const krw = parseInt(stripCommas(krwEl.value) || "0", 10) || 0;        // KRW 임계값

          if (krw <= 0) {
            await Swal.fire({ icon:"warning", title:"값을 확인하세요", text:"0보다 큰 값을 입력해 주세요.", confirmButtonText:"확인" });
            return;
          }

          submitEl.disabled = true;
          submitEl.textContent = "처리중...";
          submitEl.style.opacity = "0.6";

          try {
            let currentUserId = userId;
            if (!currentUserId) {
              const meRes = await me();
              if (!meRes?.userId) throw new Error("사용자 ID를 찾을 수 없습니다");
              currentUserId = meRes.userId;
            }

            // ✅ base는 항상 KRW, currency는 선택한 외화
            const alertData: FxAlertRequest = {
              userId: currentUserId!,
              baseCcy: "KRW",
              currency: selectedCcy,
              targetRate: krw,
              direction: "LTE",
            };

            await createFxAlert(alertData);

            await Swal.fire({
              icon: "success",
              title: "알림 신청 완료",
              text: `${selectedCcy} 1 = ${krw.toLocaleString("ko-KR")} ${quoteCcy} 이하일 때 알림을 받으실 수 있어요.`,
              confirmButtonText: "확인",
              confirmButtonColor: "#4758FC",
            });
          } catch (err: any) {
            await Swal.fire({
              icon: "error",
              title: "알림 신청 실패",
              text: err?.message || "알림 신청 중 오류가 발생했어요. 다시 시도해 주세요.",
              confirmButtonText: "확인",
              confirmButtonColor: "#ff4444",
            });
          } finally {
            submitEl.disabled = false;
            submitEl.textContent = "신청하기";
            submitEl.style.opacity = "1";
          }
        };

        currencyEl.addEventListener("change", updateKrwValue);
        krwEl.addEventListener("input", onKrwInput);
        submitEl.addEventListener("click", submit);
        krwEl.addEventListener("keydown", (e) => e.key === "Enter" && submit());
        historyEl.addEventListener("click", showHistory);
      },
    });
  };

  return (
    <button type="button" className={styles.alertBtn} onClick={openModal}>
      <span className={styles.strokeText}>알림 신청</span>
    </button>
  );
}
import Swal from "sweetalert2";
import styles from "./FxAlertButton.module.css";
import { createFxAlert, type FxAlertRequest } from "../../api/fx";
import { me } from "../../api/user";

// 간단 유틸
const stripCommas = (s: string) => s.replace(/,/g, "");
const fmtUSDString = (s: string) => {
  const hasDot = s.includes(".");
  const [i, f = ""] = s.split(".");
  const intFmt = (parseInt(i || "0", 10) || 0).toLocaleString("en-US");
  return hasDot ? `${intFmt}.${f}` : intFmt;
};
const fmtKRWString = (s: string) =>
  (parseInt(s || "0", 10) || 0).toLocaleString("ko-KR");
const sanitizeUsd = (s: string) => {
  s = s.replace(/[^\d.]/g, "");
  if (s.startsWith(".")) s = "0" + s;
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    const head = s.slice(0, firstDot);
    const tail = s.slice(firstDot + 1).replace(/\./g, "");
    s = head + "." + tail;
  }
  if (!s.startsWith("0.")) {
    s = s.replace(/^0+(?=\d)/, "");
    if (s === "") s = "0";
  }
  if (s.includes(".")) {
    const [i, f] = s.split(".");
    s = i + "." + f.slice(0, 2); // 소수 2자리
  }
  return s;
};
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
  rates?: Record<string, number>; // 통화별 환율 정보
  userId?: number;
}) {
  const openModal = async () => {
    const defaultBaseCcy = "USD";
    const initRate = rates[defaultBaseCcy] || 1398;
    const initKrw = fmtKRWString(String(Math.round(initRate * 1)));

    // 드롭다운 옵션 생성
    const currencyOptions = SUPPORTED_CURRENCIES.map(currency => 
      `<option value="${currency.code}" ${currency.code === defaultBaseCcy ? 'selected' : ''}>
        ${currency.code}
       </option>`
    ).join('');

    await Swal.fire({
      width: 580,
      padding: 0,
      showConfirmButton: false,
      html: `
<div id="fxa" style="font-family: 'EF_jejudoldam', system-ui, -apple-system, Segoe UI, Roboto, 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;">
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

    <div style="display:flex; justify-content:center; margin-top:22px;">
      <button id="fxa-submit"
        style="
          border:none; cursor:pointer;
          padding:12px 24px; border-radius:999px;
          background:#4758FC; color:#fff; font-weight:900; font-size:18px;
          box-shadow:0 4px 0 #111; border:3px solid #111;
          transition: all 0.1s ease;">
        신청하기
      </button>
    </div>
  </div>
</div>
      `,
      didOpen: () => {
        const currencyEl = document.getElementById("fxa-currency") as HTMLSelectElement;
        const krwEl = document.getElementById("fxa-krw") as HTMLInputElement;
        const submitEl = document.getElementById("fxa-submit") as HTMLButtonElement;

        // 통화 변경 시 KRW 값 업데이트
        const updateKrwValue = () => {
          const selectedCcy = currencyEl.value;
          const rate = rates[selectedCcy] || 1398;
          krwEl.value = fmtKRWString(String(Math.round(rate * 1)));
        };

        // KRW 입력 시 포맷팅
        const onKrwInput = () => {
          const raw = stripCommas(krwEl.value);
          const s = sanitizeKrw(raw);
          krwEl.value = fmtKRWString(s);
        };

        currencyEl.addEventListener("change", updateKrwValue);
        krwEl.addEventListener("input", onKrwInput);

        const submit = async () => {
          const selectedBaseCcy = currencyEl.value;
          const krw = parseInt(stripCommas(krwEl.value) || "0", 10) || 0;
          
          if (krw <= 0) {
            await Swal.fire({
              icon: "warning",
              title: "값을 확인하세요",
              text: "0보다 큰 값을 입력해 주세요.",
              confirmButtonText: "확인",
            });
            return;
          }

          // 로딩 상태 표시
          submitEl.disabled = true;
          submitEl.textContent = "처리중...";
          submitEl.style.opacity = "0.6";

          try {
            // userId가 없으면 API를 호출해서 현재 사용자 정보 가져오기
            let currentUserId = userId;
            console.log('초기 userId:', currentUserId);
            
            if (!currentUserId) {
              try {
                console.log('/auth/me API 호출 시작...');
                const userInfo = await me(); // auth API의 me 함수 사용
                console.log('사용자 정보:', userInfo);
                
                if (!userInfo.userId) {
                  throw new Error('사용자 ID를 찾을 수 없습니다');
                }
                
                currentUserId = userInfo.userId;
                console.log('추출된 userId:', currentUserId);
              } catch (authError: any) {
                // 인증 실패 시
                console.error('/auth/me API 실패:', authError);
                console.error('에러 메시지:', authError.message);
                console.error('에러 응답:', authError.response?.data);
                
                await Swal.fire({
                  icon: "warning", 
                  title: "로그인이 필요합니다",
                  text: `인증에 실패했습니다: ${authError.message || '알 수 없는 오류'}`,
                  confirmButtonText: "확인",
                });
                return;
              }
            }

            if (!currentUserId) {
              console.error('currentUserId가 여전히 null/undefined');
              await Swal.fire({
                icon: "warning", 
                title: "사용자 정보 오류",
                text: "사용자 ID를 가져올 수 없습니다.",
                confirmButtonText: "확인",
              });
              return;
            }

            // 방향은 항상 "이하"로 고정
            const direction = "LTE"; // LTE = Less Than or Equal (이하)

            console.log('알림 등록 데이터:', {
              userId: currentUserId,
              baseCcy: selectedBaseCcy,
              currency: quoteCcy,
              targetRate: krw,
              direction: direction
            });

            // API 호출
            const alertData: FxAlertRequest = {
              userId: currentUserId,
              baseCcy: selectedBaseCcy,
              currency: quoteCcy,
              targetRate: krw,
              direction: "LTE", // 항상 "이하"로 설정
            };

            const result = await createFxAlert(alertData);
            console.log('알림 등록 성공:', result);

            // 성공 메시지
            await Swal.fire({
              icon: "success",
              title: "알림 신청 완료",
              text: `${selectedBaseCcy} 1 = ${krw.toLocaleString("ko-KR")} ${quoteCcy} 이하일 때 알림을 받으실 수 있어요.`,
              confirmButtonText: "확인",
              confirmButtonColor: "#4758FC",
            });

          } catch (error: any) {
            // 에러 처리
            console.error('알림 등록 실패:', error);
            console.error('에러 응답:', error.response?.data);
            
            await Swal.fire({
              icon: "error",
              title: "알림 신청 실패",
              text: error.message || "알림 신청 중 오류가 발생했어요. 다시 시도해 주세요.",
              confirmButtonText: "확인",
              confirmButtonColor: "#ff4444",
            });
          } finally {
            // 버튼 상태 복구
            submitEl.disabled = false;
            submitEl.textContent = "신청하기";
            submitEl.style.opacity = "1";
          }
        };

        submitEl.addEventListener("click", submit);
        krwEl.addEventListener("keydown", (e) => e.key === "Enter" && submit());
      },
    });
  };

  return (
    <button type="button" className={styles.alertBtn} onClick={openModal}>
      <span className={styles.strokeText}>알림 신청</span>
    </button>
  );
}
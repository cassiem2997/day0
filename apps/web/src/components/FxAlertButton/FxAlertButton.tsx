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

    <div style="display:flex;justify-content:center;margin-top:22px;">
      <button id="fxa-submit"
        style="
          border:none;cursor:pointer;padding:12px 24px;border-radius:999px;
          background:#4758FC;color:#fff;font-weight:900;font-size:18px;
          box-shadow:0 4px 0 #111;border:3px solid #111;transition:all .1s ease;">
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

        currencyEl.addEventListener("change", updateKrwValue);
        krwEl.addEventListener("input", onKrwInput);

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

        document.getElementById("fxa-submit")!.addEventListener("click", submit);
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
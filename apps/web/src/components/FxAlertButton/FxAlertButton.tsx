import Swal from "sweetalert2";
import styles from "./FxAlertButton.module.css"; // 기존 버튼 스타일 그대로 사용

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

export default function FxAlertButton({
  baseCcy = "USD",
  quoteCcy = "KRW",
  current,
}: {
  baseCcy?: string;
  quoteCcy?: string;
  current?: number; // 최신 환율(예: 1398) → 기본값으로 꽂아줌
}) {
  const openModal = async () => {
    const initUsd = "1";
    const initKrw = fmtKRWString(String(Math.round((current ?? 1398) * 1)));

    await Swal.fire({
      width: 560,
      padding: 0,
      showConfirmButton: false, // 내부 커스텀 버튼 사용
      html: `
<div id="fxa" style="font-family: 'EF_jejudoldam', system-ui, -apple-system, Segoe UI, Roboto, 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;">
  <div style="margin: 18px; background:#f3f9ff; border:4px solid #111; border-radius:18px; padding:22px 22px 26px;">
    <div style="display:flex; justify-content:center; margin-bottom:16px;">
      <div style="background:#fff; border:4px solid #111; border-radius:999px; padding:10px 20px; font-weight:900; font-size:22px;">알림 신청</div>
    </div>

    <!-- USD -->
    <div style="display:flex; align-items:center; gap:16px; margin-top:8px;">
      <span style="min-width:90px; text-align:center; background:#4758FC; color:#fff; border:4px solid #111; border-radius:24px; padding:12px 14px; font-weight:900; font-size:20px; letter-spacing:2px;">
        ${baseCcy}
      </span>
      <div style="flex:1; border:4px solid #111; border-radius:24px; background:#fff; padding:10px 16px; display:flex; align-items:center; justify-content:flex-end;">
        <input id="fxa-usd" type="text" inputmode="decimal"
          value="${initUsd}"
          style="width:100%; text-align:right; border:none; outline:none; background:transparent; font-weight:900; font-size:26px; color:#4758fc;" />
      </div>
    </div>

    <div style="height:2px; background:#e8edf3; margin:14px 6px;"></div>

    <!-- KRW -->
    <div style="display:flex; align-items:center; gap:16px; margin-top:4px;">
      <span style="min-width:90px; text-align:center; background:#4758FC; color:#fff; border:4px solid #111; border-radius:24px; padding:12px 14px; font-weight:900; font-size:20px; letter-spacing:2px;">
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
          box-shadow:0 4px 0 #111; border:3px solid #111;">
        신청하기
      </button>
    </div>
  </div>
</div>
      `,
      didOpen: () => {
        const usdEl = document.getElementById("fxa-usd") as HTMLInputElement;
        const krwEl = document.getElementById("fxa-krw") as HTMLInputElement;
        const submitEl = document.getElementById(
          "fxa-submit"
        ) as HTMLButtonElement;

        const rate = current ?? 1398;

        const onUsdInput = () => {
          const raw = stripCommas(usdEl.value);
          const s = sanitizeUsd(raw);
          usdEl.value = fmtUSDString(s);

          const v = parseFloat(s) || 0;
          krwEl.value = fmtKRWString(String(Math.round(v * rate)));
        };

        const onKrwInput = () => {
          const raw = stripCommas(krwEl.value);
          const s = sanitizeKrw(raw);
          krwEl.value = fmtKRWString(s);

          const v = parseInt(s || "0", 10) || 0;
          const usdNum = Math.round((v / rate) * 100) / 100;
          const usdStr = usdNum
            .toFixed(2)
            .replace(/\.00$/, "")
            .replace(/(\.\d)0$/, "$1");
          usdEl.value = fmtUSDString(usdStr);
        };

        usdEl.addEventListener("input", onUsdInput);
        krwEl.addEventListener("input", onKrwInput);

        const submit = async () => {
          const usd = parseFloat(stripCommas(usdEl.value)) || 0;
          const krw = parseInt(stripCommas(krwEl.value) || "0", 10) || 0;
          if (usd <= 0 || krw <= 0) {
            await Swal.fire({
              icon: "warning",
              title: "값을 확인하세요",
              text: "0보다 큰 값을 입력해 주세요.",
              confirmButtonText: "확인",
            });
            return;
          }
          await Swal.fire({
            icon: "success",
            title: "알림 신청 완료",
            text: `${baseCcy} 1 = ${krw.toLocaleString(
              "ko-KR"
            )} ${quoteCcy} 기준으로 알림을 설정했어요.`,
            confirmButtonText: "확인",
            confirmButtonColor: "#a8d5ff",
          });
        };

        submitEl.addEventListener("click", submit);
        usdEl.addEventListener("keydown", (e) => e.key === "Enter" && submit());
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

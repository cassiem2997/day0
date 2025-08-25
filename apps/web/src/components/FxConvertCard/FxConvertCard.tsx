import { useState } from "react";
import Swal from "sweetalert2";
import styles from "./FxConvertCard.module.css";

export default function FxConvertCard({ rate = 1398 }: { rate?: number }) {
  // 기본값: 1 USD
  const [usdInput, setUsdInput] = useState("1");
  const [krwInput, setKrwInput] = useState(String(Math.round(1 * rate)));

  // 유틸
  const stripCommas = (s: string) => s.replace(/,/g, "");

  /** "1234.5" -> "1,234.5" (소수부/마침표 유지) */
  const formatUSDString = (s: string) => {
    const hasDot = s.includes(".");
    const [i, f = ""] = s.split(".");
    const intFmt = (parseInt(i || "0", 10) || 0).toLocaleString("en-US");
    return hasDot ? `${intFmt}.${f}` : intFmt;
  };

  /** "1234567" -> "1,234,567" */
  const formatKRWString = (s: string) =>
    (parseInt(s || "0", 10) || 0).toLocaleString("ko-KR");

  // ===== 입력 정규화 =====
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

  const onUsdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = stripCommas(e.target.value);
    const s = sanitizeUsd(raw);
    setUsdInput(formatUSDString(s));

    const v = parseFloat(s) || 0;
    setKrwInput(formatKRWString(String(Math.round(v * rate))));
  };

  const onKrwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = stripCommas(e.target.value);
    const s = sanitizeKrw(raw);
    setKrwInput(formatKRWString(s));

    const v = parseInt(s || "0", 10) || 0;
    const usdNum = Math.round((v / rate) * 100) / 100; // 숫자값
    // "1" / "1.2" / "1.23" (불필요한 0 제거)
    const usdStr = usdNum
      .toFixed(2)
      .replace(/\.00$/, "")
      .replace(/(\.\d)0$/, "$1");
    setUsdInput(formatUSDString(usdStr));
  };

  const fmtKRW = (n: number) =>
    n.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
  const fmtUSD = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  const usdNum = parseFloat(stripCommas(usdInput)) || 0;
  const krwNum = parseInt(stripCommas(krwInput) || "0", 10) || 0;

  const onApply = async () => {
    await Swal.fire({
      icon: "success",
      title: "환전 신청 접수(스텁)",
      text: `${fmtUSD(usdNum)} USD ≈ ${fmtKRW(
        krwNum
      )} KRW 기준으로 신청했습니다.`,
      confirmButtonText: "확인",
    });
  };

  return (
    <section className={styles.convertCard}>
      {/* USD */}
      <div className={styles.row}>
        <span className={styles.ccyPill}>USD</span>
        <div className={styles.inputBox}>
          <input
            type="text"
            inputMode="decimal"
            value={usdInput}
            onChange={onUsdChange}
            className={styles.amountInput}
            aria-label="달러 금액"
          />
        </div>
      </div>

      <hr className={styles.hr} />

      {/* KRW */}
      <div className={styles.row}>
        <span className={styles.ccyPill}>KRW</span>
        <div className={styles.inputBox}>
          <input
            type="text"
            inputMode="numeric"
            value={krwInput}
            onChange={onKrwChange}
            className={styles.amountInput}
            aria-label="원화 금액"
          />
        </div>
      </div>

      <div className={styles.ctaWrap}>
        <button type="button" className={styles.applyBtn} onClick={onApply}>
          환전 신청하기
        </button>
      </div>
    </section>
  );
}

import { useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import styles from "./ExchangeRatePage.module.css";
import dummyRate from "../../assets/dummyRate.png";

export default function ExchangeRatePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // 더미 환율, 나중에 연결해서 불러오기
  const BANK_NAME = "신한은행";
  const RATE = 1398.0;

  const [usdInput, setUsdInput] = useState("1");
  const [krwInput, setKrwInput] = useState(String(Math.round(1 * RATE)));

  // 숫자 입력할 때 01 이런 식으로 안나오게끔 (여기서부터)
  const sanitizeUsd = (s: string) => {
    s = s.replace(/[^\d.]/g, ""); // 숫자/점만
    if (s.startsWith(".")) s = "0" + s; // ".5" -> "0.5"

    // 점 하나만 허용
    const firstDot = s.indexOf(".");
    if (firstDot !== -1) {
      const head = s.slice(0, firstDot);
      const tail = s.slice(firstDot + 1).replace(/\./g, "");
      s = head + "." + tail;
    }

    // 정수부 선행 0 제거 (단, "0." 허용)
    if (!s.startsWith("0.")) {
      s = s.replace(/^0+(?=\d)/, "");
      if (s === "") s = "0";
    }

    // 소수부 2자리 제한
    if (s.includes(".")) {
      const [i, f] = s.split(".");
      s = i + "." + f.slice(0, 2);
    }
    return s;
  };

  const sanitizeKrw = (s: string) => {
    s = s.replace(/[^\d]/g, ""); // 숫자만
    s = s.replace(/^0+(?=\d)/, ""); // 선행 0 제거
    if (s === "") s = "0";
    return s;
  };

  const onUsdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = sanitizeUsd(e.target.value);
    setUsdInput(s);

    const v = parseFloat(s) || 0;
    setKrwInput(String(Math.round(v * RATE)));
  };

  const onKrwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = sanitizeKrw(e.target.value);
    setKrwInput(s);

    const v = parseInt(s || "0", 10) || 0;
    const usd = Math.round((v / RATE) * 100) / 100; // 소수 2자리
    setUsdInput(usd.toString());
  };

  const fmtKRW = (n: number) =>
    n.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
  const fmtUSD = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  const usdNum = parseFloat(usdInput) || 0;
  const krwNum = parseInt(krwInput || "0", 10) || 0;
  // 숫자 입력할 때 01 이런 식으로 안나오게끔 (여기까지)

  return (
    <div className={styles.container}>
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
      <main className={styles.main}>
        <header
          className={`${styles.header} ${
            isSidebarOpen ? styles.withSidebar : styles.noSidebar
          }`}
        >
          {/* 로고는 나중에 */}
          <img src="/logo.svg" alt="logo" width={120} height={80} />
        </header>

        {/* 그래프 더미 */}
        <section className={styles.rateBox}>
          <img src={dummyRate} alt="환율" className={styles.rateImage} />
        </section>

        {/* 환전 관련 */}
        <section className={styles.convertCard}>
          <div className={styles.pillRow}>
            <span className={styles.bankPill}>{BANK_NAME}</span>
          </div>

          <div className={styles.row}>
            <div className={styles.leftCol}>
              <div className={styles.country}>미국</div>
              <div className={styles.code}>USD</div>
            </div>
            <div className={styles.rightCol}>
              <input
                type="text"
                inputMode="decimal"
                value={usdInput}
                onChange={onUsdChange}
                className={styles.amountInput}
                aria-label="달러 금액"
              />
              <div className={styles.subLabel}>{fmtUSD(usdNum)}달러</div>
            </div>
          </div>

          <div className={styles.equalDivider}>
            <span>=</span>
          </div>

          <div className={styles.row}>
            <div className={styles.leftCol}>
              <div className={styles.country}>대한민국</div>
              <div className={styles.code}>KRW</div>
            </div>
            <div className={styles.rightCol}>
              <input
                type="text"
                inputMode="numeric"
                value={krwInput}
                onChange={onKrwChange}
                className={styles.amountInput}
                aria-label="원화 금액"
              />
              <div className={styles.subLabel}>{fmtKRW(krwNum)}원</div>
            </div>
          </div>

          <div className={styles.ctaRow}>
            <p className={styles.guide}>
              {/* 멘트 굳이? */}
              환전 신청은 신한은행에서 진행됩니다. 지금 미리 환전해 두면 출국
              당일의 수수료 부담을 줄일 수 있습니다.
            </p>
            <button className={styles.applyBtn} type="button">
              환전 신청
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

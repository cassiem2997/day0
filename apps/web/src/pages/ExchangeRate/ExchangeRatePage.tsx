import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./ExchangeRatePage.module.css";
import dummyRate from "../../assets/dummyRate.png";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

export default function ExchangeRatePage() {
  // 반응형 제어
  const isMobile = useIsMobile(768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // 더미 환율 (연동 예정)
  const BANK_NAME = "신한은행";
  const RATE = 1398.0;

  const [usdInput, setUsdInput] = useState("1");
  const [krwInput, setKrwInput] = useState(String(Math.round(1 * RATE)));

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
      s = i + "." + f.slice(0, 2);
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
    const s = sanitizeUsd(e.target.value);
    setUsdInput(s);
    const v = parseFloat(s) || 0;
    setKrwInput(String(Math.round(v * RATE)));
  };

  const onKrwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = sanitizeKrw(e.target.value);
    setKrwInput(s);
    const v = parseInt(s || "0", 10) || 0;
    const usd = Math.round((v / RATE) * 100) / 100;
    setUsdInput(usd.toString());
  };

  const fmtKRW = (n: number) =>
    n.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
  const fmtUSD = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: 2 });

  const usdNum = parseFloat(usdInput) || 0;
  const krwNum = parseInt(krwInput || "0", 10) || 0;

  return (
    <div className={styles.container}>
      {/* 모바일 전용: 사이드바 오버레이 + 햄버거 */}
      {isMobile ? (
        <>
          <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar}></Sidebar>
          <button
            type="button"
            className={styles.mobileHamburger}
            onClick={toggleSidebar}
            aria-label="메뉴 열기"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </>
      ) : null}

      <main className={styles.main}>
        {/* 데스크톱 전용 헤더 */}
        {isMobile ? null : <Header></Header>}

        <div className={styles.pageContent}>
          <h2 className={styles.title}>환율</h2>

          {/* 그래프 (더미) */}
          <section className={styles.rateBox}>
            <img src={dummyRate} alt="환율" className={styles.rateImage} />
          </section>

          {/* 환전 카드 */}
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
                환전 신청은 신한은행에서 진행됩니다. 미리 환전하면 출국 당일의
                수수료 부담을 줄일 수 있습니다.
              </p>
              <button className={styles.applyBtn} type="button">
                환전 신청
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

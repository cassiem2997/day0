import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./ExchangeRatePage.module.css";
import RateChart, {
  type RatePoint,
} from "../../components/RateChart/RateChart";
import FxAlertButton from "../../components/FxAlertButton/FxAlertButton";
import FxConvertCard from "../../components/FxConvertCard/FxConvertCard";
/* 반응형 판별 훅 */
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
  const isMobile = useIsMobile(768);

  // 모바일 사이드바
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  // 더미 환율 데이터 (최근 60일)
  const dummyRates = useMemo<RatePoint[]>(() => {
    const out: RatePoint[] = [];
    const base = 1398;
    const start = new Date();
    start.setDate(start.getDate() - 60);
    for (let i = 0; i < 60; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const mm = (d.getMonth() + 1).toString().padStart(2, "0");
      const dd = d.getDate().toString().padStart(2, "0");
      const jitter = Math.sin(i / 5) * 8 + (Math.random() * 12 - 6);
      const val = Math.round(base + jitter);
      out.push({ date: `${mm}/${dd}`, value: val });
    }
    return out;
  }, []);

  const latest = dummyRates.at(-1)?.value;

  return (
    <div className={styles.container}>
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
        {isMobile ? null : <Header></Header>}

        <div className={styles.pageContent}>
          <div className={styles.hero}>
            <h1 className={styles.exchangeTitle}>EXCHANGE</h1>
          </div>

          {/* 버튼 헤더 (우측 정렬) */}
          <div className={styles.chartHeader}>
            <FxAlertButton
              quoteCcy="KRW"
            ></FxAlertButton>
          </div>

          {/* 그래프 */}
          <section className={styles.chartSection}>
            <RateChart data={dummyRates}></RateChart>
          </section>

          <section className={styles.cardSection}>
            <FxConvertCard rate={latest ?? 1398}></FxConvertCard>
          </section>
        </div>
      </main>
    </div>
  );
}

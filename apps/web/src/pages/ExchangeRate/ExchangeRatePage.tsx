import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./ExchangeRatePage.module.css";
import { SmartRateChart } from "../../components/RateChart/RateChart"; // SmartRateChart로 변경
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

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

          <div className={styles.chartHeader}>
            <FxAlertButton quoteCcy="KRW"></FxAlertButton>
          </div>

          <section className={styles.chartSection}>
            <SmartRateChart />
          </section>

          <section className={styles.cardSection}>
            <FxConvertCard rate={1398}></FxConvertCard>
          </section>
        </div>
      </main>
    </div>
  );
}
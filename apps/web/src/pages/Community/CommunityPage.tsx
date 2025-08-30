import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./CommunityPage.module.css";

import CommunityBest from "./CommunityBest";
import CommunityBoard from "./CommunityBoard";

/* 모바일 판별 */
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

type Tab = "best" | "board";

export default function CommunityPage() {
  const isMobile = useIsMobile(768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("best");

  const toggleSidebar = () => setIsSidebarOpen((p) => !p);

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
          <h1 className={styles.communityTitle}>헤이 - 톡</h1>

          {/* 박스 바깥 우측 상단 탭(Pill) */}
          <div
            className={styles.pillTabs}
            role="tablist"
            aria-label="Community tabs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "best"}
              className={`${styles.pill} ${
                tab === "best" ? styles.pillActive : styles.pillIdle
              }`}
              onClick={() => setTab("best")}
            >
              Best
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "board"}
              className={`${styles.pill} ${
                tab === "board" ? styles.pillActive : styles.pillIdle
              }`}
              onClick={() => setTab("board")}
            >
              Board
            </button>
          </div>

          {/* 콘텐츠: Best일 때만 파란 박스, Board는 별도 영역 */}
          {tab === "best" ? (
            <section className={styles.panelFrame} aria-label="Best panel">
              {/* 박스 안 장식문구(탭 아님) */}
              <div className={styles.decorRow}>
                <div className={styles.decorPill}>Best</div>
                <div className={styles.decorPill}>Checklists</div>
              </div>

              <div className={styles.innerBox}>
                <CommunityBest></CommunityBest>
              </div>

              <div className={`${styles.cloud} ${styles.cloudLeft}`}></div>
              <div className={`${styles.cloud} ${styles.cloudRight}`}></div>
            </section>
          ) : (
            <section className={styles.boardWrap} aria-label="Board list">
              <CommunityBoard></CommunityBoard>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

// src/pages/MyPage/MyPage.tsx
import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./MyPage.module.css";
import MyPageChecklist from "./MyPageChecklist";
import MyPageSavings from "./MyPageSavings";
import MyPageExchange from "./MyPageExchange";
import MyPageProfile from "./MyPageProfile"; 

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

type MyTab = "profile" | "checklists" | "saving" | "exchange";

export default function MyPage() {
  const isMobile = useIsMobile(768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tab, setTab] = useState<MyTab>("profile"); 

  const toggleSidebar = () => setIsSidebarOpen((p) => !p);

  return (
    <div className={styles.container}>
      {isMobile ? (
        <>
          <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
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
        {isMobile ? null : <Header />}

        <div className={styles.pageContent}>
          <h1 className={styles.myPageTitle}>마이페이지</h1>

          {/* 우측 상단 pill 탭 */}
          <div
            className={styles.pillTabs}
            role="tablist"
            aria-label="My page tabs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "profile"}
              className={`${styles.pill} ${
                tab === "profile" ? styles.pillActive : styles.pillIdle
              }`}
              onClick={() => setTab("profile")}
            >
              Profile
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "checklists"}
              className={`${styles.pill} ${
                tab === "checklists" ? styles.pillActive : styles.pillIdle
              }`}
              onClick={() => setTab("checklists")}
            >
              Checklists
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "saving"}
              className={`${styles.pill} ${
                tab === "saving" ? styles.pillActive : styles.pillIdle
              }`}
              onClick={() => setTab("saving")}
            >
              Accounts
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "exchange"}
              className={`${styles.pill} ${
                tab === "exchange" ? styles.pillActive : styles.pillIdle
              }`}
              onClick={() => setTab("exchange")}
            >
              Exchange
            </button>
          </div>

          {/* 탭별 콘텐츠 */}
          {tab === "profile" && <MyPageProfile />}
          {tab === "checklists" && <MyPageChecklist />}
          {tab === "saving" && <MyPageSavings />}
          {tab === "exchange" && <MyPageExchange />}
        </div>
      </main>
    </div>
  );
}

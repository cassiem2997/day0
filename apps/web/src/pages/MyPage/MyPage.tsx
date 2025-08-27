import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./MyPage.module.css";
import MyPageChecklist from "./MyPageChecklist";
import MyPageSavings from "./MyPageSavings";
import MyPageExchange from "./MyPageExchange";

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

type MyTab = "checklists" | "saving" | "exchange";

export default function MyPage() {
  const isMobile = useIsMobile(768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tab, setTab] = useState<MyTab>("checklists");

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
              Saving
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

          {/* 프로필 카드 */}
          <section className={styles.profileCard} aria-label="프로필 요약">
            {/* 왼쪽: 아바타 + 기본정보 */}
            <div className={styles.profileLeft}>
              <div className={styles.avatarBox}>
                <span className={styles.avatarText}>이미지</span>
              </div>

              <div className={styles.profileText}>
                <h2 className={styles.nick}>닉네임</h2>
                <p className={styles.subInfo}>
                  국내대학이름
                  <br />
                </p>
              </div>

              <div className={styles.leftBottom}>
                <button type="button" className={styles.editBtn}>
                  수정
                </button>
              </div>
            </div>

            {/* 오른쪽: D-Day + 출국/국가/대학 */}
            <div className={styles.profileRight}>
              <div className={styles.hangingBadgeWrap}>
                <div className={styles.hangingBadge}>
                  <span className={styles.badgeLabel}>D − 51</span>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.fieldKey}>출국일</div>
                <div className={styles.fieldVal}>
                  <span className={styles.valText}>2025. 08. 31(일)</span>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.fieldKey}>국가</div>
                <div className={styles.fieldVal}>
                  <span className={styles.valText}>대학교이름(JPN)</span>
                </div>
              </div>
            </div>
          </section>

          {/* 탭별 콘텐츠 */}
          {tab === "checklists" && <MyPageChecklist />}

          {tab === "saving" && <MyPageSavings />}

          {tab === "exchange" && <MyPageExchange />}
        </div>
      </main>
    </div>
  );
}

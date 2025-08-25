// src/pages/Savings/SavingsPage.tsx
import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./SavingsPage.module.css";
import SavingsMission, { type Mission as MissionType } from "./SavingsMission";
import SavingsDetail from "./SavingsDetail";
import savingDetailSvg from "../../assets/savingDetail.svg";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(
    function () {
      function onResize() {
        setIsMobile(window.innerWidth < breakpoint);
      }
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    },
    [breakpoint]
  );

  return isMobile;
}

function formatAmount(n: number) {
  return n.toLocaleString("ko-KR");
}

export default function SavingsPage() {
  const isMobile = useIsMobile(768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 탭 상태: mission | detail
  const [activeTab, setActiveTab] = useState<"mission" | "detail">("mission");

  // ── 데모 값 (API 연동 시 교체) ───────────────────────────────────────────
  const goalAmount = 2_500_000;
  const [currentAmount, setCurrentAmount] = useState<number>(1_741_500);

  // 체크리스트에서 넘어온 완료 내역이라고 가정
  const [missions, setMissions] = useState<MissionType[]>([
    { id: 1, text: "이건 첫 번째 레슨", completed: true, credited: false },
    { id: 2, text: "이제 두번째 레슨", completed: false, credited: false },
    { id: 3, text: "좀 더 강해져야 돼 ~", completed: false, credited: false },
  ]);
  const rewardPerMission = 5_000;

  const percent = useMemo(() => {
    if (!goalAmount || goalAmount <= 0) return 0;
    const p = (currentAmount / goalAmount) * 100;
    return Math.min(100, Math.max(0, Math.round(p * 10) / 10));
  }, [currentAmount, goalAmount]);

  function toggleSidebar() {
    setIsSidebarOpen((prev) => !prev);
  }

  // 미션 컴포넌트에서 호출하는 입금 처리
  async function handleRequestDeposit(missionIds: number[], amount: number) {
    // TODO: 실제 API 연동
    setCurrentAmount((prev) => Math.min(goalAmount, prev + amount));
    setMissions((prev) =>
      prev.map((m) =>
        missionIds.includes(m.id) ? { ...m, credited: true } : m
      )
    );
    return true;
  }

  return (
    <div className={styles.container}>
      {/* 모바일 전용: 사이드바 + 햄버거 */}
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
        {/* 데스크톱 전용: 헤더 */}
        {isMobile ? null : <Header />}

        <div className={styles.pageContent}>
          <h1 className={styles.title}>SAVINGS</h1>

          {/* ===== 상단 섹션: Mission(프로그레스) / Detail(SVG) ===== */}
          {activeTab === "detail" ? (
            // Detail 탭: 일러스트
            <section
              className={styles.illustrationWrap}
              aria-label="Saving detail hero"
            >
              <div className={styles.illustrationCard}>
                <img
                  src={savingDetailSvg}
                  alt="Saving Details Illustration"
                  className={styles.illustrationImg}
                />
              </div>
            </section>
          ) : (
            // Mission 탭: 기존 진행 박스
            <section
              className={styles.progressWrap}
              aria-label="적금 진행 상황 요약"
            >
              <div className={styles.progressCard}>
                <div className={styles.amountRow}>
                  <div className={`${styles.amountPill} ${styles.current}`}>
                    <strong className={styles.amountValue}>
                      {formatAmount(currentAmount)}
                    </strong>
                  </div>
                  <div className={`${styles.amountPill} ${styles.goal}`}>
                    <strong className={styles.amountValue}>
                      {formatAmount(goalAmount)}
                    </strong>
                  </div>
                </div>

                <div className={styles.barTrack} aria-hidden="true">
                  <div
                    className={styles.barFill}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className={`${styles.cloud} ${styles.cloudLeft}`} />
                <div className={`${styles.cloud} ${styles.cloudRight}`} />
              </div>
            </section>
          )}

          {/* ===== 탭 버튼 ===== */}
          <div
            className={styles.tabBar}
            role="tablist"
            aria-label="Savings sections"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "mission"}
              className={`${styles.tabButton} ${
                activeTab === "mission" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("mission")}
            >
              Mission
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "detail"}
              className={`${styles.tabButton} ${
                activeTab === "detail" ? styles.active : ""
              }`}
              onClick={() => setActiveTab("detail")}
            >
              Details
            </button>
          </div>

          {/* ===== 탭 콘텐츠 ===== */}
          {activeTab === "mission" ? (
            <SavingsMission
              missions={missions}
              rewardPerMission={rewardPerMission}
              onRequestDeposit={handleRequestDeposit}
            />
          ) : (
            <SavingsDetail />
          )}
        </div>
      </main>
    </div>
  );
}

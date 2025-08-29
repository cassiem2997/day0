// src/pages/Savings/SavingsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./SavingsPage.module.css";
import SavingsMission, { type Mission as MissionType } from "./SavingsMission";
import SavingsDetail from "./SavingsDetail";
import NoSavings from "./Nosavings"; 
import savingDetailSvg from "../../assets/savingDetail.svg";
import {
  getSavingsPlan,
  getMySavingsPlans,
  type SavingsPlanDetail,
} from "../../api/savings";
import {
  getUserChecklistItems,
  type UserChecklistItem,
} from "../../api/checklist";

export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false; // SSR 안전
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}
function formatAmount(n: number) {
  return n.toLocaleString("ko-KR");
}

export default function SavingsPage() {
  const { planId: planIdParam } = useParams<{ planId?: string }>();
  const navigate = useNavigate(); 

  const checklistId = 1;
  const isMobile = useIsMobile(768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"mission" | "detail">("mission");

  const [plan, setPlan] = useState<SavingsPlanDetail | null>(null);
  const [hasPlan, setHasPlan] = useState<boolean | null>(null); 
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const goalAmount = plan?.goalAmount ?? 0;
  const [currentAmount, setCurrentAmount] = useState<number>(0);

  const [missions, setMissions] = useState<MissionType[]>([]);

  const percent = useMemo(() => {
    if (!goalAmount || goalAmount <= 0) return 0;
    const p = (currentAmount / goalAmount) * 100;
    return Math.min(100, Math.max(0, Math.round(p * 10) / 10));
  }, [currentAmount, goalAmount]);

  function toggleSidebar() {
    setIsSidebarOpen((prev) => !prev);
  }

  // ===== 플랜 상세 조회 =====
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        setHasPlan(null);

        const paramIdNum = Number(planIdParam);
        let targetPlanId: number | undefined;

        if (planIdParam && Number.isFinite(paramIdNum) && paramIdNum > 0) {
          targetPlanId = paramIdNum;
        } else {
          const myPlans = await getMySavingsPlans();
          targetPlanId = myPlans?.[0]?.planId;
        }

        if (!targetPlanId) {
          if (!alive) return;
          setPlan(null);
          setHasPlan(false); 
          return;
        }

        const data = await getSavingsPlan(targetPlanId);
        if (!alive) return;

        setPlan(data);
        setHasPlan(true); 
        setCurrentAmount(Math.max(0, data?.savingAccount?.accountBalance ?? 0));
      } catch (e: any) {
        if (!alive) return;
        if (e?.response?.status === 404) {
          setHasPlan(false);
        } else {
          const msg =
            e?.response?.data?.message ||
            e?.response?.data?.error ||
            e?.message ||
            "플랜 정보를 불러오지 못했습니다.";
          setLoadError(msg);
          console.error("getSavingsPlan failed", e?.response ?? e);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [planIdParam]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const items: UserChecklistItem[] = await getUserChecklistItems(
          checklistId
        );
        if (!alive) return;
        const mapped: MissionType[] = items.map((item) => ({
          id: item.uciId,
          text: item.title,
          completed: item.status === "DONE",
          credited: false,
        }));
        setMissions(mapped);
      } catch (e) {
        console.error("체크리스트 로딩 실패", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [checklistId]);

  async function handleRequestDeposit(missionIds: number[], amount: number) {
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
      {isMobile && (
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
      )}

      <main className={styles.main}>
        {!isMobile ? <Header /> : null}

        <div className={styles.pageContent}>
          <h1 className={styles.title}>SAVINGS</h1>

          {/* 상태 메시지 (헤더 아래에 노출) */}
          {loading && <p>불러오는 중…</p>}
          {loadError && <p role="alert">{loadError}</p>}

          {/* 플랜 없을 때 */}
          {!loading && !loadError && hasPlan === false && (
            <NoSavings onCreate={() => navigate("/savings/plan")} />
          )}

          {/* 플랜 있을 때 본문 */}
          {!loading && !loadError && hasPlan && plan && (
            <>
              {activeTab === "detail" ? (
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

              {/* 탭/콘텐츠 */}
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

              {activeTab === "mission" ? (
                <SavingsMission
                  missions={missions}
                  rewardPerMission={5000}
                  onRequestDeposit={handleRequestDeposit}
                />
              ) : (
                <SavingsDetail planId={plan?.planId} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// src/pages/Savings/SavingsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./SavingsPage.module.css";
import SavingsMission, { type Mission as MissionType } from "./SavingsMission";
import SavingsDetail from "./SavingsDetail";
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

function formatAmount(n: number) {
  return n.toLocaleString("ko-KR");
}

export default function SavingsPage() {
  // 1) URL이 /savings/:planId 형태라면 그걸 우선 사용
  const { planId: planIdParam } = useParams<{ planId?: string }>();

  const checklistId = 1; // TODO: 로그인 사용자 기준으로 매핑
  const isMobile = useIsMobile(768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"mission" | "detail">("mission");

  // API 상태
  const [plan, setPlan] = useState<SavingsPlanDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 파생 상태
  const goalAmount = plan?.goalAmount ?? 0;
  const [currentAmount, setCurrentAmount] = useState<number>(0);

  // 미션(체크리스트)
  const [missions, setMissions] = useState<MissionType[]>([]);
  // const rewardPerMission = 5000;

  const percent = useMemo(() => {
    if (!goalAmount || goalAmount <= 0) return 0;
    const p = (currentAmount / goalAmount) * 100;
    return Math.min(100, Math.max(0, Math.round(p * 10) / 10));
  }, [currentAmount, goalAmount]);

  function toggleSidebar() {
    setIsSidebarOpen((prev) => !prev);
  }

  // ===== 플랜 상세 조회 (param 우선, 없으면 내 플랜 중 첫 번째) =====
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setLoadError(null);

        // URL 파라미터가 유효하면 그걸 사용
        const paramIdNum = Number(planIdParam);
        let targetPlanId: number | undefined;

        if (planIdParam && Number.isFinite(paramIdNum) && paramIdNum > 0) {
          targetPlanId = paramIdNum;
        } else {
          // 없으면 내 플랜 목록에서 active=true인 첫 번째 사용
          const myPlans = await getMySavingsPlans();
          targetPlanId = myPlans?.[0]?.planId;
        }

        if (!targetPlanId) {
          setLoadError("조회할 적금 플랜이 없습니다. 먼저 플랜을 생성하세요.");
          return;
        }

        const data = await getSavingsPlan(targetPlanId);
        if (!alive) return;

        setPlan(data);
        setCurrentAmount(Math.max(0, data?.savingAccount?.accountBalance ?? 0));
      } catch (e: any) {
        if (!alive) return;
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "플랜 정보를 불러오지 못했습니다.";
        setLoadError(msg);
        // 403 등 문제 원인 확인을 위해 콘솔 남김
        console.error("getSavingsPlan failed", e?.response ?? e);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [planIdParam]);

  // ===== 체크리스트 → 미션 변환 =====
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
          credited: false, // TODO: 입금내역과 연동되면 true로 전환
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

  // ===== 미션 보상 입금 (더미) =====
  async function handleRequestDeposit(missionIds: number[], amount: number) {
    // TODO: 실제 API 연동(입금 트랜잭션 생성) 후 성공 시 아래 로컬 상태 업데이트
    setCurrentAmount((prev) => Math.min(goalAmount, prev + amount));
    setMissions((prev) =>
      prev.map((m) =>
        missionIds.includes(m.id) ? { ...m, credited: true } : m
      )
    );
    return true;
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.pageContent}>
            <h1 className={styles.title}>SAVINGS</h1>
            <p>불러오는 중…</p>
          </div>
        </main>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.pageContent}>
            <h1 className={styles.title}>SAVINGS</h1>
            <p role="alert">{loadError}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 모바일: 사이드바/햄버거 */}
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
        {!isMobile ? <Header /> : null}

        <div className={styles.pageContent}>
          <h1 className={styles.title}>SAVINGS</h1>

          {/* 상단 섹션 */}
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

          {/* 탭 */}
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

          {/* 콘텐츠 */}
          {activeTab === "mission" ? (
            <SavingsMission
              missions={missions}
              rewardPerMission={5000}
              onRequestDeposit={handleRequestDeposit}
            />
          ) : (
            <SavingsDetail planId={plan?.planId} />
          )}
        </div>
      </main>
    </div>
  );
}

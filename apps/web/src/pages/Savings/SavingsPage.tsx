// // src/pages/Savings/SavingsPage.tsx
// import { useEffect, useMemo, useState } from "react";
// import { useParams } from "react-router-dom";
// import Sidebar from "../../components/Sidebar/Sidebar";
// import Header from "../../components/Header/Header";
// import styles from "./SavingsPage.module.css";
// import SavingsMission, { type Mission as MissionType } from "./SavingsMission";
// import SavingsDetail from "./SavingsDetail";
// import savingDetailSvg from "../../assets/savingDetail.svg";
// import { getSavingsPlan, type SavingsPlanDetail } from "../../api/savings";
// import { getUserChecklistItems, type UserChecklistItem } from "../../api/checklist";

// function useIsMobile(breakpoint = 768) {
//   const [isMobile, setIsMobile] = useState<boolean>(() => {
//     if (typeof window === "undefined") return false;
//     return window.innerWidth < breakpoint;
//   });

//   useEffect(
//     function () {
//       function onResize() {
//         setIsMobile(window.innerWidth < breakpoint);
//       }
//       window.addEventListener("resize", onResize);
//       return () => window.removeEventListener("resize", onResize);
//     },
//     [breakpoint]
//   );

//   return isMobile;
// }

// function formatAmount(n: number) {
//   return n.toLocaleString("ko-KR");
// }

// export default function SavingsPage() {
//   // TO DO: 적금 플랜 생성 하면 planId 주석처럼 써야함
//   const planId = "5"; // const { planId } = useParams<{ planId: string }>();
//   const checklistId = 1; // TO DO : 일단 임의의 유저별 체크리스트 ID 주입되어있음
//   const isMobile = useIsMobile(768);
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);

//   // 탭 상태: mission | detail
//   const [activeTab, setActiveTab] = useState<"mission" | "detail">("mission");

//   // API 데이터 상태
//   const [plan, setPlan] = useState<SavingsPlanDetail | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [loadError, setLoadError] = useState<string | null>(null);

//   // 파생 상태
//   const goalAmount = plan?.goalAmount ?? 0;
//   const [currentAmount, setCurrentAmount] = useState<number>(0);

//   // 체크리스트에서 넘어온 완료 내역이라고 가정
//   const [missions, setMissions] = useState<MissionType[]>([]);
//   const rewardPerMission = missions.linkedAmount ?? 5000;

//   const percent = useMemo(() => {
//     if (!goalAmount || goalAmount <= 0) return 0;
//     const p = (currentAmount / goalAmount) * 100;
//     return Math.min(100, Math.max(0, Math.round(p * 10) / 10));
//   }, [currentAmount, goalAmount]);

//   function toggleSidebar() {
//     setIsSidebarOpen((prev) => !prev);
//   }

//   // 플랜 상세 조회
//   useEffect(() => {
//     if (!planId) {
//       setLoadError("planId가 없습니다.");
//       return;
//     }
//     const id = Number(planId);
//     if (Number.isNaN(id) || id <= 0) {
//       setLoadError("유효하지 않은 planId 입니다.");
//       return;
//     }

//     let alive = true;
//     (async () => {
//       try {
//         setLoading(true);
//         setLoadError(null);
//         const data = await getSavingsPlan(id);
//         if (!alive) return;
//         setPlan(data);
//         // 현재 적립액 = savingAccount.accountBalance
//         setCurrentAmount(Math.max(0, data?.savingAccount?.accountBalance ?? 0));
//       } catch (e: any) {
//         if (!alive) return;
//         setLoadError(
//           e?.response?.data?.message || e?.message || "플랜 정보를 불러오지 못했습니다."
//         );
//       } finally {
//         if (alive) setLoading(false);
//       }
//     })();
//     return () => { alive = false; };
//   }, [planId]);

//   // 체크리스트 불러오기
//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       try {
//         const items: UserChecklistItem[] = await getUserChecklistItems(checklistId);
//         if (!alive) return;
//         // API → MissionType 변환
//         const mapped: MissionType[] = items.map((item) => ({
//           id: item.uciId,
//           text: item.title,
//           completed: item.status === "DONE",
//           credited: false, // TODO: 적금 입금 내역과 연동하면 true로 변경
//         }));
//         setMissions(mapped);
//       } catch (e) {
//         console.error("체크리스트 로딩 실패", e);
//       }
//     })();
//     return () => { alive = false; };
//   }, [checklistId]);

//   // 미션 컴포넌트에서 호출하는 입금 처리
//   async function handleRequestDeposit(missionIds: number[], amount: number) {
//     // TODO: 실제 API 연동
//     setCurrentAmount((prev) => Math.min(goalAmount, prev + amount));
//     setMissions((prev) =>
//       prev.map((m) =>
//         missionIds.includes(m.id) ? { ...m, credited: true } : m
//       )
//     );
//     return true;
//   }

//   if (loading) {
//     return <div className={styles.container}><main className={styles.main}><div className={styles.pageContent}><h1 className={styles.title}>SAVINGS</h1><p>불러오는 중…</p></div></main></div>;
//   }
//   if (loadError) {
//     return <div className={styles.container}><main className={styles.main}><div className={styles.pageContent}><h1 className={styles.title}>SAVINGS</h1><p role="alert">{loadError}</p></div></main></div>;
//   }

//   return (
//     <div className={styles.container}>
//       {/* 모바일 전용: 사이드바 + 햄버거 */}
//       {isMobile ? (
//         <>
//           <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
//           <button
//             type="button"
//             className={styles.mobileHamburger}
//             onClick={toggleSidebar}
//             aria-label="메뉴 열기"
//           >
//             <span></span>
//             <span></span>
//             <span></span>
//           </button>
//         </>
//       ) : null}

//       <main className={styles.main}>
//         {/* 데스크톱 전용: 헤더 */}
//         {isMobile ? null : <Header />}

//         <div className={styles.pageContent}>
//           <h1 className={styles.title}>SAVINGS</h1>

//           {/* ===== 상단 섹션: Mission(프로그레스) / Detail(SVG) ===== */}
//           {activeTab === "detail" ? (
//             // Detail 탭: 일러스트
//             <section
//               className={styles.illustrationWrap}
//               aria-label="Saving detail hero"
//             >
//               <div className={styles.illustrationCard}>
//                 <img
//                   src={savingDetailSvg}
//                   alt="Saving Details Illustration"
//                   className={styles.illustrationImg}
//                 />
//               </div>
//             </section>
//           ) : (
//             // Mission 탭: 기존 진행 박스
//             <section
//               className={styles.progressWrap}
//               aria-label="적금 진행 상황 요약"
//             >
//               <div className={styles.progressCard}>
//                 <div className={styles.amountRow}>
//                   <div className={`${styles.amountPill} ${styles.current}`}>
//                     <strong className={styles.amountValue}>
//                       {formatAmount(currentAmount)}
//                     </strong>
//                   </div>
//                   <div className={`${styles.amountPill} ${styles.goal}`}>
//                     <strong className={styles.amountValue}>
//                       {formatAmount(goalAmount)}
//                     </strong>
//                   </div>
//                 </div>

//                 <div className={styles.barTrack} aria-hidden="true">
//                   <div
//                     className={styles.barFill}
//                     style={{ width: `${percent}%` }}
//                   />
//                 </div>

//                 <div className={`${styles.cloud} ${styles.cloudLeft}`} />
//                 <div className={`${styles.cloud} ${styles.cloudRight}`} />
//               </div>
//             </section>
//           )}

//           {/* ===== 탭 버튼 ===== */}
//           <div
//             className={styles.tabBar}
//             role="tablist"
//             aria-label="Savings sections"
//           >
//             <button
//               type="button"
//               role="tab"
//               aria-selected={activeTab === "mission"}
//               className={`${styles.tabButton} ${
//                 activeTab === "mission" ? styles.active : ""
//               }`}
//               onClick={() => setActiveTab("mission")}
//             >
//               Mission
//             </button>
//             <button
//               type="button"
//               role="tab"
//               aria-selected={activeTab === "detail"}
//               className={`${styles.tabButton} ${
//                 activeTab === "detail" ? styles.active : ""
//               }`}
//               onClick={() => setActiveTab("detail")}
//             >
//               Details
//             </button>
//           </div>

//           {/* ===== 탭 콘텐츠 ===== */}
//           {activeTab === "mission" ? (
//             <SavingsMission
//               missions={missions}
//               rewardPerMission={rewardPerMission}
//               onRequestDeposit={handleRequestDeposit}
//             />
//           ) : (
//             <SavingsDetail planId={plan?.planId} />
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }

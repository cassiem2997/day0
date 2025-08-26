import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import ChecklistStats, {
  type ChecklistItem,
} from "../../components/ChecklistStats/ChecklistStats";
import TipCard from "../../components/TipCard/TipCard";
import CalendarView from "../../components/Calendar/CalendarView";
import DayPanel from "../../components/Calendar/DayPanel";
import NoChecklist from "../../components/NoChecklist/NoChecklist";
import ChecklistMaking from "./ChecklistMaking"; // ✅ 생성 폼을 같은 페이지에서 렌더
import styles from "./ChecklistPage.module.css";

import { pickRandomTipAny } from "../../utils/tipSelector";
import type { Tip } from "../../data/tips";

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

type Mode = "empty" | "creating" | "list";

export default function ChecklistPage() {
  const isMobile = useIsMobile(768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((p) => !p);

  const leaveDate = "2026-02-20";

  // 더미는 주석 처리. 초기엔 빈 배열 => 빈 상태 보여줌
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const hasItems = items.length > 0;

  // ✔ 뷰 전환 전용 모드
  const [mode, setMode] = useState<Mode>(hasItems ? "list" : "empty");
  useEffect(() => {
    setMode(hasItems ? "list" : "empty");
  }, [hasItems]);

  // 체크 토글
  function toggleItem(id: number) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id ? { ...it, completed: !it.completed } : it
      )
    );
  }

  // 랜덤 팁
  const [tip, setTip] = useState<Tip | null>(null);
  useEffect(() => {
    setTip(pickRandomTipAny());
  }, []);

  // 캘린더 상태
  const [selectedDate, setSelectedDate] = useState(new Date());
  const handleDateChange = (d: Date) => setSelectedDate(d);

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
          <header className={styles.heroWrap} aria-labelledby="hero-title">
            <h1 id="hero-title" className={styles.hero}>
              CHECKLISTS
            </h1>
          </header>

          {/* ====== 빈 상태 → 생성 폼으로 전환 ====== */}
          {!hasItems && mode === "empty" && (
            <section aria-label="빈 체크리스트 안내">
              <NoChecklist onCreate={() => setMode("creating")} />
            </section>
          )}

          {!hasItems && mode === "creating" && (
            <section aria-label="체크리스트 생성">
              <ChecklistMaking
                onSubmit={({ leaveDate, country, university }) => {
                  // TODO: 서버 저장 후 응답으로 목록 갱신
                  // 데모용: 첫 아이템만 만들어 목록 화면으로 전환
                  setItems([
                    {
                      id: Date.now(),
                      date: leaveDate || "2025-08-20",
                      text: `${country} ${university} 준비`,
                      completed: false,
                    },
                  ]);
                  setMode("list");
                }}
                onCancel={() => setMode("empty")}
              />
            </section>
          )}

          {/* ====== 실제 목록 화면 ====== */}
          {hasItems && mode === "list" && (
            <>
              <div style={{ marginTop: 12, marginBottom: 24 }}>
                <ChecklistStats
                  leaveDate={leaveDate}
                  items={items}
                  cloudVars={{
                    ["--cloud-tr-top"]: "28%",
                    ["--cloud-tr-right"]: "14%",
                    ["--cloud-tr-w"]: "110px",
                    ["--cloud-br-bottom"]: "8px",
                    ["--cloud-br-right"]: "16px",
                    ["--cloud-br-w"]: "120px",
                    ["--cloud-bl-bottom"]: "10px",
                    ["--cloud-bl-left"]: "22%",
                    ["--cloud-bl-w"]: "160px",
                  }}
                />
              </div>

              <section className={styles.section} aria-labelledby="tip-title">
                <h2 id="tip-title" className={styles.sectionTitle}>
                  Today’s Tip
                </h2>
                <div className={styles.tipCardWrap}>
                  <TipCard
                    message={tip ? tip.text : "팁을 불러오는 중입니다."}
                  />
                </div>
              </section>

              <section
                className={styles.calendarSection}
                aria-labelledby="calendar-title"
              >
                <CalendarView
                  items={items}
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                  leaveDate={leaveDate}
                />
                <div style={{ marginTop: 16 }}>
                  <DayPanel
                    date={selectedDate}
                    items={items}
                    onToggle={toggleItem}
                  />
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

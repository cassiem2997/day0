import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import ChecklistStats, {
  type ChecklistItem,
} from "../../components/ChecklistStats/ChecklistStats";
import TipCard from "../../components/TipCard/TipCard";
import CalendarView from "../../components/Calendar/CalendarView";
import DayPanel from "../../components/Calendar/DayPanel";
import NoChecklist from "../../components/NoChecklist/NoChecklist";
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

export default function ChecklistPage() {
  const isMobile = useIsMobile(768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((p) => !p);

  const navigate = useNavigate();

  // 출국일
  const leaveDate = "2026-02-20";

  // 더미 데이터 → 테스트용으로 주석 처리
  /*
  const initialItems: ChecklistItem[] = [
    { id: 1, date: "2025-08-20", text: "여권 발급 및 비자 신청", completed: true },
    { id: 2, date: "2025-09-15", text: "항공권 예매", completed: true },
    { id: 3, date: "2025-10-01", text: "학교 기숙사 신청", completed: true },
    { id: 4, date: "2026-01-20", text: "해외유심/로밍 알아보기", completed: true },
    { id: 5, date: "2026-01-25", text: "국제학생증 발급", completed: false },
    { id: 6, date: "2025-11-10", text: "필요 서류 영문 번역 및 공증", completed: false },
    { id: 7, date: "2026-02-05", text: "해외 결제 카드 준비", completed: false },
    { id: 8, date: "2026-02-10", text: "출국 전 OT 참석", completed: false },
  ];
  */

  // 빈 배열로 설정 → NoChecklist 보이도록
  const [items, setItems] = useState<ChecklistItem[]>([]);

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

  const hasItems = items.length > 0;

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

          {/* 비어있을 때: 빈 상태 화면 */}
          {!hasItems ? (
            <section aria-label="빈 체크리스트 안내">
              <NoChecklist onCreate={() => navigate("/checklist/create")} />
            </section>
          ) : (
            <>
              {/* D-day / 진행도 */}
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

              {/* Today’s Tip */}
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

              {/* Calendar + DayPanel */}
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

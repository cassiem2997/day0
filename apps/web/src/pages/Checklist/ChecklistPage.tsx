// pages/Checklist/ChecklistPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import NoChecklist from "../../components/NoChecklist/NoChecklist";
import ChecklistStats, {
  type ChecklistItem,
} from "../../components/ChecklistStats/ChecklistStats";
import TipCard from "../../components/TipCard/TipCard";
import CalendarView from "../../components/Calendar/CalendarView";
import DayPanel from "../../components/Calendar/DayPanel";
import { pickRandomTipAny } from "../../utils/tipSelector";
import type { Tip } from "../../data/tips";
import styles from "./ChecklistPage.module.css";

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
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((p) => !p);

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const hasItems = items.length > 0;
  const leaveDate = "2026-02-20";

  const [tip, setTip] = useState<Tip | null>(null);
  useEffect(() => {
    setTip(pickRandomTipAny());
  }, []);

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
          <header className={styles.heroWrap}>
            <h1 className={styles.hero}>CHECKLISTS</h1>
          </header>

          {!hasItems && (
            <NoChecklist onCreate={() => navigate("/checklist/new")} />
          )}

          {hasItems && (
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

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Today’s Tip</h2>
                <div className={styles.tipCardWrap}>
                  <TipCard
                    message={tip ? tip.text : "팁을 불러오는 중입니다."}
                  />
                </div>
              </section>

              <section className={styles.calendarSection}>
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
                    onToggle={(id) =>
                      setItems((prev) =>
                        prev.map((it) =>
                          it.id === id
                            ? { ...it, completed: !it.completed }
                            : it
                        )
                      )
                    }
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

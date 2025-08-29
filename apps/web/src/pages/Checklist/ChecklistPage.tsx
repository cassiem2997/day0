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
import { getDeparturesByUserId } from "../../api/departure";
import { getUserChecklistByDepartureId } from "../../api/checklist";

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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [shouldShowNoChecklist, setShouldShowNoChecklist] = useState<boolean>(false);
  const leaveDate = "2026-02-20";

  const [tip, setTip] = useState<Tip | null>(null);
  useEffect(() => {
    setTip(pickRandomTipAny());
  }, []);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const handleDateChange = (d: Date) => setSelectedDate(d);

  useEffect(() => {
    let isCancelled = false;
    async function bootstrap() {
      try {
        const storedUserId = localStorage.getItem("userId");
        const userId = storedUserId ? Number(storedUserId) : null;
        
        if (!userId || Number.isNaN(userId)) {
          if (!isCancelled) {
            setShouldShowNoChecklist(true);
            setIsLoading(false);
          }
          return;
        }
        
        const departures = await getDeparturesByUserId(userId);
        if (!departures || departures.length === 0) {
          if (!isCancelled) {
            setShouldShowNoChecklist(true);
            setIsLoading(false);
          }
          return;
        }
        
        const departureId = departures[0].departureId;
        const userChecklist = await getUserChecklistByDepartureId(departureId);
        if (!userChecklist) {
          if (!isCancelled) {
            setShouldShowNoChecklist(true);
            setIsLoading(false);
          }
          return;
        }
        
        // 모든 조건을 만족하는 경우에만 /checklist/current로 이동
        if (!isCancelled) {
          navigate("/checklist/current", { replace: true });
        }
      } catch (error) {
        console.error('체크리스트 로딩 중 오류:', error);
        if (!isCancelled) {
          setShouldShowNoChecklist(true);
          setIsLoading(false);
        }
      }
    }
    bootstrap();
    return () => {
      isCancelled = true;
    };
  }, [navigate]);

  // items 상태를 올바른 형식으로 초기화
  useEffect(() => {
    // 임시로 빈 배열로 초기화 (실제로는 API에서 가져온 데이터를 변환해야 함)
    setItems([]);
  }, []);

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
              <p className={styles.subtitle}>완벽한 출국준비를 위한 첫걸음</p>
              <h1 className={styles.hero}>헤이 - 체크</h1>
          </header>

          {isLoading ? (
            <div style={{ padding: 24 }}>불러오는 중...</div>
          ) : shouldShowNoChecklist ? (
            <NoChecklist onCreate={() => navigate("/checklist/new")} />
          ) : null}

          {!isLoading && !shouldShowNoChecklist && (
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
                <h2 className={styles.sectionTitle}>Today's Tip</h2>
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
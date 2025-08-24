import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import Summary from "../../components/Summary/Summary";
import CalendarView from "../../components/Calendar/CalendarView";
import TipCard from "../../components/TipCard/TipCard";
import styles from "./ChecklistPage.module.css";

type ChecklistItem = {
  id: number;
  text: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
};

type Data = {
  leaveDate: string;
  checklistItems: ChecklistItem[];
};

const DUMMY_DATA: Data = {
  leaveDate: "2026-02-20",
  checklistItems: [
    {
      id: 1,
      date: "2025-08-20",
      text: "여권 발급 및 비자 신청",
      completed: true,
    },
    { id: 2, date: "2025-09-15", text: "항공권 예매", completed: true },
    { id: 3, date: "2025-10-01", text: "학교 기숙사 신청", completed: true },
    {
      id: 4,
      date: "2026-01-20",
      text: "해외유심 또는 로밍 알아보기",
      completed: true,
    },
    { id: 5, date: "2026-01-25", text: "국제학생증 발급", completed: false },
    {
      id: 6,
      date: "2025-11-10",
      text: "필요 서류 영문 번역 및 공증",
      completed: false,
    },
    {
      id: 7,
      date: "2026-02-05",
      text: "해외 결제 카드 준비",
      completed: false,
    },
    { id: 8, date: "2026-02-10", text: "출국 전 OT 참석", completed: false },
  ],
};

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

export default function ChecklistPage() {
  const [tripData] = useState<Data>(DUMMY_DATA);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isMobile = useIsMobile(768);

  function handleDateChange(date: Date) {
    setSelectedDate(date);
  }
  function toggleSidebar() {
    setIsSidebarOpen((prev) => !prev);
  }

  return (
    <div className={styles.container}>
      {/* 모바일에서만 사이드바 사용 */}
      {isMobile ? (
        <>
          <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar}></Sidebar>
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
        {/* 데스크톱에서만 헤더 사용 */}
        {isMobile ? null : <Header></Header>}

        <div className={styles.pageContent}>
          <h2 className={styles.title}>CHECKLIST</h2>

          <div className={styles.dashboardContainer}>
            <Summary
              leaveDate={tripData.leaveDate}
              items={tripData.checklistItems}
            ></Summary>
            <TipCard></TipCard>
          </div>

          <CalendarView
            items={tripData.checklistItems}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            leaveDate={tripData.leaveDate}
          ></CalendarView>
        </div>
      </main>
    </div>
  );
}

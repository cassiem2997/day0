import { useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Summary from "../../components/Summary/Summary";
import CalendarView from "../../components/Calendar/CalendarView";
import TipCard from "../../components/TipCard/TipCard";
import styles from "./ChecklistPage.module.css";

type ChecklistItem = {
  id: number;
  text: string;
  completed: boolean;
  date: string;
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
    { id: 5, date: "2026-01-25", text: "국제학생증 발급", completed: true },
    {
      id: 6,
      date: "2025-11-10",
      text: "필요 서류 영문 번역 및 공증",
      completed: true,
    },
    {
      id: 7,
      date: "2026-02-05",
      text: "해외 결제 카드 준비",
      completed: true,
    },
    { id: 8, date: "2026-02-10", text: "출국 전 OT 참석", completed: true },
  ],
};

export default function ChecklistPage() {
  const [tripData] = useState<Data>(DUMMY_DATA);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const handleDateChange = (date: Date) => setSelectedDate(date);

  return (
    <div className={styles.container}>
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />

      <main className={styles.main}>
        {/* 사이드바 상태에 따라 margin-left 적용 */}
        <header
          className={`${styles.header} ${
            isSidebarOpen ? styles.withSidebar : styles.noSidebar
          }`}
        >
          <img src="/logo.svg" alt="logo" width={120} height={80} />
        </header>

        <div className={styles.pageContent}>
          <h2 className={styles.title}>CHECKLIST</h2>

          <div className={styles.dashboardContainer}>
            <Summary
              leaveDate={tripData.leaveDate}
              items={tripData.checklistItems}
            />
            <TipCard />
          </div>

          <CalendarView
            items={tripData.checklistItems}
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            leaveDate={tripData.leaveDate}
          />
        </div>
      </main>
    </div>
  );
}

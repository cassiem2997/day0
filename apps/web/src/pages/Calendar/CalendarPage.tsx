// pages/Calendar/CalendarPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./CalendarPage.module.css";
import underline from "../../assets/underline.svg";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  });
  
  useState(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });
  
  return isMobile;
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((p) => !p);

  return (
    <div className={styles.divWrapper}>
      <div className={styles.div}>
        {/* 모바일 햄버거 메뉴 */}
        {isMobile ? (
          <>
            <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
            <button
              type="button"
              className={styles.mobileHamburger}
              onClick={toggleSidebar}
              aria-label="메뉴 열기"
            >
              <span className={styles.line}></span>
              <span className={styles.line2}></span>
              <span className={styles.line3}></span>
            </button>
          </>
        ) : (
          <Header />
        )}

        {/* 프로필 아이콘 */}
        <div className={styles.iconlyLightOutline} />

        {/* 상단 타이틀 섹션 */}
        <header className={styles.heroWrap}>
          <img src={underline} alt="" className={styles.underline} />
          <p className={styles.subtitle}>완벽한 출국준비의 첫 걸음</p>
          <h1 className={styles.hero}>달력</h1>
        </header>

        {/* 왼쪽 패널 */}
        <div className={styles.leftPanel}>
          <div className={styles.panelHeader}>
            <div className={styles.panelTitle}>Public</div>
          </div>
          <h2 className={styles.mainTitle}>
            런던 3개월 어학연수
            <br />
            (맥시멀리스트)
          </h2>
          
          <div className={styles.tableContainer}>
            <div className={styles.tableHeader}>
              <div className={styles.columnHeader}>구분</div>
              <div className={styles.columnHeader}>항목명</div>
            </div>
            
            <div className={styles.tableRow}>
              <div className={styles.columnItem}>중앙 안내</div>
              <div className={styles.columnItem}>토익 성적표 제출</div>
            </div>
            
            <div className={styles.tableRow}>
              <div className={styles.columnItem}></div>
              <div className={styles.columnItem}>성적 증명서 제출</div>
            </div>
            
            <div className={styles.tableRow}>
              <div className={styles.columnItem}></div>
              <div className={styles.columnItem}>비자 발급</div>
            </div>
            
            <div className={styles.tableRow}>
              <div className={styles.columnItem}>Saving</div>
              <div className={styles.columnItem}>적금 개좌 생성</div>
            </div>
            
            <div className={styles.tableRow}>
              <div className={styles.columnItem}></div>
              <div className={styles.columnItem}>트래블 카드 발급</div>
            </div>
            
            <div className={styles.tableRow}>
              <div className={styles.columnItem}>etc</div>
              <div className={styles.columnItem}>공항 버스 예매</div>
            </div>
            
            <div className={styles.tableRow}>
              <div className={styles.columnItem}></div>
              <div className={styles.columnItem}>1+1 QT 생성</div>
            </div>
          </div>
        </div>

        {/* 오른쪽 패널 */}
        <div className={styles.rightPanel}>
          <img 
            src="/src/assets/calendar_illustration.svg" 
            alt="달력 일러스트레이션" 
            className={styles.calendarIllustration}
          />
        </div>
      </div>
    </div>
  );
}

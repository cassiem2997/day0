// pages/ChecklistCurrent/ChecklistCurrentPage.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import DailyChecklist from "../../components/DailyChecklist";
import ModernCalendar from "../../components/ModernCalendar";
import { pickRandomTipAny } from "../../utils/tipSelector";
import type { Tip } from "../../data/tips";
import styles from "./ChecklistCurrentPage.module.css";
import clouds from "../../assets/clouds.svg";
import underline from "../../assets/underline.svg";
// 대학교 이미지 추가
import universityImg from "../../assets/university.svg";
import { getUserChecklistsNew, getUserChecklistItems } from "../../api/checklist";
import type { UserChecklistItem } from "../../api/checklist";
import { useAuth } from "../../auth/useAuth";

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

// 임시 체크리스트 데이터
const sampleChecklistItems = [
  { id: 1, text: "여권 유효기간 확인", completed: true, date: "2025-01-15" },
  { id: 2, text: "비자 신청", completed: true, date: "2025-01-20" },
  { id: 3, text: "항공권 예약", completed: true, date: "2025-01-25" },
  { id: 4, text: "숙소 예약", completed: false, date: "2025-02-01" },
  { id: 5, text: "여행자 보험 가입", completed: false, date: "2025-02-05" },
  { id: 6, text: "환전하기", completed: false, date: "2025-02-10" },
  { id: 7, text: "짐 정리", completed: false, date: "2025-02-15" },
  { id: 8, text: "공항 교통편 예약", completed: false, date: "2025-02-18" },
];

export default function ChecklistCurrentPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile(768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((p) => !p);
  const { user } = useAuth();

  const [items] = useState(sampleChecklistItems);
  const leaveDate = "2025-03-20";
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [tip, setTip] = useState<Tip | null>(null);
  useEffect(() => {
    setTip(pickRandomTipAny());
  }, []);
  
  // 최신 체크리스트 아이템 가져오기
  useEffect(() => {
    const fetchChecklistItems = async () => {
      if (!user?.userId) return;
      
      try {
        setIsLoading(true);
        // 1. 사용자의 체크리스트 목록 가져오기
        const checklists = await getUserChecklistsNew(user.userId);
        
        if (checklists && checklists.length > 0) {
          // 2. 가장 최근 체크리스트의 ID 가져오기 (첫 번째 항목 사용)
          const latestChecklist = checklists[0];
          const checklistId = latestChecklist.userChecklistId;
          
          // 3. 해당 체크리스트의 아이템 가져오기
          const items = await getUserChecklistItems(checklistId);
          
          // 4. 최대 3개의 아이템만 선택하여 제목 추출
          const titles = items.slice(0, 3).map(item => item.title);
          
          // 5. 체크리스트 아이템 설정
          setChecklistItems(titles);
        }
      } catch (error) {
        console.error('체크리스트 아이템을 가져오는 중 오류 발생:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChecklistItems();
  }, [user?.userId]);
  
  // 캘린더 이벤트 데이터
  const calendarEvents = useMemo(() => {
    // 기존 아이템에 오늘 날짜 추가
    const today = new Date();
    
    const events = items.map(item => ({
      date: new Date(item.date),
      count: item.completed ? 2 : 1
    }));
    
    // 오늘 날짜에 이벤트 추가 (예시용)
    events.push({
      date: today,
      count: 3 // 더 눈에 띄게 3개의 점 표시
    });
    
    return events;
  }, [items]);

  // Calculate days remaining and completion percentage
  const today = new Date();
  const targetDate = new Date(leaveDate);
  const daysRemaining = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const completedItems = items.filter(item => item.completed).length;
  const completionPercentage = items.length > 0 ? Math.round((completedItems / items.length) * 100) : 0;

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
          <h1 className={styles.hero}>헤이 - 체크</h1>
        </header>
          <div className={styles.frame4}>
            <div className={styles.group}>
              <div className={styles.textWrapper6}>01</div>
              <div className={styles.textWrapper5}>오늘의 팁</div>
            </div>
            <div className={styles.group2}>
              <div className={styles.textWrapper6}>02</div>
              <div className={styles.textWrapper7}>달력</div>
            </div>
            <div className={styles.group3}>
              <div className={styles.textWrapper6}>03</div>
              <div className={styles.textWrapper7}>세부 내용</div>
            </div>
          </div>



        {/* 진행 상황 카드 */}
        <div className={styles.frame3}>
          {/* <img src={clouds} alt="" className={styles.union2} /> */}
          <div className={styles.overlap}>
            {/* D-51 섹션 */}
            <div className={styles.rectangle8} />
            <div className={styles.rectangle9} />
            <div className={styles.rectangle10} />
            <div className={styles.rectangle11} />
            <div className={styles.rectangle12} />
            <div className={styles.rectangle13} />
            <div className={styles.rectangle14} />
            <p className={styles.d}>
              <span className={styles.textWrapper3}>D </span>
              <span className={styles.textWrapper4}>{daysRemaining}</span>
            </p>

            {/* 95% 섹션 */}
            <div className={styles.rectangle} />
            <div className={styles.rectangle2} />
            <div className={styles.rectangle3} />
            <div className={styles.rectangle4} />
            <div className={styles.rectangle5} />
            <div className={styles.rectangle6} />
            <div className={styles.rectangle7} />
            <p className={styles.element2}>
              <span className={styles.span}>{completionPercentage}</span>
              <span className={styles.textWrapper2}> %</span>
            </p>
          </div>

          {/* 진행률 바 */}
          <div className={styles.rectangleWrapper}>
            <div 
              className={styles.rectangle15}
              style={{ width: `${(completionPercentage / 100) * 500}px` }}
            />
          </div>
          {/* <img src={clouds} alt="" className={styles.union3} /> */}
        </div>

        {/* 오늘의 팁 섹션 */}
        <div className={styles.frame}>
          <div className={styles.overlapGroup}>
            <div className={styles.vector} />
            <div className={styles.textWrapper}>오늘의 팁</div>
          </div>
          <div className={styles.frame2}>
            <p className={styles.p}>
              {tip ? tip.text : "여권과 비자 사본을 클라우드에 업로드해 두면 분실 시 유용하게 사용할 수 있어요!"}
            </p>
            <img src={clouds} alt="" className={styles.union} />
            <img src={clouds} alt="" className={styles.img} />
          </div>
          

        </div>

        {/* 오늘의 체크리스트 - 페이지 맨 아래 */}
        <div className={styles.dailyChecklistWrapper}>
          <DailyChecklist
            date="2025. 08. 25"
            checklistItems={isLoading ? ["로딩 중..."] : checklistItems.length > 0 ? checklistItems : ["체크리스트 항목이 없습니다"]}
            onItemChange={(index: number, checked: boolean) => {
              console.log(`체크리스트 ${index}번 항목: ${checked ? '체크됨' : '체크해제됨'}`);
            }}
          />
        </div>
        
        {/* 대학교 이미지 */}
        <figure className={styles.universityHero} aria-label="University illustration">
          <img
            src={universityImg}
            alt="신한대학교 일러스트"
            className={styles.universityHeroImg}
          />
        </figure>
        
        {/* 달력 섹션 */}
        <div className={styles.calendarSection}>
          <div className={styles.calendarHeader}>
          <img src={underline} alt="" className={styles.calendarUnderline} />
            <div className={styles.calendarTitle}>달력</div>
          </div>
          <div className={styles.calendarContent}>
            <div className={styles.calendarRight}>
                <ModernCalendar
                  value={selectedDate}
                  onChange={setSelectedDate}
                  events={calendarEvents}
                />
            </div>
            
            <div className={styles.calendarLeft}>
              <div className={styles.historyTable}>
                <div className={styles.tableHeader}>
                  <div className={styles.headerCell}>구분</div>
                  <div className={styles.headerCell}>항목명</div>
                  <div className={styles.headerCell}>마감일</div>
                </div>
                
                <div className={styles.tableBody}>
                  <div className={styles.tableRow}>
                    <div className={styles.categoryCell}>중앙 안내</div>
                    <div className={styles.itemCell}>토익 성적표 제출</div>
                    <div className={styles.dateCell}>
                      <div className={styles.date}>2025-01-15</div>
                      <div className={styles.time}>D-30</div>
                    </div>
                  </div>
                  
                  <div className={styles.tableRow}>
                    <div className={styles.categoryCell}></div>
                    <div className={styles.itemCell}>성적 증명서 제출</div>
                    <div className={styles.dateCell}>
                      <div className={styles.date}>2025-01-20</div>
                      <div className={styles.time}>D-35</div>
                    </div>
                  </div>
                  
                  <div className={styles.tableRow}>
                    <div className={styles.categoryCell}></div>
                    <div className={styles.itemCell}>비자 발급</div>
                    <div className={styles.dateCell}>
                      <div className={styles.date}>2025-01-25</div>
                      <div className={styles.time}>D-40</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={styles.historyTable} style={{ marginTop: '40px' }}>
                <div className={styles.tableHeader}>
                  <div className={styles.headerCell}>구분</div>
                  <div className={styles.headerCell}>항목명</div>
                  <div className={styles.headerCell}>마감일</div>
                </div>
                
                <div className={styles.tableBody}>
                  <div className={styles.tableRow}>
                    <div className={styles.categoryCell}>Saving</div>
                    <div className={styles.itemCell}>적금 개좌 생성</div>
                    <div className={styles.dateCell}>
                      <div className={styles.date}>2025-02-01</div>
                      <div className={styles.time}>D-47</div>
                    </div>
                  </div>
                  
                  <div className={styles.tableRow}>
                    <div className={styles.categoryCell}></div>
                    <div className={styles.itemCell}>트래블 카드 발급</div>
                    <div className={styles.dateCell}>
                      <div className={styles.date}>2025-02-05</div>
                      <div className={styles.time}>D-51</div>
                    </div>
                  </div>
                  
                  <div className={styles.tableRow}>
                    <div className={styles.categoryCell}>etc</div>
                    <div className={styles.itemCell}>공항 버스 예매</div>
                    <div className={styles.dateCell}>
                      <div className={styles.date}>2025-02-10</div>
                      <div className={styles.time}>D-56</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
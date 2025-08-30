// pages/ChecklistCurrent/ChecklistCurrentPage.tsx
import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import DailyChecklist from "../../components/DailyChecklist";
import ModernCalendar from "../../components/ModernCalendar";
import ChecklistModal from "../../components/ChecklistModal";
import ChecklistCompletionModal from "../../components/ChecklistCompletionModal";
import openChecklistAddModal from "../../components/ChecklistAddModal/ChecklistAddModal";
import { pickRandomTipAny } from "../../utils/tipSelector";
import type { Tip } from "../../data/tips";
import styles from "./ChecklistCurrentPage.module.css";
import clouds from "../../assets/clouds.svg";
import underline from "../../assets/underline.svg";
// 대학교 이미지 추가
import universityImg from "../../assets/university.svg";
import { getUserChecklists, patchUserChecklistItem, getChecklistCalendar } from "../../api/checklist";
import type { ChecklistCalendarItem } from "../../api/checklist";
import { useAuth } from "../../auth/useAuth";
import { getMySavingsPlans } from "../../api/savings";
import { tryGetAccountById } from "../../api/accounts";
import api from "../../api/axiosInstance";
import showWithdrawSuccessModal from "../../components/ChecklistAddModal/WithdrawSuccessModal";

// UserChecklistItem 타입 직접 정의
interface UserChecklistItem {
  uciId: number;
  userChecklistId?: number;
  templateItemId?: number;
  title: string;
  description?: string;
  dueDate?: string;
  status: string;
  completedAt?: string | null;
  tag?: string;
  linkedAmount?: number;
  isFixed?: boolean;
  createdAt?: string;
}

// ChecklistEditor에서 사용하는 ChecklistItem 타입
interface ChecklistItem {
  uciId: number;
  title: string;
  tag: "NONE" | "SAVING" | "EXCHANGE" | "INSURANCE" | "DOCUMENT" | "ETC";
  status: "TODO" | "DOING" | "DONE" | "SKIP";
  dueDate: string | null;
  description?: string;
}

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
  const [leaveDate, setLeaveDate] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [checklistItems, setChecklistItems] = useState<{ title: string; dueDate?: string; dDay?: number }[]>([]);
  const [checklistItemsData, setChecklistItemsData] = useState<UserChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [latestChecklistId, setLatestChecklistId] = useState<number | null>(null);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [completedItems, setCompletedItems] = useState<number>(0);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [calendarItems, setCalendarItems] = useState<ChecklistCalendarItem[]>([]);
  const [remainingChecklistItems, setRemainingChecklistItems] = useState<ChecklistCalendarItem[]>([]);

  // 모달창 관련 상태
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedDateItems, setSelectedDateItems] = useState<UserChecklistItem[]>([]);
  
  // 완료 확인 모달 관련 상태
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState<boolean>(false);
  const [selectedCompletionItem, setSelectedCompletionItem] = useState<UserChecklistItem | null>(null);

  // 체크리스트 정보 상태
  const [isPrivate, setIsPrivate] = useState(true);
  const [checklistTitle, setChecklistTitle] = useState("");

  const [tip, setTip] = useState<Tip | null>(null);
  
  // 섹션 refs
  const tipSectionRef = useRef<HTMLDivElement>(null);
  const calendarSectionRef = useRef<HTMLDivElement>(null);
  const checklistViewSectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setTip(pickRandomTipAny());
  }, []);
  
  // 섹션으로 스크롤 이동하는 함수들
  const scrollToTipSection = () => {
    if (tipSectionRef.current) {
      const offset = 100; // 헤더 높이만큼 오프셋
      const elementPosition = tipSectionRef.current.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };
  
  const scrollToCalendarSection = () => {
    if (calendarSectionRef.current) {
      const offset = 100; // 헤더 높이만큼 오프셋
      const elementPosition = calendarSectionRef.current.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };
  
  const scrollToChecklistViewSection = () => {
    if (checklistViewSectionRef.current) {
      const offset = 100; // 헤더 높이만큼 오프셋
      const elementPosition = checklistViewSectionRef.current.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };
  
  // 체크리스트 항목 클릭 시 완료 확인 모달 열기
  const handleItemClick = (item: any) => {
    console.log('체크리스트 항목 클릭:', item);
    if (item.status === 'TODO') {
      console.log('체크리스트 항목 완료 확인 모달 표시:', {
        title: item.title,
        uciId: item.uciId,
        linkedAmount: item.linkedAmount
      });
      setSelectedCompletionItem(item);
      setIsCompletionModalOpen(true);
    }
  };
  
  // 완료 확인 모달 닫기
  const closeCompletionModal = () => {
    setIsCompletionModalOpen(false);
    setSelectedCompletionItem(null);
  };
  
  // 체크리스트 항목 완료 처리 및 미션적금 출금 (통합 함수)
  const handleCompleteItem = async () => {
    const targetItem = selectedCompletionItem;
    if (!targetItem || !latestChecklistId) {
      console.error('체크리스트 항목이 선택되지 않았거나 체크리스트 ID가 없습니다.');
      return;
    }
    
    console.log('체크리스트 항목 완료 처리 시작:', {
      uciId: targetItem.uciId,
      title: targetItem.title,
      status: targetItem.status
    });
    
    // 이미 완료된 항목인지 확인
    if (targetItem.status === 'DONE') {
      return;
    }
    
    // 처리 중 상태로 설정하여 중복 호출 방지
    targetItem.status = 'PROCESSING';
    
    try {
      // 1. 체크리스트 항목 상태를 DONE으로 변경
      await patchUserChecklistItem(targetItem.uciId, {
        status: 'DONE'
      });
      
      // 2. 연결된 금액이 있는 경우 출금 및 입금 처리
      if (targetItem.linkedAmount && targetItem.linkedAmount > 0) {
        try {
          // 저축 계획 정보 가져오기
          const savingsPlans = await getMySavingsPlans();
          if (savingsPlans && savingsPlans.length > 0) {
            const plan = savingsPlans[0]; // 첫 번째 저축 계획 사용
            
            // 출금 계좌 정보 가져오기
            const withdrawAccount = await tryGetAccountById(plan.withdrawAccountId);
            const savingsAccount = await tryGetAccountById(plan.savingAccountId);
            
            if (withdrawAccount && savingsAccount) {
              // 출금 계좌 번호 가져오기
              const withdrawAccountDetails = await api.get(`/accounts/${plan.withdrawAccountId}`);
              const withdrawAccountNo = withdrawAccountDetails.data.accountNo;
              
              // 입금 계좌 번호 가져오기
              const savingsAccountDetails = await api.get(`/accounts/${plan.savingAccountId}`);
              const savingsAccountNo = savingsAccountDetails.data.accountNo;
              
              // 1. 출금 처리
              await api.post(
                `/banks/demand-deposit/accounts/${withdrawAccountNo}/withdraw`,
                {
                  amount: targetItem.linkedAmount,
                  description: `체크리스트 완료: ${targetItem.title}`
                }
              );
              
              // 2. 입금 처리
              await api.post(
                `/banks/demand-deposit/accounts/${savingsAccountNo}/deposit`,
                {
                  amount: targetItem.linkedAmount,
                  description: `체크리스트 완료 적립: ${targetItem.title}`
                }
              );
              
              // 출금 성공 모달 표시
              console.log('출금/입금 처리 완료, 성공 모달 표시 예정:', {
                title: targetItem.title,
                amount: targetItem.linkedAmount
              });
              await showWithdrawSuccessModal(
                targetItem.title,
                targetItem.linkedAmount
              );
            } else {
              throw new Error("계좌 정보를 가져올 수 없습니다.");
            }
          } else {
            throw new Error("저축 계획을 찾을 수 없습니다.");
          }
        } catch (withdrawError) {
          console.error('미션적금 출금/입금 실패:', withdrawError);
          alert('체크리스트는 완료되었지만 미션적금 출금/입금에 실패했습니다.');
        }
      }
      
      // 3. 체크리스트 항목 목록 새로고침
      await fetchChecklistItems();
      
      // 4. 모달이 열려있는 경우에만 닫기
      if (isCompletionModalOpen) {
        closeCompletionModal();
      }
      
      // 5. 성공 메시지는 출금 성공 모달에서 표시됨
      
    } catch (error) {
      console.error('체크리스트 항목 완료 처리 실패:', error);
      alert('체크리스트 항목 완료 처리에 실패했습니다.');
    }
  };
  
  // 체크리스트 진행률 계산 함수
  const fetchChecklistProgress = async (checklistId: number) => {
    try {
      // 1. 모든 체크리스트 항목 가져오기 (todoOnly=false)
      const { data: allItems } = await api.get(`/user-checklists/${checklistId}/items`, {
        params: {
          todoOnly: false
        }
      });
      
      // 2. 총 항목 개수 설정
      const total = allItems.length;
      setTotalItems(total);
      
      // 3. 완료된 항목 가져오기 (status=DONE, todoOnly=false)
      const { data: doneItems } = await api.get(`/user-checklists/${checklistId}/items`, {
        params: {
          status: 'DONE',
          todoOnly: false
        }
      });
      
      // 4. 완료된 항목 개수 설정
      const completed = doneItems.length;
      setCompletedItems(completed);
      
      // 5. 진행률 계산 (퍼센트)
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      setCompletionPercentage(percentage);
      

      
    } catch (error) {
      console.error('체크리스트 진행률 계산 중 오류 발생:', error);
    }
  };
  
  // 체크리스트 캘린더 데이터 가져오기
  const fetchCalendarData = async (checklistId: number) => {
    try {
      // 캘린더 데이터 가져오기
      const calendarData = await getChecklistCalendar(checklistId);

      
      // 데이터가 있는 경우에만 설정
      if (calendarData && calendarData.length > 0) {
        setCalendarItems(calendarData);

      } else {
        // 데이터가 없는 경우 빈 배열 설정
        setCalendarItems([]);

      }
    } catch (error) {
      console.error('체크리스트 캘린더 데이터 가져오기 실패:', error);
      
      // 오류 발생 시 빈 배열 설정
      setCalendarItems([]);

    }
  };

  // 최신 체크리스트 아이템 가져오기
  const fetchChecklistItems = async () => {
    if (!user?.userId) return;
    
    try {
      setIsLoading(true);
      // 1. 사용자의 체크리스트 목록 가져오기
      const checklists = await getUserChecklists(user.userId);
      
      if (checklists && checklists.length > 0) {
        // 2. 가장 최근 체크리스트의 ID 가져오기 (첫 번째 항목 사용)
        const latestChecklist = checklists[0];
        const checklistId = latestChecklist.userChecklistId;
        setLatestChecklistId(checklistId);
        setChecklistTitle(latestChecklist.title || "체크리스트");
        setIsPrivate(latestChecklist.visibility === "PRIVATE");
        
        // 4. 캘린더 데이터 가져오기 (먼저 실행하여 calendarItems 설정)
        await fetchCalendarData(checklistId);
        
        // 5. 진행률 계산
        await fetchChecklistProgress(checklistId);
        
        // 6. 해당 체크리스트의 아이템 가져오기 (모든 상태의 항목을 가져와서 달력에 표시)
        const { data: items } = await api.get(`/user-checklists/${checklistId}/items`, {
          params: {
            todoOnly: false
          }
        });
        console.log('체크리스트 아이템 데이터:', items);
        setChecklistItemsData(items);
        
        // 7. TODO 상태인 항목만 필터링하여 최대 3개 선택
        const todoItems = items.filter((item: UserChecklistItem) => item.status === 'TODO');
        const processedItems = todoItems.slice(0, 3).map((item: UserChecklistItem) => {
          // D-day 계산
          let dDay: number | undefined = undefined;
          if (item.dueDate) {
            const today = new Date();
            const dueDate = new Date(item.dueDate);
            const timeDiff = dueDate.getTime() - today.getTime();
            dDay = Math.ceil(timeDiff / (1000 * 3600 * 24));
          }
          
          return {
            title: item.title,
            dueDate: item.dueDate,
            dDay: dDay,
            status: item.status,
            uciId: item.uciId  // uciId 추가
          };
        });
        
        // 8. 체크리스트 아이템 설정
        setChecklistItems(processedItems);
        
        // 더 이상 남은 체크리스트 항목을 별도로 설정할 필요가 없음
        // 전체 TODO 항목을 직접 렌더링하므로 이 부분은 생략
      } else {
        // 체크리스트가 없습니다. NoChecklistPage로 리다이렉트
        console.log('체크리스트가 없습니다. NoChecklistPage로 이동합니다.');
        navigate("/checklist/no-checklist", { replace: true });
        return;
      }
    } catch (error) {
      console.error('체크리스트 아이템을 가져오는 중 오류 발생:', error);
      // 오류 발생 시에도 체크리스트가 없는 것으로 간주하고 NoChecklistPage로 이동
      navigate("/checklist/no-checklist", { replace: true });
      return;
    } finally {
      setIsLoading(false);
    }
  };
  
  // 출국일 정보 가져오기
  const fetchDepartureInfo = async () => {
    if (!user?.userId) return;
    
    try {
      console.log('출국일 API 호출 시작:', `/departures`);
      console.log('요청 데이터:', { userId: user.userId });
      console.log('현재 인증 상태 확인:', document.cookie);
      
      const departureResponse = await api.get(`/departures`, {
        params: { userId: user.userId }
      });
      console.log('출국일 API 전체 응답:', departureResponse);
      console.log('출국일 API 응답 데이터:', departureResponse.data);
      console.log('출국일 API 응답 상태:', departureResponse.status);
      console.log('출국일 API 응답 헤더:', departureResponse.headers);
      
      if (departureResponse.data && departureResponse.data.length > 0) {
        console.log('출국일 데이터 발견:', departureResponse.data);
        console.log('데이터 타입:', typeof departureResponse.data);
        console.log('데이터 길이:', departureResponse.data.length);
        
        const latestDeparture = departureResponse.data[0]; // 가장 최근 출국 정보
        console.log('가장 최근 출국 정보:', latestDeparture);
        console.log('latestDeparture 타입:', typeof latestDeparture);
        console.log('latestDeparture 키들:', Object.keys(latestDeparture));
        
        if (latestDeparture.startDate) {
          console.log('startDate 발견:', latestDeparture.startDate);
          console.log('startDate 타입:', typeof latestDeparture.startDate);
          
          // startDate는 "2025-09-12 15:00:00.000" 형태이므로 시간 정보 제거
          const startDate = new Date(latestDeparture.startDate);
          console.log('startDate 파싱 결과:', startDate);
          console.log('startDate 유효성:', !isNaN(startDate.getTime()));
          
          // YYYY-MM-DD 형식으로 변환 (시간 정보 제거)
          const formattedDate = startDate.toISOString().split('T')[0];
          setLeaveDate(formattedDate);
          console.log('출국일 설정 완료:', { 
            original: latestDeparture.startDate, 
            formatted: formattedDate,
            startDate: startDate.toISOString(),
            leaveDate: formattedDate
          });
        } else {
          console.log('startDate가 없습니다. latestDeparture 전체:', latestDeparture);
          console.log('startDate 필드 확인:', 'startDate' in latestDeparture);
          console.log('가능한 날짜 필드들:', Object.keys(latestDeparture).filter(key => key.toLowerCase().includes('date')));
        }
      } else {
        console.log('출국일 데이터가 없습니다. 전체 응답:', departureResponse);
        console.log('departureResponse.data 타입:', typeof departureResponse.data);
        console.log('departureResponse.data 길이:', departureResponse.data?.length);
        console.log('departureResponse.data 내용:', departureResponse.data);
      }
    } catch (departureError: any) {
      console.error('출국일 정보 가져오기 실패:', departureError);
      console.error('에러 상세:', departureError.response?.data);
      console.error('에러 상태:', departureError.response?.status);
      console.error('에러 메시지:', departureError.message);
    }
  };

  // 컴포넌트 마운트 시 체크리스트 아이템 가져오기
  useEffect(() => {
    fetchChecklistItems();
  }, [user?.userId]);
  
  // 체크리스트 로드 완료 후 출국일 정보 가져오기
  useEffect(() => {
    if (!isLoading && latestChecklistId) {
      console.log('체크리스트 로드 완료, 출국일 정보 가져오기 시작');
      fetchDepartureInfo();
    }
  }, [isLoading, latestChecklistId, user?.userId]);
  
  // 체크리스트 항목 체크 처리 및 출금 기능 (상단 체크박스용)
  const handleChecklistItemChange = async (uciId: number, checked: boolean) => {
    try {
      if (!checked || !latestChecklistId) {
        return;
      }
      
      // 인증 상태 확인
      if (!user?.userId) {
        console.error('사용자가 로그인되지 않음');
        alert('로그인이 필요합니다. 다시 로그인해주세요.');
        return;
      }
      
      // 체크된 항목 정보 가져오기
      console.log('체크리스트 항목 데이터:', checklistItemsData);
      const checkedItem = checklistItemsData.find(item => item.uciId === uciId);
      console.log('체크된 항목:', { uciId, checkedItem });
      
      if (!checkedItem) {
        console.error('체크된 항목을 찾을 수 없음:', uciId);
        return;
      }
      
      // 이미 완료된 항목인지 확인
      if (checkedItem.status === 'DONE') {
        return;
      }
      
      // 완료 확인 모달 표시
      setSelectedCompletionItem(checkedItem);
      setIsCompletionModalOpen(true);
      return;
      
    } catch (error) {
      console.error('체크리스트 항목 처리 중 오류 발생:', error);
      alert('처리 중 오류가 발생했습니다.');
    }
  };
  
  // 날짜 선택 시 해당 날짜의 체크리스트 항목 가져오기 또는 추가 모달 열기
  const handleDateSelect = async (date: Date, openModal: boolean = true) => {
    // 항상 현재 날짜 업데이트 (달력 이동용)
    setCurrentDate(date);
    

    
    // openModal이 false면 달력만 이동하고 모달은 열지 않음
    if (!openModal) {

      return;
    }
    
    if (!latestChecklistId) {

      return;
    }
    
    try {
      // 선택한 날짜의 YYYY-MM-DD 형식
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      

      
      // 모든 체크리스트 항목을 가져온 후 클라이언트에서 날짜 필터링
      const response = await api.get(`/user-checklists/${latestChecklistId}/items`, {
        params: {
          todoOnly: false
        }
      });
      
      
      
      // 해당 날짜에 체크리스트 항목이 없는 경우 빈 배열로 설정
      let allItems = Array.isArray(response.data) ? response.data : [];
      
      // 선택한 날짜와 일치하는 항목만 필터링 (dueDate의 날짜 부분만 비교)
      const filteredItems = allItems.filter(item => {
        if (!item.dueDate) return false;
        
        // dueDate에서 날짜 부분만 추출 (YYYY-MM-DD)
        const itemDateStr = item.dueDate.split('T')[0];
        

        
        // 날짜 문자열을 직접 비교 (YYYY-MM-DD 형식)
        // 이 방식이 더 안전하고 직관적임
        const isMatching = itemDateStr === dateStr;
        

        return isMatching;
      });
      

      
      // 선택한 날짜에 체크리스트 항목이 있는 경우: 기존 모달 열기
      if (filteredItems.length > 0) {
        setSelectedDate(date);
        setSelectedDateItems(filteredItems);
        setIsModalOpen(true);

      } else {
        // 선택한 날짜에 체크리스트 항목이 없는 경우: 체크리스트 추가 모달 열기

        
        // 선택한 날짜를 YYYY-MM-DD 형식으로 전달
        const selectedDateStr = `${year}-${month}-${day}`;
        
        try {
          const newItemData = await openChecklistAddModal(selectedDateStr);
          
                    if (newItemData) {
            // 기존 체크리스트 항목에서 linkedAmount 값 가져오기
            let linkedAmount = 0;
            if (checklistItemsData.length > 0) {
              // 첫 번째 항목의 linkedAmount 값을 사용 (모든 항목이 같은 값을 가짐)
              linkedAmount = checklistItemsData[0].linkedAmount || 0;
            }
            
            // 새로운 항목을 API로 추가
            if (latestChecklistId) {
              await api.post(`/user-checklists/${latestChecklistId}/items`, {
                title: newItemData.title,
                tag: newItemData.tag,
                dueDate: newItemData.dueDate,
                linkedAmount: linkedAmount, // 기존 항목의 linkedAmount 값 사용
                isFixed: newItemData.isFixed || true
              });
              
              // 체크리스트 항목 목록 새로고침
              await fetchChecklistItems();
              
              // 성공 메시지 표시
              alert('체크리스트 항목이 성공적으로 추가되었습니다!');
            }
          }
        } catch (error) {
          console.error('체크리스트 추가 모달에서 오류 발생:', error);
        }
      }
    } catch (error) {
      console.error('선택한 날짜의 체크리스트 항목을 가져오는 중 오류 발생:', error);
      // 오류 발생 시 빈 배열로 설정
      setSelectedDateItems([]);
      setSelectedDate(date);
      setIsModalOpen(true);
    }
  };

  // 모달창 닫기
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // 체크리스트 정보 표시용 함수들 (읽기 전용)
  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'TODO': return '미완료';
      case 'DOING': return '진행중';
      case 'DONE': return '완료';
      case 'SKIP': return '건너뜀';
      default: return '미완료';
    }
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'TODO': return 'statusTodo';
      case 'DOING': return 'statusDoing';
      case 'DONE': return 'statusDone';
      case 'SKIP': return 'statusSkip';
      default: return 'statusTodo';
    }
  };

  // 태그별로 아이템 그룹화 (카테고리별로 변환)
  const groupedItems = checklistItemsData.reduce((acc, item) => {
    const category = (() => {
      switch(item.tag) {
        case 'SAVING': return '저축';
        case 'DOCUMENT': return '서류';
        case 'EXCHANGE': return '환전';
        case 'INSURANCE': return '보험';
        case 'ETC': return '기타';
        default: return '기타';
      }
    })();
    
    if (!acc[category]) {
      acc[category] = [];
    }
    
    // UserChecklistItem을 ChecklistItem으로 변환
    const checklistItem: ChecklistItem = {
      uciId: item.uciId,
      title: item.title,
      tag: (item.tag || 'ETC') as "NONE" | "SAVING" | "EXCHANGE" | "INSURANCE" | "DOCUMENT" | "ETC",
      status: (item.status || 'TODO') as "TODO" | "DOING" | "DONE" | "SKIP",
      dueDate: item.dueDate || null,
      description: item.description || ""
    };
    
    acc[category].push(checklistItem);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  // 캘린더 이벤트 데이터 - 체크리스트 항목의 마감기한에 해당하는 날짜에 eventDot 표시
  const calendarEvents = useMemo(() => {
    const events: { date: Date; count: number }[] = [];
    

    
    // 디버깅용 로그 (필요시 주석 해제)
    // console.log('=== calendarEvents 계산 ===');
    // console.log('checklistItemsData:', checklistItemsData);
    
    // 날짜별 이벤트 중복 방지를 위한 Set (함수 전체에서 사용할 수 있도록 상단에 선언)
    const dateSet = new Set<string>();
    
    // 체크리스트 항목의 마감기한에 해당하는 날짜에 이벤트 추가
    if (checklistItemsData && checklistItemsData.length > 0) {
      
      checklistItemsData.forEach(item => {
        if (item.dueDate) {
          // 날짜 형식 변환
          // 날짜 형식이 "YYYY-MM-DD" 또는 "YYYY-MM-DDTHH:MM:SS.sssZ" 형식일 수 있음
          const dateStr = item.dueDate.split('T')[0]; // "YYYY-MM-DD" 부분만 추출
          
  
          
          // 이미 처리한 날짜인지 확인
          if (!dateSet.has(dateStr)) {
            dateSet.add(dateStr);
            
            // 날짜 문자열을 직접 Date 객체로 변환 (YYYY-MM-DD)
            // 이 방식은 문자열을 그대로 파싱하므로 월 값을 조정할 필요가 없음
            const dateObj = new Date(dateStr + 'T00:00:00');
            
            
            
            if (!isNaN(dateObj.getTime())) {
              events.push({
                date: dateObj,
                count: 1 // 하나의 점만 표시
              });
  
            }
          }
        }
      });
    }
    
    // 디버깅용: 오늘 날짜 확인 (실제로는 체크리스트 항목이 있을 때만 eventDot 표시해야 함)
    // const today = new Date();
    // const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    // console.log(`오늘 날짜: ${todayStr}, 원본: ${today.toISOString()}`);
    

    return events;
  }, [checklistItemsData]);

  // Calculate days remaining
  const today = new Date();
  let daysRemaining = 0;
  
  if (leaveDate) {
    // start_date는 "2025-09-12 15:00:00.000" 형태이므로 시간 정보 제거하고 날짜만 비교
    const targetDate = new Date(leaveDate);
    if (!isNaN(targetDate.getTime())) {
      // 오늘 날짜를 00:00:00으로 설정하여 시간 차이 제거
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      // 출국일을 00:00:00으로 설정하여 시간 차이 제거
      const targetDateStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
      
      // 오늘 - 출국일 (양수면 출국일이 과거, 음수면 출국일이 미래)
      daysRemaining = Math.ceil((todayStart.getTime() - targetDateStart.getTime()) / (1000 * 60 * 60 * 24));
    }
  }
  
  console.log('D-day 계산:', { 
    leaveDate, 
    daysRemaining, 
    today: today.toISOString(),
    todayStart: new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString()
  });

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
            <div className={styles.group} onClick={scrollToTipSection}>
              <div className={styles.textWrapper6}>01</div>
              <div className={styles.textWrapper5}>오늘의 팁</div>
            </div>
            <div className={styles.group2} onClick={scrollToCalendarSection}>
              <div className={styles.textWrapper6}>02</div>
              <div className={styles.textWrapper7}>달력</div>
            </div>
            <div className={styles.group3} onClick={scrollToChecklistViewSection}>
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
              <span className={styles.textWrapper4}>
                {leaveDate ? daysRemaining : '-'}
              </span>
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
              <span className={styles.textWrapper2}>%</span>
            </p>
          </div>

          {/* 진행률 바 */}
          <div className={styles.rectangleWrapper}>
            <div 
              className={styles.rectangle15}
              style={{ width: `${(completionPercentage / 100) * 100}%` }}
            />
          </div>
          {/* <img src={clouds} alt="" className={styles.union3} /> */}
        </div>

        {/* 오늘의 팁 섹션 */}
        <div ref={tipSectionRef} className={styles.frame}>
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
            date={new Date().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            }).replace(/\. /g, '. ').replace(/\.$/, '')}
            checklistItems={
              isLoading 
                ? [{ title: "로딩 중..." }] 
                : checklistItems.length > 0 
                  ? checklistItems
                  : [
                      { title: "비자 신청" },
                      { title: "항공권 예약" },
                      { title: "숙소 예약" }
                    ] // 데이터가 없을 경우 샘플 데이터 표시
            }
            onItemChange={handleChecklistItemChange}
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
        <div ref={calendarSectionRef} className={styles.calendarSection}>
          <div className={styles.calendarHeader}>
          <img src={underline} alt="" className={styles.calendarUnderline} />
            <div className={styles.calendarTitle}>달력</div>
          </div>
          <div className={styles.calendarContent}>
            <div className={styles.calendarRight}>
                <ModernCalendar
                  value={currentDate}
                  onChange={handleDateSelect}
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
                  {calendarItems.length > 0 ? (
                    calendarItems.slice(0, 3).map((item, index) => (
                      <div key={`calendar-item-${index}`} className={styles.tableRow}>
                        <div className={styles.categoryCell}>{item.category}</div>
                        <div className={styles.itemCell}>
                          {item.title}
                        </div>
                        <div className={styles.dateCell}>
                          <div className={styles.date}>{item.dueDate}</div>
                          <div className={styles.time}>D-{item.dDay}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.tableRow}>
                      <div className={styles.categoryCell}>-</div>
                      <div className={styles.itemCell}>확정된 일정이 없습니다</div>
                      <div className={styles.dateCell}>
                        <div className={styles.date}>-</div>
                        <div className={styles.time}>-</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.historyTable} style={{ marginTop: '40px' }}>
                <h3 className={styles.additionalTitle}>전체 체크리스트 (미완료 항목)</h3>
                <div className={styles.tableHeader}>
                  <div className={styles.headerCell}>구분</div>
                  <div className={styles.headerCell}>항목명</div>
                  <div className={styles.headerCell}>마감일</div>
                </div>
                
                <div className={styles.tableBody} style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {checklistItemsData.filter(item => item.status === 'TODO').length > 0 ? (
                    checklistItemsData.filter(item => item.status === 'TODO').map((item, index) => {
                      // D-day 계산
                      let dDay = 0;
                      if (item.dueDate) {
                        const today = new Date();
                        const dueDate = new Date(item.dueDate);
                        const timeDiff = dueDate.getTime() - today.getTime();
                        dDay = Math.ceil(timeDiff / (1000 * 3600 * 24));
                      }
                      
                      // 태그를 한글로 변환
                      let category = '기타';
                      switch(item.tag) {
                        case 'SAVING': category = '저축'; break;
                        case 'EXCHANGE': category = '환전'; break;
                        case 'INSURANCE': category = '보험'; break;
                        case 'DOCUMENT': category = '서류'; break;
                        case 'VISA': category = '비자'; break;
                        case 'FLIGHT': category = '항공'; break;
                        case 'ACCOMMODATION': category = '숙소'; break;
                        case 'ETC': category = '기타'; break;
                      }
                      
                      // 날짜 형식 변환
                      const formattedDate = item.dueDate 
                        ? new Date(item.dueDate).toLocaleDateString('ko-KR')
                        : '-';
                      
                      return (
                        <div 
                          key={`todo-checklist-item-${index}`} 
                          className={`${styles.tableRow} ${styles.clickableRow}`}
                          onClick={() => handleItemClick(item)}
                        >
                          <div className={styles.categoryCell}>{category}</div>
                          <div className={styles.itemCell}>
                            {item.title}
                          </div>
                          <div className={styles.dateCell}>
                            <div className={styles.date}>{formattedDate}</div>
                            <div className={styles.time}>D-{dDay}</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className={styles.tableRow}>
                      <div className={styles.categoryCell}>-</div>
                      <div className={styles.itemCell}>미완료 항목이 없습니다</div>
                      <div className={styles.dateCell}>
                        <div className={styles.date}>-</div>
                        <div className={styles.time}>-</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 체크리스트 전체보기 섹션 */}
        <div ref={checklistViewSectionRef} className={styles.checklistViewSection}>
          <div className={styles.viewSectionHeader}>
            <img src={underline} alt="" className={styles.viewSectionUnderline} />
            <div className={styles.viewSectionTitle}>세부내용</div>
          </div>
          
          <div className={styles.viewSectionContent}>
            <div className={styles.checklistInfo}>
              <div className={styles.checklistTitleDisplay}>
                <h3 className={styles.checklistTitleText}>{checklistTitle}</h3>
                <div className={styles.privacyStatus}>
                  {isPrivate ? '비공개' : '공개'}
                </div>
              </div>
            </div>
            
            <div className={styles.checklistItemsView}>
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className={styles.categoryGroup}>
                  <h4 className={styles.categoryTitle}>{category}</h4>
                  <div className={styles.itemsList}>
                    {items.map((item) => (
                      <div 
                        key={item.uciId} 
                        className={`${styles.itemRow} ${item.status === 'TODO' ? styles.clickableItem : ''}`}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className={styles.itemTitle}>{item.title}</div>
                        <div className={styles.itemStatus}>
                          {item.status === 'TODO' && (
                            <span 
                              className={`${styles.statusTodo} ${styles.clickableStatus}`} 
                              onClick={(e) => {
                                e.stopPropagation(); // 이벤트 버블링 방지
                                handleItemClick(item);
                              }}
                            >
                              미완료
                            </span>
                          )}
                          {item.status === 'DOING' && <span className={styles.statusDoing}>진행중</span>}
                          {item.status === 'DONE' && <span className={styles.statusDone}>완료</span>}
                          {item.status === 'SKIP' && <span className={styles.statusSkip}>건너뜀</span>}
                        </div>
                        <div className={styles.itemDueDate}>
                          {item.dueDate ? new Date(item.dueDate).toLocaleDateString('ko-KR') : '-'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* 체크리스트 항목 모달창 */}
      <ChecklistModal
        isOpen={isModalOpen}
        onClose={closeModal}
        date={selectedDate}
        checklistItems={selectedDateItems}
      />
      
      {/* 체크리스트 완료 확인 모달창 */}
      <ChecklistCompletionModal
        isOpen={isCompletionModalOpen}
        onClose={closeCompletionModal}
        onConfirm={handleCompleteItem}
        itemTitle={selectedCompletionItem?.title || ''}
        linkedAmount={selectedCompletionItem?.linkedAmount || 0}
        uciId={selectedCompletionItem?.uciId}
      />
    </div>
  );
}
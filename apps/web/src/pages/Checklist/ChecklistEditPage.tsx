// src/pages/Checklist/ChecklistEditPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./ChecklistPage.module.css";
import editStyles from "./ChecklistEdit.module.css";
import ChecklistEditor from "../../components/ChecklistEditor";
import { 
  getUserChecklistByDepartureId, 
  updateUserChecklist,
  getUserChecklistItems,
  addUserChecklistItem,
  patchUserChecklistItem,
  deleteUserChecklistItem,
  type AddChecklistItemResponse
} from "../../api/checklist";
import { getDeparturesByUserId } from "../../api/departure";
import openChecklistAddModal from "../../components/ChecklistAddModal/ChecklistAddModal";
import openChecklistAmountButton from "../../components/ChecklistAddModal/ChecklistAmountButton";

// 체크리스트 아이템 타입
interface ChecklistItem {
  uciId: number;
  title: string;
  tag: "NONE" | "SAVING" | "EXCHANGE" | "INSURANCE" | "DOCUMENT" | "ETC";
  status: "TODO" | "DOING" | "DONE" | "SKIP";
  dueDate: string | null;
  description?: string;
}

// 태그를 카테고리명으로 변환하는 매핑
const TAG_TO_CATEGORY: Record<string, string> = {
  "SAVING": "저축",
  "DOCUMENT": "서류", 
  "EXCHANGE": "환전",
  "INSURANCE": "보험",
  "ETC": "기타",
  "NONE": "기타"
};

// 카테고리를 태그로 변환하는 매핑
const CATEGORY_TO_TAG: Record<string, string> = {
  "저축": "SAVING",
  "서류": "DOCUMENT",
  "환전": "EXCHANGE", 
  "보험": "INSURANCE",
  "기타": "ETC"
};

export default function ChecklistEditPage() {
  const navigate = useNavigate();
  const { userChecklistId } = useParams<{ userChecklistId: string }>();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  

  const toggleSidebar = () => setIsSidebarOpen((p) => !p);

  // API에서 체크리스트 데이터를 가져오기
  useEffect(() => {
    const loadChecklist = async () => {
      try {
        setIsLoadingData(true);
        const userId = localStorage.getItem("userId");
        if (!userId) {
          navigate("/login", { replace: true });
          return;
        }

        // 1. 사용자의 출국 정보 조회 (status가 PLANNED인 것)
        const departures = await getDeparturesByUserId(Number(userId));
        const plannedDeparture = departures.find(d => d.status === "PLANNED");
        
        if (!plannedDeparture) {
          alert("계획된 출국 정보가 없습니다.");
          navigate("/checklist");
          return;
        }

        // 2. departureId로 체크리스트 조회
        const checklistData = await getUserChecklistByDepartureId(plannedDeparture.departureId);
        if (!checklistData) {
          alert("해당 출국 일정의 체크리스트를 찾을 수 없습니다.");
          navigate("/checklist", { replace: true });
          return;
        }
        setTitle(checklistData.title);
        setIsPrivate(checklistData.visibility === "PRIVATE");

        // 3. 체크리스트 아이템들 조회
        if (userChecklistId) {
          const itemsData = await getUserChecklistItems(Number(userChecklistId));
          // API 응답을 우리의 ChecklistItem 타입으로 변환
          const mappedItems: ChecklistItem[] = (itemsData || []).map((apiItem) => ({
            uciId: apiItem.uciId,
            title: apiItem.title,
            tag: (apiItem.tag || "NONE") as "NONE" | "SAVING" | "EXCHANGE" | "INSURANCE" | "DOCUMENT" | "ETC",
            status: (apiItem.status || "TODO") as "TODO" | "DOING" | "DONE" | "SKIP",
            dueDate: apiItem.dueDate || null,
            description: apiItem.description || ""
          }));
          setItems(mappedItems);
        }
      } catch (error) {
        console.error("Failed to load checklist:", error);
        alert("체크리스트를 불러오는데 실패했습니다.");
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadChecklist();
  }, [userChecklistId, navigate]);

  const togglePrivacy = () => {
    setIsPrivate(!isPrivate);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const addNewItem = async (category?: string) => {
    // 카테고리 + 버튼에서 호출된 경우 바로 항목 추가
    if (category) {
      try {
        if (!userChecklistId) return;
        
        const tag = CATEGORY_TO_TAG[category] || "ETC";
        const newItemData: AddChecklistItemResponse = await addUserChecklistItem(userChecklistId, {
          title: "새로운 항목",
          tag: tag as "NONE" | "SAVING" | "EXCHANGE" | "INSURANCE" | "DOCUMENT" | "ETC",
          linkedAmount: 0,
          isFixed: true
        });
        
        const newItem: ChecklistItem = {
          uciId: newItemData.uciId,
          title: newItemData.title,
          tag: newItemData.tag,
          status: newItemData.status,
          dueDate: newItemData.dueDate || null,
          description: newItemData.description || ""
        };
        
        setItems([...items, newItem]);
      } catch (error) {
        console.error("Failed to add new item:", error);
        alert("새 항목 추가에 실패했습니다.");
      }
    } else {
      // "추가" 버튼에서 호출된 경우 모달 열기
      try {
        const modalResult = await openChecklistAddModal();
        if (!modalResult || !userChecklistId) return;

        const newItemData: AddChecklistItemResponse = await addUserChecklistItem(userChecklistId, {
          title: modalResult.title,
          tag: modalResult.tag,
          dueDate: modalResult.dueDate,
          linkedAmount: modalResult.linkedAmount || 0,
          isFixed: modalResult.isFixed ?? true
        });
        
        const newItem: ChecklistItem = {
          uciId: newItemData.uciId,
          title: newItemData.title,
          tag: newItemData.tag,
          status: newItemData.status,
          dueDate: newItemData.dueDate || null,
          description: newItemData.description || ""
        };
        
        setItems([...items, newItem]);
      } catch (error) {
        console.error("Failed to add new item:", error);
        alert("새 항목 추가에 실패했습니다.");
      }
    }
  };

  const updateItemName = async (uciId: number, newName: string) => {
    try {
      await patchUserChecklistItem(uciId, { title: newName });
      
      setItems(items.map(item =>
        item.uciId === uciId ? { ...item, title: newName } : item
      ));
    } catch (error) {
      console.error("Failed to update item name:", error);
      // 사용자 경험을 위해 로컬 상태는 즉시 업데이트하되, 에러 시 되돌리기
      setItems(items.map(item =>
        item.uciId === uciId ? { ...item, title: newName } : item
      ));
    }
  };

  const deleteItem = async (uciId: number) => {
    try {
      await deleteUserChecklistItem(uciId);
      setItems(items.filter(item => item.uciId !== uciId));
    } catch (error) {
      console.error("Failed to delete item:", error);
      alert("항목 삭제에 실패했습니다.");
    }
  };

  const handleSave = async () => {
    if (!userChecklistId) return;
    
    setIsLoading(true);
    try {
      // 체크리스트 제목과 공개 설정 업데이트
      await updateUserChecklist(userChecklistId, {
        title,
        visibility: isPrivate ? "PRIVATE" : "PUBLIC"
      });
      
      // SavingsPlanPage로 이동
      navigate(`/savings/plan`, {
        state: { 
          justUpdated: true,
          checklistId: userChecklistId,
          checklistTitle: title
        },
      });
    } catch (error) {
      console.error("Failed to save checklist:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // const handleCancel = () => {
  //   navigate(-1);
  // };

  // 로딩 중인 경우
  if (isLoadingData) {
    return (
      <div className={styles.container}>
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
        <main className={styles.main}>
          <Header />
          <div className={styles.pageContent}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: '400px',
              fontSize: '18px',
              color: '#666'
            }}>
              체크리스트를 불러오는 중...
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 태그별로 아이템 그룹화 (카테고리별로 변환)
  const groupedItems = items.reduce((acc, item) => {
    const category = TAG_TO_CATEGORY[item.tag] || "Etc";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, ChecklistItem[]>);

  return (
    <div className={editStyles.outer}>
      <div className={styles.container}>
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

        <main className={styles.main}>
          <Header />
          <div className={styles.pageContent}>
          <header className={styles.heroWrap}>
            <p className={styles.subtitle}>체크리스트를 수정하세요!</p>
            <h1 className={styles.hero}>헤이 - 체크</h1>
          </header>

          <ChecklistEditor
            isPrivate={isPrivate}
            title={title}
            groupedItems={groupedItems}
            isLoading={isLoading}
            togglePrivacy={togglePrivacy}
            handleTitleChange={handleTitleChange}
            addNewItem={addNewItem}
            updateItemName={updateItemName}
            deleteItem={deleteItem}
            handleSave={handleSave}
          />
          </div>
        </main>
      </div>
    </div>
  );
}

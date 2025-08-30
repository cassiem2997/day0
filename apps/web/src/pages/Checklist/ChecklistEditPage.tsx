import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./ChecklistPage.module.css";
import editStyles from "./ChecklistEdit.module.css";
import ChecklistEditor from "../../components/ChecklistEditor";

import { 
  updateUserChecklist,
  getUserChecklistItems,
  addUserChecklistItem,
  patchUserChecklistItem,
  deleteUserChecklistItem,
  getUserChecklist,
  type AddChecklistItemResponse,
} from "../../api/checklist";
import { me } from "../../api/user";
import AIChecklistModal from "../../components/ChecklistAddModal/AIChecklistModal";

interface ChecklistItem {
  uciId: number;
  title: string;
  tag: "NONE" | "SAVING" | "EXCHANGE" | "INSURANCE" | "DOCUMENT" | "ETC";
  status: "TODO" | "DOING" | "DONE" | "SKIP";
  dueDate: string | null;
  description?: string;
}

const TAG_TO_CATEGORY: Record<string, string> = {
  SAVING: "저축",
  DOCUMENT: "서류",
  EXCHANGE: "환전",
  INSURANCE: "보험",
  ETC: "기타",
  NONE: "기타",
};

const CATEGORY_TO_TAG: Record<string, string> = {
  저축: "SAVING",
  서류: "DOCUMENT",
  환전: "EXCHANGE",
  보험: "INSURANCE",
  기타: "ETC",
};

// AI 추천 테스트용 더미 데이터
const DUMMY_MISSING_ITEMS = [
  {
    item_title: "여행자보험 가입",
    item_description: "해외여행 시 필수 보험 가입",
    item_tag: "INSURANCE",
    popularity_rate: 95,
    avg_offset_days: -7,
    priority_score: 8.5,
    missing_reason: "안전한 여행을 위한 보험",
    confidence_score: 0.9
  },
  {
    item_title: "환전 카드 발급",
    item_description: "해외 사용 가능한 신용카드 준비",
    item_tag: "EXCHANGE",
    popularity_rate: 88,
    avg_offset_days: -3,
    priority_score: 7.8,
    missing_reason: "현지 통화 사용 편의성",
    confidence_score: 0.85
  },
  {
    item_title: "여권 사본 준비",
    item_description: "여권 정보 복사본 제작",
    item_tag: "DOCUMENT",
    popularity_rate: 92,
    avg_offset_days: -5,
    priority_score: 8.2,
    missing_reason: "분실 시 대비",
    confidence_score: 0.88
  },
  {
    item_title: "비상금 준비",
    item_description: "현금 및 비상용 자금 마련",
    item_tag: "SAVING",
    popularity_rate: 85,
    avg_offset_days: -2,
    priority_score: 7.5,
    missing_reason: "긴급 상황 대비",
    confidence_score: 0.82
  }
];

export default function ChecklistEditPage() {
  const navigate = useNavigate();
  const { userChecklistId } = useParams<{ userChecklistId: string }>();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((p) => !p);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const profile = await me();
        if (!alive) return;
        if (!profile?.userId) {
          navigate("/login", { replace: true });
          return;
        }
        if (!userChecklistId) {
          navigate("/checklist/current", { replace: true });
          return;
        }

        setIsLoadingData(true);

        const chk = await getUserChecklist(Number(userChecklistId));
        if (!alive) return;

        setTitle(chk?.title ?? "");
        setIsPrivate((chk?.visibility ?? "PRIVATE") === "PRIVATE");

        const itemsData = await getUserChecklistItems(Number(userChecklistId));
        if (!alive) return;

        const mapped: ChecklistItem[] = (itemsData || []).map((x: any) => ({
          uciId: x.uciId,
          title: x.title,
          tag: (x.tag || "NONE") as ChecklistItem["tag"],
          status: (x.status || "TODO") as ChecklistItem["status"],
          dueDate: x.dueDate || null,
          description: x.description || "",
        }));
        setItems(mapped);
      } catch (e) {
        alert("체크리스트를 불러오는데 실패했습니다.");
      } finally {
        if (alive) setIsLoadingData(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [userChecklistId, navigate]);

  const togglePrivacy = () => {
    setIsPrivate(!isPrivate);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const addNewItem = async (category?: string) => {
    try {
      if (!userChecklistId) return;

      if (category) {
        const tag = CATEGORY_TO_TAG[category] || "ETC";
        const created: AddChecklistItemResponse = await addUserChecklistItem(
          userChecklistId,
          {
            title: "새로운 항목",
            tag: tag as ChecklistItem["tag"],
            linkedAmount: 0,
            isFixed: true,
          }
        );
        const next: ChecklistItem = {
          uciId: created.uciId,
          title: created.title,
          tag: created.tag,
          status: created.status,
          dueDate: created.dueDate || null,
          description: created.description || "",
        };
        setItems((prev) => [...prev, next]);
        return;
      }

      const modal = await (
        await import("../../components/ChecklistAddModal/ChecklistAddModal")
      ).default();
      const modalResult = await modal;
      if (!modalResult) return;

      const created: AddChecklistItemResponse = await addUserChecklistItem(
        userChecklistId,
        {
          title: modalResult.title,
          tag: modalResult.tag,
          dueDate: modalResult.dueDate,
          linkedAmount: modalResult.linkedAmount || 0,
          isFixed: modalResult.isFixed ?? true,
        }
      );

      const next: ChecklistItem = {
        uciId: created.uciId,
        title: created.title,
        tag: created.tag,
        status: created.status,
        dueDate: created.dueDate || null,
        description: created.description || "",
      };
      setItems((prev) => [...prev, next]);
    } catch {
      alert("새 항목 추가에 실패했습니다.");
    }
  };

  const updateItemName = async (uciId: number, newName: string) => {
    try {
      await patchUserChecklistItem(uciId, { title: newName });
      setItems((prev) =>
        prev.map((it) => (it.uciId === uciId ? { ...it, title: newName } : it))
      );
    } catch {
      setItems((prev) =>
        prev.map((it) => (it.uciId === uciId ? { ...it, title: newName } : it))
      );
    }
  };

  const deleteItem = async (uciId: number) => {
    try {
      await deleteUserChecklistItem(uciId);
      setItems((prev) => prev.filter((it) => it.uciId !== uciId));
    } catch {
      alert("항목 삭제에 실패했습니다.");
    }
  };

  const handleSave = async () => {
    if (!userChecklistId) return;
    setIsLoading(true);
    try {
      await updateUserChecklist(userChecklistId, {
        title,
        visibility: isPrivate ? "PRIVATE" : "PUBLIC",
      });
      navigate(`/savings/plan`, {
        state: {
          justUpdated: true,
          checklistId: userChecklistId,
          checklistTitle: title,
        },
      });
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const openAIModal = () => {
    setIsAIModalOpen(true);
  };

  const closeAIModal = () => {
    setIsAIModalOpen(false);
  };

  const handleAIConfirm = async () => {
    if (!userChecklistId) return;
    
    setIsAIModalOpen(false);
    setIsLoading(true);
    
    try {
      // 실제 API 호출 대신 더미 데이터 사용 (테스트용)
      // const missingItemsResponse = await getMissingItems(userChecklistId, userId);
      
      // 더미 데이터로 테스트
      const missingItemsResponse = {
        missing_items: DUMMY_MISSING_ITEMS,
        total_missing: DUMMY_MISSING_ITEMS.length,
        recommendation_summary: "AI가 추천하는 체크리스트 항목들입니다."
      };
      
      if (missingItemsResponse.total_missing > 0) {
        // 누락된 아이템들을 체크리스트에 추가
        for (const item of missingItemsResponse.missing_items) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + Math.abs(item.avg_offset_days));
          
          await addUserChecklistItem(userChecklistId, {
            title: item.item_title,
            tag: item.item_tag as ChecklistItem["tag"],
            linkedAmount: 0,
            isFixed: false,
          });
        }
        
        alert(`${missingItemsResponse.total_missing}개가 추가되었습니다.`);
        
        // 아이템 목록 새로고침
        const itemsData = await getUserChecklistItems(Number(userChecklistId));
        const mapped: ChecklistItem[] = (itemsData || []).map((x: any) => ({
          uciId: x.uciId,
          title: x.title,
          tag: (x.tag || "NONE") as ChecklistItem["tag"],
          status: (x.status || "TODO") as ChecklistItem["status"],
          dueDate: x.dueDate || null,
          description: x.description || "",
        }));
        setItems(mapped);
      } else {
        alert("추가할 수 있는 아이템이 없습니다.");
      }
    } catch (error) {
      console.error("AI 추천 처리 중 오류:", error);
      alert("AI 추천 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

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
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "400px",
                fontSize: "18px",
                color: "#666",
              }}
            >
              체크리스트를 불러오는 중...
            </div>
          </div>
        </main>
      </div>
    );
  }

  const groupedItems = items.reduce((acc, item) => {
    const category = TAG_TO_CATEGORY[item.tag] || "Etc";
    if (!acc[category]) acc[category] = [];
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
            onAIRecommend={openAIModal}
          />
          </div>
        </main>
      </div>
      
      <AIChecklistModal
        isOpen={isAIModalOpen}
        onClose={closeAIModal}
        onConfirm={handleAIConfirm}
      />
    </div>
  );
}

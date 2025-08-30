import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./ChecklistPage.module.css";
import editStyles from "./ChecklistEdit.module.css";
import ChecklistEditor from "../../components/ChecklistEditor";
import { getCookie, setCookie } from "../../utils/cookieUtils";
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
          />
          </div>
        </main>
      </div>
    </div>
  );
}

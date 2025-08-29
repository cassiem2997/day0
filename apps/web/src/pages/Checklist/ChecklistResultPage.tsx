// src/pages/Checklist/ChecklistResultPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./ChecklistPage.module.css";
import {
  getUserChecklist,
  getUserChecklistItems,
  addUserChecklistItem,
  patchUserChecklistItem,
  deleteUserChecklistItem,
} from "../../api/checklist";

type Item = {
  uciId: number;
  title: string;
  description?: string;
  tag: "NONE" | "SAVING" | "EXCHANGE" | "INSURANCE" | "DOCUMENT" | "ETC";
  status: "TODO" | "DOING" | "DONE" | "SKIP";
};

const tagColors = {
  DOCUMENT: "#FF6B6B",
  EXCHANGE: "#4ECDC4", 
  INSURANCE: "#45B7D1",
  SAVING: "#96CEB4",
  ETC: "#FECA57",
  NONE: "#95A5A6"
};

const tagLabels = {
  DOCUMENT: "서류",
  EXCHANGE: "환전",
  INSURANCE: "보험",
  SAVING: "적금",
  ETC: "기타",
  NONE: "기타"
};

export default function ChecklistResultPage() {
  const { checklistId } = useParams<{ checklistId: string }>();
  const navigate = useNavigate();

  const id = useMemo(() => Number(checklistId), [checklistId]);

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("체크리스트");
  const [items, setItems] = useState<Item[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTag, setNewTag] = useState<Item["tag"]>("NONE");

  const toggleSidebar = () => setIsSidebarOpen((p) => !p);

  useEffect(() => {
    if (!Number.isFinite(id)) {
      navigate("/checklist");
      return;
    }
    (async () => {
      try {
        const [list, listItems] = await Promise.all([
          getUserChecklist(id),
          getUserChecklistItems(id),
        ]);
        console.log('API Response - list:', list);
        console.log('API Response - listItems:', listItems);
        setTitle(list?.title ?? "체크리스트");
        setItems(
          (listItems ?? []).map((it: any) => ({
            uciId: it.uciId ?? it.id,
            title: it.title,
            description: it.description,
            tag: it.tag ?? "NONE",
            status: it.status ?? "TODO",
          }))
        );
      } catch (e) {
        console.error(e);
        alert("체크리스트를 불러오지 못했습니다.");
        navigate("/checklist");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  const completedCount = items.filter(item => item.status === "DONE").length;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleDone = async (item: Item) => {
    const next = item.status === "DONE" ? "TODO" : "DONE";
    try {
      await patchUserChecklistItem(item.uciId, { status: next });
      setItems((prev) =>
        prev.map((it) =>
          it.uciId === item.uciId ? { ...it, status: next } : it
        )
      );
    } catch (e) {
      console.error(e);
      alert("상태 변경 실패");
    }
  };

  const remove = async (uciId: number) => {
    if (!confirm("삭제할까요?")) return;
    try {
      await deleteUserChecklistItem(uciId);
      setItems((prev) => prev.filter((it) => it.uciId !== uciId));
    } catch (e) {
      console.error(e);
      alert("삭제 실패");
    }
  };

  const add = async () => {
    if (!newTitle.trim()) return alert("항목명을 입력하세요.");
    try {
      const created = await addUserChecklistItem(id, {
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        tag: newTag,
      });
      
      // API 응답 구조를 안전하게 처리
      const uciId = created?.uciId;
      if (!uciId) {
        throw new Error("생성된 항목의 ID를 가져올 수 없습니다.");
      }
      
      const appended: Item = {
        uciId: uciId,
        title: created?.title ?? newTitle.trim(),
        description: created?.description,
        tag: created?.tag ?? newTag,
        status: created?.status ?? "TODO",
      };
      
      setItems((prev) => [appended, ...prev]);
      setNewTitle("");
      setNewDesc("");
      setNewTag("NONE");
    } catch (e) {
      console.error("항목 추가 실패:", e);
      alert("추가 실패");
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
        <main className={styles.main}>
          <Header />
          <div className={styles.pageContent}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '50vh',
              fontSize: '1.125rem',
              color: '#64748b'
            }}>
              체크리스트를 불러오는 중...
            </div>
          </div>
        </main>
      </div>
    );
  }

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
          {/* Page Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <button 
                onClick={() => navigate('/checklist')}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#64748b',
                  marginBottom: '0.5rem'
                }}
              >
                ← 뒤로가기
              </button>
              <h1 style={{ 
                margin: 0, 
                fontSize: 'clamp(1.5rem, 3vw, 2rem)', 
                fontWeight: '700',
                color: '#1e293b'
              }}>
                {title}
              </h1>
            </div>
            
            <button
              onClick={() => setEditMode(!editMode)}
              style={{
                backgroundColor: editMode ? '#ef4444' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                minWidth: '100px'
              }}
            >
              {editMode ? '완료' : '편집'}
            </button>
          </div>

          {/* Progress Card */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: '2rem',
              alignItems: 'center'
            }}>
              <div>
                <h2 style={{ 
                  margin: '0 0 1rem 0', 
                  fontSize: '1.25rem', 
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  진행 상황
                </h2>
                <div style={{
                  height: '8px',
                  backgroundColor: '#f1f5f9',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  marginBottom: '0.75rem'
                }}>
                  <div style={{
                    width: `${progressPercentage}%`,
                    height: '100%',
                    backgroundColor: '#10b981',
                    borderRadius: '4px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <p style={{
                  margin: 0,
                  fontSize: '0.875rem',
                  color: '#64748b'
                }}>
                  {completedCount}개 완료 / 총 {totalCount}개 ({progressPercentage}%)
                </p>
              </div>
              
              <div style={{
                textAlign: 'center',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                minWidth: '100px'
              }}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '700',
                  color: '#10b981',
                  marginBottom: '0.25rem'
                }}>
                  {progressPercentage}%
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#64748b'
                }}>
                  완료율
                </div>
              </div>
            </div>
          </div>

          {/* Add Item Form */}
          {editMode && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '2rem',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
              border: '1px solid #f1f5f9'
            }}>
              <h3 style={{
                margin: '0 0 1.5rem 0',
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#1e293b'
              }}>
                새 항목 추가
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr',
                gap: '1rem'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr auto',
                  gap: '1rem',
                  alignItems: 'end'
                }}>
                  <input
                    placeholder="할 일을 입력하세요"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={{
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      outline: 'none'
                    }}
                  />
                  <select
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value as Item["tag"])}
                    style={{
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      backgroundColor: 'white'
                    }}
                  >
                    <option value="DOCUMENT">서류</option>
                    <option value="EXCHANGE">환전</option>
                    <option value="INSURANCE">보험</option>
                    <option value="SAVING">적금</option>
                    <option value="ETC">기타</option>
                  </select>
                  <button
                    onClick={add}
                    style={{
                      backgroundColor: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.75rem 1.5rem',
                      cursor: 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    추가
                  </button>
                </div>
                
                <textarea
                  placeholder="상세 설명 (선택사항)"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              </div>
            </div>
          )}

          {/* Checklist Items */}
          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            {items.map((item) => (
              <div
                key={item.uciId}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  boxShadow: '0 1px 6px rgba(0, 0, 0, 0.06)',
                  border: item.status === 'DONE' ? '2px solid #10b981' : '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Checkbox */}
                <div
                  onClick={() => toggleDone(item)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '4px',
                    border: item.status === 'DONE' ? 'none' : '2px solid #d1d5db',
                    backgroundColor: item.status === 'DONE' ? '#10b981' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  {item.status === 'DONE' && (
                    <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                      ✓
                    </span>
                  )}
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem'
                  }}>
                    <div style={{
                      backgroundColor: tagColors[item.tag],
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      textTransform: 'uppercase'
                    }}>
                      {tagLabels[item.tag]}
                    </div>
                    {editMode && (
                      <button
                        onClick={() => remove(item.uciId)}
                        style={{
                          backgroundColor: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          cursor: 'pointer',
                          fontSize: '0.75rem'
                        }}
                      >
                        삭제
                      </button>
                    )}
                  </div>

                  <h4 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: item.status === 'DONE' ? '#64748b' : '#1e293b',
                    textDecoration: item.status === 'DONE' ? 'line-through' : 'none'
                  }}>
                    {item.title}
                  </h4>

                  {item.description && (
                    <p style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      color: '#64748b',
                      lineHeight: '1.5'
                    }}>
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {items.length === 0 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '3rem 2rem',
              textAlign: 'center',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
              border: '1px solid #f1f5f9'
            }}>
              <h3 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#64748b'
              }}>
                체크리스트가 비어있습니다
              </h3>
              <p style={{
                margin: '0',
                fontSize: '1rem',
                color: '#94a3b8'
              }}>
                편집 버튼을 클릭하여 새로운 할 일을 추가해보세요
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCommunityPosts } from "../../api/community";
import { getUserChecklistItems, collectChecklistItem } from "../../api/checklist";
import styles from "./CommunityPage.module.css";

export default function CommunityBest() {
  const [bestPosts, setBestPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 체크리스트 관련 상태 추가
  const [selectedChecklist, setSelectedChecklist] = useState<{
    checklist: any;
    items: any[];
  } | null>(null);
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(false);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

  // 체크리스트 클릭 핸들러
  const handleChecklistClick = async (checklistItem: any, e: React.MouseEvent) => {
    e.preventDefault(); // Link의 기본 동작 방지
    
    if (selectedChecklist?.checklist?.postId === checklistItem.postId) {
      // 이미 선택된 체크리스트라면 토글
      setIsChecklistExpanded(!isChecklistExpanded);
      return;
    }

    setIsLoadingChecklist(true);
    setSelectedItems(new Set()); // 새로운 체크리스트를 열 때 선택된 항목 초기화
    try {
      // 체크리스트 항목들을 가져오기
      // postId를 userChecklistId로 사용 (임시)
      const itemsData = await getUserChecklistItems(checklistItem.postId);

      setSelectedChecklist({
        checklist: checklistItem,
        items: itemsData
      });
      setIsChecklistExpanded(true);
    } catch (error) {
      console.error('체크리스트 정보를 가져오는데 실패했습니다:', error);
    } finally {
      setIsLoadingChecklist(false);
    }
  };

  // 체크박스 변경 핸들러
  const handleItemCheckboxChange = (itemId: number, checked: boolean) => {
    const newSelectedItems = new Set(selectedItems);
    if (checked) {
      newSelectedItems.add(itemId);
    } else {
      newSelectedItems.delete(itemId);
    }
    setSelectedItems(newSelectedItems);
  };

  // Save 버튼 클릭 핸들러 - API 호출 포함
  const handleSaveClick = async () => {
    if (selectedItems.size === 0) {
      alert('저장할 항목을 선택해주세요.');
      return;
    }

    try {
      // 임시로 하드코딩된 체크리스트 ID 사용 (403 에러 방지)
      // TODO: 실제 구현에서는 사용자 인증 후 체크리스트 ID를 가져와야 함
      const myChecklistId = 1; // 임시 체크리스트 ID
      
      // 선택된 각 항목을 수집 API로 전송
      const selectedItemIds = Array.from(selectedItems);
      const promises = selectedItemIds.map(async (sourceItemId) => {
        // userId는 현재 로그인한 사용자의 ID (임시로 1로 설정)
        const userId = 1; // TODO: 실제 사용자 ID로 변경
        return collectChecklistItem(myChecklistId, userId, sourceItemId);
      });

      await Promise.all(promises);
      
      alert(`${selectedItems.size}개의 항목이 성공적으로 저장되었습니다.`);
      setIsChecklistExpanded(false);
      setSelectedItems(new Set());
      
    } catch (error) {
      console.error('항목 저장에 실패했습니다:', error);
      alert('항목 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
              try {
          // API 호출을 더 간단하게 시도
          const res = await getCommunityPosts({ page: 0, size: 10 });
          console.log('API 응답:', res); // 디버깅용 로그
          if (mounted) {
            // 응답 구조에 따라 데이터 설정
            if (res && res.success && res.data && res.data.content && Array.isArray(res.data.content)) {
              console.log('res.data.content 사용:', res.data.content);
              setBestPosts(res.data.content);
            } else if (res && res.data && Array.isArray(res.data)) {
              console.log('res.data 직접 사용:', res.data);
              setBestPosts(res.data);
            } else if (res && Array.isArray(res)) {
              console.log('res 직접 사용:', res);
              setBestPosts(res);
            } else {
              console.log('API 응답 구조가 예상과 다름:', res);
              setBestPosts([]);
            }
          }
        } catch (err) {
          console.error("popular-top fetch error", err);
          if (mounted) {
            setBestPosts([]);
          }
        } finally {
          if (mounted) setLoading(false);
        }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.stack}>
        <article className={styles.postCard}>
          <header className={styles.postHead}>
            <h2 className={styles.postTitle}>
              <span className={styles.titleLink}>불러오는 중…</span>
            </h2>
            <button type="button" className={styles.saveBtn}>
              save
            </button>
          </header>
          <div className={styles.metaRow}>
            <span className={styles.badgeCheck} aria-hidden="true">
              ✓
            </span>
            <span className={styles.countText}>
              0 <span className={styles.slash}>/</span> 0
            </span>
            <span className={styles.star} aria-hidden="true">
              ★
            </span>
            <span className={styles.countText}>0</span>
            <span className={styles.by}>by</span>
            <span className={styles.author}>…</span>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className={styles.stack}>
      {Array.isArray(bestPosts) && bestPosts.map((it, idx) => (
        <article key={it.id} className={styles.postCard}>
          <header className={styles.postHead}>
            <h2 className={styles.postTitle}>
              <Link 
                to={`/community/${it.postId}`} 
                className={styles.titleLink}
                onClick={(e) => handleChecklistClick(it, e)}
              >
                {it.title}
              </Link>
            </h2>
            <button type="button" className={styles.saveBtn}>
              save
            </button>
          </header>

          <div className={styles.metaRow}>
            <span className={styles.badgeCheck} aria-hidden="true">
              ✓
            </span>
            <span className={styles.countText}>
              체크리스트
            </span>

            <span className={styles.star} aria-hidden="true">
              ★
            </span>
            <span className={styles.countText}>{it.likeCount || 0}</span>

            <span className={styles.by}>by</span>
            <span className={styles.author}>{it.authorNickname || "사용자"}</span>
          </div>

          {idx === 0 ? <div className={styles.rowDivider} /> : null}
        </article>
      ))}
              {Array.isArray(bestPosts) && bestPosts.length === 0 && (
          <div className={styles.emptyNotice}>표시할 항목이 없습니다.</div>
        )}

        {/* 체크리스트 상세보기 모달 */}
        {isChecklistExpanded && selectedChecklist && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>체크리스트 상세보기</h2>
                <button className={styles.closeButton} onClick={() => setIsChecklistExpanded(false)}>×</button>
              </div>
              <div className={styles.modalBody}>
                {isLoadingChecklist ? (
                  <div className={styles.loadingMessage}>체크리스트 정보를 불러오는 중...</div>
                ) : (
                  <>
                    <div className={styles.checklistInfo}>
                      <div className={styles.checklistTitleDisplay}>
                        <h3 className={styles.checklistTitleText}>{selectedChecklist.checklist.title}</h3>
                        <div className={styles.privacyStatus}>
                          공개
                        </div>
                      </div>
                    </div>
                    
                    {/* 선택된 항목 정보 */}
                    {selectedItems.size > 0 && (
                      <div className={styles.selectedItemsInfo}>
                        <div className={styles.selectedItemsTitle}>
                          선택된 항목 ({selectedItems.size}개)
                        </div>
                        <div className={styles.selectedItemsList}>
                          {Array.from(selectedItems).map((itemId) => {
                            const item = selectedChecklist.items.find(i => i.uciId === itemId);
                            return item ? (
                              <span key={itemId} className={styles.selectedItemTag}>
                                {item.title}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                    
                    <div className={styles.checklistItemsView}>
                      {selectedChecklist.items.length > 0 ? (
                        selectedChecklist.items.map((item: any) => (
                          <div key={item.uciId} className={styles.itemRow}>
                            <div className={styles.itemCheckbox}>
                              <input
                                type="checkbox"
                                className={styles.checkbox}
                                checked={selectedItems.has(item.uciId)}
                                onChange={(e) => handleItemCheckboxChange(item.uciId, e.target.checked)}
                              />
                              <div className={styles.itemTitle}>{item.title}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className={styles.noItemsMessage}>체크리스트 항목이 없습니다.</div>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.modalSaveBtn} onClick={handleSaveClick}>
                  Save ({selectedItems.size})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

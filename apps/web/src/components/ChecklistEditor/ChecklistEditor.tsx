import React from "react";
import styles from "./ChecklistEditor.module.css";

interface ChecklistItem {
  uciId: number;
  title: string;
  tag: "NONE" | "SAVING" | "EXCHANGE" | "INSURANCE" | "DOCUMENT" | "ETC";
  status: "TODO" | "DOING" | "DONE" | "SKIP";
  dueDate: string | null;
  description?: string;
}

interface ChecklistEditorProps {
  isPrivate: boolean;
  title: string;
  groupedItems: Record<string, ChecklistItem[]>;
  isLoading: boolean;
  togglePrivacy: () => void;
  handleTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  addNewItem: (category?: string) => void;
  updateItemName: (uciId: number, newName: string) => void;
  deleteItem: (uciId: number) => void;
  handleSave: () => void;
}

const ChecklistEditor: React.FC<ChecklistEditorProps> = ({
  isPrivate,
  title,
  groupedItems,
  isLoading,
  togglePrivacy,
  handleTitleChange,
  addNewItem,
  updateItemName,
  deleteItem,
  handleSave
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button 
          className={`${styles.privacyButton} ${isPrivate ? styles.private : styles.public}`}
          onClick={togglePrivacy}
          type="button"
        >
          {isPrivate ? "Private" : "Public"}
        </button>
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          className={styles.titleInput}
          placeholder="체크리스트 제목을 입력하세요"
        />
      </div>

      <div className={styles.content}>
        <div className={styles.tableHeader}>
          <div className={styles.categoryColumn}>구분</div>
          <div className={styles.nameColumn}>항목명</div>
          <div className={styles.statusColumn}>삭제</div>
        </div>

        {Object.keys(groupedItems).length === 0 ? (
          <div className={styles.categorySection}>
            <div className={styles.categoryHeader}>
              <div className={styles.categoryCell}>
                <span className={styles.categoryLabel}>기타</span>
                <button
                  className={styles.addCategoryButton}
                  onClick={() => addNewItem("기타")}
                  type="button"
                  title="기타에 새 항목 추가"
                >
                  +
                </button>
              </div>
            </div>
            <div style={{
              padding: '40px 20px',
              textAlign: 'center' as const,
              color: '#999',
              fontSize: '16px'
            }}>
              체크리스트 항목이 없습니다. 위의 + 버튼을 눌러 항목을 추가해보세요.
            </div>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className={styles.categorySection}>
              <div className={styles.categoryHeader}>
                <div className={styles.categoryCell}>
                  <span className={styles.categoryLabel}>{category}</span>
                </div>
              </div>
              {categoryItems.map((item) => (
                <div key={item.uciId} className={styles.itemRow}>
                  <div className={styles.nameCell}>
                    <input
                      key={`item-${item.uciId}`}
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItemName(item.uciId, e.target.value)}
                      className={styles.nameInput}
                    />
                  </div>
                  <div className={styles.statusCell}>
                    <button
                      className={styles.deleteItemButton}
                      onClick={() => deleteItem(item.uciId)}
                      type="button"
                      title="항목 삭제"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.saveButton}
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? "저장 중..." : "저장하기"}
        </button>
        <button
          type="button"
          className={styles.addBottomButton}
          onClick={() => addNewItem()}
          title="새 항목 추가"
        >
          추가
        </button>
      </div>
    </div>
  );
};

export default ChecklistEditor;

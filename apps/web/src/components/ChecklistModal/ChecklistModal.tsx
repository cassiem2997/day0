import React from 'react';
import styles from './ChecklistModal.module.css';

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

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  checklistItems: UserChecklistItem[];
}

const ChecklistModal: React.FC<ChecklistModalProps> = ({ isOpen, onClose, date, checklistItems }) => {

  
  if (!isOpen || !date) return null;

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일`;
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{formatDate(date)} 체크리스트</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.modalBody}>
          {checklistItems.length > 0 ? (
            <ul className={styles.checklistItems}>
              {checklistItems.map((item, index) => {
        
                return (
                  <li key={item.uciId} className={styles.checklistItem}>
                    <div className={styles.itemTitle}>{item.title}</div>
                    {item.description && (
                      <div className={styles.itemDescription}>{item.description}</div>
                    )}
                    <div className={styles.itemInfo}>
                      <span className={styles.itemTag}>{item.tag}</span>
                      <span className={styles.itemStatus}>{item.status === 'TODO' ? '미완료' : '완료'}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className={styles.noItems}>이 날짜에 체크리스트 항목이 없습니다.</div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.closeButton} onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistModal;

import React from 'react';
import styles from './ChecklistCompletionModal.module.css';

interface ChecklistCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemTitle: string;
  linkedAmount?: number;
  uciId?: number;
}

const ChecklistCompletionModal: React.FC<ChecklistCompletionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemTitle,
  linkedAmount = 0,
  uciId
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>체크리스트 완료 확인</h3>
        </div>
        
        <div className={styles.modalBody}>
          <p className={styles.confirmationText}>
            <strong>"{itemTitle}"</strong> 항목을 완료하셨나요?
          </p>
          
          {linkedAmount > 0 && (
            <div className={styles.linkedAmountInfo}>
              <p>연결된 미션적금 금액: <strong>{linkedAmount.toLocaleString()}원</strong></p>
              <p className={styles.amountNote}>
                완료 시 해당 금액이 출금되어 계좌로 입금됩니다.
              </p>
            </div>
          )}
        </div>
        
        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={onClose}>
            취소
          </button>
          <button 
            className={styles.confirmButton} 
            onClick={() => {
              console.log('완료 처리 클릭, uciId:', uciId);
              onConfirm();
            }}
          >
            완료 처리
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistCompletionModal;


import styles from "./AIChecklistModal.module.css";

interface AIChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function AIChecklistModal({
  isOpen,
  onClose,
  onConfirm,
}: AIChecklistModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.content}>
          <h2 className={styles.title}>AI 체크리스트 수정 시스템</h2>
          <p className={styles.message}>
            AI 체크리스트 수정 시스템을 사용하시겠습니까?
          </p>
          <div className={styles.buttonContainer}>
            <button className={styles.cancelButton} onClick={onClose}>
              아니오
            </button>
            <button className={styles.confirmButton} onClick={onConfirm}>
              네
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

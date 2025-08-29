import React from 'react';
import styles from './DailyChecklist.module.css';

interface DailyChecklistProps {
  date: string;
  checklistItems: string[];
  onItemChange?: (index: number, checked: boolean) => void;
}

const DailyChecklist: React.FC<DailyChecklistProps> = ({ 
  date, 
  checklistItems, 
  onItemChange 
}) => {
  const handleCheckboxChange = (index: number, checked: boolean) => {
    if (onItemChange) {
      onItemChange(index, checked);
    }
  };

  return (
    <div className={styles.container}>
      {/* 날짜 배너 */}
      <div className={styles.dateBannerWrapper}>
        {/* 왼쪽 고리 */}
        <div className={styles.leftHookWhite}></div>
        <div className={styles.leftHookBlue}></div>
        <div className={styles.leftHookInner}></div>
        
        {/* 오른쪽 고리 */}
        <div className={styles.rightHookWhite}></div>
        <div className={styles.rightHookBlue}></div>
        <div className={styles.rightHookInner}></div>
        
        {/* 배너 본체 */}
        <div className={styles.dateBannerWhiteBg}></div>
        <div className={styles.dateBannerBlueBg}></div>
        <div className={styles.dateBannerText}>
          {date}
        </div>
      </div>
      
      {/* 체크리스트 아이템들 */}
      <div className={styles.checklistItems}>
        {checklistItems.map((item, index) => (
          <div key={index} className={styles.checklistItem}>
            <input
              type="checkbox"
              id={`checklist-${index}`}
              className={styles.checkbox}
              onChange={(e) => handleCheckboxChange(index, e.target.checked)}
            />
            <label htmlFor={`checklist-${index}`} className={styles.itemText}>
              {item}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyChecklist;

import React, { useState, useEffect } from 'react';
import styles from './DailyChecklist.module.css';

// 체크리스트 항목 인터페이스 정의
interface ChecklistItem {
  title: string;
  dueDate?: string;  // ISO 형식의 날짜 문자열
  dDay?: number;     // D-day 숫자
  status?: string;   // 항목 상태 (TODO, DONE 등)
  uciId?: number;    // 체크리스트 항목 ID
}

interface DailyChecklistProps {
  date: string;
  checklistItems: ChecklistItem[];
  onItemChange?: (uciId: number, checked: boolean) => void;
}

const DailyChecklist: React.FC<DailyChecklistProps> = ({ 
  date, 
  checklistItems, 
  onItemChange 
}) => {
  // 체크박스 상태를 관리하는 상태 추가
  const [checkedItems, setCheckedItems] = useState<boolean[]>([]);
  
  // 체크리스트 항목이 변경될 때마다 체크박스 상태 초기화
  useEffect(() => {
    // 각 항목의 상태에 따라 체크박스 상태 설정
    const initialCheckedItems = checklistItems.map(item => item.status === 'DONE');
    setCheckedItems(initialCheckedItems);
  }, [checklistItems]);

  const handleCheckboxChange = (index: number, checked: boolean) => {
    console.log('DailyChecklist 체크박스 클릭:', { index, checked, item: checklistItems[index] });
    
    // 체크박스 상태 업데이트
    const newCheckedItems = [...checkedItems];
    newCheckedItems[index] = checked;
    setCheckedItems(newCheckedItems);
    
    if (onItemChange && checklistItems[index].uciId) {
      console.log('onItemChange 호출:', checklistItems[index].uciId, checked);
      onItemChange(checklistItems[index].uciId, checked);
    } else {
      console.warn('uciId가 없어서 체크리스트 항목을 처리할 수 없습니다:', checklistItems[index]);
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
          <div key={`item-${index}-${item.title}`} className={styles.checklistItem}>
            {/* D-day 표시 (왼쪽에 배치) */}
            {item.dDay !== undefined && (
              <div className={styles.dDayContainer}>
                <div className={styles.dDay}>D-{item.dDay}</div>
              </div>
            )}
            
            {/* 체크박스 */}
            <input
              type="checkbox"
              id={`checklist-${index}-${item.title}`}
              className={styles.checkbox}
              checked={checkedItems[index] || false}
              disabled={item.status === 'DONE'}
              onChange={(e) => handleCheckboxChange(index, e.target.checked)}
            />
            
            {/* 항목 내용 */}
            <label htmlFor={`checklist-${index}-${item.title}`} className={styles.itemText}>
              {item.title}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DailyChecklist;
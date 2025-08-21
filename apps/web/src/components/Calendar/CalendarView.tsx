import { useMemo } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import styles from "./CalendarView.module.css";

type ChecklistItem = {
  id: number;
  text: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
};

type CalendarViewProps = {
  items: ChecklistItem[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  leaveDate: string; // YYYY-MM-DD
};

const toLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// YYYY. M. D
const formatKDate = (d: Date) =>
  `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;

export default function CalendarView({
  items,
  selectedDate,
  onDateChange,
  leaveDate,
}: CalendarViewProps) {
  // 선택된 날짜의 투두
  const dailyItems = useMemo(() => {
    const key = toLocalDateString(selectedDate);
    return items.filter((it) => it.date === key);
  }, [items, selectedDate]);

  // 할 일 있는 날짜 집합
  const itemDateSet = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) s.add(it.date);
    return s;
  }, [items]);

  // 타일 클래스 (출국일 / 할일 존재)
  const tileClassName = ({
    date,
    view,
  }: {
    date: Date;
    view: "month" | "year" | "decade" | "century";
  }) => {
    if (view !== "month") return undefined;
    const key = toLocalDateString(date);
    const classes: string[] = [];
    if (key === leaveDate) classes.push(styles.leaveDay);
    if (itemDateSet.has(key)) classes.push(styles.hasItems);
    return classes.join(" ");
  };

  // 타일 추가 컨텐츠 (출국 라벨 / 도트)
  const tileContent = ({
    date,
    view,
  }: {
    date: Date;
    view: "month" | "year" | "decade" | "century";
  }) => {
    if (view !== "month") return null;
    const key = toLocalDateString(date);
    return (
      <div className={styles.tileExtras}>
        {key === leaveDate && (
          <div className={styles.departureLabel}>출국일</div>
        )}
        {itemDateSet.has(key) && <span className={styles.dot}></span>}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* 캘린더 카드 */}
      <div className={`${styles.panel} ${styles.calendarPanel}`}>
        <Calendar
          onChange={(value) => onDateChange(value as Date)}
          value={selectedDate}
          formatDay={(_, date) => date.getDate().toString()}
          tileClassName={tileClassName}
          tileContent={tileContent}
          calendarType="gregory"
          locale="ko-KR"
          selectRange={false}
        />
      </div>

      {/* 체크리스트 카드 */}
      <div className={`${styles.panel} ${styles.listPanel}`}>
        <h3 className={styles.dailyHeader}>
          {formatKDate(selectedDate)} 체크리스트
        </h3>

        {dailyItems.length > 0 ? (
          <ul className={styles.checklist}>
            {dailyItems.map((item) => (
              <li key={item.id} className={styles.checklistItem}>
                <input type="checkbox" checked={item.completed} readOnly />
                <span className={styles.itemText}>{item.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className={styles.noItems}>예정된 할 일이 없습니다.</div>
        )}
      </div>
    </div>
  );
}

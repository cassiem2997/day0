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

  // 할 일 있는 날짜 Set (빠른 lookup)
  const itemDateSet = useMemo(() => {
    const s = new Set<string>();
    for (const it of items) s.add(it.date);
    return s;
  }, [items]);

  // 셀에 class 부여 (출국일 빨간색 등)
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

    if (key === leaveDate) classes.push(styles.leaveDay); // 출국일: 빨간 텍스트
    if (itemDateSet.has(key)) classes.push(styles.hasItems); // 할 일 있는 날: dot 표시용 클래스

    return classes.join(" ");
  };

  // 셀 안에 추가 컨텐츠 (출국일 라벨, dot)
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
        {itemDateSet.has(key) && <span className={styles.dot} />}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.calendarWrapper}>
        <Calendar
          onChange={(value) => onDateChange(value as Date)}
          value={selectedDate}
          formatDay={(_, date) => date.getDate().toString()}
          tileClassName={tileClassName}
          tileContent={tileContent}
        />
      </div>

      <div className={styles.dailyListWrapper}>
        <h3>{selectedDate.toLocaleDateString()}의 할 일</h3>
        <ul className={styles.checklist}>
          {dailyItems.length > 0 ? (
            dailyItems.map((item) => (
              <li key={item.id} className={styles.checklistItem}>
                <input type="checkbox" checked={item.completed} readOnly />
                <span>{item.text}</span>
              </li>
            ))
          ) : (
            <p className={styles.noItems}>예정된 할 일이 없습니다.</p>
          )}
        </ul>
      </div>
    </div>
  );
}

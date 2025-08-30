import { useMemo } from "react";
import styles from "./ModernCalendar.module.css";

type EventInput = string | Date | { date: string | Date; count?: number };

function toISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 타입 정의 제거

export default function ModernCalendar({
  value,
  onChange,
  events = [],
  compact = false,
}: {
  value?: Date;
  onChange?: (d: Date, openModal?: boolean) => void;
  events?: EventInput[];
  compact?: boolean;
}) {
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      const raw = typeof e === "object" && "date" in e ? e.date : e;
      const key = typeof raw === "string" ? raw.slice(0, 10) : toISO(raw as Date);
      const c = typeof e === "object" && "count" in e && e.count ? e.count : 1;
      map.set(key, Math.min(3, (map.get(key) || 0) + c));
    }
    return map;
  }, [events]);

  // 이 함수는 직접 사용하지 않으므로 제거

  // 현재 월의 날짜 데이터 생성
  const currentDate = value || new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  // 현재 월의 첫 날과 마지막 날
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  
  // 현재 월의 총 일수
  const totalDays = lastDayOfMonth.getDate();
  
  // 주 단위로 날짜 그룹화
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  // 첫 주 시작 전 이전 달 날짜 채우기
  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0: 일요일, 1: 월요일, ...
  if (firstDayOfWeek > 0) {
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevMonthDay = new Date(currentYear, currentMonth, -i);
      currentWeek.unshift(prevMonthDay);
    }
  }
  
  // 현재 월 날짜 채우기
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(currentYear, currentMonth, day);
    currentWeek.push(date);
    
    // 토요일이거나 마지막 날이면 주 마감
    if (date.getDay() === 6 || day === totalDays) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  }
  
  // 마지막 주 다음 달 날짜로 채우기
  const lastWeek = weeks[weeks.length - 1];
  if (lastWeek.length < 7) {
    const daysToAdd = 7 - lastWeek.length;
    for (let i = 1; i <= daysToAdd; i++) {
      lastWeek.push(new Date(currentYear, currentMonth + 1, i));
    }
  }
  
  return (
    <div className={`${styles.wrapper} ${compact ? styles.compact : ""}`}>
      <div className={styles.customCalendar}>
        <div className={styles.calendarHeader}>
          <button onClick={(e) => {
            e.stopPropagation();
            // 이전 달로 이동 시 모달 열지 않고 달력만 이동
            const newDate = new Date(currentYear, currentMonth - 1, 1);
            if (onChange) {
              // 두 번째 인자로 false를 전달하여 모달 열지 않음을 표시
              onChange(newDate, false);
            }
          }}>
            &lt;
          </button>
          <div className={styles.currentMonth}>
            {currentYear}년 {currentMonth + 1}월
          </div>
          <button onClick={(e) => {
            e.stopPropagation();
            // 다음 달로 이동 시 모달 열지 않고 달력만 이동
            const newDate = new Date(currentYear, currentMonth + 1, 1);
            if (onChange) {
              // 두 번째 인자로 false를 전달하여 모달 열지 않음을 표시
              onChange(newDate, false);
            }
          }}>
            &gt;
          </button>
        </div>
        
        <div className={styles.calendarWeeks}>
          {weeks.map((week, weekIndex) => (
            <div key={`week-${weekIndex}`} className={styles.calendarWeek}>
              {week.map((date, dayIndex) => {
                const isCurrentMonth = date.getMonth() === currentMonth;
                // 오늘 날짜 확인
                const today = new Date();
                const isToday = date.getDate() === today.getDate() && 
                                date.getMonth() === today.getMonth() && 
                                date.getFullYear() === today.getFullYear();
                
                // 현재 월에 속하는 날짜만 이벤트 표시
                const hasEvent = isCurrentMonth && counts.get(toISO(date)) ? true : false;
                
                // 디버깅용 로그
                if (date.getDate() === 30 && counts.get(toISO(date))) {
                  console.log(`날짜 30일 확인: ${date.toISOString()}, 월: ${date.getMonth() + 1}, 현재 월: ${currentMonth + 1}, isCurrentMonth: ${isCurrentMonth}, hasEvent: ${hasEvent}`);
                  console.log(`eventDot 표시 여부: ${hasEvent}, 키: ${toISO(date)}, 값: ${counts.get(toISO(date))}`);
                }
                
                return (
                  <div 
                    key={`day-${weekIndex}-${dayIndex}`} 
                    className={`${styles.calendarDay} ${isCurrentMonth ? '' : styles.otherMonth} ${isToday ? styles.selected : ''} ${hasEvent ? styles.hasEvent : ''}`}
                    onClick={() => {
                      // 현재 월에 속하는 모든 날짜 클릭 가능
                      if (isCurrentMonth) {
                        onChange?.(date, true);
                      }
                    }}
                    style={{ cursor: isCurrentMonth ? 'pointer' : 'default' }}
                  >
                    {date.getDate()}
                    {hasEvent ? (
                      <div className={styles.eventDot} />
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

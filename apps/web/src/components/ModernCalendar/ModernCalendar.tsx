import React, { useMemo } from "react";
import Calendar from "react-calendar";
import type { CalendarProps } from "react-calendar";
import type { ReactNode } from "react";
import "react-calendar/dist/Calendar.css";
import styles from "./ModernCalendar.module.css";

type EventInput = string | Date | { date: string | Date; count?: number };

function toISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type TileContentFn = Exclude<NonNullable<CalendarProps["tileContent"]>, ReactNode>;
type TileContentProps = Parameters<TileContentFn>[0];

export default function ModernCalendar({
  value,
  onChange,
  events = [],
  compact = false,
}: {
  value?: Date;
  onChange?: (d: Date) => void;
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

  const renderTileContent = ({ date, view }: TileContentProps) => {
    if (view !== "month") return null;
    const k = toISO(date);
    const c = counts.get(k) ?? 0;
    if (c <= 0) return null;

    if (c === 1) return <div className={styles.eventDot} aria-hidden />;
    
    return (
      <div className={styles.dotRow} aria-hidden>
        {Array.from({ length: Math.min(3, c) }).map((_, i) => (
          <div key={i} className={styles.eventDot} />
        ))}
      </div>
    );
  };

  return (
    <div className={`${styles.wrapper} ${compact ? styles.compact : ""}`}>
      <Calendar
        value={value}
        onChange={(v) => onChange?.(v as Date)}
        tileContent={renderTileContent}
        prev2Label={null}  // 년도 이동 버튼 숨김
        next2Label={null}  // 년도 이동 버튼 숨김
        showNeighboringMonth={true}
        locale="ko-KR"
        formatDay={(locale, date) => date.getDate().toString()} // 날짜만 표시
        formatShortWeekday={() => ''} // 요일 레이블 제거
      />
    </div>
  );
}

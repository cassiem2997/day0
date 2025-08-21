import { useEffect, useMemo, useState } from "react";
import styles from "./Summary.module.css";

type ChecklistItem = {
  id: number;
  text: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
};

type SummaryProps = {
  leaveDate: string;        // YYYY-MM-DD
  items: ChecklistItem[];
};

export default function Summary({ leaveDate, items }: SummaryProps) {
  const { progressPercentage, dDay } = useMemo(() => {
    const total = items.length;
    const done = items.filter((i) => i.completed).length;
    const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

    const today = new Date();
    const target = new Date(leaveDate);
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diff = target.getTime() - today.getTime();
    const day = Math.ceil(diff / (1000 * 60 * 60 * 24));

    return { progressPercentage: percentage, dDay: day };
  }, [items, leaveDate]);

  // 애니메이션 width 상태 (초기 0 → 목표 퍼센트로 전환)
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimatedWidth(progressPercentage));
    return () => cancelAnimationFrame(id);
  }, [progressPercentage]);

  return (
    <div className={styles.card}>
      <div className={styles.dDay}>
        <span>출국까지</span>
        <strong>{dDay <= 0 ? "D-DAY" : `D-${dDay}`}</strong>
      </div>

      <div className={styles.progressWrapper}>
        <div className={styles.progressInfo}>
          <span>체크리스트 달성률</span>
          <strong>{progressPercentage}%</strong>
        </div>

        <div className={styles.progressBarBackground}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${animatedWidth}%` }}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={animatedWidth}
            role="progressbar"
          />
        </div>
      </div>
    </div>
  );
}

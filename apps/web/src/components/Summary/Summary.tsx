import { useEffect, useMemo, useState } from "react";
import styles from "./Summary.module.css";
import airplane from "../../assets/airplane.svg";

type ChecklistItem = {
  id: number;
  text: string;
  completed: boolean;
  date: string; // YYYY-MM-DD
};

type SummaryProps = {
  leaveDate: string; // YYYY-MM-DD
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

  // 0 → 목표 퍼센트로 자연스러운 이동
  const [animatedPct, setAnimatedPct] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimatedPct(progressPercentage));
    return () => cancelAnimationFrame(id);
  }, [progressPercentage]);

  // 달성률에 따른 이륙 단계(위치/각도/투명도) 계산
  const planeStyle = useMemo(() => {
    let y = 0; // px (음수면 위로 떠오름)
    let rot = 0; // deg (음수면 코가 위로)
    let opacity = 1; // 0~1

    const p = animatedPct;

    // 0~30%: 활주로 위
    if (p <= 30) {
      // 약간의 미세 진동 없이 고정 — 필요하면 흔들림 추가 가능
      y = 0;
      rot = 0;
    }
    // 30~70%: 이륙 중 (기울면서 상승)
    else if (p <= 70) {
      const t = (p - 30) / 40; // 0 → 1
      y = -t * 16; // 최대 16px 위로
      rot = -t * 12; // 최대 -12deg
    }
    // 70~99%: 구름 위로 (더 높고 살짝 더 기울임)
    else if (p < 100) {
      const t = (p - 70) / 30; // 0 → 1
      y = -16 - t * 12; // -16 ~ -28px
      rot = -12 - t * 6; // -12 ~ -18deg
    }
    // 100%: 화면 밖으로 사라짐
    else {
      y = -32;
      rot = -20;
      opacity = 0; // 페이드아웃
    }

    return {
      left: `${p}%`,
      transform: `translate(-50%, ${y}px) rotate(${rot}deg)`,
      opacity,
    } as React.CSSProperties;
  }, [animatedPct]);

  return (
    <div className={styles.card}>
      <div className={styles.dDay}>
        <span>출국까지</span>
        <strong>{dDay <= 0 ? "D-DAY" : `D-${dDay}`}</strong>
      </div>

      <div className={styles.progressHeader}>
        <span>체크리스트 달성률</span>
        <strong>{progressPercentage}%</strong>
      </div>

      {/* 활주로 + 비행기 */}
      <div className={styles.runway} aria-label="체크리스트 이륙 진행도">
        <div className={styles.runwayLine} />
        <img
          src={airplane}
          alt="airplane"
          className={styles.plane}
          style={planeStyle}
          draggable={false}
        />
      </div>

      {/* 100% 완료 문구 */}
      {animatedPct >= 100 ? (
        <div className={styles.doneBadge} aria-live="polite">
          출국 준비 완료
        </div>
      ) : null}
    </div>
  );
}

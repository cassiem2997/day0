import { useMemo } from "react";
import styles from "./ChecklistStats.module.css";
import clouds from "../../assets/clouds.svg";

/** 진행도 계산에 쓰는 최소 타입 */
export type ChecklistItem = {
  id: number;
  text?: string;
  completed: boolean;
  date?: string; // YYYY-MM-DD
};

/** CSS 변수로 구름 위치/크기 오버라이드 */
type CloudVars = React.CSSProperties & {
  ["--cloud-tr-top"]?: string;
  ["--cloud-tr-right"]?: string;
  ["--cloud-tr-w"]?: string;
  ["--cloud-br-bottom"]?: string;
  ["--cloud-br-right"]?: string;
  ["--cloud-br-w"]?: string;
  ["--cloud-bl-bottom"]?: string;
  ["--cloud-bl-left"]?: string;
  ["--cloud-bl-w"]?: string;
};

type Props = {
  leaveDate: string;
  items: ChecklistItem[];
  cloudVars?: CloudVars; // 위치/크기 커스터마이즈
};

function daysUntil(leaveDate: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = leaveDate.split("-").map(Number);
  const leave = new Date(y, m - 1, d);
  const diff = Math.ceil((leave.getTime() - today.getTime()) / 86400000);
  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return "D-DAY";
  return `D+${Math.abs(diff)}`;
}

export default function ChecklistStats({ leaveDate, items, cloudVars }: Props) {
  const ddayText = useMemo(() => daysUntil(leaveDate), [leaveDate]);

  const { done, total, percent } = useMemo(() => {
    const total = items.length;
    const done = items.filter((i) => i.completed).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, percent };
  }, [items]);

  return (
    <section
      className={styles.wrap}
      style={cloudVars}
      aria-label="출국 D-Day와 체크리스트 진행도"
    >
      {/* 구름 3개: 상단오른쪽 / 하단오른쪽 / 하단왼쪽 */}
      <img src={clouds} alt="" aria-hidden="true" className={`${styles.cloud} ${styles.tr}`} />
      <img src={clouds} alt="" aria-hidden="true" className={`${styles.cloud} ${styles.br}`} />
      <img src={clouds} alt="" aria-hidden="true" className={`${styles.cloud} ${styles.bl}`} />

      {/* 상단 메트릭: D-day | 완료율 */}
      <div className={styles.topRow}>
        <div className={styles.metric} aria-label={`출국까지 ${ddayText}`}>
          <div className={styles.pill}>{ddayText}</div>
        </div>

        <div className={styles.metric} aria-label={`체크리스트 완료율 ${percent} 퍼센트`}>
          <div className={styles.pill}>{percent} %</div>
        </div>
      </div>

      {/* 진행바 */}
      <div className={styles.progressRow}>
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={`완료 ${done}개 / 총 ${total}개`}
        >
          <div className={styles.progressFill} style={{ width: `${percent}%` }}></div>
        </div>
      </div>
    </section>
  );
}

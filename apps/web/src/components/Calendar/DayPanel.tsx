import clouds from "../../assets/clouds.svg";
import styles from "./DayPanel.module.css";
import type { ChecklistItem } from "../ChecklistStats/ChecklistStats"; // 공용 타입 없이 사용

type Props = { date: Date; items: ChecklistItem[] };

function fmt(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}. ${m}. ${d}`;
}
function toKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DayPanel({ date, items }: Props) {
  const key = toKey(date);
  const todays = items.filter((it) => it.date === key);

  return (
    <section className={styles.wrap} aria-label={`${fmt(date)} 체크리스트`}>
      {/* 배경 구름 */}
      <img
        src={clouds}
        alt=""
        aria-hidden="true"
        className={`${styles.cloud} ${styles.tr}`}
      />
      <img
        src={clouds}
        alt=""
        aria-hidden="true"
        className={`${styles.cloud} ${styles.br}`}
      />

      {/* 날짜 알약 */}
      <div className={styles.dateRow}>
        <div className={styles.pill}>{fmt(date)}</div>
      </div>

      {/* 리스트 */}
      {todays.length === 0 ? (
        <p className={styles.empty}>예정된 할 일이 없습니다.</p>
      ) : (
        <ul className={styles.list}>
          {todays.map((it) => (
            <li key={it.id} className={styles.item}>
              <span className={styles.checkbox} aria-hidden="true" />
              <div className={styles.inputLike}>
                <span className={styles.text}>{it.text}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

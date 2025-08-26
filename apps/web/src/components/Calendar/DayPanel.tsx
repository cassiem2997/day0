import clouds from "../../assets/clouds.svg";
import styles from "./DayPanel.module.css";
import type { ChecklistItem } from "../ChecklistStats/ChecklistStats";

type Props = {
  date: Date;
  items: ChecklistItem[];
  onToggle?: (id: number) => void;
};

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

export default function DayPanel({ date, items, onToggle }: Props) {
  const key = toKey(date);
  const todays = items.filter((it) => it.date === key); // 완료/미완 모두 표시

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
            <li
              key={it.id}
              className={`${styles.item} ${it.completed ? styles.done : ""}`}
            >
              {/* 체크박스 (커스텀) */}
              <label className={styles.checkboxWrap}>
                <input
                  type="checkbox"
                  className={styles.nativeCheckbox}
                  checked={it.completed}
                  onChange={() => onToggle?.(it.id)}
                  aria-label={`${it.text} 완료`}
                />
                <span className={styles.checkbox} aria-hidden="true" />
              </label>

              {/* 입력칸 모양 텍스트 */}
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

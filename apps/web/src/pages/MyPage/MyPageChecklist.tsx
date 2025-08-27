import styles from "./MyPageChecklist.module.css";

type Visibility = "Public" | "Private";
type Status = "완료" | "진행중" | "미완료";

export type ChecklistItem = {
  id: string | number;
  visibility: Visibility;
  title: string;
  status: Status;
};

type Props = {
  items?: ChecklistItem[];
};

const DEFAULT_ITEMS: ChecklistItem[] = [
  { id: 1, visibility: "Public", title: "적금 계좌 만들기", status: "진행중" },
  {
    id: 2,
    visibility: "Private",
    title: "1,000,000원 적금하기",
    status: "완료",
  },
];

export default function MyPageChecklist({ items = DEFAULT_ITEMS }: Props) {
  return (
    <section className={styles.wrap} aria-label="체크리스트 목록">
      <h2 className={styles.title}>체크리스트 목록</h2>

      <div
        className={styles.tableCard}
        role="table"
        aria-label="체크리스트 테이블"
      >
        {/* 헤더 */}
        <div className={styles.head} role="rowgroup">
          <div
            className={`${styles.cell} ${styles.th}`}
            role="columnheader"
            aria-sort="none"
          >
            구분
          </div>
          <div className={`${styles.cell} ${styles.th}`} role="columnheader">
            항목명
          </div>
          <div
            className={`${styles.cell} ${styles.th} ${styles.thRight}`}
            role="columnheader"
          >
            상태
          </div>
        </div>

        {/* 바디 */}
        <div className={styles.body} role="rowgroup">
          {items.map((row) => (
            <div key={row.id} className={styles.row} role="row">
              <div className={styles.cell} role="cell">
                <span
                  className={`${styles.badge} ${
                    row.visibility === "Public"
                      ? styles.badgePublic
                      : styles.badgePrivate
                  }`}
                >
                  {row.visibility}
                </span>
              </div>

              <div className={`${styles.cell} ${styles.titleCell}`} role="cell">
                <span className={styles.itemTitle}>{row.title}</span>
              </div>

              <div className={`${styles.cell} ${styles.cellRight}`} role="cell">
                <span
                  className={`${styles.state} ${
                    row.status === "완료"
                      ? styles.stateDone
                      : row.status === "진행중"
                      ? styles.stateDoing
                      : styles.stateTodo
                  }`}
                >
                  {row.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

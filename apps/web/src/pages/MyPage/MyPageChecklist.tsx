import { useEffect, useState } from "react";
import styles from "./MyPageChecklist.module.css";
import {
  listUserChecklists,
  type ChecklistListItemUI,
} from "../../api/checklist";

type Visibility = "Public" | "Private";
type Status = "완료" | "진행중" | "미완료";

export type ChecklistItem = {
  id: string | number;
  visibility: Visibility;
  title: string;
  status: Status;
};

export default function MyPageChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    listUserChecklists({})
      .then((data: ChecklistListItemUI[]) => {
        setItems(data);
      })
      .catch((err) => {
        console.error(err);
        setError("체크리스트를 불러오는 데 실패했습니다.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className={styles.wrap} aria-label="체크리스트 목록">
      <h2 className={styles.title}>체크리스트 목록</h2>

      {loading && <div className={styles.loading}>불러오는 중...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!loading && !error && (
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
            {items.length === 0 ? (
              <div className={`${styles.row} ${styles.emptyRow}`} role="row">
                <div className={styles.emptyCell} role="cell">
                  등록된 체크리스트가 없습니다.
                </div>
              </div>
            ) : (
              items.map((row) => (
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

                  <div
                    className={`${styles.cell} ${styles.titleCell}`}
                    role="cell"
                  >
                    <span className={styles.itemTitle}>{row.title}</span>
                  </div>

                  <div
                    className={`${styles.cell} ${styles.cellRight}`}
                    role="cell"
                  >
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
              ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}

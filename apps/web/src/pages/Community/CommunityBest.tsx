import styles from "./CommunityPage.module.css";

export default function CommunityBest() {
  // 더미 2개 (피그마 느낌만 잡아둠)
  const items = [
    {
      id: 1,
      title: "런던 3개월 어학연수 (맥시멀리스트)",
      done: 51,
      total: 120,
      star: 51,
      author: "연세_우유",
    },
    {
      id: 2,
      title: "뉴욕 1년 교환학생 준비",
      done: 1,
      total: 51,
      star: 51,
      author: "고려_기프트",
    },
  ];

  return (
    <div className={styles.stack}>
      {items.map((it, idx) => (
        <article key={it.id} className={styles.postCard}>
          <header className={styles.postHead}>
            <h2 className={styles.postTitle}>{it.title}</h2>
            <button type="button" className={styles.saveBtn}>
              save
            </button>
          </header>

          <div className={styles.metaRow}>
            <span className={styles.badgeCheck} aria-hidden="true">
              ✓
            </span>
            <span className={styles.countText}>
              {it.done} <span className={styles.slash}>/</span> {it.total}
            </span>

            <span className={styles.star} aria-hidden="true">
              ★
            </span>
            <span className={styles.countText}>{it.star}</span>

            <span className={styles.by}>by</span>
            <span className={styles.author}>{it.author}</span>
          </div>

          {idx === 0 ? <div className={styles.rowDivider}></div> : null}
        </article>
      ))}
    </div>
  );
}

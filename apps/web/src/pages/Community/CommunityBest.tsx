import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./CommunityPage.module.css";
import { fetchPopularTop, type PopularBestItem } from "../../api/checklist";

type BestItem = PopularBestItem;

export default function CommunityBest() {
  const [items, setItems] = useState<BestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // country는 필요 시 "KR" 등으로 지정하세요.
        const res = await fetchPopularTop({ limit: 10 /*, country: "KR" */ });
        if (mounted) setItems(res);
      } catch (err) {
        console.error("popular-top fetch error", err);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.stack}>
        <article className={styles.postCard}>
          <header className={styles.postHead}>
            <h2 className={styles.postTitle}>
              <span className={styles.titleLink}>불러오는 중…</span>
            </h2>
            <button type="button" className={styles.saveBtn}>
              save
            </button>
          </header>
          <div className={styles.metaRow}>
            <span className={styles.badgeCheck} aria-hidden="true">
              ✓
            </span>
            <span className={styles.countText}>
              0 <span className={styles.slash}>/</span> 0
            </span>
            <span className={styles.star} aria-hidden="true">
              ★
            </span>
            <span className={styles.countText}>0</span>
            <span className={styles.by}>by</span>
            <span className={styles.author}>…</span>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className={styles.stack}>
      {items.map((it, idx) => (
        <article key={it.id} className={styles.postCard}>
          <header className={styles.postHead}>
            <h2 className={styles.postTitle}>
              <Link to={`/community/${it.id}`} className={styles.titleLink}>
                {it.title}
              </Link>
            </h2>
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

          {idx === 0 ? <div className={styles.rowDivider} /> : null}
        </article>
      ))}
      {items.length === 0 && (
        <div className={styles.emptyNotice}>표시할 항목이 없습니다.</div>
      )}
    </div>
  );
}

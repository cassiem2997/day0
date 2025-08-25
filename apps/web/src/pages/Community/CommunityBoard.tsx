import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./CommunityPage.module.css";
import communitySvg from "../../assets/community.svg";

type BoardCategory = "ALL" | "CHECKLIST" | "FREE";

type Post = {
  id: number;
  category: Exclude<BoardCategory, "ALL">;
  badge?: string | null;
  title: string;
  snippet: string;
  author: string;
  createdAgo: string;
  views: number;
  comments: number;
  likes: number;
  thumbnail?: string | null;
};

// 더미 데이터
const POSTS: Post[] = [
  {
    id: 1,
    category: "CHECKLIST",
    badge: "체크리스트",
    title: "[공유] 출국 30일 전 체크리스트",
    snippet: "깨끗딱으로 준비했으니까 수정 부탁\n안 보면 후회함",
    author: "연세_우유",
    createdAgo: "51분",
    views: 1,
    comments: 1,
    likes: 1,
  },
  {
    id: 2,
    category: "FREE",
    badge: "자유게시판",
    title: "뉴욕 1년 교환학생 준비",
    snippet: "체류 계획, 짐 구성, 보험 정리 공유합니다.",
    author: "고려_기프트",
    createdAgo: "1일",
    views: 73,
    comments: 2,
    likes: 5,
  },
];

export default function CommunityBoard() {
  const [cat, setCat] = useState<BoardCategory>("ALL");

  const filtered = useMemo(() => {
    if (cat === "ALL") return POSTS;
    return POSTS.filter((p) => p.category === cat);
  }, [cat]);

  return (
    <div className={styles.boardRoot}>
      {/* 상단 히어로 이미지 */}
      <figure className={styles.boardHero} aria-label="Community board hero">
        <img
          src={communitySvg}
          alt="커뮤니티 일러스트"
          className={styles.boardHeroImg}
        />
      </figure>

      {/* 필터 칩 + 글쓰기 버튼 */}
      <div
        className={styles.boardFilterBar}
        role="tablist"
        aria-label="게시글 분류"
      >
        {[
          { key: "ALL", label: "전체" },
          { key: "CHECKLIST", label: "체크리스트" },
          { key: "FREE", label: "자유게시판" },
        ].map((c) => (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={cat === (c.key as BoardCategory)}
            className={`${styles.chip} ${
              cat === (c.key as BoardCategory) ? styles.chipActive : ""
            }`}
            onClick={() => setCat(c.key as BoardCategory)}
          >
            {c.label}
          </button>
        ))}

        <div className={styles.spacer} />
        <Link to="/community/write" className={styles.writeBtn}>
          글쓰기
        </Link>
      </div>

      {/* 리스트 */}
      <ul className={styles.boardList}>
        {filtered.map((p) => (
          <li key={p.id} className={styles.boardRow}>
            {/* 왼쪽 내용 */}
            <div className={styles.rowLeft}>
              {p.badge ? (
                <div className={styles.rowBadge}>{p.badge}</div>
              ) : null}
              <h3 className={styles.rowTitle}>
                <Link to={`/community/${p.id}`} className={styles.titleLink}>
                  {p.title}
                </Link>
              </h3>

              <pre className={styles.rowSnippet}>{p.snippet}</pre>

              <div className={styles.rowMeta}>
                <span className={styles.metaAuthor}>{p.author}</span>
                <span className={styles.metaDot}>·</span>
                <span>{p.createdAgo}</span>
                <span className={styles.metaSep}></span>
                <span>조회 {p.views}</span>
                <span className={styles.metaDot}>·</span>
                <span>댓글 {p.comments}</span>
                <span className={styles.metaDot}>·</span>
                <span>좋아요 {p.likes}</span>
              </div>
            </div>

            {/* 오른쪽 썸네일/자리표시자 */}
            <div className={styles.rowRight}>
              {p.thumbnail ? (
                <img src={p.thumbnail} alt="" className={styles.thumbImg} />
              ) : (
                <div className={styles.thumbPlaceholder}>이미지</div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* 모바일 플로팅 작성 버튼 */}
      <Link
        to="/community/write"
        className={styles.fabWrite}
        aria-label="글쓰기"
      >
        +
      </Link>
    </div>
  );
}

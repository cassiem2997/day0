// src/pages/Community/CommunityBoard.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./CommunityPage.module.css";
import communitySvg from "../../assets/community.svg";
import {
  getCommunityPosts,
  type Cat,
  type CommunitySort,
  type GetPostsParams,
  type PostSummary,
  type PageBlock,
} from "../../api/community";

/* ====== 로컬 탭 타입 (ALL 포함) ====== */
type BoardCategory = "ALL" | "CHECKLIST" | "FREE";

/* ====== 유틸: time ago ====== */
function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - t);

  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분`;

  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간`;

  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일`;

  const w = Math.floor(d / 7);
  if (w < 5) return `${w}주`;

  const mon = Math.floor(d / 30);
  if (mon < 12) return `${mon}개월`;

  const y = Math.floor(d / 365);
  return `${y}년`;
}

/* ====== 파라미터 빌더 ====== */
function buildParams(
  cat: BoardCategory,
  page: number,
  size: number,
  sort: CommunitySort,
  extras?: Partial<GetPostsParams>
): GetPostsParams {
  const p: GetPostsParams = {
    page,
    size,
    sort,
  };
  if (cat !== "ALL") {
    p.category = cat as Cat;
  }
  if (extras) {
    for (const k in extras) {
      const key = k as keyof GetPostsParams;
      const val = extras[key];
      if (val !== undefined && val !== null && val !== "") {
        // @ts-expect-error narrow assign
        p[key] = val;
      }
    }
  }
  return p;
}

/* ====== 메인 컴포넌트 ====== */
export default function CommunityBoard() {
  const [cat, setCat] = useState<BoardCategory>("ALL");
  const [sort, setSort] = useState<CommunitySort>("latest");

  // 목록 상태
  const [items, setItems] = useState<PostSummary[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [hasNext, setHasNext] = useState(false);

  // 상태
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 카테고리/정렬 변경 시 페이지 리셋
  useEffect(() => {
    setPage(0);
  }, [cat, sort]);

  // 데이터 로드
  useEffect(() => {
    let cancelled = false;

    async function fetchList() {
      setLoading(true);
      setErrorMsg(null);

      try {
        const params = buildParams(cat, page, size, sort);
        const res = await getCommunityPosts(params); // GET /community/posts
        if (!res.success) {
          if (!cancelled) {
            setErrorMsg(res.message || "목록을 불러오지 못했습니다.");
          }
          return;
        }

        const block: PageBlock<PostSummary> = res.data;

        if (!cancelled) {
          // 첫 페이지면 교체, 그 외에는 append
          if (page === 0) {
            setItems(block.content || []);
          } else {
            setItems((prev) => prev.concat(block.content || []));
          }
          setHasNext(Boolean(block.hasNext));
          setInitialLoaded(true);
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMsg("네트워크 오류가 발생했습니다.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchList();
    return () => {
      cancelled = true;
    };
  }, [cat, page, size, sort]);

  const visible = useMemo(() => items, [items]);

  return (
    <div className={styles.boardRoot}>
      {/* 상단 히어로 이미지 */}
      <figure className={styles.boardHero} aria-label="Community board hero">
        <img
          src={communitySvg}
          alt="커뮤니티 일러스트"
          className={styles.boardHeroImg}
        ></img>
      </figure>

      {/* 필터 칩 + 글쓰기 버튼 + 정렬 토글 */}
      <div
        className={styles.boardFilterBar}
        role="tablist"
        aria-label="게시글 분류"
      >
        {[
          { key: "ALL", label: "전체" },
          { key: "CHECKLIST", label: "체크리스트" },
          { key: "FREE", label: "자유게시판" },
          { key: "QNA", label: "Q&A" },
        ].map((c) => (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={cat === (c.key as BoardCategory)}
            className={`${styles.chip} ${
              cat === (c.key as BoardCategory) ? styles.chipActive : ""
            }`}
            onClick={function onClick() {
              setCat(c.key as BoardCategory);
            }}
          >
            {c.label}
          </button>
        ))}

        <div className={styles.spacer}></div>

        {/* 정렬 토글: 최신/인기 */}
        <div className={styles.sortWrap}>
          <button
            type="button"
            className={`${styles.sortBtn} ${
              sort === "latest" ? styles.sortActive : ""
            }`}
            aria-pressed={sort === "latest"}
            onClick={function onClick() {
              setSort("latest");
            }}
          >
            최신순
          </button>
          <button
            type="button"
            className={`${styles.sortBtn} ${
              sort === "popular" ? styles.sortActive : ""
            }`}
            aria-pressed={sort === "popular"}
            onClick={function onClick() {
              setSort("popular");
            }}
          >
            인기순
          </button>
        </div>

        <Link to="/community/write" className={styles.writeBtn}>
          글쓰기
        </Link>
      </div>

      {/* 리스트 영역 */}
      {/* 로딩/에러/빈 상태 처리 */}
      {errorMsg ? <div className={styles.errorBox}>{errorMsg}</div> : null}

      {!initialLoaded && loading ? (
        <ul className={styles.boardList}>
          {Array.from({ length: 5 }).map(function (_, i) {
            return (
              <li key={i} className={`${styles.boardRow} ${styles.skeleton}`}>
                <div className={styles.rowLeft}>
                  <div className={styles.rowBadge}></div>
                  <div className={styles.skelTitle}></div>
                  <div className={styles.skelLine}></div>
                  <div className={styles.skelLine}></div>
                </div>
                <div className={styles.rowRight}>
                  <div className={styles.thumbPlaceholder}></div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {initialLoaded && visible.length === 0 && !loading && !errorMsg ? (
        <div className={styles.emptyBox}>게시글이 없습니다.</div>
      ) : null}

      {visible.length > 0 ? (
        <ul className={styles.boardList}>
          {visible.map(function (p) {
            const createdAgo = timeAgo(p.createdAt);
            return (
              <li key={p.postId} className={styles.boardRow}>
                {/* 왼쪽 내용 */}
                <div className={styles.rowLeft}>
                  <div className={styles.rowBadge}>
                    {typeof p.category === "string"
                      ? p.category
                      : String(p.category)}
                  </div>

                  <h3 className={styles.rowTitle}>
                    <Link
                      to={`/community/${p.postId}`}
                      className={styles.titleLink}
                    >
                      {p.title}
                    </Link>
                  </h3>

                  <pre className={styles.rowSnippet}>{p.bodyPreview || ""}</pre>

                  <div className={styles.rowMeta}>
                    <span className={styles.metaAuthor}>
                      {p.authorNickname}
                    </span>
                    <span className={styles.metaDot}>·</span>
                    <span>{createdAgo}</span>
                    <span className={styles.metaSep}></span>
                    <span>댓글 {p.replyCount ?? 0}</span>
                    <span className={styles.metaDot}>·</span>
                    <span>좋아요 {p.likeCount ?? 0}</span>
                  </div>
                </div>

                {/* 오른쪽 썸네일/자리표시자 (API에 썸네일 없으니 플레이스홀더) */}
                <div className={styles.rowRight}>
                  <div className={styles.thumbPlaceholder}>이미지</div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {/* 더보기 버튼 (hasNext일 때만) */}
      {visible.length > 0 && hasNext ? (
        <div className={styles.loadMoreWrap}>
          <button
            type="button"
            className={styles.loadMoreBtn}
            disabled={loading}
            onClick={function onClick() {
              setPage(function (prev) {
                return prev + 1;
              });
            }}
          >
            {loading ? "불러오는 중..." : "더보기"}
          </button>
        </div>
      ) : null}

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

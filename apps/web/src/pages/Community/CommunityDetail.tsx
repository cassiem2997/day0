import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./CommunityDetail.module.css";

// ───────────────── 공통: 모바일 판별 ─────────────────
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  });
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

type DetailPost = {
  id: number;
  category: "CHECKLIST" | "FREE";
  badge: string;
  title: string;
  author: string;
  createdAgo: string;
  views: number;
  comments: number;
  likes: number;
  thumbnail?: string | null;
  body: string; // \n 포함
};

// ───────────────── 더미 데이터 (API 연동 전) ─────────────────
const DUMMY: Record<number, DetailPost> = {
  1: {
    id: 1,
    category: "CHECKLIST",
    badge: "체크리스트",
    title: "[공유] 출국 30일 전 체크리스트",
    author: "연세_우유",
    createdAgo: "51분",
    views: 1,
    comments: 1,
    likes: 1,
    thumbnail: "", // 없으면 자리표시자
    body: "✅ 여권/비자 원본 및 사본\n✅ 예방접종 증명서, 보험증권\n✅ 국제운전면허, 영문 처방전\n\n공항 동선/금지물품/환전 팁은 댓글로 꾸준히 업데이트할게요!",
  },
  2: {
    id: 2,
    category: "FREE",
    badge: "자유게시판",
    title: "뉴욕 1년 교환학생 준비",
    author: "고려_기프트",
    createdAgo: "1일",
    views: 73,
    comments: 2,
    likes: 5,
    thumbnail: "",
    body: "생활비/집 구하기/짐 구성 고민 정리했습니다.\n추가 질문 있으시면 댓글로 남겨주세요!",
  },
};

export default function CommunityDetail() {
  const isMobile = useIsMobile(768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((p) => !p);

  const { postId } = useParams();
  const id = Number(postId);
  const post = useMemo<DetailPost>(() => DUMMY[id] ?? DUMMY[1], [id]);

  return (
    <div className={styles.container}>
      {/* 모바일: 사이드바 + 햄버거 */}
      {isMobile ? (
        <>
          <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
          <button
            type="button"
            className={styles.mobileHamburger}
            onClick={toggleSidebar}
            aria-label="메뉴 열기"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </>
      ) : null}

      <main className={styles.main}>
        {isMobile ? null : <Header />}

        <div className={styles.pageContent}>
          <h1 className={styles.communityTitle}>COMMUNITY</h1>

          {/* 상단: 제목/메타 */}
          <section className={styles.headCard} aria-label="게시글 헤더">
            <div className={styles.headLeft}>
              <span className={styles.badge}>{post.badge}</span>
              <h2 className={styles.title}>{post.title}</h2>
            </div>
            <div className={styles.headRight}>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>시간</span>
                <strong className={styles.metaStrong}>{post.createdAgo}</strong>
              </div>
              <div className={styles.metaRow}>
                <span className={styles.metaLabel}>작성</span>
                <strong className={styles.metaStrong}>{post.author}</strong>
              </div>
            </div>
          </section>

          {/* 본문 */}
          <article className={styles.bodyCard} aria-label="본문">
            <div className={styles.bodyInner}>
              <div className={styles.hero}>
                {post.thumbnail ? (
                  <img src={post.thumbnail} alt="" className={styles.heroImg} />
                ) : (
                  <div className={styles.heroPlaceholder}></div>
                )}
              </div>

              <pre className={styles.bodyText}>{post.body}</pre>

              {/* 액션칩 */}
              <div className={styles.actionBar}>
                <button
                  type="button"
                  className={`${styles.chip} ${styles.chipPrimary}`}
                >
                  좋아요 <b>{post.likes}</b>
                </button>
                <button type="button" className={styles.chip}>
                  댓글 <b>{post.comments}</b>
                </button>
                <div className={styles.rightStats}>
                  <span>조회 {post.views}</span>
                </div>
              </div>
            </div>
          </article>

          {/* 댓글 영역 (샘플 1개) */}
          <section className={styles.commentCard} aria-label="댓글">
            <div className={styles.commentHead}>
              <strong>댓글</strong>
              <span className={styles.count}>({post.comments})</span>
            </div>

            <ul className={styles.commentList}>
              <li className={styles.commentItem}>
                <div className={styles.commentMeta}>
                  <strong>고려_기프트</strong>
                  <span className={styles.dot}>·</span>
                  <span>2025.08.25. 12:22</span>
                </div>
                <p className={styles.commentText}>
                  이런 어그로성 글은 작성하지 마세요 ::
                </p>
                <div className={styles.commentActions}>
                  <button type="button" className={styles.btnGrey}>
                    수정
                  </button>
                  <button type="button" className={styles.btnGrey}>
                    삭제
                  </button>
                </div>
              </li>
            </ul>
          </section>

          {/* 뒤로가기 */}
          <div className={styles.bottomNav}>
            <Link to="/community" className={styles.linkBack}>
              ← 목록으로
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

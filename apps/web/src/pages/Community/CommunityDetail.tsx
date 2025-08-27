// src/pages/Community/CommunityDetail.tsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./CommunityDetail.module.css";

import api from "../../api/axiosInstance";
import {
  getCommunityPostDetail,
  type PostDetail as ApiPostDetail,
} from "../../api/community";

/* ───────────────── 공통: 모바일 판별 ───────────────── */
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

/* ───────────────── 뷰 모델(기존 UI 구조 유지) ───────────────── */
type DetailPost = {
  id: number;
  category: "CHECKLIST" | "FREE" | "QNA";
  badge: string;
  title: string;
  author: string;
  createdAgo: string;
  views: number;
  comments: number;
  likes: number;
  thumbnail?: string | null;
  body: string;
};

/* createdAt → "n분 전" 포맷 */
function timeAgo(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  const diff = Math.max(0, Date.now() - d.getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간`;
  const day = Math.floor(h / 24);
  if (day < 7) return `${day}일`;
  const w = Math.floor(day / 7);
  if (w < 5) return `${w}주`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}개월`;
  const y = Math.floor(day / 365);
  return `${y}년`;
}

/* 카테고리 → 뱃지 라벨 */
function categoryBadge(cat?: string) {
  switch (cat) {
    case "CHECKLIST":
      return "체크리스트";
    case "FREE":
      return "자유게시판";
    case "QNA":
      return "Q&A";
    default:
      return cat ?? "";
  }
}

/* API 응답 → 뷰 모델 매핑 */
function mapToDetailView(p: ApiPostDetail): DetailPost {
  return {
    id: p.postId,
    category: (p.category as any) ?? "FREE",
    badge: categoryBadge(p.category),
    title: p.title,
    author: p.authorNickname,
    createdAgo: timeAgo(p.createdAt),
    views: (p as any).viewCount ?? 0, // 스웨거에 없으면 0 처리
    comments: p.replyCount ?? 0,
    likes: p.likeCount ?? 0,
    thumbnail: p.imageUrl ?? null,
    body: p.body ?? "",
  };
}

export default function CommunityDetail() {
  const isMobile = useIsMobile(768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((p) => !p);

  const { postId } = useParams();
  const pid = Number(postId);

  const [userId, setUserId] = useState<number | null>(null);
  const [post, setPost] = useState<DetailPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /* 로그인 사용자(userId) 조회 */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/me", { withCredentials: true });
        const id = res?.data?.userId;
        if (typeof id === "number" && id > 0) setUserId(id);
        else setUserId(null);
      } catch {
        setUserId(null);
      }
    })();
  }, []);

  /* 게시글 상세 로드 */
  useEffect(() => {
    if (!Number.isFinite(pid)) return;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await getCommunityPostDetail(pid, userId ?? undefined);
        setPost(mapToDetailView(data.data));
      } catch (e: any) {
        setErr(
          e?.response?.data?.message ||
            e?.message ||
            "게시글을 불러오지 못했습니다."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [pid, userId]);

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
          {/* 로딩/에러 처리 */}
          {loading && (
            <section className={styles.headCard}>불러오는 중…</section>
          )}
          {err && (
            <section className={styles.headCard}>
              <div style={{ color: "#c0392b", fontWeight: 800 }}>{err}</div>
            </section>
          )}

          {/* 상단: 제목/메타 */}
          {post && !loading && !err && (
            <>
              <section className={styles.headCard} aria-label="게시글 헤더">
                <div className={styles.headLeft}>
                  <span className={styles.badge}>{post.badge}</span>
                  <h2 className={styles.title}>{post.title}</h2>
                </div>
                <div className={styles.headRight}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>시간</span>
                    <strong className={styles.metaStrong}>
                      {post.createdAgo}
                    </strong>
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
                      <img
                        src={post.thumbnail}
                        alt=""
                        className={styles.heroImg}
                      />
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

              {/* 댓글 영역 (API 연결 전: 자리만 유지) */}
              <section className={styles.commentCard} aria-label="댓글">
                <div className={styles.commentHead}>
                  <strong>댓글</strong>
                  <span className={styles.count}>({post.comments})</span>
                </div>
                {/* 실제 댓글 API 붙이면 여기 채우기 */}
              </section>
            </>
          )}

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

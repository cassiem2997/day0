// src/pages/Community/CommunityDetail.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./CommunityDetail.module.css";
import Swal from "sweetalert2";

import api from "../../api/axiosInstance";
import {
  getCommunityPostDetail,
  deleteCommunityPost,
  likeCommunityPost,
  unlikeCommunityPost,
  getCommunityReplies,
  createCommunityReply,
  deleteCommunityReply,
  adoptReply,
  cancelAdoptReply,
  type PostDetail as ApiPostDetail,
  type Reply,
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

/* ───────────────── 뷰 모델 ───────────────── */
type DetailPost = {
  id: number;
  category: "CHECKLIST" | "FREE" | "QNA";
  badge: string;
  title: string;
  author: string;
  authorId: number;
  createdAgo: string;
  views: number;
  comments: number;
  likes: number;
  liked: boolean;
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
    authorId: p.authorId,
    createdAgo: timeAgo(p.createdAt),
    views: (p as any).viewCount ?? 0,
    comments: p.replyCount ?? 0,
    likes: p.likeCount ?? 0,
    liked: p.liked ?? false,
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
  const nav = useNavigate();

  const [userId, setUserId] = useState<number | null>(null);
  const [post, setPost] = useState<DetailPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyInput, setReplyInput] = useState("");

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

  /* 댓글 목록 불러오기 */
  useEffect(() => {
    if (!Number.isFinite(pid)) return;
    (async () => {
      try {
        const data = await getCommunityReplies(pid);
        setReplies(data.data);
      } catch (e) {
        console.error("댓글 불러오기 실패", e);
      }
    })();
  }, [pid]);

  /* 좋아요 토글 */
  async function onToggleLike() {
    if (!post || !userId) return;
    try {
      if (post.liked) {
        await unlikeCommunityPost(post.id, userId);
        setPost({ ...post, liked: false, likes: post.likes - 1 });
      } else {
        await likeCommunityPost(post.id, userId);
        setPost({ ...post, liked: true, likes: post.likes + 1 });
      }
    } catch (e) {
      console.error("좋아요 토글 실패", e);
    }
  }

  /* 게시글 삭제 */
  async function onDeletePost() {
    if (!post || !userId) return;
    const confirm = await Swal.fire({
      title: "삭제하시겠습니까?",
      text: "삭제한 글은 복구할 수 없습니다.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
    });
    if (confirm.isConfirmed) {
      try {
        await deleteCommunityPost(post.id, userId);
        await Swal.fire("삭제 완료", "게시글이 삭제되었습니다.", "success");
        nav("/community", { replace: true });
      } catch (e) {
        Swal.fire("오류", "삭제에 실패했습니다.", "error");
      }
    }
  }

  /* 댓글 작성 */
  async function onAddReply() {
    if (!replyInput.trim() || !userId || !pid) return;
    try {
      await createCommunityReply(pid, userId, { body: replyInput.trim() });
      setReplyInput("");
      const data = await getCommunityReplies(pid);
      setReplies(data.data);
    } catch (e) {
      console.error("댓글 작성 실패", e);
    }
  }

  /* 댓글 삭제 */
  async function onDeleteReply(replyId: number) {
    if (!userId) return;
    const confirm = await Swal.fire({
      title: "댓글을 삭제하시겠습니까?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
    });
    if (confirm.isConfirmed) {
      try {
        await deleteCommunityReply(replyId, userId);
        setReplies(replies.filter((r) => r.replyId !== replyId));
      } catch (e) {
        Swal.fire("오류", "댓글 삭제 실패", "error");
      }
    }
  }

  /* ---------- 채택/취소 (QNA + 글 작성자 + 타인 댓글만 채택) ---------- */
  const isQna = post?.category === "QNA";
  const isPostAuthor = !!post && userId === post.authorId;
  const hasAdopted = replies.some((r) => r.adopted === true);

  async function onAdopt(replyId: number) {
    if (!userId || !isQna || !isPostAuthor) return;
    const c = await Swal.fire({
      title: "이 댓글을 채택할까요?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "채택",
      cancelButtonText: "취소",
    });
    if (!c.isConfirmed) return;

    try {
      await adoptReply(replyId, userId);
      await Swal.fire("채택되었습니다.", "", "success");
      const data = await getCommunityReplies(pid);
      setReplies(data.data);
    } catch (e) {
      Swal.fire("오류", "채택에 실패했습니다.", "error");
    }
  }

  async function onCancelAdopt(replyId: number) {
    if (!userId || !isQna || !isPostAuthor) return;
    const c = await Swal.fire({
      title: "채택을 취소할까요?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "채택 취소",
      cancelButtonText: "닫기",
    });
    if (!c.isConfirmed) return;

    try {
      await cancelAdoptReply(replyId, userId);
      await Swal.fire("채택이 취소되었습니다.", "", "success");
      const data = await getCommunityReplies(pid);
      setReplies(data.data);
    } catch (e) {
      Swal.fire("오류", "채택 취소에 실패했습니다.", "error");
    }
  }

  return (
    <div className={styles.container}>
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
          {loading && (
            <section className={styles.headCard}>불러오는 중…</section>
          )}
          {err && (
            <section className={styles.headCard}>
              <div style={{ color: "#c0392b", fontWeight: 800 }}>{err}</div>
            </section>
          )}

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
                      <div></div>
                    )}
                  </div>

                  <pre className={styles.bodyText}>{post.body}</pre>

                  <div className={styles.actionBar}>
                    <button
                      type="button"
                      className={`${styles.chip} ${
                        post.liked ? styles.chipPrimary : ""
                      }`}
                      onClick={onToggleLike}
                    >
                      {post.liked ? "좋아요 취소" : "좋아요"}{" "}
                      <b>{post.likes}</b>
                    </button>
                    <button type="button" className={styles.chip}>
                      댓글 <b>{replies.length}</b>
                    </button>
                    <div className={styles.rightStats}>
                    </div>
                  </div>
                </div>
              </article>

              <section className={styles.commentCard} aria-label="댓글">
                <div className={styles.commentHead}>
                  <strong>댓글</strong>
                  <span className={styles.count}>({replies.length})</span>
                </div>

                <div style={{ margin: "8px 0" }}>
                  <textarea
                    className={styles.textarea}
                    placeholder="댓글을 입력하세요"
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className={styles.chip}
                    onClick={onAddReply}
                    disabled={!replyInput.trim()}
                  >
                    등록
                  </button>
                </div>

                <ul style={{ marginTop: "12px" }}>
                  {replies.map((r) => {
                    const canAdoptThis =
                      isQna &&
                      isPostAuthor &&
                      userId !== r.authorId &&
                      !r.adopted;
                    const canCancelThis = isQna && isPostAuthor && r.adopted;

                    return (
                      <li
                        key={r.replyId}
                        className={`${styles.commentItem} ${
                          r.adopted ? styles.commentItemAdopted : ""
                        }`}
                        style={{ marginBottom: "8px" }}
                      >
                        <div className={styles.commentMeta}>
                          <b>{r.authorNickname}</b>
                          <span className={styles.dot}>·</span>
                          <small>{timeAgo(r.createdAt)}</small>
                          {r.adopted ? (
                            <span className={styles.adoptedBadge}>채택됨</span>
                          ) : null}
                        </div>

                        <p className={styles.commentText}>{r.body}</p>

                        <div className={styles.commentActions}>
                          {canCancelThis ? (
                            <button
                              type="button"
                              className={`${styles.chip} ${styles.chipPrimary}`}
                              onClick={() => onCancelAdopt(r.replyId)}
                            >
                              채택 취소
                            </button>
                          ) : null}

                          {canAdoptThis ? (
                            <button
                              type="button"
                              className={styles.chip}
                              onClick={() => onAdopt(r.replyId)}
                              disabled={hasAdopted}
                              title={
                                hasAdopted
                                  ? "이미 채택된 댓글이 있습니다"
                                  : undefined
                              }
                            >
                              채택
                            </button>
                          ) : null}

                          {/* 본인 댓글이면 삭제 가능 */}
                          {userId === r.authorId && (
                            <button
                              type="button"
                              className={styles.chip}
                              onClick={() => onDeleteReply(r.replyId)}
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {/* 작성자 전용 수정/삭제 버튼 */}
              {userId && post.authorId === userId && (
                <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className={styles.chip}
                    onClick={() =>
                      nav(`/community/write?edit=1&postId=${post.id}`)
                    }
                  >
                    수정하기
                  </button>
                  <button
                    type="button"
                    className={styles.chip}
                    onClick={onDeletePost}
                  >
                    삭제하기
                  </button>
                </div>
              )}
            </>
          )}

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

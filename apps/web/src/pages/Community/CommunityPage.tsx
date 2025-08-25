import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./CommunityPage.module.css";

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

type Category = "ALL" | "HOT" | "CHECKLIST" | "TIPS" | "FREE";

type Post = {
  id: number;
  category: "CHECKLIST" | "TIPS" | "FREE";
  title: string;
  snippet: string;
  author: string;
  createdAgo: string; // "4분" 같은 형태
  views: number;
  comments: number;
  likes: number;
  badge?: string | null;
  thumbnail?: string | null; // public 폴더 이미지 경로 가능
};

/** ====== 네 프로젝트 톤에 맞춘 더미 ======
 *  교환학생/환전/체크리스트 위주로 구성
 */
const DUMMY: Post[] = [
  {
    id: 101,
    category: "CHECKLIST",
    badge: "체크리스트",
    title: "[공유] 출국 30일 전 체크리스트",
    snippet:
      "비자 원본/사본, 국제운전면허, 예방접종 증명서, 학교 보험 가입확인서 등 12항목 정리했습니다. 누락 항목 있으면 댓글로 추가 부탁!",
    author: "연세_최민",
    createdAgo: "4분",
    views: 128,
    comments: 3,
    likes: 7,
  },
  {
    id: 102,
    category: "TIPS",
    badge: "TIP",
    title: "USD 환전, 카드사 우대 vs 은행 우대 뭐가 이득?",
    snippet:
      "출국 2주 전 기준 시뮬 돌려보니 은행 80% 우대 + 픽업이 카드 캐시백 5%보다 총액이 낮았습니다. 그래프랑 계산 근거 공유합니다.",
    author: "KU_박지윤",
    createdAgo: "41분",
    views: 815,
    comments: 15,
    likes: 21,
    thumbnail: "/sample/exchange-usd.jpg",
  },
  {
    id: 103,
    category: "TIPS",
    badge: "TIP",
    title: "UC 산타바바라 Manzanita Village 후기 (사진 많음)",
    snippet:
      "바다 보이는 뷰는 진짜 미쳤습니다. 다만 공용 주방 냄새 이슈가 있고, 세탁실은 야간 대기가 길어요. 방음/치안/식당 요약했어요.",
    author: "UCSB_J",
    createdAgo: "3시간",
    views: 2370,
    comments: 28,
    likes: 54,
    thumbnail: "/sample/dorm.jpg",
  },
  {
    id: 104,
    category: "TIPS",
    badge: "TIP",
    title: "F-1 비자 인터뷰 질문 리스트 최신본",
    snippet:
      "재정증명 관련 보충서류 물어보는 비율이 올랐습니다. 대사관 방문 동선/소요시간/금지물품/흐름까지 한 장에 정리.",
    author: "서강_운영자",
    createdAgo: "어제",
    views: 990,
    comments: 12,
    likes: 33,
  },
  {
    id: 105,
    category: "FREE",
    badge: "자유게시판",
    title: "짐 얼마나 줄이셨나요? 캐리어 1+보스턴 vs 캐리어 2",
    snippet:
      "겨울 코트 2벌이면 충분하다는 의견과 현지 중고장터 추천 많이 주셨어요. 여러분은 어떻게 하셨는지 궁금!",
    author: "한양_지수",
    createdAgo: "2일",
    views: 460,
    comments: 9,
    likes: 11,
  },
];

export default function CommunityPage() {
  const isMobile = useIsMobile(768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [active, setActive] = useState<Category>("ALL");
  const [q, setQ] = useState("");

  const toggleSidebar = () => setIsSidebarOpen((p) => !p);

  const filtered = useMemo(() => {
    let list = [...DUMMY];
    if (active !== "ALL" && active !== "HOT") {
      list = list.filter((p) => p.category === active);
    }
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(s) ||
          p.snippet.toLowerCase().includes(s) ||
          p.author.toLowerCase().includes(s)
      );
    }
    if (active === "HOT") {
      list.sort((a, b) => b.views + b.likes * 10 - (a.views + a.likes * 10));
    }
    return list;
  }, [active, q]);

  return (
    <div className={styles.container}>
      {isMobile ? (
        <>
          <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar}></Sidebar>
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
        {isMobile ? null : <Header></Header>}

        <div className={styles.pageContent}>
          {/* 탭/툴바 */}
          <div className={styles.toolbar}>
            <div className={styles.tabGroup}>
              {[
                { key: "ALL", label: "전체글" },
                { key: "HOT", label: "인기글" },
                { key: "CHECKLIST", label: "체크리스트" },
                { key: "TIPS", label: "T I P" },
                { key: "FREE", label: "자유게시판" },
              ].map((t) => (
                <button
                  key={t.key}
                  className={`${styles.tab} ${
                    active === (t.key as Category) ? styles.active : ""
                  }`}
                  onClick={() => setActive(t.key as Category)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className={styles.toolGroup}>
              <input
                className={styles.search}
                placeholder="검색어를 입력하세요"
                aria-label="게시글 검색"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          {/* 리스트 */}
          <ul className={styles.postList}>
            {filtered.map((p) => (
              <li key={p.id} className={styles.postItem}>
                <div className={styles.postLeft}>
                  <div className={styles.titleRow}>
                    {p.badge ? (
                      <span className={styles.badge}>{p.badge}</span>
                    ) : null}
                    <button type="button" className={styles.postTitle}>
                      {p.title}
                    </button>
                  </div>
                  <p className={styles.snippet}>{p.snippet}</p>
                  <div className={styles.metaRow}>
                    <span className={styles.meta}>
                      {p.author}
                      <span className={styles.dot}>·</span>
                      {p.createdAgo}
                    </span>
                    <span className={styles.metaRight}>
                      조회 {p.views}
                      <span className={styles.sep}>|</span> 댓글 {p.comments}
                      <span className={styles.sep}>|</span> 좋아요 {p.likes}
                    </span>
                  </div>
                </div>
                {p.thumbnail ? (
                  <img src={p.thumbnail} alt="" className={styles.thumb} />
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
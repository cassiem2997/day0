// src/pages/Community/CommunityBoard.tsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./CommunityPage.module.css";
import communitySvg from "../../assets/community.svg";
import {
  getCommunityPosts,
  getCommunityGroups,
  type Cat,
  type CommunitySort,
  type GetPostsParams,
  type PostSummary,
  type PageBlock,
  type GetCommunityGroupsParams,
} from "../../api/community";
import {
  fetchCountryCodes,
  fetchUniversitiesByCountry,
  type CountryItem,
  type UniversityItem,
} from "../../api/university";

type BoardCategory = "ALL" | "CHECKLIST" | "FREE" | "QNA";

/* time ago */
function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - t);
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

/* 요청 파라미터 빌더 */
function buildParams(
  cat: BoardCategory,
  page: number,
  size: number,
  sort: CommunitySort,
  extras?: Partial<GetPostsParams>
): GetPostsParams {
  const p: GetPostsParams = { page, size, sort };
  if (cat !== "ALL") p.category = cat as Cat;
  if (extras) {
    for (const k in extras) {
      const key = k as keyof GetPostsParams;
      const val = extras[key];
      if (val !== undefined && val !== null && val !== "") {
        // @ts-expect-error – narrow assign
        p[key] = val;
      }
    }
  }
  return p;
}

/* 서버 category 문자열 정규화 */
function normalizeCat(
  c: PostSummary["category"]
): "CHECKLIST" | "FREE" | "QNA" | "UNKNOWN" {
  const s = String(c).toUpperCase();
  if (s === "CHECKLIST" || s === "FREE" || s === "QNA") return s as any;
  return "UNKNOWN";
}

export default function CommunityBoard() {
  const [cat, setCat] = useState<BoardCategory>("ALL");

  // 선택중(폼) 상태
  const [country, setCountry] = useState<string>(""); // ISO2
  const [universityId, setUniversityId] = useState<number | undefined>();

  // 적용된 검색값(이 값으로 실제 목록 호출)
  const [appliedCountry, setAppliedCountry] = useState<string>("");
  const [appliedUniversityId, setAppliedUniversityId] = useState<
    number | undefined
  >();

  // 드롭다운 옵션
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [universities, setUniversities] = useState<UniversityItem[]>([]);

  // 목록 상태
  const [items, setItems] = useState<PostSummary[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(20);
  const [hasNext, setHasNext] = useState(false);

  // 상태
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 국가 목록 최초 로드
  useEffect(() => {
    (async () => {
      try {
        const list = await fetchCountryCodes();
        setCountries(list);
      } catch {
        setCountries([]);
      }
    })();
  }, []);

  // 국가 변경 → 대학 목록 로드 & 대학 선택 초기화(폼 상태)
  useEffect(() => {
    setUniversityId(undefined);
    if (!country) {
      setUniversities([]);
      return;
    }
    (async () => {
      try {
        const list = await fetchUniversitiesByCountry(country);
        setUniversities(list);
      } catch {
        setUniversities([]);
      }
    })();
  }, [country]);

  // 카테고리/적용된 검색값 바뀌면 페이지 초기화
  useEffect(() => {
    setPage(0);
  }, [cat, appliedCountry, appliedUniversityId]);

  // 적용된 검색값으로 게시글 목록 호출
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const extras: Partial<GetPostsParams> = {};
        if (appliedCountry) extras.country = appliedCountry;
        if (appliedUniversityId !== undefined)
          extras.universityId = appliedUniversityId;

        // 정렬은 latest로 통일(필터 중심)
        const params = buildParams("ALL", page, size, "latest", extras);
        const res = await getCommunityPosts(params);

        if (!res.success) {
          if (!cancelled)
            setErrorMsg(res.message || "목록을 불러오지 못했습니다.");
          return;
        }

        const block: PageBlock<PostSummary> = res.data;

        if (!cancelled) {
          if (page === 0) setItems(block.content || []);
          else setItems((prev) => prev.concat(block.content || []));
          setHasNext(Boolean(block.hasNext));
          setInitialLoaded(true);
        }
      } catch {
        if (!cancelled) setErrorMsg("네트워크 오류가 발생했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, size, appliedCountry, appliedUniversityId]);

  // 탭(카테고리) 필터
  const visible = useMemo(() => {
    if (cat === "ALL") return items;
    return items.filter((p) => normalizeCat(p.category) === cat);
  }, [items, cat]);

  // 드롭다운 핸들러(폼 상태 갱신)
  function onChangeCountry(e: React.ChangeEvent<HTMLSelectElement>) {
    setCountry(e.target.value);
  }
  function onChangeUniversity(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setUniversityId(v ? Number(v) : undefined);
  }

  // 검색 버튼: /community/groups 호출(검증/로그 목적), 그리고 실제 목록 필터 적용
  async function onSearch() {
    try {
      const params: GetCommunityGroupsParams = {};
      if (country) params.country = country;
      if (universityId !== undefined) params.universityId = universityId;

      // 응답은 화면에서 사용하지 않음(Option A)
      await getCommunityGroups(params);

      setAppliedCountry(country);
      setAppliedUniversityId(universityId);
      setPage(0);
    } catch {
      setAppliedCountry(country);
      setAppliedUniversityId(universityId);
      setPage(0);
    }
  }

  return (
    <div className={styles.boardRoot}>
      <figure className={styles.boardHero} aria-label="Community board hero">
        <img
          src={communitySvg}
          alt="커뮤니티 일러스트"
          className={styles.boardHeroImg}
        />
      </figure>

      {/* 필터 바 */}
      <div
        className={styles.boardFilterBar}
        role="tablist"
        aria-label="게시글 분류"
      >
        {/* 카테고리 탭 */}
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
            onClick={() => setCat(c.key as BoardCategory)}
          >
            {c.label}
          </button>
        ))}

        <div className={styles.spacer} />

        {/* 국가 / 대학 드롭다운 + 검색 버튼 */}
        <div className={styles.sortWrap}>
          <select
            className={styles.select}
            value={country}
            onChange={onChangeCountry}
            aria-label="국가 선택"
          >
            <option value="">국가 전체</option>
            {countries.map((c) => (
              <option key={c.countryCode} value={c.countryCode}>
                {c.countryName}
              </option>
            ))}
          </select>

          <select
            className={styles.select}
            value={universityId ?? ""}
            onChange={onChangeUniversity}
            aria-label="대학 선택"
            disabled={!country}
          >
            <option value="">{country ? "대학 전체" : "국가 먼저 선택"}</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          <button type="button" className={styles.searchBtn} onClick={onSearch}>
            검색
          </button>
        </div>

        <Link to="/community/write" className={styles.writeBtn}>
          글쓰기
        </Link>
      </div>

      {/* 상태 표시 */}
      {errorMsg && <div className={styles.errorBox}>{errorMsg}</div>}

      {!initialLoaded && loading && (
        <ul className={styles.boardList}>
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className={`${styles.boardRow} ${styles.skeleton}`}>
              <div className={styles.rowLeft}>
                <div className={styles.rowBadge} />
                <div className={styles.skelTitle} />
                <div className={styles.skelLine} />
                <div className={styles.skelLine} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {initialLoaded && visible.length === 0 && !loading && !errorMsg && (
        <div className={styles.emptyBox}>게시글이 없습니다.</div>
      )}

      {/* 리스트 */}
      {visible.length > 0 && (
        <ul className={styles.boardList}>
          {visible.map((p) => {
            const createdAgo = timeAgo(p.createdAt);
            return (
              <li key={p.postId} className={styles.boardRow}>
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
                    <span className={styles.metaSep} />
                    <span>댓글 {p.replyCount ?? 0}</span>
                    <span className={styles.metaDot}>·</span>
                    <span>좋아요 {p.likeCount ?? 0}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 더보기 */}
      {visible.length > 0 && hasNext && (
        <div className={styles.loadMoreWrap}>
          <button
            type="button"
            className={styles.loadMoreBtn}
            disabled={loading}
            onClick={() => setPage((prev) => prev + 1)}
          >
            {loading ? "불러오는 중..." : "더보기"}
          </button>
        </div>
      )}

      {/* 플로팅 작성 버튼 */}
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

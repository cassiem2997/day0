import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./CommunityWrite.module.css";

import {
  fetchCountryCodes,
  fetchUniversitiesByCountry,
  type CountryItem,
  type UniversityItem,
} from "../../api/university";
import {
  createCommunityPost,
  updateCommunityPost,
  getCommunityPostDetail,
  type CommunityPostPayload,
} from "../../api/community";
import api from "../../api/axiosInstance";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const f = () => setIsMobile(window.innerWidth < breakpoint);
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, [breakpoint]);
  return isMobile;
}

type Cat = "CHECKLIST" | "FREE" | "QNA";

export default function CommunityWrite() {
  const isMobile = useIsMobile(768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((p) => !p);
  const nav = useNavigate();
  const [search] = useSearchParams();
  const editMode = search.get("edit") === "1";
  const postId = Number(search.get("postId"));
  const initialCat = (search.get("cat") as Cat) || "CHECKLIST";

  const [cat, setCat] = useState<Cat>(initialCat);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [countryCode, setCountryCode] = useState<string>("");
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [univId, setUnivId] = useState<number>(0);

  const [userId, setUserId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/me", { withCredentials: true });
        setUserId(res.data.userId);
      } catch {
        setUserId(null);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchCountryCodes();
        setCountries(list);
        if (list.length && !countryCode) setCountryCode(list[0].countryCode);
      } catch {
        setCountries([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!countryCode) {
      setUniversities([]);
      setUnivId(0);
      return;
    }
    (async () => {
      try {
        const list = await fetchUniversitiesByCountry(countryCode);
        setUniversities(list);
        setUnivId(list[0]?.id ?? 0);
      } catch {
        setUniversities([]);
        setUnivId(0);
      }
    })();
  }, [countryCode]);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // --- 수정 모드일 때 기존 값 불러오기 ---
  useEffect(() => {
    if (editMode && Number.isFinite(postId)) {
      (async () => {
        try {
          const data = await getCommunityPostDetail(
            postId,
            userId ?? undefined
          );
          const p = data.data;
          setTitle(p.title);
          setContent(p.body);
          setCat(p.category as Cat);
          setCountryCode(p.countryCode);
          setUnivId(p.universityId);
        } catch (e) {
          console.error("수정 모드 초기값 불러오기 실패", e);
        }
      })();
    }
  }, [editMode, postId, userId]);

  const isValid =
    title.trim().length > 0 &&
    content.trim().length >= 5 &&
    countryCode &&
    univId > 0;

  function onChooseFile(f?: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/"))
      return setErr("이미지 파일만 업로드 가능합니다.");
    if (f.size > 5 * 1024 * 1024)
      return setErr("이미지 최대 5MB까지 업로드 가능합니다.");
    setErr("");
    setFile(f);
  }
  function clearFile() {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setErr("필수 항목을 확인해주세요.");
      return;
    }
    if (!userId) {
      setErr("로그인이 필요합니다.");
      return;
    }
    setErr("");

    const payload: CommunityPostPayload = {
      title: title.trim(),
      body: content.trim(),
      category: cat,
      countryCode,
      universityId: univId,
    };

    try {
      if (editMode && Number.isFinite(postId)) {
        await updateCommunityPost(
          postId,
          {
            title: payload.title,
            body: payload.body,
            category: payload.category,
          },
          userId
        );
      } else {
        await createCommunityPost(payload, userId);
      }
      nav("/community", { replace: true });
    } catch (e) {
      console.error(e);
      setErr(
        editMode
          ? "수정 중 오류가 발생했습니다."
          : "등록 중 오류가 발생했습니다."
      );
    }
  }

  const fileName = useMemo(() => file?.name ?? "선택 안 함", [file]);

  return (
    <div className={styles.container}>
      {isMobile && (
        <>
          <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
          <button
            type="button"
            className={styles.hamburger}
            onClick={toggleSidebar}
            aria-label="메뉴"
          >
            <span />
            <span />
            <span />
          </button>
        </>
      )}

      <main className={styles.main}>
        {!isMobile && <Header />}
        <div className={styles.page}>
          <h1 className={styles.title}>COMMUNITY</h1>

          <form className={styles.card} onSubmit={onSubmit}>
            <label className={styles.field}>
              <span className={styles.label}>제목을 입력하세요</span>
              <input
                className={styles.input}
                placeholder="제목을 입력하세요"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>내용</span>
              <textarea
                className={styles.textarea}
                placeholder="내용을 입력하세요"
                rows={14}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </label>

            <div className={styles.field}>
              <span className={styles.label}>파일 업로드</span>
              <div className={styles.fileRow}>
                <label className={styles.btnPrimarySm}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className={styles.hiddenFile}
                    onChange={(e) => onChooseFile(e.target.files?.[0] ?? null)}
                  />
                  파일 선택
                </label>
                <span className={styles.fileChip}>{fileName}</span>
                <button
                  type="button"
                  className={styles.btnGhostSm}
                  onClick={clearFile}
                >
                  삭제
                </button>
                {preview && (
                  <img src={preview} alt="미리보기" className={styles.thumb} />
                )}
              </div>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>카테고리</span>
              <div className={styles.pills}>
                {(["CHECKLIST", "FREE", "QNA"] as Cat[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    className={cat === k ? styles.pillActive : styles.pill}
                    onClick={() => setCat(k)}
                  >
                    {k === "CHECKLIST"
                      ? "체크리스트"
                      : k === "FREE"
                      ? "자유게시판"
                      : "Q&A"}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.field}>
              <span className={styles.label}>국가 / 학교명</span>
              <div className={styles.row2}>
                <select
                  className={styles.select}
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                >
                  {countries.map((c) => (
                    <option key={c.countryCode} value={c.countryCode}>
                      {c.countryName || c.countryCode}
                    </option>
                  ))}
                </select>

                <select
                  className={styles.select}
                  value={univId || 0}
                  onChange={(e) => setUnivId(Number(e.target.value))}
                  disabled={universities.length === 0}
                >
                  {universities.length === 0 && (
                    <option value={0}>대학 목록 없음</option>
                  )}
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {err && <p className={styles.error}>{err}</p>}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.btnGhost}
                onClick={() => nav(-1)}
              >
                취소
              </button>
              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={!isValid}
              >
                {editMode ? "수정하기" : "등록하기"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

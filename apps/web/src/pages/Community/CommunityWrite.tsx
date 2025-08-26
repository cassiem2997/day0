import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./CommunityWrite.module.css";

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

type Cat = "CHECKLIST" | "FREE";

export default function CommunityWrite() {
  const isMobile = useIsMobile(768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((p) => !p);
  const nav = useNavigate();
  const [search] = useSearchParams();

  const initialCat = (search.get("cat") as Cat) || "CHECKLIST";

  // form state
  const [cat, setCat] = useState<Cat>(initialCat);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleChooseFile(f?: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setErr("이미지 파일만 업로드 가능합니다.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setErr("이미지 최대 5MB까지 업로드 가능합니다.");
      return;
    }
    setErr("");
    setFile(f);
  }

  const isValid = title.trim().length > 0 && content.trim().length >= 5;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      setErr("제목/내용을 확인해주세요.");
      return;
    }
    setErr("");

    // TODO: 실제 API 연동 (FormData 예시)
    // const fd = new FormData();
    // fd.append("category", cat);
    // fd.append("title", title);
    // fd.append("content", content);
    // if (file) fd.append("image", file);

    nav("/community", { replace: true });
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
          <h1 className={styles.title}>COMMUNITY</h1>

          <form className={styles.formCard} onSubmit={onSubmit}>
            {/* 상단: 분류 / 제목 */}
            <div className={styles.headGrid}>
              <div className={styles.field}>
                <label htmlFor="cat" className={styles.fieldLabel}>
                  분류
                </label>
                <select
                  id="cat"
                  className={styles.select}
                  value={cat}
                  onChange={(e) => setCat(e.target.value as Cat)}
                >
                  <option value="CHECKLIST">체크리스트</option>
                  <option value="FREE">자유게시판</option>
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="title" className={styles.fieldLabel}>
                  제목
                </label>
                <input
                  id="title"
                  className={styles.input}
                  placeholder="제목을 입력하세요"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>

            {/* 본문 + 이미지(간단 버튼) */}
            <div className={styles.bodyGrid}>
              <div className={styles.leftCol}>
                <div className={styles.field}>
                  <label htmlFor="content" className={styles.fieldLabel}>
                    내용
                  </label>
                  <textarea
                    id="content"
                    className={styles.textarea}
                    placeholder="내용을 입력하세요"
                    rows={14}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.rightCol}>
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>이미지</span>
                  <div className={styles.uploadInline}>
                    <label className={styles.btnFile}>
                      <input
                        type="file"
                        accept="image/*"
                        className={styles.hiddenFile}
                        onChange={(e) =>
                          handleChooseFile(e.target.files?.[0] ?? null)
                        }
                      />
                      파일 선택
                    </label>

                    {preview ? (
                      <img
                        src={preview}
                        alt="미리보기"
                        className={styles.thumb}
                      />
                    ) : (
                      <span className={styles.hint}>선택 안 함</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {err ? <p className={styles.error}>{err}</p> : null}

            <div className={styles.actionRow}>
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
                등록
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

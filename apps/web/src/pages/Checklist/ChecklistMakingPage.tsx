import { useState, type FormEvent, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../../components/Header/Header";
import styles from "./ChecklistPage.module.css";
import formStyles from "./ChecklistMaking.module.css";
import bg from "../../assets/checklistMaking.svg";
import underline from "../../assets/underline.svg";
import { createDeparture } from "../../api/departure";
import { createUserChecklist } from "../../api/checklist";
import { me, type MeResponse } from "../../api/user";

const COUNTRY_OPTIONS = ["미국", "영국", "호주", "캐나다", "일본"] as const;
const COUNTRY_CODE_MAP: Record<(typeof COUNTRY_OPTIONS)[number], string> = {
  미국: "US",
  영국: "GB",
  호주: "AU",
  캐나다: "CA",
  일본: "JP",
};

function toInstantStringKST(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error("출국일 형식이 올바르지 않습니다. (YYYY-MM-DD)");
  }
  return `${dateStr}T00:00:00+09:00`;
}

const UNIVERSITY_BY_COUNTRY: Record<
  (typeof COUNTRY_OPTIONS)[number],
  { id: number; name: string }[]
> = {
  미국: [
    { id: 1, name: "하버드 대학교" },
    { id: 2, name: "MIT" },
    { id: 3, name: "스탠퍼드 대학교" },
    { id: 4, name: "UC 버클리" },
  ],
  영국: [
    { id: 5, name: "옥스퍼드 대학교" },
    { id: 6, name: "케임브리지 대학교" },
    { id: 7, name: "UCL" },
    { id: 8, name: "LSE" },
  ],
  호주: [
    { id: 9, name: "멜버른 대학교" },
    { id: 10, name: "시드니 대학교" },
    { id: 11, name: "ANU" },
  ],
  캐나다: [
    { id: 12, name: "토론토 대학교" },
    { id: 13, name: "UBC" },
    { id: 14, name: "맥길 대학교" },
  ],
  일본: [
    { id: 15, name: "도쿄대학교" },
    { id: 16, name: "교토대학교" },
    { id: 17, name: "오사카대학교" },
  ],
};

const todayLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString()
  .split("T")[0];

export default function ChecklistMakingPage() {
  const navigate = useNavigate();

  const [leaveDate, setLeaveDate] = useState("");
  const [country, setCountry] = useState<string>("");
  const [universityId, setUniversityId] = useState<number | "">("");
  const [userId, setUserId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ✅ 쿠키 세션 기반 사용자 확인
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        console.log("[MakingPage] fetching /auth/me ...");
        const res: MeResponse = await me();
        if (!alive) return;
        console.log("[MakingPage] me:", res);
        if (res?.userId) {
          setUserId(res.userId);
        } else {
          console.warn("[MakingPage] me has no userId → /login");
          navigate("/login", { replace: true });
        }
      } catch (e) {
        console.warn("[MakingPage] me() failed → /login", e);
        navigate("/login", { replace: true });
      }
    })();
    return () => {
      alive = false;
    };
  }, [navigate]);

  const uniOptions = useMemo(
    () =>
      country
        ? UNIVERSITY_BY_COUNTRY[
            country as keyof typeof UNIVERSITY_BY_COUNTRY
          ] ?? []
        : [],
    [country]
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!userId) {
      alert("사용자 정보를 불러오는 중입니다...");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      const departureData = {
        userId,
        universityId: universityId ? (universityId as number) : null,
        programTypeId: 1,
        countryCode:
          COUNTRY_CODE_MAP[country as keyof typeof COUNTRY_CODE_MAP] ?? country,
        startDate: toInstantStringKST(leaveDate),
        endDate: null,
        status: "PLANNED" as const,
      };
      
      console.log("[MakingPage] createDeparture payload:", departureData);
      console.log("출국 데이터:", departureData);
      
      // API 호출
      const dep = await createDeparture(departureData);
      console.log("출국 생성 응답:", dep);

      console.log("[MakingPage] createDeparture response:", dep);
      const departureId: number =
        dep?.departureId ?? dep?.id ?? dep?.data?.departureId;
      if (!departureId) {
        console.error("[MakingPage] departureId not found!", dep);
        throw new Error("departureId를 확인할 수 없습니다.");
      }

      const checklistData = {
        userId,
        departureId,
        visibility: "PRIVATE" as const,
        title: `${country} 출국 체크리스트`,
        templateId: null,
      };
      
      // API 호출
      const checklist = await createUserChecklist(checklistData);
      console.log("체크리스트 생성 응답:", checklist);
      
      const { userChecklistId } = checklist;

      console.log("[MakingPage] ✔ checklist created:", userChecklistId);
      navigate(`/checklist/edit/${userChecklistId}`, {
        state: { justCreated: true },
      });
    } catch (err: any) {
      console.error("[MakingPage] create flow error:", err);
      alert(err?.response?.data?.message ?? "생성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <Header />
        <div className={styles.pageContent}>
          <header className={styles.heroWrap}>
            <img src={underline} alt="" className={styles.underline} />
            <p className={styles.subtitle}>완벽한 출국준비를 위한 첫걸음</p>
            <h1 className={styles.hero}>헤이 - 체크</h1>
          </header>

          <div className={formStyles.inner}>
            <img className={formStyles.bg} src={bg} alt="" />

            <form className={formStyles.card} onSubmit={handleSubmit}>
              <div className={formStyles.row}>
                <label className={formStyles.label}>예상출국일</label>
                <div className={formStyles.inputWrap}>
                  <input
                    className={`${formStyles.control} ${formStyles.date}`}
                    type="date"
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    required
                    min={todayLocal}
                  />
                </div>
              </div>

              <div className={formStyles.row}>
                <label className={formStyles.label}>국가</label>
                <div className={formStyles.inputWrap}>
                  <select
                    className={`${formStyles.control} ${formStyles.select}`}
                    value={country}
                    onChange={(e) => {
                      setCountry(e.target.value);
                      setUniversityId("");
                    }}
                    required
                  >
                    <option value="" disabled>
                      국가 선택
                    </option>
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <span className={formStyles.chevron} aria-hidden>
                    ▾
                  </span>
                </div>
              </div>

              <div className={formStyles.row}>
                <label className={formStyles.label}>대학교</label>
                <div className={formStyles.inputWrap}>
                  <select
                    className={`${formStyles.control} ${formStyles.select}`}
                    value={universityId}
                    onChange={(e) => setUniversityId(Number(e.target.value))}
                    required
                    disabled={!country}
                  >
                    <option value="" disabled>
                      {country ? "대학교 선택" : "국가 먼저 선택"}
                    </option>
                    {uniOptions.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                  <span className={formStyles.chevron} aria-hidden>
                    ▾
                  </span>
                </div>
              </div>

              <div className={formStyles.actions}>
                <button
                  type="button"
                  className={formStyles.secondary}
                  onClick={() => navigate("/checklist")}
                  disabled={submitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className={formStyles.cta}
                  disabled={submitting}
                >
                  다음
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

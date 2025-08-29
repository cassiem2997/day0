// src/pages/Checklist/ChecklistMakingPage.tsx
import { useState, type FormEvent, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../../components/Header/Header";
import styles from "./ChecklistPage.module.css";
import formStyles from "./ChecklistMaking.module.css";
import bg from "../../assets/checklistMaking.svg";
import underline from "../../assets/underline.svg";
import { createDeparture } from "../../api/departure";
import { createUserChecklist } from "../../api/checklist";
import { getCurrentUser } from "../../api/user";

const COUNTRY_OPTIONS = ["미국", "영국", "호주", "캐나다", "일본"] as const;

// 한글 → ISO2 코드 매핑 (DB의 CHAR(2)와 맞추기)
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
  // KST 자정으로 고정해 서버에 Offset 포함해 전달
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

export default function ChecklistMakingPage() {
  const navigate = useNavigate();

  const [leaveDate, setLeaveDate] = useState("");
  const [country, setCountry] = useState<string>("");
  const [universityId, setUniversityId] = useState<number | "">("");
  const [userId, setUserId] = useState<number | null>(null);

  // 사용자 정보 가져오기 - localStorage에서 userId 확인
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(Number(storedUserId));
    } else {
      // userId가 없으면 로그인 페이지로
      navigate("/login", { replace: true });
    }
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

    // handleSubmit 내부 핵심 변경점
    // const token = localStorage.getItem("accessToken");
    // if (!token || token === "undefined" || token === "null") {
    //   alert("로그인이 필요합니다.");
    //   navigate("/login", { replace: true });
    //   return;
    // }
    
    try {
      // userId가 아직 로드되지 않았다면 대기
      if (!userId) {
        alert("사용자 정보를 불러오는 중입니다...");
        return;
      }

      // 출국 컨텍스트 생성
      const dep = await createDeparture({
        userId,
        universityId: universityId ? (universityId as number) : null,
        programTypeId: 1, // 임시
        countryCode:
          COUNTRY_CODE_MAP[country as keyof typeof COUNTRY_CODE_MAP] ?? country,
        // 날짜는 서버에서 파싱하도록 YYYY-MM-DD 그대로 전달
        startDate: toInstantStringKST(leaveDate),
        endDate: null,
        status: "PLANNED",
      });

      const departureId: number =
        dep.departureId ?? dep.id ?? dep.data?.departureId;
      if (!departureId) throw new Error("departureId를 확인할 수 없습니다.");

      // 체크리스트 생성
      const checklist = await createUserChecklist({
        userId,
        departureId,
        visibility: "PRIVATE",
        title: `${country} 출국 체크리스트`, // 기본 제목 설정
        templateId: null,
      });

      const userChecklistId: number =
        checklist.userChecklistId ??
        checklist.id ??
        checklist.data?.userChecklistId;
      if (!userChecklistId)
        throw new Error("userChecklistId를 확인할 수 없습니다.");

      // 편집 페이지로 이동
      navigate(`/checklist/edit/${userChecklistId}`, {
        state: { justCreated: true },
      });
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message ?? "생성 중 오류가 발생했습니다.");
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
                  >
                    취소
                  </button>
                  <button type="submit" className={formStyles.cta}>
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

import { useState, type FormEvent, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./ChecklistPage.module.css";
import formStyles from "./ChecklistMaking.module.css";
import bg from "../../assets/checklistMaking.svg";
import { createDeparture } from "../../api/departure";

const COUNTRY_OPTIONS = ["미국", "영국", "호주", "캐나다", "일본"] as const;

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((p) => !p);

  const [leaveDate, setLeaveDate] = useState("");
  const [country, setCountry] = useState<string>("");
  const [universityId, setUniversityId] = useState<number | "">("");

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

    try {
      const payload = {
        userId: 1, // TODO: 로그인 사용자 ID 동적으로 가져오기
        universityId: universityId ? (universityId as number) : null,
        programTypeId: 1, // TODO: 프로그램 종류 선택 UI 후 값 연동
        countryCode: country,
        startDate: new Date(leaveDate).toISOString(),
        endDate: null,
        status: "PLANNED" as const,
      };

      const data = await createDeparture(payload);
      console.log("출국 컨텍스트 생성 성공:", data);

      // TODO: 생성된 departure_id 기반 체크리스트 생성 API 호출 필요
      navigate("/checklist");
    } catch (err) {
      console.error(err);
      alert("출국 컨텍스트 생성 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className={styles.container}>
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

      <main className={styles.main}>
        <Header />
        <div className={styles.pageContent}>
          <header className={styles.heroWrap}>
            <h1 className={styles.hero}>CHECKLIST</h1>
          </header>

          <section className={formStyles.stage}>
            <div className={formStyles.inner}>
              <img className={formStyles.bg} src={bg} alt="" />

              <form className={formStyles.card} onSubmit={handleSubmit}>
                {/* 날짜 */}
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

                {/* 국가 */}
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

                {/* 대학교 */}
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
          </section>
        </div>
      </main>
    </div>
  );
}

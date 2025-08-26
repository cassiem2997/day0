import { useState, type FormEvent, useMemo } from "react";
import styles from "./ChecklistMaking.module.css";
import bg from "../../assets/checklistMaking.svg";

type ChecklistMakingProps = {
  onSubmit?: (payload: {
    leaveDate: string;
    country: string;
    university: string;
  }) => void;
  onCancel?: () => void;
  avatarUrl?: string;
};

const COUNTRY_OPTIONS = ["미국", "영국", "호주", "캐나다", "일본"] as const;
const UNIVERSITY_BY_COUNTRY: Record<
  (typeof COUNTRY_OPTIONS)[number],
  string[]
> = {
  미국: ["하버드 대학교", "MIT", "스탠퍼드 대학교", "UC 버클리"],
  영국: ["옥스퍼드 대학교", "케임브리지 대학교", "UCL", "LSE"],
  호주: ["멜버른 대학교", "시드니 대학교", "ANU"],
  캐나다: ["토론토 대학교", "UBC", "맥길 대학교"],
  일본: ["도쿄대학교", "교토대학교", "오사카대학교"],
};

export default function ChecklistMaking({
  onSubmit,
  onCancel,
  avatarUrl,
}: ChecklistMakingProps) {
  const [leaveDate, setLeaveDate] = useState("");
  const [country, setCountry] = useState<string>("");
  const uniOptions = useMemo(
    () =>
      country
        ? UNIVERSITY_BY_COUNTRY[
            country as keyof typeof UNIVERSITY_BY_COUNTRY
          ] ?? []
        : [],
    [country]
  );
  const [university, setUniversity] = useState<string>("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit?.({ leaveDate, country, university });
  };

  const handleCountry = (val: string) => {
    setCountry(val);
    setUniversity("");
  };

  return (
    <section className={styles.stage}>
      <div className={styles.inner}>
        <img className={styles.bg} src={bg} alt="" />
        {avatarUrl ? (
          <img className={styles.avatar} src={avatarUrl} alt="avatar" />
        ) : null}

        <form className={styles.card} onSubmit={handleSubmit}>
          {/* 날짜 */}
          <div className={styles.row}>
            <label className={styles.label}>예상출국일</label>
            <div className={styles.inputWrap}>
              <input
                className={`${styles.control} ${styles.date}`}
                type="date"
                value={leaveDate}
                onChange={(e) => setLeaveDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* 국가 */}
          <div className={styles.row}>
            <label className={styles.label}>국가</label>
            <div className={styles.inputWrap}>
              <select
                className={`${styles.control} ${styles.select}`}
                value={country}
                onChange={(e) => handleCountry(e.target.value)}
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
              <span className={styles.chevron} aria-hidden>
                ▾
              </span>
            </div>
          </div>

          {/* 대학교 */}
          <div className={styles.row}>
            <label className={styles.label}>대학교</label>
            <div className={styles.inputWrap}>
              <select
                className={`${styles.control} ${styles.select}`}
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                required
                disabled={!country}
              >
                <option value="" disabled>
                  {country ? "대학교 선택" : "국가 먼저 선택"}
                </option>
                {uniOptions.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <span className={styles.chevron} aria-hidden>
                ▾
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondary}
              onClick={onCancel}
            >
              취소
            </button>
            <button type="submit" className={styles.cta}>
              생성하기
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

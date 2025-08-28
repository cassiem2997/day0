import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./MyPageProfile.module.css";
import formStyles from "../Checklist/ChecklistMaking.module.css"; // 폼 컨트롤 스타일 재사용
import {
  me,
  getUserProfile,
  updateUserProfile,
  type UserProfile,
  type UpdateUserProfileBody,
} from "../../api/user";
import {
  fetchCountryCodes,
  fetchUniversitiesByCountry,
  type CountryItem,
  type UniversityItem,
} from "../../api/university";

/** 화면 표현용 타입 (UI 유지) */
type ProfileVM = {
  nickname: string;
  homeUniversity: string;
  departureDate: string; // UI-only
  destinationLabel: string;
  profileImage?: string | null;
};

type ActivityItem = { id: string; title: string; date: string };

/* D-Day 계산 */
function dday(target?: string) {
  if (!target || target === "-") return "-";
  const tgt = new Date(target + "T00:00:00");
  const today = new Date();
  const diff = Math.ceil(
    (tgt.getTime() - today.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
  );
  return diff >= 0 ? `D - ${diff}` : `D + ${Math.abs(diff)}`;
}

// ---- 더미(활동 내역은 아직 API 정보 없음) ----
const DUMMY_POSTS: ActivityItem[] = [
  { id: "p1", title: "출국 전 준비 팁 모음", date: "2025-08-22" },
  { id: "p2", title: "비자 발급 후기", date: "2025-08-19" },
];
const DUMMY_COMMENTS: ActivityItem[] = [
  { id: "c1", title: "체크리스트 항목 좋은데요!", date: "2025-08-21" },
  { id: "c2", title: "보험은 어디가 괜찮나요?", date: "2025-08-20" },
];
const DUMMY_SAVED: ActivityItem[] = [
  { id: "s1", title: "런던 3개월 어학연수 체크리스트", date: "2025-08-18" },
  { id: "s2", title: "환전 전 체크하기", date: "2025-08-16" },
];

export default function MyPageProfile() {
  const [pf, setPf] = useState<ProfileVM | null>(null);
  const [raw, setRaw] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /** 편집 모달 상태 */
  const [editOpen, setEditOpen] = useState(false);
  const [nick, setNick] = useState("");
  const [date, setDate] = useState(""); // UI-only (TODO: Departure 연동)
  const [countryCode, setCountryCode] = useState<string>(""); // ISO2
  const [universityId, setUniversityId] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /** 국가/대학 옵션 */
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [universitiesLoading, setUniversitiesLoading] = useState(false);
  const uniCacheRef = useRef<Record<string, UniversityItem[]>>({}); // countryCode → list 캐시

  const countryNameByCode = useMemo(() => {
    const map: Record<string, string> = {};
    countries.forEach((c) => (map[c.countryCode] = c.countryName));
    return map;
  }, [countries]);

  /** 최초 프로필 */
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const auth = await me();
        const userId = auth?.userId;
        if (!userId) {
          setErr("로그인이 필요합니다.");
          return;
        }
        const res = await getUserProfile(userId);
        const u: UserProfile = res.data;
        setRaw(u);

        const vm: ProfileVM = {
          nickname: u.nickname || u.name || "사용자",
          homeUniversity: u.homeUnivId ? `#${u.homeUnivId}` : "-",
          departureDate: "-", // 서버 미보유
          destinationLabel: u.destUnivId ? `#${u.destUnivId}` : "-",
          profileImage: u.profileImage ?? null,
        };
        setPf(vm);
      } catch (e: any) {
        const msg =
          e?.response?.data?.message || e?.message || "프로필을 불러오지 못했어요.";
        setErr(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /** 모달 열기 */
  async function openEdit() {
    if (!pf) return;
    setNick(pf.nickname);
    setDate(pf.departureDate === "-" ? "" : pf.departureDate);
    setFile(null);
    setPreview(pf.profileImage ?? null);

    // 국가 목록
    if (countries.length === 0) {
      try {
        setCountriesLoading(true);
        const list = await fetchCountryCodes();
        setCountries(list);
      } catch (e) {
        console.error(e);
      } finally {
        setCountriesLoading(false);
      }
    }

    // 기존 목적지 대학 프리셀렉트는 서버에 국가 정보가 없을 수 있어 생략
    setCountryCode("");
    setUniversityId("");
    setUniversities([]);

    setEditOpen(true);
  }

  /** ESC로 닫기 + 바디 스크롤 잠금 */
  useEffect(() => {
    if (!editOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setEditOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [editOpen]);

  /** 파일 미리보기 */
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  /** 국가 변경 → 대학 로드(캐시) */
  async function onChangeCountry(code: string) {
    setCountryCode(code);
    setUniversityId("");
    if (!code) {
      setUniversities([]);
      return;
    }
    if (uniCacheRef.current[code]) {
      setUniversities(uniCacheRef.current[code]);
      return;
    }
    try {
      setUniversitiesLoading(true);
      const list = await fetchUniversitiesByCountry(code);
      uniCacheRef.current[code] = list;
      setUniversities(list);
    } catch (e) {
      console.error(e);
      setUniversities([]);
    } finally {
      setUniversitiesLoading(false);
    }
  }

  /** 저장 */
  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!raw) return;
    setSaving(true);
    try {
      const auth = await me();
      const userId = auth?.userId;
      if (!userId) throw new Error("로그인이 필요합니다.");

      const body: UpdateUserProfileBody = {
        nickname: nick.trim() || undefined,
        destUnivId: typeof universityId === "number" ? universityId : undefined,
        // 출국일(date)은 현재 프로필 API에 없음 → TODO: Departure API로 반영
      };

      const res = await updateUserProfile(userId, body, file);
      const u = res.data;
      setRaw(u);

      setPf({
        nickname: u.nickname || u.name || "사용자",
        homeUniversity: u.homeUnivId ? `#${u.homeUnivId}` : "-",
        departureDate: date || "-", // UI만 업데이트
        destinationLabel: u.destUnivId ? `#${u.destUnivId}` : "-",
        profileImage: u.profileImage ?? null,
      });

      setEditOpen(false);
    } catch (e: any) {
      alert(e?.response?.data?.message || e?.message || "프로필 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <section className={styles.wrap}>불러오는 중…</section>;
  }
  if (err) {
    return (
      <section className={styles.wrap} style={{ color: "#c0392b", fontWeight: 800 }}>
        {err}
      </section>
    );
  }
  if (!pf) return null;

  return (
    <section className={styles.wrap} aria-label="내 프로필 및 활동 내역">
      {/* 프로필 카드 */}
      <div className={styles.profileCard}>
        <div className={styles.profileLeft}>
          <div className={styles.avatarBox}>
            {pf.profileImage ? (
              <img
                src={pf.profileImage}
                alt="프로필"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 18 }}
              />
            ) : (
              <span className={styles.avatarText}>이미지</span>
            )}
          </div>

          <div className={styles.profileText}>
            <h2 className={styles.nick}>{pf.nickname}</h2>
            <p className={styles.subInfo}>{pf.homeUniversity}</p>
          </div>

          <div className={styles.leftBottom}>
            <button type="button" className={styles.editBtn} onClick={openEdit}>
              수정
            </button>
          </div>
        </div>

        <div className={styles.profileRight}>
          <div className={styles.hangingBadgeWrap}>
            <div className={styles.hangingBadge}>
              <span className={styles.badgeLabel}>{dday(pf.departureDate)}</span>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.fieldKey}>출국일</div>
            <div className={styles.fieldVal}>
              <span className={styles.valText}>
                {pf.departureDate === "-" ? "-" : pf.departureDate.replaceAll("-", ".") + "(일)"}
              </span>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.fieldKey}>국가/도착지</div>
            <div className={styles.fieldVal}>
              <span className={styles.valText}>{pf.destinationLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 활동 내역 (아직 더미) */}
      <div className={styles.activityGrid}>
        <ActivityCard title="작성한 글" items={DUMMY_POSTS} />
        <ActivityCard title="작성한 댓글" items={DUMMY_COMMENTS} />
        <ActivityCard title="저장한 체크리스트" items={DUMMY_SAVED} />
      </div>

      {/* ===== 스크롤 가능한 모달 ===== */}
      {editOpen && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          onClick={() => setEditOpen(false)}   // 바깥 클릭 닫기
        >
          <section
            className={styles.modal}
            onClick={(e) => e.stopPropagation()} // 안쪽 클릭은 전파 막기
          >
            <header className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>프로필 수정</h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setEditOpen(false)}
                aria-label="닫기"
              >
                닫기
              </button>
            </header>

            <div className={styles.modalBody}>
              <form onSubmit={saveEdit}>
                {/* 닉네임 */}
                <div className={formStyles.row}>
                  <label className={formStyles.label}>닉네임</label>
                  <div className={formStyles.inputWrap}>
                    <input
                      className={formStyles.control}
                      type="text"
                      value={nick}
                      onChange={(e) => setNick(e.target.value)}
                      maxLength={20}
                      placeholder="닉네임"
                      required
                    />
                  </div>
                </div>

                {/* 프로필 이미지 + 미리보기 */}
                <div className={formStyles.row}>
                  <label className={formStyles.label}>프로필</label>
                  <div className={formStyles.inputWrap}>
                    <input
                      className={formStyles.control}
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                    {preview ? (
                      <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center" }}>
                        <img
                          src={preview}
                          alt="미리보기"
                          style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 12, border: "2px solid #111" }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            setPreview(raw?.profileImage ?? null);
                          }}
                          className={formStyles.secondary}
                          style={{ height: 40, padding: "6px 12px" }}
                        >
                          선택 해제
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* 예상출국일 (UI-only) */}
                <div className={formStyles.row}>
                  <label className={formStyles.label}>예상출국일</label>
                  <div className={formStyles.inputWrap}>
                    <input
                      className={`${formStyles.control} ${formStyles.date}`}
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* 국가(동적) */}
                <div className={formStyles.row}>
                  <label className={formStyles.label}>국가</label>
                  <div className={formStyles.inputWrap}>
                    <select
                      className={`${formStyles.control} ${formStyles.select}`}
                      value={countryCode}
                      onChange={(e) => onChangeCountry(e.target.value)}
                      disabled={countriesLoading}
                    >
                      <option value="" disabled>
                        {countriesLoading ? "불러오는 중…" : "국가 선택"}
                      </option>
                      {countries.map((c) => (
                        <option key={c.countryCode} value={c.countryCode}>
                          {c.countryName} ({c.countryCode})
                        </option>
                      ))}
                    </select>
                    <span className={formStyles.chevron} aria-hidden>
                      ▾
                    </span>
                  </div>
                </div>

                {/* 대학교(동적) */}
                <div className={formStyles.row}>
                  <label className={formStyles.label}>대학교</label>
                  <div className={formStyles.inputWrap}>
                    <select
                      className={`${formStyles.control} ${formStyles.select}`}
                      value={universityId}
                      onChange={(e) => setUniversityId(Number(e.target.value))}
                      disabled={!countryCode || universitiesLoading}
                    >
                      <option value="" disabled>
                        {!countryCode
                          ? "국가 먼저 선택"
                          : universitiesLoading
                          ? "불러오는 중…"
                          : "대학교 선택"}
                      </option>
                      {universities.map((u) => (
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

                <div className={formStyles.actions} style={{ marginTop: 18 }}>
                  <button
                    type="button"
                    className={formStyles.secondary}
                    onClick={() => setEditOpen(false)}
                    disabled={saving}
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className={formStyles.cta}
                    disabled={saving || !nick.trim()}
                  >
                    {saving ? "저장 중…" : "저장"}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function ActivityCard({ title, items }: { title: string; items: ActivityItem[] }) {
  return (
    <section className={styles.card} aria-label={title}>
      <h3 className={styles.cardTitle}>{title}</h3>
      {items.length === 0 ? (
        <p className={styles.empty}>내역이 없어요.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((it) => (
            <li key={it.id} className={styles.item}>
              <span className={styles.itemTitle}>{it.title}</span>
              <span className={styles.itemDate}>{it.date}</span>
            </li>
          ))}
        </ul>
      )}
      <div className={styles.cardFooter}>
        <button className={styles.moreBtn} type="button">
          더 보기
        </button>
      </div>
    </section>
  );
}

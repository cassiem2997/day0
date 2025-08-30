import { useEffect, useRef, useState } from "react";
import styles from "./MyPageProfile.module.css";
import formStyles from "../Checklist/ChecklistMaking.module.css";
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

type ProfileVM = {
  nickname: string;
  homeUniversity: string;
  departureDate: string;
  destinationLabel: string;
  profileImage?: string | null;
  mileage: number;
};

function dday(target?: string) {
  if (!target || target === "-") return "-";

  const iso = target.includes("T") ? target : `${target}T00:00:00`;
  const tgt = new Date(iso);

  if (isNaN(tgt.getTime())) return "-"; // 혹시라도 잘못된 값 들어오면 방어

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = Math.ceil((tgt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? `D - ${diff}` : `D + ${Math.abs(diff)}`;
}


const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const todayLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  .toISOString()
  .split("T")[0];

function absUrlMaybe(path?: string | null) {
  if (!path) return null;
  if (path.startsWith("/")) return `${API_BASE}${path}`;
  return path;
}

function toNum(v: unknown, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

function lsKey(userId: number) {
  return `my:departureDate:${userId}`;
}

export default function MyPageProfile() {
  const [pf, setPf] = useState<ProfileVM | null>(null);
  const [raw, setRaw] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [nick, setNick] = useState("");
  const [date, setDate] = useState("");
  const [countryCode, setCountryCode] = useState<string>("");
  const [universityId, setUniversityId] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [universitiesLoading, setUniversitiesLoading] = useState(false);
  const uniCacheRef = useRef<Record<string, UniversityItem[]>>({});

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

        const homeLabel =
          (u as any).homeUniv ??
          (u.homeUnivId != null ? `#${u.homeUnivId}` : "-");

        const destLabel =
          (u as any).destUniv ??
          (u.destUnivId != null ? `#${u.destUnivId}` : "-");

        const departureDate = (u as any).departureDate ??
        (u.departureDate != null ? `#${u.departureDate}` : "-");

        const mileage = toNum(
          (u as any).mileage ?? (u as any).miles ?? (u as any).points,
          0
        );

        const vm: ProfileVM = {
          nickname: u.nickname || u.name || "사용자",
          homeUniversity: homeLabel,
          departureDate: departureDate === "-" ? "-" : departureDate,
          destinationLabel: destLabel,
          profileImage: absUrlMaybe(u.profileImage),
          mileage,
        };
        setPf(vm);
      } catch (e: any) {
        const msg =
          e?.response?.data?.message ||
          e?.message ||
          "프로필을 불러오지 못했어요.";
        setErr(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function openEdit() {
    if (!pf) return;
    setNick(pf.nickname);
    setDate(pf.departureDate === "-" ? "" : pf.departureDate);
    setFile(null);
    setPreview(pf.profileImage ?? null);

    if (countries.length === 0) {
      try {
        setCountriesLoading(true);
        const list = await fetchCountryCodes();
        setCountries(list);
      } finally {
        setCountriesLoading(false);
      }
    }

    setCountryCode("");
    setUniversityId("");
    setUniversities([]);
    setEditOpen(true);
  }

  useEffect(() => {
    if (!editOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setEditOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [editOpen]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

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
    } catch {
      setUniversities([]);
    } finally {
      setUniversitiesLoading(false);
    }
  }

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
      };

      const res = await updateUserProfile(userId, body, file);
      const u = res.data;
      setRaw(u);

      let destLabel =
        (u as any).destUniv ??
        (u.destUnivId != null ? `#${u.destUnivId}` : "-");

      if (typeof universityId === "number") {
        const found = universities.find((x) => x.id === universityId);
        if (found) destLabel = found.name;
      }

      const finalDate = date || "-";
      localStorage.setItem(lsKey(userId), finalDate);

      const mileage = toNum(
        (u as any).mileage ?? (u as any).miles ?? (u as any).points,
        pf?.mileage ?? 0
      );

      setPf({
        nickname: u.nickname || u.name || "사용자",
        homeUniversity:
          (u as any).homeUniv ??
          (u.homeUnivId != null ? `#${u.homeUnivId}` : "-"),
        departureDate: finalDate,
        destinationLabel: destLabel,
        profileImage: absUrlMaybe(u.profileImage),
        mileage,
      });

      setEditOpen(false);
    } catch (e: any) {
      alert(
        e?.response?.data?.message ||
          e?.message ||
          "프로필 저장에 실패했습니다."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <section className={styles.wrap}>불러오는 중…</section>;
  if (err) {
    return (
      <section
        className={styles.wrap}
        style={{ color: "#c0392b", fontWeight: 800 }}
      >
        {err}
      </section>
    );
  }
  if (!pf) return null;

  return (
    <section className={styles.wrap} aria-label="내 프로필 및 활동 내역">
      <div className={styles.profileCard}>
        <div className={styles.profileLeft}>
          <div className={styles.avatarBox}>
            {pf.profileImage ? (
              <img
                src={pf.profileImage}
                alt="프로필"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 18,
                }}
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
            <div className={styles.mileageBox} aria-label="보유 마일리지">
              <span className={styles.mileageKey}>보유 마일리지</span>
              <span className={styles.mileageVal}>
                {pf.mileage.toLocaleString("ko-KR")} P
              </span>
            </div>
          </div>
        </div>

        <div className={styles.profileRight}>
          <div className={styles.hangingBadgeWrap}>
            <div className={styles.hangingBadge}>
              <span className={styles.badgeLabel}>
                {dday(pf.departureDate)}
              </span>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.fieldKey}>출국일</div>
            <div className={styles.fieldVal}>
              <span className={styles.valText}>
                {pf.departureDate === "-"
                  ? "-"
                  : pf.departureDate.slice(0, 10).replaceAll("-", ".") }
              </span>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.fieldKey}>예정 학교</div>
            <div className={styles.fieldVal}>
              <span className={styles.valText}>{pf.destinationLabel}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className={`${styles.editBtn} ${styles.editFab}`}
          onClick={openEdit}
          aria-label="프로필 수정"
        >
          수정
        </button>
      </div>

      {editOpen && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          onClick={() => setEditOpen(false)}
        >
          <section
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
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
                      <div
                        style={{
                          marginTop: 10,
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <img
                          src={preview}
                          alt="미리보기"
                          style={{
                            width: 64,
                            height: 64,
                            objectFit: "cover",
                            borderRadius: 12,
                            border: "2px solid #111",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            setPreview(
                              raw?.profileImage
                                ? absUrlMaybe(raw.profileImage)
                                : null
                            );
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

                <div className={formStyles.row}>
                  <label className={formStyles.label}>예상출국일</label>
                  <div className={formStyles.inputWrap}>
                    <input
                      className={`${formStyles.control} ${formStyles.date}`}
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={todayLocal}
                    />
                  </div>
                </div>

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

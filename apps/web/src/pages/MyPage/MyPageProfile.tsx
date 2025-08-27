// src/pages/MyPage/MyPageProfile.tsx
import { useEffect, useState } from "react";
import styles from "./MyPageProfile.module.css";
import api from "../../api/axiosInstance";
import { getUserProfile, type UserProfile } from "../../api/user";

/** 화면 표현용 타입 (UI 유지) */
type ProfileVM = {
  nickname: string;
  homeUniversity: string;
  departureDate: string; 
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
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // 1) 로그인 사용자 확인
        const me = await api.get("/auth/me", { withCredentials: true });
        const userId = me?.data?.userId as number | undefined;
        if (!userId) {
          setErr("로그인이 필요합니다.");
          setLoading(false);
          return;
        }

        // 2) 프로필 조회
        const res = await getUserProfile(userId);
        const u: UserProfile = res.data;

        // 3) 화면용 매핑
        const vm: ProfileVM = {
          nickname: u.nickname || u.name || "사용자",
          homeUniversity: u.homeUnivId ? `#${u.homeUnivId}` : "-",
          // 아래 2개는 스웨거에 아직 없어서 임시값 처리
          departureDate: "-", // 추후 API 필드 생기면 교체
          destinationLabel: u.destUnivId ? `#${u.destUnivId}` : "-",
          profileImage: u.profileImage ?? null,
        };
        setPf(vm);
      } catch (e: any) {
        setErr(e?.response?.data?.message || "프로필을 불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <section className={styles.wrap}>불러오는 중…</section>;
  }
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
      {/* 프로필 카드 */}
      <div className={styles.profileCard}>
        <div className={styles.profileLeft}>
          <div className={styles.avatarBox}>
            {pf.profileImage ? (
              // 프로필 이미지가 URL로 내려온다면 이렇게 표시
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
            <button type="button" className={styles.editBtn}>
              수정
            </button>
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
                  : pf.departureDate.replaceAll("-", ".") + "(일)"}
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
    </section>
  );
}

function ActivityCard({
  title,
  items,
}: {
  title: string;
  items: ActivityItem[];
}) {
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

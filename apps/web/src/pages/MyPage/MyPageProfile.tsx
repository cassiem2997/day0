// src/pages/MyPage/MyPageProfile.tsx
import styles from "./MyPageProfile.module.css";

/** 실데이터로 바꿀 때 이 타입만 맞추면 됨 */
type Profile = {
  nickname: string;
  homeUniversity: string;
  departureDate: string; // "2025-08-31"
  destinationLabel: string; // "대학교이름(JPN)" 등
};

type ActivityItem = { id: string; title: string; date: string };

const DUMMY_PROFILE: Profile = {
  nickname: "닉네임",
  homeUniversity: "국내대학이름",
  departureDate: "2025-08-31",
  destinationLabel: "대학교이름(JPN)",
};

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

function dday(target: string) {
  const tgt = new Date(target + "T00:00:00");
  const today = new Date();
  const diff = Math.ceil(
    (tgt.getTime() - today.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24)
  );
  return diff >= 0 ? `D - ${diff}` : `D + ${Math.abs(diff)}`;
}

export default function MyPageProfile() {
  const pf = DUMMY_PROFILE;

  return (
    <section className={styles.wrap} aria-label="내 프로필 및 활동 내역">
      {/* 프로필 카드 */}
      <div className={styles.profileCard}>
        <div className={styles.profileLeft}>
          <div className={styles.avatarBox}>
            <span className={styles.avatarText}>이미지</span>
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
                {pf.departureDate.replaceAll("-", ".")}(<span>일</span>)
              </span>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.fieldKey}>국가</div>
            <div className={styles.fieldVal}>
              <span className={styles.valText}>{pf.destinationLabel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 활동 내역 */}
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

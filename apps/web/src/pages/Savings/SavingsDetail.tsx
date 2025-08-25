import styles from "./SavingsPage.module.css";

export type DetailItem = {
  id: number;
  category: string; // 예: "미션", "자동이체"
  amount: number; // 입금액(+)
  description: string;
  date: string; // YYYY-MM-DD
};

const DUMMY: DetailItem[] = [
  {
    id: 1,
    category: "미션",
    amount: 5000,
    description:
      "미션 성공 추가 납입액과 적금 납입 내역을 한 눈에 확인 가능합니다.",
    date: "2025-08-23",
  },
  {
    id: 2,
    category: "자동이체",
    amount: 50000,
    description: "8월 자동이체 납입 완료.",
    date: "2025-08-15",
  },
  {
    id: 3,
    category: "미션",
    amount: 15000,
    description: "체크리스트 3건 완료 보너스 입금.",
    date: "2025-08-10",
  },
];

function formatAmount(n: number) {
  return n.toLocaleString("ko-KR");
}

export default function SavingsDetail({
  items = DUMMY,
}: {
  items?: DetailItem[];
}) {
  return (
    <section className={styles.detailSection} aria-label="적금 내역">
      {/* 헤더: 큰 타이틀 + 설명 */}
      <div className={styles.detailHeader}>
        <h2 className={styles.detailTitle}>
          <span>Saving</span>
          <br />
          <span>Details</span>
        </h2>

        <p className={styles.detailDesc}>
          미션 성공 추가 납입액과 적금 납입 내역을
          <br />한 눈에 확인 가능합니다.
        </p>
      </div>

      {/* 표 카드 */}
      <div className={styles.detailCard}>
        <div className={styles.detailHeadRow}>
          <div className={`${styles.headCell} ${styles.headLabel}`}>구분</div>
          <div className={`${styles.headCell} ${styles.headLabel}`}>액수</div>
          <div className={`${styles.headCell} ${styles.headLabel}`}>내용</div>
          <div className={`${styles.headCell} ${styles.headLabel}`}>일시</div>
        </div>

        {/* 표 본문 */}
        <ul className={styles.detailList}>
          {items.map((row) => (
            <li key={row.id} className={styles.detailRow}>
              <div className={styles.colType}>{row.category}</div>
              <div className={styles.colAmount}>
                + {formatAmount(row.amount)}원
              </div>
              <div className={styles.colDesc}>{row.description}</div>
              <div className={styles.colDate}>{row.date}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

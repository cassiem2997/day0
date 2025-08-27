import styles from "./MyPageSavings.module.css";

type AccountType = "SAVING" | "DEPOSIT" | "FX";

interface AccountRow {
  type: AccountType;
  title: string;
  number: string;
  balance: string; // 통화 기호 포함된 표시용 문자열
}

const DUMMY: AccountRow[] = [
  {
    type: "SAVING",
    title: "런던 3개월 어학연수 (맥시멀리스트)",
    number: "088-123-123456",
    balance: "51,515 KRW",
  },
  {
    type: "DEPOSIT",
    title: "쓸편한 입출금 통장",
    number: "110-606-123456",
    balance: "123,456 KRW",
  },
  {
    type: "FX",
    title: "외화 입출금 통장",
    number: "110-606-123456",
    balance: "1,422 $",
  },
];

function TypeBadge({ t }: { t: AccountType }) {
  if (t === "SAVING")
    return (
      <span className={`${styles.badge} ${styles.badgeSaving}`}>적금</span>
    );
  if (t === "DEPOSIT")
    return (
      <span className={`${styles.badge} ${styles.badgeDeposit}`}>입출금</span>
    );
  return <span className={`${styles.badge} ${styles.badgeFx}`}>외화</span>;
}

export default function MyPageSavings() {
  return (
    <section className={styles.wrap} aria-label="계좌 조회">

      <div className={styles.titleRow}>
        <h2 className={styles.title}>계좌 조회</h2>
        <button
          type="button"
          className={styles.createBtn}
          aria-label="계좌 등록"
        >
          계좌 등록
        </button>
      </div>

      <div className={styles.tableCard}>
        {/* 헤더 */}
        <div className={styles.head} role="row">
          <div className={styles.th}>구분</div>
          <div className={styles.th}>계좌명</div>
          <div className={`${styles.th} ${styles.thRight}`}>잔액</div>
        </div>

        {/* 바디 */}
        <div className={styles.body}>
          {DUMMY.map((row, i) => (
            <div key={i} className={styles.row} role="row">
              <div className={styles.cell}>
                <TypeBadge t={row.type} />
              </div>

              <div className={`${styles.cell} ${styles.titleCell}`}>
                <div className={styles.itemTitle}>{row.title}</div>
                <div className={styles.accountNum}>{row.number}</div>
              </div>

              <div className={`${styles.cell} ${styles.cellRight}`}>
                <span className={styles.balance}>{row.balance}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

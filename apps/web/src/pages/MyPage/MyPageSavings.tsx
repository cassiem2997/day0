import { useState } from "react";
import styles from "./MyPageSavings.module.css";
import MyPageSavingsDetail from "./MyPageSavingsDetail";

type AccountType = "SAVING" | "DEPOSIT" | "FX";

interface AccountRow {
  id: string;
  type: AccountType;
  title: string;
  number: string;
  balance: string; // 표시용
}

const DUMMY: AccountRow[] = [
  {
    id: "a1",
    type: "SAVING",
    title: "런던 3개월 어학연수 (맥시멀리스트)",
    number: "088-123-123456",
    balance: "51,515 KRW",
  },
  {
    id: "a2",
    type: "DEPOSIT",
    title: "쓸편한 입출금 통장",
    number: "110-606-123456",
    balance: "123,456 KRW",
  },
  {
    id: "a3",
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
  const [selected, setSelected] = useState<AccountRow | null>(null);

  // 상세로 넘길 샘플 거래내역
  const txns = [
    {
      id: 1,
      date: "2025.08.23",
      time: "18:30:43",
      title: "체크리스트 항목",
      amount: 15000,
      runningBalance: 55000,
    },
    {
      id: 2,
      date: "2025.08.22",
      time: "18:30:43",
      title: "체크리스트 항목",
      amount: 15000,
      runningBalance: 40000,
    },
    {
      id: 3,
      date: "2025.08.21",
      time: "18:30:43",
      title: "체크리스트 항목",
      amount: 15000,
      runningBalance: 25000,
    },
    {
      id: 4,
      date: "2025.08.20",
      time: "18:30:43",
      title: "1회차 정기 적금",
      amount: 10000,
      runningBalance: 10000,
    },
  ];

  if (selected) {
    return (
      <MyPageSavingsDetail
        badge={
          selected.type === "SAVING"
            ? "적금"
            : selected.type === "DEPOSIT"
            ? "입출금"
            : "외화"
        }
        accountTitle={selected.title}
        maskedNumber={`신한 ${selected.number.replace(
          /^(\d{3})-(\d{3})-(\d+)/,
          "$1-***-$3"
        )}`}
        balanceKRW={Number(selected.balance.replace(/[^0-9]/g, "")) || 0}
        txns={txns}
        onBack={() => setSelected(null)}
      />
    );
  }

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
        <div className={styles.head} role="row">
          <div className={styles.th}>구분</div>
          <div className={styles.th}>계좌명</div>
          <div className={`${styles.th} ${styles.thRight}`}>잔액</div>
        </div>

        <div className={styles.body}>
          {DUMMY.map((row) => (
            <div
              key={row.id}
              className={`${styles.row} ${styles.rowClickable}`}
              role="button"
              tabIndex={0}
              aria-label={`${row.title} 상세 보기`}
              onClick={() => setSelected(row)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelected(row);
                }
              }}
            >
              <div className={styles.cell}>
                <TypeBadge t={row.type} />
              </div>

              <div className={`${styles.cell} ${styles.titleCell}`}>
                <div className={styles.itemTitle}>{row.title}</div>
                <div className={styles.accountNum}>{row.number}</div>
              </div>

              <div className={`${styles.cell} ${styles.cellRight}`}>
                <span className={styles.balance}>{row.balance}</span>
                <span aria-hidden className={styles.chevron}>
                  ›
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

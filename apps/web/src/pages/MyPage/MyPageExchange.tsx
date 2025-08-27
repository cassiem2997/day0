import { useMemo } from "react";
import styles from "./MyPageExchange.module.css";

type FxHistoryItem = {
  id: string;
  /** ISO string (e.g. 2025-08-23T18:30:43Z) */
  at: string;
  /** KRW per USD */
  rateKrwPerUsd: number;
  /** exchanged USD amount */
  usdAmount: number;
  /** withdrawn KRW amount */
  withdrawKrw: number;
};

// 데모용 더미 데이터
const DUMMY: FxHistoryItem[] = [
  {
    id: "fx_1",
    at: "2025-08-23T18:30:43+09:00",
    rateKrwPerUsd: 1390.13,
    usdAmount: 10,
    withdrawKrw: 91351,
  },
  {
    id: "fx_2",
    at: "2025-08-22T18:30:43+09:00",
    rateKrwPerUsd: 1390.13,
    usdAmount: 10,
    withdrawKrw: 40000 + 51351,
  },
  {
    id: "fx_3",
    at: "2025-08-21T18:30:43+09:00",
    rateKrwPerUsd: 1390.13,
    usdAmount: 10,
    withdrawKrw: 25000 + 66351,
  },
  {
    id: "fx_4",
    at: "2025-08-20T18:30:43+09:00",
    rateKrwPerUsd: 1390.13,
    usdAmount: 10,
    withdrawKrw: 10000 + 81351,
  },
];

// 포맷 헬퍼
function fmtDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}
function fmtTime(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mi}:${ss}`;
}
function fmtKRW(n: number) {
  return `${n.toLocaleString("ko-KR")}원`;
}
function fmtUSD(n: number) {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
function fmtRateKRW(n: number) {
  return `${n.toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}원`;
}

export default function MyPageExchange() {
  // 실제에선 여기서 API 호출해 리스트를 받아오면 됩니다.
  const rows = useMemo(() => DUMMY, []);

  return (
    <section className={styles.wrap} aria-label="환전 내역">
      <h2 className={styles.title}>환전 내역</h2>

      <div className={styles.tableCard}>
        {/* 헤더 */}
        <div className={styles.head} role="row">
          <div className={styles.th}>일시</div>
          <div className={styles.th}>적용환율</div>
          <div className={`${styles.th} ${styles.thMid}`}>환전금액</div>
          <div className={`${styles.th} ${styles.thRight}`}>출금금액</div>
        </div>

        {/* 리스트 */}
        <div className={styles.body}>
          {rows.length === 0 ? (
            <div className={styles.empty}>아직 환전 내역이 없습니다.</div>
          ) : (
            rows.map((item) => {
              const d = new Date(item.at);
              return (
                <div key={item.id} className={styles.rowCard} role="row">
                  {/* 일시 */}
                  <div className={styles.cell}>
                    <div className={styles.datePill}>
                      <div className={styles.date}>{fmtDate(d)}</div>
                      <div className={styles.time}>{fmtTime(d)}</div>
                    </div>
                  </div>

                  {/* 적용환율 */}
                  <div className={styles.cell}>
                    <div className={styles.rate}>
                      {fmtRateKRW(item.rateKrwPerUsd)}
                    </div>
                  </div>

                  {/* 환전금액(USD) */}
                  <div className={`${styles.cell} ${styles.cellMid}`}>
                    <div className={`${styles.amount} ${styles.usd}`}>
                      {fmtUSD(item.usdAmount)}
                    </div>
                  </div>

                  {/* 출금금액(KRW) */}
                  <div className={`${styles.cell} ${styles.cellRight}`}>
                    <div className={`${styles.amount} ${styles.krw}`}>
                      {fmtKRW(item.withdrawKrw)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

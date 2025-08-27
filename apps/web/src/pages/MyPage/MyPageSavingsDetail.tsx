import styles from "./MyPageSavingsDetail.module.css";

type TxnType = "PLUS" | "MINUS";

export interface SavingsTxn {
  id: string | number;
  date: string; // YYYY.MM.DD
  time: string; // HH:mm:ss
  title: string;
  amount: number; // +/-
  runningBalance: number;
}

export interface SavingsDetailProps {
  badge?: "적금" | "입출금" | "외화";
  accountTitle: string;
  maskedNumber: string;
  balanceKRW: number;
  txns: SavingsTxn[];
  onBack?: () => void;
}

export default function MyPageSavingsDetail({
  badge = "적금",
  accountTitle,
  maskedNumber,
  balanceKRW,
  txns,
  onBack,
}: SavingsDetailProps) {
  return (
    <section className={styles.wrap} aria-label="계좌 상세">
      <div className={styles.headerRow}>
        <h2 className={styles.pageTitle}>계좌명</h2>
        {onBack ? (
          <button type="button" className={styles.backBtn} onClick={onBack}>
            이전으로
          </button>
        ) : null}
      </div>

      <div className={styles.card}>
        <div className={styles.summary}>
          <div className={styles.summaryLeft}>
            <span
              className={`${styles.badge} ${
                badge === "적금"
                  ? styles.badgeSaving
                  : badge === "입출금"
                  ? styles.badgeDeposit
                  : styles.badgeFx
              }`}
            >
              {badge}
            </span>

            <div className={styles.accountTexts}>
              <div className={styles.accountTitle}>{accountTitle}</div>
              <div className={styles.accountNumMuted}>{maskedNumber}</div>
            </div>
          </div>

          <div className={styles.balanceBox}>
            <span className={styles.balanceText}>
              {balanceKRW.toLocaleString("ko-KR")}
            </span>
            <span className={styles.balanceWon}>원</span>
          </div>
        </div>

        <ul className={styles.txnList} aria-label="거래 내역">
          {txns.map((t) => {
            const kind: TxnType = t.amount >= 0 ? "PLUS" : "MINUS";
            return (
              <li key={t.id} className={styles.txnItem}>
                <div className={styles.txnWhen}>
                  <div className={styles.txnDate}>{t.date}</div>
                  <div className={styles.txnTime}>{t.time}</div>
                </div>

                <div className={styles.txnTitle}>{t.title}</div>

                <div className={styles.txnAmountBox}>
                  <div
                    className={`${styles.txnAmount} ${
                      kind === "PLUS" ? styles.plus : styles.minus
                    }`}
                  >
                    {kind === "PLUS" ? "+" : "-"}
                    {Math.abs(t.amount).toLocaleString("ko-KR")}원
                  </div>
                  <div className={styles.txnSub}>
                    잔액 {t.runningBalance.toLocaleString("ko-KR")}원
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

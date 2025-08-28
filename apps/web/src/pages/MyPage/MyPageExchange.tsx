// src/pages/MyPage/MyPageExchange.tsx
import { useEffect, useMemo, useState } from "react";
import styles from "./MyPageExchange.module.css";
import { fetchFxTransactions, type FxTransaction } from "../../api/fx";
import { me } from "../../api/user";

/* 포맷 헬퍼 */
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
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}
function fmtUSD(n: number) {
  return `$${Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
function fmtRateKRW(n: number) {
  return `${Number(n).toLocaleString("ko-KR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}원`;
}
function toYMD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** 기본 기간: 최근 30일 */
function defaultRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return { start: toYMD(start), end: toYMD(end) };
}

export default function MyPageExchange() {
  const [rows, setRows] = useState<FxTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 조회 폼 상태
  const [accountNo, setAccountNo] = useState<string>(
    () => localStorage.getItem("fx:accountNo") || ""
  );
  const init = defaultRange();
  const [startDate, setStartDate] = useState<string>(init.start);
  const [endDate, setEndDate] = useState<string>(init.end);

  // 최초 자동 조회: 계좌번호가 저장돼 있으면 바로 불러오기
  useEffect(() => {
    (async () => {
      if (!accountNo) return;
      await handleSearch();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const auth = await me();
      if (!auth?.userId) throw new Error("로그인이 필요합니다.");

      // 계좌번호 기억
      if (accountNo) localStorage.setItem("fx:accountNo", accountNo);

      const list = await fetchFxTransactions({
        userId: auth.userId,
        accountNo,
        startDate,
        endDate,
      });
      // 최신일자 먼저 보이도록 내림차순 정렬
      list.sort((a, b) => (a.at < b.at ? 1 : -1));
      setRows(list);
    } catch (e: any) {
      const message =
        e?.response?.data?.message ||
        e?.message ||
        "환전 내역을 불러오지 못했습니다.";
      setErr(message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const viewRows = useMemo(() => rows, [rows]);

  return (
    <section className={styles.wrap} aria-label="환전 내역">
      <h2 className={styles.title}>환전 내역</h2>

      {/* 조회 폼 */}
      <form
        onSubmit={handleSearch}
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <label style={{ fontWeight: 800 }}>
          계좌번호
          <input
            type="text"
            value={accountNo}
            onChange={(e) => setAccountNo(e.target.value)}
            placeholder="예: 110-123-456789"
            style={{
              marginLeft: 8,
              padding: "8px 10px",
              border: "3px solid #121212",
              borderRadius: 10,
            }}
            required
          />
        </label>

        <label style={{ fontWeight: 800 }}>
          시작일
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              marginLeft: 8,
              padding: "8px 10px",
              border: "3px solid #121212",
              borderRadius: 10,
            }}
            required
          />
        </label>

        <label style={{ fontWeight: 800 }}>
          종료일
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              marginLeft: 8,
              padding: "8px 10px",
              border: "3px solid #121212",
              borderRadius: 10,
            }}
            required
          />
        </label>

        <button
          type="submit"
          style={{
            padding: "10px 14px",
            border: "5px solid #121212",
            borderRadius: 12,
            background: "#fff",
            fontWeight: 900,
            boxShadow: "0 6px 0 rgba(0,0,0,0.15)",
          }}
          disabled={loading}
        >
          {loading ? "조회 중…" : "조회"}
        </button>

        {err ? (
          <span style={{ color: "#c0392b", fontWeight: 800, marginLeft: 8 }}>
            {err}
          </span>
        ) : null}
      </form>

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
          {loading ? (
            <div className={styles.empty}>불러오는 중…</div>
          ) : viewRows.length === 0 ? (
            <div className={styles.empty}>아직 환전 내역이 없습니다.</div>
          ) : (
            viewRows.map((item) => {
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

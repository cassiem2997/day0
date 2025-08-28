import { useEffect, useMemo, useState } from "react";
import styles from "./SavingsPage.module.css";
import { listTransactions, type SavingsTxn } from "../../api/savings";

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

function toDateYYYYMMDD(iso?: string) {
  if (!iso) return "";
  // processedAt 우선, 없으면 requestedAt
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function categoryFromTxnType(t: string) {
  if (t === "REGULAR") return "자동이체";
  if (t === "MISSION" || t === "BONUS") return "미션";
  return "기타";
}

function buildDescription(txn: SavingsTxn) {
  if (txn.status === "FAILED") {
    return txn.failureReason
      ? `실패: ${txn.failureReason}`
      : "실패한 거래";
  }
  // 적당한 기본 설명
  if (txn.txnType === "REGULAR") return "정기 자동이체 납입";
  if (txn.txnType === "MISSION") return "미션 보상 입금";
  if (txn.txnType === "BONUS") return "보너스 입금";
  return txn.idempotencyKey || txn.externalTxId || "거래 내역";
}

export default function SavingsDetail({
  items,         // 있으면 그대로 사용
  planId,        // 없으면 1로 fallback
}: {
  items?: DetailItem[];
  planId?: number;
}) {
  const effectivePlanId = planId && planId > 0 ? planId : 1;

  const [rows, setRows] = useState<DetailItem[] | null>(items ?? null);
  const [loading, setLoading] = useState<boolean>(!items);
  const [error, setError] = useState<string | null>(null);

  // 페이지네이션
  const [page, setPage] = useState(0);
  const [last, setLast] = useState(false);

  // 처음 마운트 또는 planId 바뀌면 0페이지부터 로드
  useEffect(() => {
    if (items) return; // 외부에서 props로 받는다면 API 호출 안함
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        setPage(0);
        const res = await listTransactions({
          planId: effectivePlanId,
          page: 0,
          size: 20,
          sort: "processedAt,desc",
        });

        if (!alive) return;

        const list: DetailItem[] = res.content.map((t) => ({
          id: t.txnId,
          category: categoryFromTxnType(t.txnType),
          amount: t.amount ?? 0,
          description: buildDescription(t),
          date: toDateYYYYMMDD(t.processedAt || t.requestedAt),
        }));

        setRows(list);
        setLast(res.last);
        setPage(res.number);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.response?.data?.message || e?.message || "납입 내역을 불러오지 못했습니다.");
        setRows(DUMMY); // 실패 시 데모 표시(원치 않으면 null로 두세요)
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [effectivePlanId, items]);

  // 더 불러오기
  async function loadMore() {
    try {
      setLoading(true);
      const nextPage = page + 1;
      const res = await listTransactions({
        planId: effectivePlanId,
        page: nextPage,
        size: 20,
        sort: "processedAt,desc",
      });

      const more: DetailItem[] = res.content.map((t) => ({
        id: t.txnId,
        category: categoryFromTxnType(t.txnType),
        amount: t.amount ?? 0,
        description: buildDescription(t),
        date: toDateYYYYMMDD(t.processedAt || t.requestedAt),
      }));

      setRows((prev) => (prev ? [...prev, ...more] : more));
      setLast(res.last);
      setPage(res.number);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "추가 로딩 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const hasRows = useMemo(() => (rows?.length ?? 0) > 0, [rows]);
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

        {/* 상태 메시지 */}
        {loading && <div style={{ padding: 12 }}>불러오는 중…</div>}
        {error && <div role="alert" style={{ padding: 12, color: "crimson" }}>{error}</div>}
        {!loading && !hasRows && <div style={{ padding: 12 }}>표시할 내역이 없습니다.</div>}

        {/* 표 본문 */}
        {hasRows && (
          <ul className={styles.detailList}>
            {rows!.map((row) => (
              <li key={row.id} className={styles.detailRow}>
                <div className={styles.colType}>{row.category}</div>
                <div className={styles.colAmount}>+ {formatAmount(row.amount)}원</div>
                <div className={styles.colDesc}>{row.description}</div>
                <div className={styles.colDate}>{row.date}</div>
              </li>
            ))}
          </ul>
        )}

        {/* 더 보기 (페이지네이션) */}
        {!loading && hasRows && !last && (
          <div style={{ padding: 12, textAlign: "center" }}>
            <button type="button" onClick={loadMore} className={styles.tabButton}>
              더 불러오기
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
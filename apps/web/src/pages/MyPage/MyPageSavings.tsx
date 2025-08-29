
import { useEffect, useState } from "react";
import styles from "./MyPageSavings.module.css";
import MyPageSavingsDetail from "./MyPageSavingsDetail";
import {
  fetchAccounts,
  fetchAccountProducts,
  createAccount,
  type AccountNormalized,
  type AccountProduct,
} from "../../api/account";
// import { getMySavingsPlans, type SavingsPlanSummary } from "../../api/savings";
import { getMyAccounts, tryGetAccountById, type DepositAccount } from "../../api/accounts";
import {
  getMySavingsPlans,
  listTransactions,
  getSavingsPlan,
  type SavingsPlanSummary,
  type SavingsTxn as ApiSavingsTxn,
} from "../../api/savings";
import type { SavingsTxn as UiTxn } from "./MyPageSavingsDetail";

type AccountType = "SAVING" | "DEPOSIT" | "FX";

interface AccountRow {
  id: string;
  type: AccountType;
  title: string;
  number: string;
  balance: string;
  // 적금
  planId?: number;  
  savingAccountId?: number;  
}

export interface SavingsPlanWithAccount extends SavingsPlanSummary {
  savingAccount?: DepositAccount | null;
}

function TypeBadge({ t }: { t: AccountType }) {
  if (t === "SAVING") {
    return (
      <span className={`${styles.badge} ${styles.badgeSaving}`}>D-적금</span>
    );
  }
  if (t === "DEPOSIT") {
    return (
      <span className={`${styles.badge} ${styles.badgeDeposit}`}>입출금</span>
    );
  }
  return <span className={`${styles.badge} ${styles.badgeFx}`}>외화</span>;
}

function formatBalance(amount: number, currency: "KRW" | "USD") {
  if (currency === "USD") {
    return `${Math.round(amount).toLocaleString("en-US")} $`;
  }
  return `${Math.round(amount).toLocaleString("ko-KR")} KRW`;
}

export default function MyPageSavings() {
  // 목록/선택 상태
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [selected, setSelected] = useState<AccountRow | null>(null);

  // 에러/로딩
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 생성 모달 상태
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<AccountProduct[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodErr, setProdErr] = useState<string | null>(null);
  const [productId, setProductId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [initialAmount, setInitialAmount] = useState<string>("");
  const [creating, setCreating] = useState(false);

  // 상세(적금) 데이터
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailErr, setDetailErr] = useState<string | null>(null);
  const [detailTxns, setDetailTxns] = useState<UiTxn[]>([]);
  const [detailTitle, setDetailTitle] = useState<string>("");
  const [detailMaskedNum, setDetailMaskedNum] = useState<string>("");
  const [detailBalanceKRW, setDetailBalanceKRW] = useState<number>(0);

  // 날짜/시간 포맷 (KST 기준 표기)
const pad2 = (n: number) => String(n).padStart(2, "0");
function formatDateTime(iso?: string) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = pad2(d.getMonth() + 1);
  const dd = pad2(d.getDate());
  const HH = pad2(d.getHours());
  const MM = pad2(d.getMinutes());
  const SS = pad2(d.getSeconds());
  return { date: `${yyyy}.${mm}.${dd}`, time: `${HH}:${MM}:${SS}` };
}

// 타이틀 규칙(예시)
function resolveTitle(tx: ApiSavingsTxn) {
  const base =
    tx.txnType === "MISSION"
      ? "미션 적립"
      : tx.txnType === "REGULAR"
      ? "정기 적립"
      : "적립";
  switch (tx.status) {
    case "POSTED":
      return base;
    case "PROCESSING":
      return `${base} (처리중)`;
    case "RECEIVED":
      return `${base} (접수)`;
    case "FAILED":
      return `${base} 실패`;
    default:
      return `${base} (${tx.status})`;
  }
}

// 금액 사인 (의견): 실패는 0 처리, 나머지는 + 가정
function resolveSignedAmount(tx: ApiSavingsTxn) {
  // ※ 서버에서 IN/OUT을 명확히 주면 그 값을 사용하세요. (the opinion of ChatGPT)
  if (tx.status === "FAILED") return 0;
  return tx.amount ?? 0;
}

// API Txn → 화면 Txn + 누적잔액
function mapAndAccumulate(apiTxns: ApiSavingsTxn[]): UiTxn[] {
  // 누적을 위해 시간 오름차순 정렬
  const asc = [...apiTxns].sort((a, b) => {
    const ta = a.processedAt || a.requestedAt || "";
    const tb = b.processedAt || b.requestedAt || "";
    return new Date(ta).getTime() - new Date(tb).getTime();
  });

  let running = 0;
  const built: UiTxn[] = asc.map((tx) => {
    const when = tx.processedAt || tx.requestedAt;
    const { date, time } = formatDateTime(when);
    const signed = resolveSignedAmount(tx);
    running += signed;
    return {
      id: tx.txnId,
      date,
      time,
      title: resolveTitle(tx),
      amount: signed,
      runningBalance: running,
    };
  });

  // 화면은 최신순
  return built.sort((a, b) => {
    const ad = a.date + " " + a.time;
    const bd = b.date + " " + b.time;
    return ad < bd ? 1 : ad > bd ? -1 : 0;
  });
}

  // 더미 거래내역
  // const txns = useMemo(
  //   () => [
  //     {
  //       id: 1,
  //       date: "2025.08.23",
  //       time: "18:30:43",
  //       title: "체크리스트 항목",
  //       amount: 15000,
  //       runningBalance: 55000,
  //     },
  //     {
  //       id: 2,
  //       date: "2025.08.22",
  //       time: "18:30:43",
  //       title: "체크리스트 항목",
  //       amount: 15000,
  //       runningBalance: 40000,
  //     },
  //     {
  //       id: 3,
  //       date: "2025.08.21",
  //       time: "18:30:43",
  //       title: "체크리스트 항목",
  //       amount: 15000,
  //       runningBalance: 25000,
  //     },
  //     {
  //       id: 4,
  //       date: "2025.08.20",
  //       time: "18:30:43",
  //       title: "1회차 정기 적금",
  //       amount: 10000,
  //       runningBalance: 10000,
  //     },
  //   ],
  //   []
  // );

  // 계좌 목록 로드(단일 소스: fetchAccounts)
  async function loadAccounts() {
    setLoading(true);
    setErr(null);
    try {
      const list: AccountNormalized[] = await fetchAccounts();
      const mapped: AccountRow[] = list.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        number: a.accountNo,
        balance: formatBalance(a.balanceAmount, a.currency),
      }));
      setRows(mapped);
    } catch (e: any) {
      setErr(
        e?.response?.data?.message ||
          e?.message ||
          "계좌 목록을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  // 선택 변경될 때 상세 로딩
useEffect(() => {
  let alive = true;
  (async () => {
    // 적금 상세만 API 호출
    if (!selected || selected.type !== "SAVING" || !selected.planId) {
      setDetailTxns([]);
      setDetailErr(null);
      return;
    }
    try {
      setDetailLoading(true);
      setDetailErr(null);

      // 플랜 + 거래 불러오기
      const [plan, page] = await Promise.all([
        getSavingsPlan(selected.planId),
        listTransactions({ planId: selected.planId, page: 0, size: 50, sort: "processedAt,desc" }),
      ]);
      if (!alive) return;

      // 화면 데이터 구성
      const uiTxns = mapAndAccumulate(page.content);

      const bank = plan.savingAccount.bankName || "은행";
      const no = plan.savingAccount.accountNo || "";
      const masked = no.replace(/^(\d{3})-(\d{3})-(\d+)/, "$1-***-$3");

      setDetailTitle(`${bank} 적금`);
      setDetailMaskedNum(`${bank} ${masked || no}`);
      setDetailBalanceKRW(plan.savingAccount.accountBalance ?? 0);
      setDetailTxns(uiTxns);
    } catch (e: any) {
      if (!alive) return;
      setDetailErr(e?.response?.data?.message || e?.message || "적금 상세 로드 실패");
    } finally {
      if (alive) setDetailLoading(false);
    }
  })();
  return () => { alive = false; };
}, [selected]);


  useEffect(() => {
    let alive = true;
    (async () => {
      
      try {
        setLoading(true);
        setErr(null);

        const [plans, accounts] = await Promise.all([
          getMySavingsPlans(),
          getMyAccounts(),
        ]);

        if (!alive) return;

        // 적금 플랜 → AccountRow
         const uniqueIds = Array.from(new Set(plans.map(p => p.savingAccountId).filter(Boolean)));

        // 2) 병렬 호출 (실패 허용)
        const settled = await Promise.allSettled(
          uniqueIds.map(id => tryGetAccountById(id))
        );

        // 3) id → DepositAccount 매핑
        const accountMap = new Map<number, DepositAccount>();
        settled.forEach((res, idx) => {
          if (res.status === "fulfilled" && res.value) {
            accountMap.set(uniqueIds[idx]!, res.value);
          }
        });

        // 4) 플랜을 AccountRow로 변환 (계좌 상세 반영)
        const savingRows: AccountRow[] = plans.map((p) => {
          const acc = accountMap.get(p.savingAccountId);
          return {
            id: `saving-${p.planId}`,
            type: "SAVING",
            title: acc ? acc.bankName : "",
            number: acc ? acc.accountNo : "",
            balance: acc ? acc.accountBalance + "원" : "",
            planId: p.planId,
            savingAccountId: p.savingAccountId,
          };
        });

        // 입출금 계좌 → AccountRow
        const depositRows: AccountRow[] = accounts.map((a, idx) => {
          const isFx = a.currency !== "KRW";
          return {
            id: `acct-${idx}`,
            type: isFx ? "FX" : "DEPOSIT",
            title: a.bankName,
            number: a.accountNo,
            balance: isFx
              ? `${a.accountBalance.toLocaleString("en-US")} ${a.currency}`
              : `${a.accountBalance.toLocaleString("ko-KR")}원`,
          };
        });

        setRows([...savingRows, ...depositRows]);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.response?.data?.message || e?.message || "계좌 정보를 불러오지 못했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // 생성 모달 열기 + 상품 로드
  async function openCreateModal() {
    setOpen(true);
    setProducts([]);
    setProductId("");
    setTitle("");
    setInitialAmount("");
    setProdErr(null);
    try {
      setProdLoading(true);
      const list = await fetchAccountProducts();
      setProducts(list);
      setProductId(list.length > 0 ? String(list[0].id) : "");
    } catch (e: any) {
      setProdErr(
        e?.response?.data?.message ||
          e?.message ||
          "상품 목록을 불러오지 못했습니다."
      );
    } finally {
      setProdLoading(false);
    }
  }

  // 생성 제출
  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return;
    setCreating(true);
    try {
      await createAccount({
        productId: Number(productId), 
        title: title.trim() || undefined,
        initialAmount: initialAmount ? Number(initialAmount) : undefined,
      });
      setOpen(false);
      await loadAccounts();
    } catch (e: any) {
      alert(
        e?.response?.data?.message || e?.message || "계좌 생성에 실패했습니다."
      );
    } finally {
      setCreating(false);
    }
  }

  // 상세 화면
  if (selected) {
    // const numericKRW = /KRW/.test(selected.balance)
    //   ? Number(selected.balance.replace(/[^0-9]/g, "")) || 0
    //   : 0;

    // return (
    //   <MyPageSavingsDetail
    //     badge={
    //       selected.type === "SAVING"
    //         ? "적금"
    //         : selected.type === "DEPOSIT"
    //         ? "입출금"
    //         : "외화"
    //     }
    //     accountTitle={selected.title}
    //     maskedNumber={`신한 ${selected.number.replace(
    //       /^(\d{3})-(\d{3})-(\d+)/,
    //       "$1-***-$3"
    //     )}`}
    //     balanceKRW={numericKRW}
    //     txns={txns}
    //     onBack={() => setSelected(null)}
    //   ></MyPageSavingsDetail>
    // );

     const badge =
      selected.type === "SAVING" ? "적금" : selected.type === "DEPOSIT" ? "입출금" : "외화";

    // 적금: API 기반, 입출금/외화: 기존 표시(간단 처리)
    if (selected.type === "SAVING") {
      if (detailLoading) return <div className={styles.empty}>불러오는 중…</div>;
      if (detailErr) return <div className={styles.empty} style={{ color: "#c0392b", fontWeight: 800 }}>{detailErr}</div>;

      return (
        <MyPageSavingsDetail
          badge={badge}
          accountTitle={detailTitle || selected.title}
          maskedNumber={detailMaskedNum || `신한 ${selected.number.replace(/^(\d{3})-(\d{3})-(\d+)/, "$1-***-$3")}`}
          balanceKRW={detailBalanceKRW}
          txns={detailTxns}
          onBack={() => setSelected(null)}
        />
      );
    } else {
      const numericKRW = /KRW/.test(selected.balance)
        ? Number(selected.balance.replace(/[^0-9]/g, "")) || 0
        : 0;
      return (
        <MyPageSavingsDetail
          badge={badge}
          accountTitle={selected.title}
          maskedNumber={`신한 ${selected.number.replace(/^(\d{3})-(\d{3})-(\d+)/, "$1-***-$3")}`}
          balanceKRW={numericKRW}
          txns={[]}  // 입출금/외화 거래는 별도 API가 있으면 여기서 교체
          onBack={() => setSelected(null)}
        />
      );
    }
   }

  return (
    <section className={styles.wrap} aria-label="계좌 조회">
      <div className={styles.titleRow}>
        <h2 className={styles.title}>계좌 조회</h2>
        <button
          type="button"
          className={styles.createBtn}
          onClick={openCreateModal}
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
          {loading ? (
            <div className={styles.empty}>불러오는 중…</div>
          ) : err ? (
            <div
              className={styles.empty}
              style={{ color: "#c0392b", fontWeight: 800 }}
            >
              {err}
            </div>
          ) : rows.length === 0 ? (
            <div className={styles.empty}>등록된 계좌가 없습니다.</div>
          ) : (
            rows.map((row) => (
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
                  <TypeBadge t={row.type}></TypeBadge>
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
            ))
          )}
        </div>
      </div>

      {open && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <section
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <header className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>계좌 등록</h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setOpen(false)}
                aria-label="닫기"
              >
                닫기
              </button>
            </header>

            <div className={styles.modalBody}>
              {prodLoading ? (
                <div>상품을 불러오는 중…</div>
              ) : prodErr ? (
                <div style={{ color: "#c0392b", fontWeight: 800 }}>
                  {prodErr}
                </div>
              ) : (
                <form onSubmit={submitCreate}>
                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>상품</label>
                    <div className={styles.formField}>
                      <select
                        className={styles.select}
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        disabled={products.length === 0}
                        required
                      >
                        {products.length === 0 ? (
                          <option value="">등록 가능한 상품이 없습니다</option>
                        ) : (
                          products.map((p) => (
                            <option key={p.id} value={String(p.id)}>
                              {p.accountName}
                            </option>
                          ))
                        )}
                      </select>
                      {products.length === 0 ? (
                        <p className={styles.helperText}>
                          상품이 없어 계좌를 생성할 수 없습니다. 관리자에게 상품
                          등록을 요청하세요.
                        </p>
                      ) : (
                        <></>
                      )}
                    </div>
                  </div>

                  <div className={styles.formRow}>
                    <label className={styles.formLabel}>계좌명</label>
                    <div className={styles.formField}>
                      <input
                        className={styles.input}
                        type="text"
                        placeholder="예: 런던 3개월 어학연수"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={30}
                      />
                    </div>
                  </div>

                  {/* <div className={styles.formRow}>
                    <label className={styles.formLabel}>초기 입금(선택)</label>
                    <div className={styles.formField}>
                      <input
                        className={styles.input}
                        type="number"
                        min={0}
                        step={1}
                        placeholder="숫자만"
                        value={initialAmount}
                        onChange={(e) => setInitialAmount(e.target.value)}
                      />
                    </div>
                  </div> */}

                  <div className={styles.formActions}>
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => setOpen(false)}
                      disabled={creating}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      className={styles.primaryBtn}
                      disabled={creating || !productId || products.length === 0}
                    >
                      {creating ? "생성 중…" : "생성"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
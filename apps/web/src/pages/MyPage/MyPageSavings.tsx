import { useEffect, useMemo, useState } from "react";
import styles from "./MyPageSavings.module.css";
import MyPageSavingsDetail from "./MyPageSavingsDetail";
import {
  fetchAccounts,
  fetchAccountProducts,
  createAccount,
  type AccountNormalized,
  type AccountProduct,
} from "../../api/account";

type AccountType = "SAVING" | "DEPOSIT" | "FX";

interface AccountRow {
  id: string;
  type: AccountType;
  title: string;
  number: string;
  balance: string;
}

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

function formatBalance(amount: number, currency: "KRW" | "USD") {
  if (currency === "USD")
    return `${Math.round(amount).toLocaleString("en-US")} $`;
  return `${Math.round(amount).toLocaleString("ko-KR")} KRW`;
}

export default function MyPageSavings() {
  const [rows, setRows] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<AccountRow | null>(null);

  // 등록 모달
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<AccountProduct[]>([]);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodErr, setProdErr] = useState<string | null>(null);
  const [productId, setProductId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [initialAmount, setInitialAmount] = useState<string>("");
  const [creating, setCreating] = useState(false);

  const txns = useMemo(
    () => [
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
    ],
    []
  );

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

  useEffect(() => {
    loadAccounts();
  }, []);

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

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return;
    setCreating(true);
    try {
      await createAccount({
        productId,
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

  if (selected) {
    const numericKRW = /KRW/.test(selected.balance)
      ? Number(selected.balance.replace(/[^0-9]/g, "")) || 0
      : 0;

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
        balanceKRW={numericKRW}
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
            ))
          )}
        </div>
      </div>

      {/* ====== 계좌 생성 모달 ====== */}
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
                              [{p.type}] {p.name} ({p.currency})
                            </option>
                          ))
                        )}
                      </select>
                      {products.length === 0 && (
                        <p className={styles.helperText}>
                          상품이 없어 계좌를 생성할 수 없습니다. 관리자에게 상품
                          등록을 요청하세요.
                        </p>
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

                  <div className={styles.formRow}>
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
                  </div>

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

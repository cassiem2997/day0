// src/pages/Savings/SavingPlan.tsx
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import stylesPage from "../Checklist/ChecklistPage.module.css";
import "./SavingPlan.css";
import {
  createSavingsPlan,
  type CreateSavingsPlanPayload,
} from "../../api/savings";
import { fetchMyAccounts } from "../../api/account";
import bg from "../../assets/checklistMaking.svg";

type AccountOption = { accountId: number; label: string };

export default function SavingPlan() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((p) => !p);

  // 상태
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [withdrawAccountId, setWithdrawAccountId] = useState<number | null>(
    null
  );

  const [frequency, setFrequency] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");
  const [depositDay, setDepositDay] = useState<number>(15);
  const [depositWeekday, setDepositWeekday] = useState<number>(3);

  const [months, setMonths] = useState<number>(5);
  const [endDate, setEndDate] = useState<string>("");

  const [amountText, setAmountText] = useState<string>("100,000");
  const amountNumber = useMemo(
    () => Number(String(amountText).replace(/[^\d.]/g, "")),
    [amountText]
  );

  const [goalText, setGoalText] = useState<string>("");
  const goalNumber = useMemo(
    () => Number(String(goalText).replace(/[^\d.]/g, "")),
    [goalText]
  );

  const [submitting, setSubmitting] = useState(false);

  const userId = useMemo(() => Number(localStorage.getItem("userId") ?? 1), []);
  const departureId = useMemo(
    () => Number(localStorage.getItem("departureId") ?? 1),
    []
  );

  // 계좌 목록
  useEffect(() => {
    (async () => {
      try {
        const list = await fetchMyAccounts({ userId });
        const withdrawables = list.filter(
          (a) => a.type === "DEPOSIT" && a.currency === "KRW"
        );
        const opts = withdrawables
          .map((a) => {
            const numId = Number(a.id);
            if (!Number.isFinite(numId)) return null;
            return {
              accountId: numId,
              label: `${a.productName} / ${a.number}`,
            };
          })
          .filter(Boolean) as AccountOption[];
        setAccounts(opts);
        setWithdrawAccountId(opts[0]?.accountId ?? null);
      } catch (e) {
        console.error("계좌 목록 로딩 실패", e);
      }
    })();
  }, [userId]);

  // 종료일 자동 계산
  useEffect(() => {
    const today = new Date();
    const d = new Date(
      today.getFullYear(),
      today.getMonth() + months,
      today.getDate()
    );
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setEndDate(`${yyyy}-${mm}-${dd}`);
  }, [months]);

  // 숫자 입력 포맷팅
  function handleNumberTextChange(setter: (v: string) => void, raw: string) {
    const num = raw.replace(/[^\d]/g, "");
    setter(num.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
  }

  // 생성
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!withdrawAccountId) return alert("출금 계좌를 선택하세요.");
    if (!amountNumber || amountNumber <= 0)
      return alert("납입 금액을 입력하세요.");
    if (!goalNumber || goalNumber <= 0) return alert("목표액을 입력하세요.");
    if (!endDate) return alert("종료일을 확인하세요.");

    const payload: CreateSavingsPlanPayload & { goalAmount?: number } = {
      userId,
      departureId,
      withdrawAccountId,
      endDate,
      frequency,
      amountPerPeriod: amountNumber,
      ...(frequency === "MONTHLY" ? { depositDay } : { depositWeekday }),
      goalAmount: goalNumber, // ▶ 추가
    };

    try {
      setSubmitting(true);
      const resp = await createSavingsPlan(payload);
      const newPlanId =
        (resp as any)?.planId ??
        (resp as any)?.id ??
        (resp as any)?.data?.planId ??
        (resp as any)?.data?.id;
      if (!newPlanId) throw new Error("planId를 확인할 수 없습니다.");
      navigate(`/savings/${newPlanId}`);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message ?? "생성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  const noAccount = accounts.length === 0;

  return (
    <div className={stylesPage.container}>
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
      <button
        type="button"
        className={stylesPage.mobileHamburger}
        onClick={toggleSidebar}
        aria-label="메뉴 열기"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      <main className={stylesPage.main}>
        <Header />
        <div className={stylesPage.pageContent}>
          <header className="savingplan-hero">
            <h1 className="savingplan-hero-title">SAVINGS</h1>
          </header>

          <section className="sp-stage" aria-label="Saving plan form">
            <div className="sp-inner">
              <img className="bg" src={bg} alt="" />
              <div className="sp-scroll">
                <div className="sp-card">
                  <h2 className="sp-cardTitle">적금 플랜</h2>

                  <form className="sp-form" onSubmit={handleSubmit}>
                    <div className="sp-row">
                      <label className="sp-label">계좌조회</label>
                      <div className="sp-inputWrap">
                        <select
                          className="sp-control sp-select"
                          value={withdrawAccountId ?? ""}
                          onChange={(e) =>
                            setWithdrawAccountId(Number(e.target.value))
                          }
                          disabled={noAccount}
                        >
                          {noAccount ? (
                            <option>등록된 출금계좌가 없습니다</option>
                          ) : (
                            accounts.map((a) => (
                              <option key={a.accountId} value={a.accountId}>
                                {a.label}
                              </option>
                            ))
                          )}
                        </select>
                        <span className="sp-chevron" aria-hidden>
                          ▾
                        </span>
                      </div>
                    </div>

                    <div className="sp-row">
                      <label className="sp-label">납입 주기</label>
                      <div className="sp-inputWrap">
                        <div className="sp-toggleGroup">
                          <button
                            type="button"
                            className={`sp-toggle ${
                              frequency === "MONTHLY" ? "is-active" : ""
                            }`}
                            onClick={() => setFrequency("MONTHLY")}
                          >
                            월별
                          </button>
                          <button
                            type="button"
                            className={`sp-toggle ${
                              frequency === "WEEKLY" ? "is-active" : ""
                            }`}
                            onClick={() => setFrequency("WEEKLY")}
                          >
                            주별
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="sp-row">
                      <label className="sp-label">납일</label>
                      <div className="sp-inputWrap">
                        {frequency === "MONTHLY" ? (
                          <>
                            <input
                              className="sp-control"
                              type="number"
                              min={1}
                              max={31}
                              value={depositDay}
                              onChange={(e) =>
                                setDepositDay(
                                  Math.max(
                                    1,
                                    Math.min(31, Number(e.target.value))
                                  )
                                )
                              }
                            />
                            <span className="sp-suffix">일</span>
                          </>
                        ) : (
                          <>
                            <select
                              className="sp-control sp-select"
                              value={depositWeekday}
                              onChange={(e) =>
                                setDepositWeekday(Number(e.target.value))
                              }
                            >
                              <option value={1}>월</option>
                              <option value={2}>화</option>
                              <option value={3}>수</option>
                              <option value={4}>목</option>
                              <option value={5}>금</option>
                              <option value={6}>토</option>
                              <option value={7}>일</option>
                            </select>
                            <span className="sp-suffix">요일</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="sp-row">
                      <label className="sp-label">납입 액</label>
                      <div className="sp-inputWrap">
                        <input
                          className="sp-control"
                          inputMode="numeric"
                          value={amountText}
                          onChange={(e) =>
                            handleNumberTextChange(
                              setAmountText,
                              e.target.value
                            )
                          }
                          placeholder="예: 100,000"
                        />
                        <span className="sp-suffix">원</span>
                      </div>
                    </div>

                    {/* ▶ 추가: 목표액 */}
                    <div className="sp-row">
                      <label className="sp-label">목표액</label>
                      <div className="sp-inputWrap">
                        <input
                          className="sp-control"
                          inputMode="numeric"
                          value={goalText}
                          onChange={(e) =>
                            handleNumberTextChange(setGoalText, e.target.value)
                          }
                          placeholder="예: 5,000,000"
                        />
                        <span className="sp-suffix">원</span>
                      </div>
                    </div>

                    <div className="sp-row">
                      <label className="sp-label">기간</label>
                      <div className="sp-inputWrap">
                        <input
                          className="sp-control"
                          type="number"
                          min={1}
                          value={months}
                          onChange={(e) =>
                            setMonths(Math.max(1, Number(e.target.value)))
                          }
                        />
                        <span className="sp-suffix">개월</span>
                      </div>
                    </div>

                    <div className="sp-row">
                      <label className="sp-label">종료일</label>
                      <div className="sp-inputWrap">
                        <input
                          className="sp-control sp-date"
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="sp-actions">
                      <button
                        type="button"
                        className="sp-secondary"
                        onClick={() => navigate("/savings")}
                        disabled={submitting}
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="sp-cta"
                        disabled={submitting || accounts.length === 0}
                      >
                        {submitting ? "생성 중…" : "생성하기"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

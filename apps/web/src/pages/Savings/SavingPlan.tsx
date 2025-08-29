// src/pages/Savings/SavingPlan.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SavingPlan.css";
import {
  createSavingsPlan,
  type CreateSavingsPlanPayload,
} from "../../api/savings";

type AccountOption = { accountId: number; label: string };

export const SavingPlan = () => {
  const navigate = useNavigate();

  // ---- 상태값 ----
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [withdrawAccountId, setWithdrawAccountId] = useState<number | null>(
    null
  );

  const [frequency, setFrequency] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");
  const [depositDay, setDepositDay] = useState<number>(15); // MONTHLY일 때 사용(1~31)
  const [depositWeekday, setDepositWeekday] = useState<number>(3); // WEEKLY일 때 사용(1~7)

  const [months, setMonths] = useState<number>(5); // "기간" 예: N개월
  const [endDate, setEndDate] = useState<string>(""); // YYYY-MM-DD (원하면 직접 계산)
  const [amountText, setAmountText] = useState<string>("100,000"); // 표시용(콤마 포함)
  const amountNumber = useMemo(
    () => Number(String(amountText).replace(/[^\d.]/g, "")),
    [amountText]
  );

  const [submitting, setSubmitting] = useState(false);

  // ---- 더미: 계정/컨텍스트에서 userId/departureId 확보 ----
  const userId = useMemo(() => Number(localStorage.getItem("userId") ?? 1), []);
  const departureId = useMemo(
    () => Number(localStorage.getItem("departureId") ?? 1),
    []
  );

  // ---- 마운트 시 계좌 목록 로딩(있는 경우) API 있어서 연동할거----
  useEffect(() => {
    (async () => {
      try {
        // TODO: 실제 API가 있으면 교체
        // const list = await listWithdrawAccounts({ me: true });
        // const opts = list.map((a) => ({ accountId: a.id, label: `${a.bankName} ${a.accountNo}` }));
        const opts: AccountOption[] = [
          { accountId: 101, label: "이자그게뭔데 수시입출금 / 123-4567-890" }, // 더미
        ];
        setAccounts(opts);
        if (opts[0]) setWithdrawAccountId(opts[0].accountId);
      } catch (e) {
        console.error("계좌 목록 로딩 실패", e);
      }
    })();
  }, []);

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

  // ---- 생성 ----
  async function handleCreate() {
    if (!withdrawAccountId) return alert("출금 계좌를 선택하세요.");
    if (!endDate) return alert("종료일을 확인하세요.");
    if (!amountNumber || amountNumber <= 0)
      return alert("납입 금액을 입력하세요.");

    const payload: CreateSavingsPlanPayload = {
      userId, 
      departureId, 
      withdrawAccountId,
      endDate,
      frequency,
      amountPerPeriod: amountNumber,
      ...(frequency === "MONTHLY" ? { depositDay } : { depositWeekday }),
    };

    try {
      setSubmitting(true);
      const resp = await createSavingsPlan(payload);
      const newPlanId =
        resp?.planId ?? resp?.id ?? resp?.data?.planId ?? resp?.data?.id;
      if (!newPlanId) {
        console.warn("응답:", resp);
        throw new Error("planId를 확인할 수 없습니다.");
      }
      navigate(`/savings/${newPlanId}`);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message ?? "생성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- 보조: 숫자 입력 포맷팅 ----
  function handleAmountChange(raw: string) {
    const num = raw.replace(/[^\d]/g, "");
    setAmountText(num.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
  }

  return (
    <div className="screen">
      <div className="div">
        <img className="line" alt="Line" src="/img/line-1-3.svg" />
        <img className="img" alt="Line" src="/img/line-1-3.svg" />
        <img className="line-2" alt="Line" src="/img/line-1-3.svg" />
        <img
          className="iconly-light-outline"
          alt="Iconly light outline"
          src="/img/iconly-light-outline-profile-1.svg"
        />

        <div className="frame">
          <img className="union" alt="Union" src="/img/union-12.svg" />

          <div className="overlap">
            <img className="union-2" alt="Union" src="/img/union-13.svg" />
            <div className="text-wrapper">적금 플랜</div>
          </div>

          <div className="overlap-group">
            <img className="union-3" alt="Union" src="/img/union-14.svg" />

            <div className="frame-2">
              <div className="div-wrapper">
                <div className="text-wrapper-2">계좌조회</div>
              </div>
              <div className="overlap-2">
                <select
                  className="select-account"
                  value={withdrawAccountId ?? ""}
                  onChange={(e) => setWithdrawAccountId(Number(e.target.value))}
                >
                  {accounts.map((a) => (
                    <option key={a.accountId} value={a.accountId}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 납입 주기 */}
              <div className="overlap-group-2">
                <div className="text-wrapper-5">납입 주기</div>
              </div>
              <div className="overlap-4">
                <div
                  className={`overlap-5 ${
                    frequency === "WEEKLY" ? "is-active" : ""
                  }`}
                  onClick={() => setFrequency("WEEKLY")}
                  role="button"
                  tabIndex={0}
                >
                  <div className="text-wrapper-7">주별</div>
                </div>
                <div
                  className={`overlap-6 ${
                    frequency === "MONTHLY" ? "is-active" : ""
                  }`}
                  onClick={() => setFrequency("MONTHLY")}
                  role="button"
                  tabIndex={0}
                >
                  <div className="text-wrapper-8">월별</div>
                </div>
              </div>

              {/* 납일 (주/월에 따라 다르게 노출) */}
              <div className="overlap-3">
                <div className="text-wrapper-6">납일</div>
              </div>

              {frequency === "MONTHLY" ? (
                <div className="overlap-7">
                  <input
                    className="input-day"
                    type="number"
                    min={1}
                    max={31}
                    value={depositDay}
                    onChange={(e) =>
                      setDepositDay(
                        Math.max(1, Math.min(31, Number(e.target.value)))
                      )
                    }
                  />
                  <span className="label-inline">일</span>
                </div>
              ) : (
                <div className="overlap-7">
                  <select
                    className="select-weekday"
                    value={depositWeekday}
                    onChange={(e) => setDepositWeekday(Number(e.target.value))}
                  >
                    <option value={1}>월</option>
                    <option value={2}>화</option>
                    <option value={3}>수</option>
                    <option value={4}>목</option>
                    <option value={5}>금</option>
                    <option value={6}>토</option>
                    <option value={7}>일</option>
                  </select>
                  <span className="label-inline">요일</span>
                </div>
              )}

              {/* 기간/종료일 */}
              <div className="overlap-8">
                <div className="text-wrapper-10">기간</div>
              </div>
              <div className="overlap-10">
                <input
                  className="input-months"
                  type="number"
                  min={1}
                  value={months}
                  onChange={(e) =>
                    setMonths(Math.max(1, Number(e.target.value)))
                  }
                />
                <div className="text-wrapper-12">개월</div>
              </div>
              <div className="enddate-row">
                <label className="enddate-label">종료일</label>
                <input
                  className="enddate-input"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              {/* 금액 */}
              <div className="overlap-12">
                <p className="p">
                  <span className="span">납입 액 </span>
                  <span className="text-wrapper-16">(원)</span>
                </p>
              </div>
              <div className="overlap-11">
                <input
                  className="input-amount"
                  inputMode="numeric"
                  value={amountText}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="예: 100,000"
                />
                <div className="text-wrapper-15">원</div>
              </div>

              {/* 생성하기 */}
              <div
                className={`overlap-9 ${submitting ? "is-disabled" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => !submitting && handleCreate()}
              >
                <div className="text-wrapper-11">
                  {submitting ? "생성 중…" : "생성하기"}
                </div>
              </div>
            </div>
          </div>

          <img className="union-4" alt="Union" src="/img/union-15.svg" />
        </div>

        <div className="overlap-13">
          <div className="text-wrapper-17">출국준비의 기본! 적금 플랜!</div>
        </div>

        <div className="text-wrapper-18">D - 적금</div>
      </div>
    </div>
  );
};

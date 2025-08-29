// src/pages/Savings/SavingsPlanPage.tsx
import { useState, type FormEvent, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import Header from "../../components/Header/Header";
import styles from "./SavingsPage.module.css";
import planStyles from "./SavingsPlanPage.module.css";
import underline from "../../assets/underline.svg";
import bg from "../../assets/checklistMaking.svg";
import formStyles from "../Checklist/ChecklistMaking.module.css";
import { getDemandDepositAccounts } from "../../api/accounts";
import { createSavingsPlan } from "../../api/savings";
import { useAuth } from "../../auth/useAuth";
import openChecklistAddModal from "../../components/ChecklistAddModal/ChecklistAddModal";
import { updateChecklistLinkedAmount } from "../../api/checklist";
import openChecklistAmountButton from "../../components/ChecklistAddModal/ChecklistAmountButton";

// API에서 가져오는 계좌 타입 사용
import type { DepositAccount } from "../../api/accounts";

export default function SavingsPlanPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [paymentCycle, setPaymentCycle] = useState<"월별" | "주별">("월별");
  const [paymentDate, setPaymentDate] = useState("15");
  const [paymentAmount, setPaymentAmount] = useState("100000");
  const [duration, setDuration] = useState("12");
  const [missionAmount, setMissionAmount] = useState("100000");
  const [isDateError, setIsDateError] = useState(false);
  const [isDurationError, setIsDurationError] = useState(false);
  const [accounts, setAccounts] = useState<DepositAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<DepositAccount | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [checklistInfo, setChecklistInfo] = useState<{
    checklistId?: number;
    checklistTitle?: string;
  } | null>(null);

  // 체크리스트 편집 페이지에서 전달받은 정보 확인
  useEffect(() => {
    if (location.state) {
      setChecklistInfo({
        checklistId: location.state.checklistId,
        checklistTitle: location.state.checklistTitle
      });
    }
  }, [location.state]);

  // 납입 주기가 변경될 때 납입일 초기화
  useEffect(() => {
    if (paymentCycle === "월별") {
      setPaymentDate("15"); // 월별 기본값: 15일
    } else {
      setPaymentDate("1"); // 주별 기본값: 월요일
    }
  }, [paymentCycle]);

  // 계좌 조회 함수
  const fetchAccounts = async () => {
    try {
      setAccountsLoading(true);
      const accountsData = await getDemandDepositAccounts();
      setAccounts(accountsData);
      
      // 첫 번째 계좌를 기본 선택
      if (accountsData.length > 0) {
        setSelectedAccount(accountsData[0]);
      }
    } catch (err: any) {
      console.error("계좌 조회 오류:", err);
      alert("계좌 정보를 가져올 수 없습니다.");
    } finally {
      setAccountsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 계좌 조회
  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 필수 필드 검증
    if (!selectedAccount) {
      alert("출금계좌를 선택해주세요.");
      return;
    }

    try {
      // 현재 날짜 계산
      const currentDate = new Date();
      
      // 종료 날짜 계산 (현재 날짜 + 개월 수)
      const endDate = new Date(currentDate);
      endDate.setMonth(currentDate.getMonth() + parseInt(duration));
      
      // user 정보에서 userId 확인
      console.log("useAuth에서 가져온 user 정보:", user);
      
      if (!user?.userId) {
        alert("사용자 정보를 가져올 수 없습니다. 다시 로그인해주세요.");
        return;
      }
      
      // API 요청 데이터 준비
      const requestData = {
        userId: user.userId,
        departureId: checklistInfo?.checklistId || 0,
        withdrawAccountId: parseInt(selectedAccount.accountNo) || 0,
        endDate: endDate.toISOString().split('T')[0], // YYYY-MM-DD 형식
        frequency: paymentCycle === "월별" ? "MONTHLY" : "WEEKLY" as "MONTHLY" | "WEEKLY",
        amountPerPeriod: parseFloat(paymentAmount),
        ...(paymentCycle === "월별" 
          ? { depositDay: parseInt(paymentDate) }
          : { depositWeekday: parseInt(paymentDate) - 1 } // 0~6 (0=일요일)로 변환
        )
      };

      console.log("적금 플랜 생성 요청:", requestData);
      
      // 적금 플랜 생성 API 호출 (테스트용으로 try-catch 제거)
      try {
        const result = await createSavingsPlan(requestData);
        console.log("적금 플랜 생성 성공:", result);
        alert("적금 플랜이 성공적으로 생성되었습니다!");
      } catch (error) {
        console.error("적금 플랜 생성 실패:", error);
        alert("적금 플랜 생성에 실패했습니다. 하지만 미션 적금은 설정할 수 있습니다.");
      }
      
      // 성공/실패 상관없이 미션 적금 입력 모달 표시
      if (checklistInfo?.checklistId) {
        try {
          // 미션 적금 입력을 위한 모달 (ChecklistAmountButton 사용)
          const missionAmount = await openChecklistAmountButton(parseInt(paymentAmount));
          
          if (missionAmount) {
            // 체크리스트의 linked_amount를 업데이트하는 API 호출
            await updateChecklistLinkedAmount(checklistInfo.checklistId, missionAmount);
            alert("미션 적금이 설정되었습니다!");
            
            // ChecklistCurrentPage로 이동
            navigate("/checklist/current", { replace: true });
            return; // 여기서 함수 종료
          } else {
            // 사용자가 취소한 경우에도 계속 진행
            console.log("미션 적금 설정이 취소되었습니다.");
          }
        } catch (error) {
          console.error("미션 적금 입력 모달 오류:", error);
        }
      }
      
      // 성공/실패 상관없이 적금 페이지로 이동
      navigate("/savings", { replace: true });
    } catch (err: any) {
      console.error("적금 플랜 생성 오류:", err);
      alert("적금 플랜 생성 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <Header />
        <div className={planStyles.pageContent}>
          <header className={styles.heroWrap}>
            <img src={underline} alt="" className={styles.underline} />
            <p className={styles.subtitle}>목표 달성을 위한 적금 계획</p>
            <h1 className={styles.hero}>적금 플랜</h1>
          </header>

          <div className={formStyles.inner}>
            {/* 체크리스트 정보 표시 */}
            {/* {checklistInfo && (
              <div className={planStyles.checklistInfo}>
                <h3>연결된 체크리스트</h3>
                <p><strong>제목:</strong> {checklistInfo.checklistTitle}</p>
                <p><strong>ID:</strong> {checklistInfo.checklistId}</p>
              </div>
            )} */}
            <img className={formStyles.bg} src={bg} alt="" />
            <form className={planStyles.card} onSubmit={handleSubmit}>
              {/* 출금계좌 선택 */}
              <div className={planStyles.rowGroup}>
                <div className={planStyles.row}>
                  <label className={planStyles.label}>출금계좌</label>
                  <div className={planStyles.inputWrap}>
                    {accountsLoading ? (
                      <div className={planStyles.loading}>계좌 정보를 불러오는 중...</div>
                    ) : (
                      <select
                        className={`${planStyles.control} ${planStyles.select}`}
                        value={selectedAccount?.accountNo || ""}
                        onChange={(e) => {
                          const account = accounts.find(acc => acc.accountNo === e.target.value);
                          setSelectedAccount(account || null);
                        }}
                        required
                      >
                        <option value="">계좌를 선택하세요</option>
                        {accounts.map((account) => (
                          <option key={account.accountNo} value={account.accountNo}>
                            {account.bankName} - {account.accountNo} ({account.accountBalance.toLocaleString()}원)
                          </option>
                        ))}
                      </select>
                    )}
                    <span className={planStyles.chevron} aria-hidden>
                      ▾
                    </span>
                  </div>
                </div>
              </div>

              {/* 첫 번째 행 - 납입 주기와 납일 */}
              <div className={planStyles.rowGroup}>
                <div className={planStyles.row}>
                  <label className={planStyles.label}>납입 주기</label>
                  <div className={planStyles.inputWrap}>
                    <div className={planStyles.buttonGroup}>
                      <button
                        type="button"
                        className={`${planStyles.cycleButton} ${
                          paymentCycle === "월별" ? planStyles.active : ""
                        }`}
                        onClick={() => setPaymentCycle("월별")}
                      >
                        월별
                      </button>
                      <button
                        type="button"
                        className={`${planStyles.cycleButton} ${
                          paymentCycle === "주별" ? planStyles.active : ""
                        }`}
                        onClick={() => setPaymentCycle("주별")}
                      >
                        주별
                      </button>
                    </div>
                  </div>
                </div>

                <div className={planStyles.row}>
                  <label className={planStyles.label}>
                    {paymentCycle === "월별" ? "납입일" : "납입요일"}
                  </label>
                  <div className={planStyles.inputWrap}>
                    {paymentCycle === "월별" ? (
                      // 월별: 직접 입력 (1일~31일)
                      <input
                        className={`${planStyles.control} ${isDateError ? planStyles.error : ""}`}
                        type="number"
                        min="1"
                        max="31"
                        value={paymentDate}
                        onChange={(e) => {
                          const inputValue = e.target.value;
                          // 빈 값이거나 유효한 범위의 숫자인 경우에만 업데이트
                          if (inputValue === "" || (parseInt(inputValue) >= 1 && parseInt(inputValue) <= 31)) {
                            setPaymentDate(inputValue);
                            setIsDateError(false); // 에러 상태 해제
                          } else if (parseInt(inputValue) > 31) {
                            // 31보다 큰 수를 입력한 경우
                            setIsDateError(true);
                            setPaymentDate(inputValue);
                            
                            // 0.5초 후에 빈칸으로 만들고 에러 상태 해제
                            setTimeout(() => {
                              setPaymentDate("");
                              setIsDateError(false);
                            }, 500);
                          }
                        }}
                        placeholder="1~31"
                        required
                      />
                    ) : (
                      // 주별: 요일 선택
                      <select
                        className={`${planStyles.control} ${planStyles.select}`}
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                        required
                      >
                        {[
                          { value: "1", label: "월요일" },
                          { value: "2", label: "화요일" },
                          { value: "3", label: "수요일" },
                          { value: "4", label: "목요일" },
                          { value: "5", label: "금요일" },
                          { value: "6", label: "토요일" },
                          { value: "7", label: "일요일" }
                        ].map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {paymentCycle === "주별" && (
                      <span className={planStyles.chevron} aria-hidden>
                        ▾
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 두 번째 행 - 납입액과 기간 */}
              <div className={planStyles.rowGroup}>
                <div className={planStyles.row}>
                  <div>
                    <label className={planStyles.label}>납입 액
                    <div className={planStyles.labelUnit}>(원)</div>

                    </label>
                  </div>
                  <div className={planStyles.inputWrap}>
                    <input
                      className={planStyles.control}
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="100000"
                      required
                    />
                  </div>
                </div>

                <div className={planStyles.row}>
                  <div>
                    <label className={planStyles.label}>기간
                    <div className={planStyles.labelUnit}>(개월)</div>

                    </label>
                  </div>
                  <div className={planStyles.inputWrap}>
                    <input
                      className={`${planStyles.control} ${isDurationError ? planStyles.durationError : ""}`}
                      type="number"
                      min="1"
                      max="48"
                      value={duration}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        // 빈 값이거나 유효한 범위의 숫자인 경우에만 업데이트
                        if (inputValue === "" || (parseInt(inputValue) >= 1 && parseInt(inputValue) <= 48)) {
                          setDuration(inputValue);
                          setIsDurationError(false); // 에러 상태 해제
                        } else if (parseInt(inputValue) > 48) {
                          // 48개월을 초과하는 경우
                          setIsDurationError(true);
                          setDuration(inputValue);
                          
                          // 0.5초 후에 기본값 12개월로 설정하고 에러 상태 해제
                          setTimeout(() => {
                            setDuration("12");
                            setIsDurationError(false);
                          }, 500);
                        }
                      }}
                      placeholder="1~48"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 체크리스트 미션 적금 설정 */}
              {/* <div className={planStyles.rowGroup}>
                <div className={planStyles.row}>
                  <label className={planStyles.label}>체크리스트 미션 적금</label>
                  <div className={planStyles.inputWrap}>
                    <div className={planStyles.missionButton}>
                      미션 적금 설정
                    </div>
                  </div>
                </div>
                <div className={planStyles.row}>
                  <div className={planStyles.inputWrap}>
                    <input
                      className={planStyles.control}
                      type="number"
                      value={missionAmount}
                      onChange={(e) => setMissionAmount(e.target.value)}
                      placeholder="100000"
                      required
                    />
                  </div>
                </div>
              </div> */}

              {/* 하단 생성하기 버튼 */}
              <div className={planStyles.createButton}>
                <button type="submit" className={planStyles.cta}>
                  생성하기
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

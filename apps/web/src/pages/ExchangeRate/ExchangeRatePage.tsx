import { useEffect, useMemo, useState, useRef } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import styles from "./ExchangeRatePage.module.css";
import underline from "../../assets/underline.svg";
import cloud from "../../assets/cloud.svg";
import clouds from "../../assets/clouds.svg";
import Swal from "sweetalert2";
import FxAlertButton from "../../components/FxAlertButton/FxAlertButton";
import FxConvertCard, { type FxConvertCardRef } from "../../components/FxConvertCard/FxConvertCard";
import AccountInfoCard from "../../components/AccountInfoCard";
import ExchangeHistory, { type ExchangeHistoryRef } from "./ExchangeHistory";
import ExchangeAlerts, { type ExchangeAlertsRef } from "./ExchangeAlerts";
import { createFxExchange } from "../../api/fx";
import { getMyAccounts } from "../../api/accounts";
import { useAuth } from "../../auth/useAuth";


import { SmartRateChart } from "../../components/RateChart/RateChart"; // SmartRateChart로 변경


/* 반응형 판별 훅 */
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < breakpoint;
  });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}

export default function ExchangeRatePage() {
  const { user, loading } = useAuth();
  const isMobile = useIsMobile(768);
  const [showExchangeForm, setShowExchangeForm] = useState(false);
  const [hasAccounts, setHasAccounts] = useState(true); // 계좌 존재 여부 추적
  const fxConvertCardRef = useRef<FxConvertCardRef>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [latest, setLatest] = useState<number>(1398); // 최신 환율 상태 (SmartRateChart에서 받아옴)
  const [exchangeInfo, setExchangeInfo] = useState<{
    toCurrency: string;
    toAmount: number;
    fromAmount: number;
    fromCurrency: string;
    isValid: boolean;
  } | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const exchangeHistoryRef = useRef<ExchangeHistoryRef>(null);

  // 디버깅용 로그
  useEffect(() => {
    console.log('ExchangeRatePage - isLoading changed:', isLoading);
  }, [isLoading]);

  useEffect(() => {
    console.log('ExchangeRatePage - exchangeInfo changed:', exchangeInfo);
  }, [exchangeInfo]);

  // 인증 상태 모니터링
  useEffect(() => {
    console.log('=== ExchangeRatePage 인증 상태 변경 ===');
    console.log('loading:', loading);
    console.log('user:', user);
    console.log('user?.userId:', user?.userId);
    console.log('user === null:', user === null);
    console.log('user === undefined:', user === undefined);
  }, [user, loading]);

  // SmartRateChart에서 받은 환율 업데이트
  const handleRateChange = (rate: number) => {
    setLatest(rate);
  };

  const handleExchangeRequest = () => {
    if (!hasAccounts) {
      alert("계좌를 먼저 등록해주세요. 마이페이지 > 계좌관리에서 계좌을 생성할 수 있습니다.");
      return;
    }
    setShowExchangeForm(true);
  };

  const handleExchangeApply = async () => {
    console.log("=== 환전신청 시작 ===");
    console.log("현재 user 상태:", user);
    console.log("user?.userId:", user?.userId);
    console.log("loading 상태:", loading);
    
    if (!user?.userId) {
      console.log("로그인 필요 - user.userId가 없음");
      console.log("loading이 true인 경우:", loading);
      console.log("user가 null인 경우:", user === null);
      
      if (loading) {
        await Swal.fire({
          icon: "info",
          title: "로딩 중",
          text: "사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.",
          confirmButtonText: "확인",
        });
        return;
      }
      
      await Swal.fire({
        icon: "error",
        title: "로그인 필요",
        text: "환전신청을 위해 로그인이 필요합니다.",
        confirmButtonText: "확인",
      });
      return;
    }

    try {
      // FxConvertCard에서 환전 정보 가져오기
      const exchangeInfo = fxConvertCardRef.current?.getExchangeInfo();
      if (!exchangeInfo) {
        await Swal.fire({
          icon: "error",
          title: "환전 정보 없음",
          text: "환전 정보를 가져올 수 없습니다.",
          confirmButtonText: "확인",
        });
        return;
      }

      // 계좌 정보 가져오기
      const accounts = await getMyAccounts();
      const krwAccount = accounts.find(acc => acc.currency === "KRW");
      
      if (!krwAccount) {
        await Swal.fire({
          icon: "error",
          title: "계좌 없음",
          text: "KRW 계좌를 찾을 수 없습니다.",
          confirmButtonText: "확인",
        });
        return;
      }

      // FxAlertButton 스타일을 참고한 환전신청 확인 다이얼로그
                await Swal.fire({
        width: 580,
        padding: 0,
        showConfirmButton: false,
        html: `
<div id="exchange-confirm" style="font-family: 'EF_jejudoldam', system-ui, -apple-system, Segoe UI, Roboto, 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;">
  <div style="margin: 18px; background:#f3f9ff; border:4px solid #111; border-radius:18px; padding:22px 22px 26px;">
    <div style="display:flex; justify-content:center; margin-bottom:16px;">
      <div style="background:#fff; border:4px solid #111; border-radius:999px; padding:10px 20px; font-weight:900; font-size:22px;">환전 신청 확인</div>
    </div>
    
    <!-- 환전 정보 -->
    <div style="display:flex; align-items:center; gap:16px; margin-top:8px;">
      <div style="min-width:160px; text-align:center; background:#4758FC; color:#fff; border:4px solid #111; border-radius:24px; padding:12px 14px; font-weight:900; font-size:18px;">
        ${exchangeInfo.toCurrency}
      </div>
      <div style="flex:1; border:4px solid #111; border-radius:24px; background:#fff; padding:10px 16px; display:flex; align-items:center; justify-content:center;">
        <span style="font-weight:900; font-size:26px; color:#4758fc;">${exchangeInfo.toAmount}</span>
      </div>
    </div>

    <div style="height:2px; background:#e8edf3; margin:14px 6px;"></div>

    <!-- KRW -->
    <div style="display:flex; align-items:center; gap:16px; margin-top:4px;">
      <span style="min-width:160px; text-align:center; background:#4758FC; color:#fff; border:4px solid #111; border-radius:24px; padding:12px 14px; font-weight:900; font-size:20px; letter-spacing:2px;">
        KRW
      </span>
      <div style="flex:1; border:4px solid #111; border-radius:24px; background:#f0f0f0; padding:10px 16px; display:flex; align-items:center; justify-content:flex-end;">
        <span style="font-weight:900; font-size:26px; color:#666;">${exchangeInfo.fromAmount.toLocaleString("ko-KR")}</span>
      </div>
    </div>

    <!-- 출금 계좌 정보 -->
    <div style="margin-top:16px; padding:16px; background:#fff; border:2px solid #111; border-radius:16px;">
      <div style="font-weight:900; font-size:16px; color:#111; margin-bottom:8px;">출금 계좌</div>
      <div style="font-size:14px; color:#666;">
        <div>${krwAccount.bankName}</div>
        <div>${krwAccount.accountNo}</div>
      </div>
    </div>

    <div style="display:flex; justify-content:center; gap:12px; margin-top:22px;">
      <button id="exchange-cancel"
        style="
          border:none; cursor:pointer;
          padding:12px 24px; border-radius:999px;
          background:#fff; color:#111; font-weight:900; font-size:18px;
          box-shadow:0 4px 0 #111; border:3px solid #111;
          transition: all 0.1s ease;">
        취소
      </button>
      <button id="exchange-submit"
        style="
          border:none; cursor:pointer;
          padding:12px 24px; border-radius:999px;
          background:#4758FC; color:#fff; font-weight:900; font-size:18px;
          box-shadow:0 4px 0 #111; border:3px solid #111;
          transition: all 0.1s ease;">
        환전신청
      </button>
    </div>
  </div>
</div>
        `,
        didOpen: () => {
          const cancelEl = document.getElementById("exchange-cancel") as HTMLButtonElement;
          const submitEl = document.getElementById("exchange-submit") as HTMLButtonElement;

          // 취소 버튼
          cancelEl.addEventListener("click", () => {
            Swal.close();
          });

          // 환전신청 버튼
          const submit = async () => {
            // 로딩 상태 표시
            submitEl.disabled = true;
            submitEl.textContent = "처리중...";
            submitEl.style.opacity = "0.6";

            try {
              // 환전신청 API 호출
              const exchangeData = {
                userId: user.userId!,
                accountNo: krwAccount.accountNo,
                exchangeCurrency: exchangeInfo.toCurrency,
                exchangeAmount: exchangeInfo.toAmount,
              };

              const response = await createFxExchange(exchangeData);
              
              if (response.success) {
                await Swal.fire({
                  icon: "success",
                  title: "환전신청 완료",
                  text: "환전신청이 성공적으로 처리되었습니다.",
                  confirmButtonText: "확인",
                  confirmButtonColor: "#4758FC",
                });
                
                // 모달 닫기
                setShowExchangeForm(false);
                
                // 환전 내역 새로고침
                if (exchangeHistoryRef.current) {
                  await exchangeHistoryRef.current.refreshTransactions();
                }
                

              } else {
                throw new Error(response.message || "환전신청 실패");
              }
            } catch (error: any) {
              console.error("환전신청 오류:", error);
              await Swal.fire({
                icon: "error",
                title: "환전신청 실패",
                text: error?.message || "환전신청 중 오류가 발생했습니다.",
                confirmButtonText: "확인",
                confirmButtonColor: "#ff4444",
              });
            } finally {
              // 버튼 상태 복구
              submitEl.disabled = false;
              submitEl.textContent = "환전신청";
              submitEl.style.opacity = "1";
            }
          };

          submitEl.addEventListener("click", submit);
        },
      });
    } catch (error: any) {
      console.error("환전신청 오류:", error);
      await Swal.fire({
        icon: "error",
        title: "환전신청 실패",
        text: error?.message || "환전신청 중 오류가 발생했습니다.",
        confirmButtonText: "확인",
      });
    }
  };

  return (
    <div className={styles.container}>
      {isMobile ? (
        <>
          <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar}></Sidebar>
          <button
            type="button"
            className={styles.mobileHamburger}
            onClick={toggleSidebar}
            aria-label="메뉴 열기"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </>
      ) : null}

      <main className={styles.main}>
        {isMobile ? null : <Header></Header>}

        <div className={styles.pageContent}>
          {/* 구름 배경 */}
          <div className={styles.cloudBackground}>
            <img src={cloud} alt="" className={styles.cloudLeft} />
            <img src={clouds} alt="" className={styles.cloudRight} />
          </div>
          
          <header className={styles.heroWrap}>
            <p className={styles.subtitle}>원하는 환율! 완벽한 환전!</p>
            <img src={underline} alt="" className={styles.underline} />
            <h1 className={styles.hero}>D - 환전소</h1>
          </header>

          <div className={styles.chartHeader}>
            <FxAlertButton quoteCcy="KRW"></FxAlertButton>
          </div>

          <section className={styles.chartSection}>
            <SmartRateChart />
          </section>

          {/* 환전신청하기 버튼 */}
          {!showExchangeForm && (
            <div className={styles.exchangeButtonSection}>
              <button
                type="button"
                className={`${styles.exchangeRequestBtn} ${!hasAccounts ? styles.disabled : ''}`}
                onClick={handleExchangeRequest}
                disabled={!hasAccounts}
              >
                환전신청하기
              </button>
              {!hasAccounts && (
                <p className={styles.disabledMessage}>
                  환전을 위해서는 먼저 계좌를 등록해주세요.
                </p>
              )}
            </div>
          )}

          {/* 환전 폼 모달 */}
          {showExchangeForm && (
            <div className={styles.modalOverlay} onClick={() => setShowExchangeForm(false)}>
              <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <h2 className={styles.modalTitle}>환전 신청</h2>
                  <button
                    type="button"
                    className={styles.closeModalBtn}
                    onClick={() => setShowExchangeForm(false)}
                    aria-label="모달 닫기"
                  >
                    ×
                  </button>
                </div>
                <div className={styles.modalBody}>
                  <AccountInfoCard onAccountsLoaded={(hasAccounts) => setHasAccounts(hasAccounts)} />
                  <FxConvertCard 
                    ref={fxConvertCardRef} 
                    rate={latest ?? 1398}
                    onLoadingChange={setIsLoading}
                    onExchangeInfoChange={setExchangeInfo}
                  />
                </div>
                <div className={styles.modalFooter}>
                  {isLoading ? (
                    <div className={styles.loadingMessage}>
                      <p>환율 정보를 불러오는 중입니다...</p>
                      <p>잠시만 기다려주세요.</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={styles.exchangeFormBtn}
                      onClick={handleExchangeApply}
                      disabled={!exchangeInfo?.isValid}
                    >
                      환전 신청하기
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 환전 내역 */}
          <ExchangeHistory ref={exchangeHistoryRef} />
          
        </div>
      </main>
    </div>
  );
}
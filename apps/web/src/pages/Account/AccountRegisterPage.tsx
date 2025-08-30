import { useState, type FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../Login/LoginPage.module.css";
import accountStyles from "./AccountRegister.module.css";
import Character from "../../assets/character.svg";
import api from "../../api/axiosInstance";

// API 응답 타입
interface BankProduct {
  productId: string;
  bankCode: string;
  bankName: string;
  accountTypeCode: string;
  accountTypeName: string;
  accountName: string;
  accountDescription: string;
  accountType: string;
}

// 선택된 계좌 정보
interface SelectedAccount {
  productId: string;
  bankName: string;
  accountName: string;
  accountDescription: string;
}

export default function AccountRegisterPage() {
  const navigate = useNavigate();
  const [rightPanel, setRightPanel] = useState(true);
  const [bankProducts, setBankProducts] = useState<BankProduct[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<SelectedAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 은행 상품 목록 가져오기
  useEffect(() => {
    const fetchBankProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/accounts/products');
        setBankProducts(response.data);
      } catch (err: any) {
        console.error('은행 상품 목록 가져오기 실패:', err);
        setError('은행 상품 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchBankProducts();
  }, []);

  const handleAccountSelect = (product: BankProduct) => {
    setSelectedAccount({
      productId: product.productId,
      bankName: product.bankName,
      accountName: product.accountName,
      accountDescription: product.accountDescription
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAccount) {
      alert("계좌를 선택해주세요.");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      // 계좌 생성 API 호출
      const response = await api.post(`/accounts/products/${selectedAccount.productId}`, {});
      
      console.log("계좌 생성 성공:", response.data);
      
      // 성공 시 체크리스트 페이지로 이동
      alert("계좌가 성공적으로 생성되었습니다!");
      navigate("/checklist", { replace: true });
      
    } catch (err: any) {
      console.error("계좌 등록 실패:", err);
      alert("계좌 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <div
        className={`${styles.container} ${
          rightPanel ? styles["right-panel-active"] : ""
        }`}
      >
        <div
          className={`${styles["form-container"]} ${styles["sign-up-container"]} ${styles.bluePanel}`}
        >
          <form onSubmit={handleSubmit}>
            <h2 className={styles.panelTitle}>계좌 등록</h2>

            <div className={styles.form}>
              {loading ? (
                <div className={accountStyles.loading}>은행 상품 목록을 불러오는 중...</div>
              ) : error ? (
                <div className={accountStyles.error}>{error}</div>
              ) : (
                <>
                  <div className={accountStyles.accountList}>
                    <div className={accountStyles.accountHeader}>
                      <div className={accountStyles.headerCell}>은행</div>
                      <div className={accountStyles.headerCell}>상품명</div>
                    </div>
                    
                    <div className={accountStyles.accountItems}>
                      {bankProducts.map((product) => (
                        <div
                          key={product.productId}
                          className={`${accountStyles.accountItem} ${
                            selectedAccount?.productId === product.productId ? accountStyles.selected : ""
                          }`}
                          onClick={() => handleAccountSelect(product)}
                        >
                          <div className={accountStyles.bankName}>{product.bankName}</div>
                          <div className={accountStyles.productName}>{product.accountName}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={accountStyles.startButton}
                    disabled={submitting || !selectedAccount}
                    aria-busy={submitting}
                  >
                    {submitting ? "등록 중..." : "시작"}
                  </button>
                </>
              )}
            </div>
          </form>
        </div>

        <div
          className={`${styles["form-container"]} ${styles["sign-in-container"]} ${styles.bluePanel}`}
        >
          {/* 이 부분은 사용되지 않지만 레이아웃을 위해 유지 */}
        </div>

        <div className={styles["overlay-container"]}>
          <div className={styles.overlay}>
            <div
              className={`${styles["overlay-panel"]} ${styles["overlay-left"]}`}
            >
              {/* 이 부분은 사용되지 않지만 레이아웃을 위해 유지 */}
            </div>

            <div
              className={`${styles["overlay-panel"]} ${styles["overlay-right"]}`}
            >
              <h3 className={`${styles.headline} ${styles.mtTight}`}>
                Let's Day <span className={styles.zero}>0</span>
              </h3>
              <p className={styles.subcopy}>
                데이영에서
                <br />
                사용할 계좌를 등록하세요!
              </p>

              <div className={styles.mascotBox}>
                <img
                  src={Character}
                  alt="캐릭터"
                  className={styles.mascotImg}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

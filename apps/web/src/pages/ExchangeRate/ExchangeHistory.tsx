import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import styles from './ExchangeHistory.module.css';
import { getFxTransactions, type FxTransaction } from '../../api/fx';
import { getDemandDepositAccounts, type DepositAccount } from '../../api/accounts';
import { useAuth } from '../../auth/useAuth';

export interface ExchangeHistoryRef {
  refreshTransactions: () => Promise<void>;
}

const ExchangeHistory = forwardRef<ExchangeHistoryRef>((props, ref) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<FxTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 계좌 관련 상태
  const [accounts, setAccounts] = useState<DepositAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<DepositAccount | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

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
      setError("계좌 정보를 가져올 수 없습니다.");
    } finally {
      setAccountsLoading(false);
    }
  };

  const refreshTransactions = async () => {
    if (!user?.userId || !selectedAccount) return;

    try {
      setLoading(true);
      setError(null);

      // 날짜 설정 (1개월 전부터 오늘까지)
      const today = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // 1개월 전
      
      // 오늘 날짜를 포함하도록 endDate를 내일로 설정
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 1); // 내일 날짜로 설정하여 오늘까지 포함
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      console.log('환전 내역 조회 날짜 범위:', { startDateStr, endDateStr, today: today.toISOString().split('T')[0] });

      // 환전 내역 조회
      const response = await getFxTransactions(
        user.userId,
        selectedAccount.accountNo,
        startDateStr,
        endDateStr
      );

      if (response.success) {
        setTransactions(response.data);
        // 전체 페이지 수 계산
        setTotalPages(Math.ceil(response.data.length / itemsPerPage));
        setCurrentPage(1); // 첫 페이지로 리셋
      } else {
        setError("환전 내역을 가져올 수 없습니다.");
      }
    } catch (err: any) {
      console.error("환전 내역 조회 오류:", err);
      setError(err?.message || "환전 내역 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 계좌 조회
  useEffect(() => {
    if (user?.userId) {
      fetchAccounts();
    }
  }, [user?.userId]);

  // 선택된 계좌가 변경되면 환전 내역 조회
  useEffect(() => {
    if (selectedAccount) {
      setCurrentPage(1); // 계좌 변경 시 첫 페이지로 리셋
      refreshTransactions();
    }
  }, [selectedAccount]);

  // 부모 컴포넌트에서 호출할 수 있도록 ref로 노출
  useImperativeHandle(ref, () => ({
    refreshTransactions,
  }));

  // 현재 페이지의 데이터 계산
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return transactions.slice(startIndex, endIndex);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 페이지 상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 페이지 번호 배열 생성
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5; // 최대 5개 페이지 번호 표시
    
    if (totalPages <= maxVisiblePages) {
      // 전체 페이지가 5개 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 현재 페이지 주변의 페이지 번호만 표시
      let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      // endPage 조정
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const formatCurrency = (amount: number | undefined, currency: string) => {
    if (amount === undefined || amount === null) return "-";
    
    if (currency === 'USD') {
      return `$${amount.toFixed(2)}`;
    } else if (currency === 'EUR') {
      return `€${amount.toFixed(2)}`;
    } else if (currency === 'JPY') {
      return `¥${amount.toFixed(0)}`;
    } else if (currency === 'KRW') {
      return `${amount.toLocaleString()}원`;
    }
    return `${amount}`;
  };

  const formatExchangeRate = (rate: number | undefined) => {
    if (rate === undefined || rate === null) return "-";
    return `${rate.toFixed(2)}원`;
  };

  const formatDateTime = (dateTimeStr: string) => {
    const date = new Date(dateTimeStr);
    const dateStr = date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const timeStr = date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    return { date: dateStr, time: timeStr };
  };

  if (loading) {
    return (
      <section className={styles.exchangeHistorySection}>
        <div className={styles.historyContainer}>
          <h2 className={styles.historyTitle}>환전 내역</h2>
          <div className={styles.loading}>
            <p>환전 내역을 불러오는 중...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.exchangeHistorySection}>
        <div className={styles.historyContainer}>
          <h2 className={styles.historyTitle}>환전 내역</h2>
          <div className={styles.error}>
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.exchangeHistorySection}>
      <div className={styles.historyContainer}>
        <h2 className={styles.historyTitle}>환전 내역</h2>
        
        {/* 계좌 선택 */}
        <div className={styles.accountSelector}>
          <label htmlFor="account-select" className={styles.accountLabel}>
            계좌 선택:
          </label>
          <select
            id="account-select"
            value={selectedAccount?.accountNo || ''}
            onChange={(e) => {
              const account = accounts.find(acc => acc.accountNo === e.target.value);
              setSelectedAccount(account || null);
            }}
            className={styles.accountSelect}
            disabled={accountsLoading}
          >
            {accountsLoading ? (
              <option>계좌 정보를 불러오는 중...</option>
            ) : accounts.length === 0 ? (
              <option>사용 가능한 계좌가 없습니다</option>
            ) : (
              accounts.map((account) => (
                <option key={account.accountNo} value={account.accountNo}>
                  {account.bankName} - {account.accountNo} ({account.currency})
                </option>
              ))
            )}
          </select>
        </div>
        
        {transactions.length > 0 ? (
          <>
            <div className={styles.historyTable}>
              <div className={styles.tableHeader}>
                <div className={styles.headerCell}>일시</div>
                <div className={styles.headerCell}>적용환율</div>
                <div className={styles.headerCell}>환전금액</div>
                <div className={styles.headerCell}>출금금액</div>
              </div>
              
              <div className={styles.tableBody}>
                {getCurrentPageData().map((transaction, index) => {
                  const { date, time } = formatDateTime(transaction.created || transaction.at || new Date().toISOString());
                  return (
                    <div key={index} className={styles.tableRow}>
                      <div className={styles.dateCell}>
                        <div className={styles.date}>{date}</div>
                        <div className={styles.time}>{time}</div>
                      </div>
                      <div className={styles.rateCell}>
                        {formatExchangeRate(transaction.exchangeRate || transaction.rateKrwPerUsd)}
                      </div>
                      <div className={styles.amountCell}>
                        {formatCurrency(transaction.exchangeAmount || transaction.usdAmount, transaction.exchangeCurrency || 'USD')}
                      </div>
                      <div className={styles.withdrawalCell}>
                        {formatCurrency(transaction.amount || transaction.withdrawKrw, transaction.currency || 'KRW')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                {/* 이전 페이지 버튼 */}
                <button
                  className={`${styles.pageButton} ${styles.prevButton}`}
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  이전
                </button>
                
                {/* 페이지 번호들 */}
                <div className={styles.pageNumbers}>
                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      className={`${styles.pageButton} ${currentPage === page ? styles.activePage : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                {/* 다음 페이지 버튼 */}
                <button
                  className={`${styles.pageButton} ${styles.nextButton}`}
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  다음
                </button>
              </div>
            )}
            
            {/* 페이지 정보 */}
            <div className={styles.pageInfo}>
              <span>
                {transactions.length}개 중 {(currentPage - 1) * itemsPerPage + 1}-
                {Math.min(currentPage * itemsPerPage, transactions.length)}개 표시
              </span>
            </div>
          </>
        ) : (
          <div className={styles.noData}>
            <p>환전 내역이 없습니다.</p>
          </div>
        )}
      </div>
    </section>
  );
});

export default ExchangeHistory;

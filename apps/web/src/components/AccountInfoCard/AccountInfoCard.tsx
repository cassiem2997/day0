import React, { useState, useEffect } from "react";
import { fetchMyAccounts, type AccountSummary } from "../../api/account";
import styles from "./AccountInfoCard.module.css";

export default function AccountInfoCard({ onAccountsLoaded }: { onAccountsLoaded?: (hasAccounts: boolean) => void }) {
  const [accounts, setAccounts] = useState<AccountSummary[]>([]);
  const [selectedWithdrawalAccount, setSelectedWithdrawalAccount] = useState<AccountSummary | null>(null);
  const [selectedDepositAccount, setSelectedDepositAccount] = useState<AccountSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const accountsData = await fetchMyAccounts();
        console.log('=== Accoun왜tInfoCard에서 받은 계좌 데이터 ===');
        console.log('accountsData:', accountsData);
        console.log('첫 번째 계좌:', accountsData[0]);
        console.log('두 번째 계좌:', accountsData[1]);
        console.log('========================');
        
        setAccounts(accountsData);
        
        // 부모 컴포넌트에 계좌 존재 여부 알려주기
        onAccountsLoaded?.(accountsData.length > 0);
        
        // 기본값 설정 (첫 번째 계좌를 출금계좌로, 두 번째를 입금계좌로)
        if (accountsData.length > 0) {
          console.log('출금계좌 설정:', accountsData[0]);
          setSelectedWithdrawalAccount(accountsData[0]);
        }
        if (accountsData.length > 1) {
          console.log('입금계좌 설정 (두 번째):', accountsData[1]);
          setSelectedDepositAccount(accountsData[1]);
        } else if (accountsData.length > 0) {
          console.log('입금계좌 설정 (첫 번째):', accountsData[0]);
          setSelectedDepositAccount(accountsData[0]);
        }
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
        onAccountsLoaded?.(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccounts();
  }, [onAccountsLoaded]);

  const handleWithdrawalAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const account = accounts.find(acc => acc.id === e.target.value);
    setSelectedWithdrawalAccount(account || null);
  };

  const handleDepositAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log('입금계좌 변경 시도:', e.target.value);
    const account = accounts.find(acc => acc.id === e.target.value);
    console.log('찾은 계좌:', account);
    setSelectedDepositAccount(account || null);
    console.log('입금계좌 상태 업데이트됨:', account?.id);
  };

  if (isLoading) {
    return (
      <section className={styles.accountCard}>
        <div className={styles.loadingText}>계좌 정보를 불러오는 중...</div>
      </section>
    );
  }

  if (accounts.length === 0) {
    return (
      <section className={styles.accountCard}>
        <div className={styles.errorText}>
          <div>등록된 계좌가 없습니다.</div>
          <div className={styles.helpText}>
            환전을 위해서는 먼저 계좌를 생성해주세요.<br/>
            마이페이지 계좌관리에서 계좌를 생성할 수 있습니다.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.accountCard}>
      {/* 출금계좌 */}
      <div className={styles.accountRow}>
        <span className={styles.accountLabel}>출금계좌</span>
        <div className={styles.accountField}>
          <select
            value={selectedWithdrawalAccount?.id || ""}
            onChange={handleWithdrawalAccountChange}
            className={styles.accountSelect}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.bankName} - {account.number}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 입금계좌 */}
      <div className={styles.accountRow}>
        <span className={styles.accountLabel}>입금계좌</span>
        <div className={styles.accountField}>
          <select
            value={selectedDepositAccount?.id || ""}
            onChange={handleDepositAccountChange}
            className={styles.accountSelect}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.bankName} - {account.number}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

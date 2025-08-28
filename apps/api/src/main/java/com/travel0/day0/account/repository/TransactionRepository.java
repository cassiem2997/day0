// com.travel0.day0.account.repository.TransactionRepository.java
package com.travel0.day0.account.repository;

import com.travel0.day0.account.domain.AccountTransaction;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.math.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

public interface TransactionRepository extends JpaRepository<AccountTransaction, Long> {

    // 전체(A)
    List<AccountTransaction> findByAccount_AccountIdAndTransactionDateBetween(
            Long accountId, String startDate, String endDate, Sort sort
    );

    // 타입 필터(1=입금, 2=출금)
    List<AccountTransaction> findByAccount_AccountIdAndTransactionTypeAndTransactionDateBetween(
            Long accountId, String transactionType, String startDate, String endDate, Sort sort
    );

    @Modifying
    @Query(value = """
        INSERT INTO account_transaction(
            account_id, transaction_unique_no, transaction_date, transaction_time,
            transaction_type, transaction_type_name, transaction_account_no,
            transaction_balance, transaction_after_balance, transaction_summary, transaction_memo,
            idempotency_key, created_at
        )
        VALUES (
            :accountId, :uniqueNo, :yyyymmdd, :hhmmss,
            :type, :typeName, :counterAcct,
            :amount, :afterBalance, :summary, :memo,
            :idem, CURRENT_TIMESTAMP(3)
        )
        """, nativeQuery = true)
    int insertRaw(@Param("accountId") Long accountId,
                  @Param("uniqueNo") Long uniqueNo,
                  @Param("yyyymmdd") String yyyymmdd,
                  @Param("hhmmss") String hhmmss,
                  @Param("type") String type,               // '1' 입금, '2' 출금
                  @Param("typeName") String typeName,
                  @Param("counterAcct") String counterAcct,
                  @Param("amount") BigDecimal amount,
                  @Param("afterBalance") BigDecimal afterBalance,
                  @Param("summary") String summary,
                  @Param("memo") String memo,
                  @Param("idem") String idempotencyKey);

    @Query(value = "SELECT account_balance FROM user_account WHERE account_id=:accountId FOR UPDATE", nativeQuery = true)
    BigDecimal lockBalance(@Param("accountId") Long accountId);

    default AccountTransaction insertDebit(Long accountId, String externalTxId, BigDecimal amount, String summary, String idem) {
        BigDecimal before = lockBalance(accountId);
        BigDecimal after  = before.subtract(amount);

        long uniqueNo = uniqueNoFrom(externalTxId, accountId);
        var now = ZonedDateTime.now(ZoneOffset.UTC);
        String yyyymmdd = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String hhmmss   = now.format(DateTimeFormatter.ofPattern("HHmmss"));

        insertRaw(accountId, uniqueNo, yyyymmdd, hhmmss,
                "2", "출금(이체)", null,
                amount, after, summary, null, idem);
        // 반환 엔터티 조회
        return findTopByAccount_AccountIdOrderByTxIdDesc(accountId);
    }

    default AccountTransaction insertCredit(Long accountId, String externalTxId, BigDecimal amount, String summary, String idem) {
        BigDecimal before = lockBalance(accountId);
        BigDecimal after  = before.add(amount);

        long uniqueNo = uniqueNoFrom(externalTxId, accountId);
        var now = ZonedDateTime.now(ZoneOffset.UTC);
        String yyyymmdd = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String hhmmss   = now.format(DateTimeFormatter.ofPattern("HHmmss"));

        insertRaw(accountId, uniqueNo, yyyymmdd, hhmmss,
                "1", "입금(이체)", null,
                amount, after, summary, null, idem);
        return findTopByAccount_AccountIdOrderByTxIdDesc(accountId);
    }

    private static long uniqueNoFrom(String externalTxId, Long accountId) {
        if (externalTxId != null && externalTxId.matches("\\d+")) {
            // 외부가 숫자라면 그대로 사용(계좌별 유니크 조건 충족)
            return Long.parseLong(externalTxId);
        }
        // 숫자 아님 → 내부 유니크 생성 (계좌ID 일부 + 시각)
        return (accountId % 1_000_000L) * 10_000_000L + (System.currentTimeMillis() % 10_000_000L);
    }

    AccountTransaction findTopByAccount_AccountIdOrderByTxIdDesc(Long accountId);
}

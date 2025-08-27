// com.travel0.day0.account.repository.TransactionRepository.java
package com.travel0.day0.account.repository;

import com.travel0.day0.account.domain.AccountTransaction;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.*;
import java.util.List;

public interface TransactionRepository extends JpaRepository<AccountTransaction, Long> {

    // 전체(A)
    List<AccountTransaction> findByAccountIdAndTransactionDateBetween(
            Long accountId, String startDate, String endDate, Sort sort
    );

    // 타입 필터(1=입금, 2=출금)
    List<AccountTransaction> findByAccountIdAndTransactionTypeAndTransactionDateBetween(
            Long accountId, String transactionType, String startDate, String endDate, Sort sort
    );
}

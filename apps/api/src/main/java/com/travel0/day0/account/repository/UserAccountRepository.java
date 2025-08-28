package com.travel0.day0.account.repository;

import com.travel0.day0.account.domain.UserAccount;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    List<UserAccount> findAllByUser_UserIdAndAccountTypeAndActiveTrue(
            Long userId, UserAccount.AccountType accountType
    );
    Optional<UserAccount> findByAccountIdAndUser_UserId(Long accountId, Long userId);
    Optional<UserAccount> findByAccountNo(String accountNo);

    @Modifying
    @Query("""
        update UserAccount a
           set a.accountBalance = a.accountBalance + :delta,
               a.lastTransactionDate = CURRENT_TIMESTAMP
         where a.accountId = :accountId and a.currency = :ccy
    """)
    int addBalance(@Param("accountId") Long accountId,
                   @Param("delta") BigDecimal delta,
                   @Param("ccy") String currency);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from UserAccount a where a.accountId = :id")
    Optional<UserAccount> lockById(@Param("id") Long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
      update UserAccount a
         set a.accountBalance = :balance,
             a.lastTransactionDate = :ts
       where a.accountId = :id
    """)
    int updateBalanceAndTouch(@Param("id") Long id,
                              @Param("balance") BigDecimal balance,
                              @Param("ts") Instant ts);
}
package com.travel0.day0.account.repository;

import com.travel0.day0.account.domain.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    List<UserAccount> findAllByUserIdAndAccountTypeAndActiveTrue(
            Long userId, UserAccount.AccountType accountType
    );
    Optional<UserAccount> findByAccountIdAndUserId(Long accountId, Long userId);

}
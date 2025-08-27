package com.travel0.day0.savings.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.travel0.day0.account.domain.UserAccount;
import com.travel0.day0.savings.domain.SavingsPlan;

import java.math.BigDecimal;
import java.time.Instant;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record SavingsPlanDto(
        Long planId,
        Long userId,

        Long withdrawAccountId,
        AccountBriefDto savingAccount,

        Instant startDate,
        Instant endDate,
        String frequency,
        BigDecimal amountPerPeriod,
        BigDecimal goalAmount
) {
    public static SavingsPlanDto from(SavingsPlan p) {
        return new SavingsPlanDto(
                p.getPlanId(),
                p.getUser().getUserId(),
                p.getWithdrawAccount().getAccountId(),
                AccountBriefDto.from(p.getSavingAccount()),
                p.getStartDate(),
                p.getEndDate(),
                p.getFrequency().name(),
                p.getAmountPerPeriod(),
                p.getGoalAmount()
        );
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record AccountBriefDto(
            Long accountId,
            String origin,
            String accountType,
            String bankCode,
            String bankName,
            String accountNo,
            String currency,
            BigDecimal accountBalance,
            BigDecimal dailyTransferLimit,
            BigDecimal oneTimeTransferLimit,
            LocalDate accountCreateDate,
            LocalDate accountExpireDate,
            Instant lastTransactionDate,
            Boolean active
    ) {
        public static AccountBriefDto from(UserAccount a) {
            if (a == null) return null;
            return new AccountBriefDto(
                    a.getAccountId(),
                    a.getOrigin() != null ? a.getOrigin().name() : null,
                    a.getAccountType() != null ? a.getAccountType().name() : null,
                    a.getBankCode(),
                    a.getBankName(),
                    a.getAccountNo(),
                    a.getCurrency(),
                    a.getAccountBalance(),
                    a.getDailyTransferLimit(),
                    a.getOneTimeTransferLimit(),
                    a.getAccountCreateDate(),
                    a.getAccountExpireDate(),
                    a.getLastTransactionDate(),
                    a.isActive()
            );
        }
    }
}
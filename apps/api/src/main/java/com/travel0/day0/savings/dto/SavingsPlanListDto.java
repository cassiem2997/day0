package com.travel0.day0.savings.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.travel0.day0.account.domain.UserAccount;
import com.travel0.day0.savings.domain.SavingsPlan;

import java.math.BigDecimal;
import java.time.Instant;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;


public record SavingsPlanListDto(
        Long planId,
        Long userId,
        Long withdrawAccountId,
        Long savingAccountId,
        Instant startDate,
        Instant endDate,
        String frequency,
        BigDecimal amountPerPeriod,
        BigDecimal goalAmount
) {
    public static SavingsPlanListDto from(SavingsPlan p) {
        return new SavingsPlanListDto(
                p.getPlanId(),
                p.getUser().getUserId(),
                p.getWithdrawAccount().getAccountId(),
                p.getSavingAccount().getAccountId(),
                p.getStartDate(),
                p.getEndDate(),
                p.getFrequency().name(),
                p.getAmountPerPeriod(),
                p.getGoalAmount()
        );
    }
}

package com.travel0.day0.savings.dto;

import com.travel0.day0.common.enums.SavingsFrequency;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;

public record CreatePlanResponse(
        Long planId,
        Instant startDate,
        BigDecimal goalAmount,
        @NotNull Long userId,
        Long departureId,
        @NotNull Long withdrawAccountId,
        @NotNull Long savingAccountId,
        Instant endDate,
        @NotNull SavingsFrequency frequency,
        @NotNull @DecimalMin("0.01") BigDecimal amountPerPeriod,
        @Min(1) @Max(28) Integer depositDay,
        @Min(0) @Max(6) Integer depositWeekday
) {}
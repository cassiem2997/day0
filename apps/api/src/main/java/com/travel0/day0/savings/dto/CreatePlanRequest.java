package com.travel0.day0.savings.dto;

import com.travel0.day0.common.enums.SavingsFrequency;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.*;

public record CreatePlanRequest(
        @NotNull Long userId,
        Long departureId,
        Long withdrawAccountId,
        @NotNull @DecimalMin("0.01") BigDecimal goalAmount,
        @NotNull Instant startDate,
        Instant endDate,
        @NotNull SavingsFrequency frequency,
        @NotNull @DecimalMin("0.01") BigDecimal amountPerPeriod,
        @Min(1) @Max(28) Integer depositDay,
        @Min(0) @Max(6) Integer depositWeekday
) {}
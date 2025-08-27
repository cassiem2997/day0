package com.travel0.day0.savings.dto;

import com.travel0.day0.common.enums.SavingsFrequency;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;

public record UpdatePlanRequest(
        Instant endDate,                          // optional (연장만 가능, 최대 4년)
        SavingsFrequency frequency,               // optional
        @Min(1) @Max(31) Integer depositDay,      // MONTHLY 전용
        @Min(0) @Max(6)  Integer depositWeekday,  // WEEKLY 전용
        @DecimalMin(value = "0.01") BigDecimal amountPerPeriod // optional
) {}
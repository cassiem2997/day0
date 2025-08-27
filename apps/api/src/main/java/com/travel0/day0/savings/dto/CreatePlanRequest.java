package com.travel0.day0.savings.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.travel0.day0.common.enums.SavingsFrequency;
import jakarta.validation.constraints.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.math.BigDecimal;
import java.time.*;

public record CreatePlanRequest(
        @NotNull Long userId,
        Long departureId,
        @NotNull Long withdrawAccountId,
        @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
        LocalDate endDate,
        @NotNull SavingsFrequency frequency,
        @NotNull @DecimalMin("0.01") BigDecimal amountPerPeriod,
        @Min(1) @Max(28) Integer depositDay,
        @Min(0) @Max(6) Integer depositWeekday
) {}
package com.travel0.day0.savings.dto;

import com.travel0.day0.common.enums.SavingsFrequency;

import java.math.BigDecimal;

public record UpdatePlanRequest(
        BigDecimal amountPerPeriod,
        SavingsFrequency frequency,
        Boolean active
) {}
package com.travel0.day0.savings.dto;

import com.travel0.day0.savings.domain.SavingTxn;
import com.travel0.day0.common.enums.SavingTxnStatus;
import com.travel0.day0.common.enums.SavingTxnType;

import java.math.BigDecimal;
import java.time.Instant;

public record SavingTxnDto(
        Long txnId,
        Long planId,
        Long scheduleId,
        SavingTxnType txnType,
        Long sourceUciId,
        Instant requestedAt,
        Instant processedAt,
        BigDecimal amount,
        SavingTxnStatus status,
        String idempotencyKey,
        String externalTxId,
        String failureReason,
        Long postingTxId
) {
    public static SavingTxnDto from(SavingTxn e) {
        return new SavingTxnDto(
                e.getTxnId(),
                e.getPlan().getPlanId(),
                e.getSchedule().getScheduleId(),
                e.getTxnType(),
                e.getSourceChecklistItem().getUciId(),
                e.getRequestedAt(),
                e.getProcessedAt(),
                e.getAmount(),
                e.getStatus(),
                e.getIdempotencyKey(),
                e.getExternalTxId(),
                e.getFailureReason(),
                e.getPostingTx().getTxId()
        );
    }
}

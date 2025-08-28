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
        Long planId = (e.getPlan() != null) ? e.getPlan().getPlanId() : null;
        Long scheduleId = (e.getSchedule() != null) ? e.getSchedule().getScheduleId() : null;
        Long sourceUciId = (e.getSourceChecklistItem() != null) ? e.getSourceChecklistItem().getUciId() : null;
        Long postingTxId = (e.getPostingTx() != null) ? e.getPostingTx().getTxId() : null;

        return new SavingTxnDto(
                e.getTxnId(),
                planId,
                scheduleId,
                e.getTxnType(),          // enum: null 허용이면 그대로 둠
                sourceUciId,
                e.getRequestedAt(),
                e.getProcessedAt(),
                e.getAmount(),
                e.getStatus(),           // enum: null 허용이면 그대로 둠
                e.getIdempotencyKey(),
                e.getExternalTxId(),
                e.getFailureReason(),
                postingTxId
        );
    }
}

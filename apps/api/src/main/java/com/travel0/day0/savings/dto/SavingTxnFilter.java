package com.travel0.day0.savings.dto;

import com.travel0.day0.common.enums.SavingTxnStatus;
import com.travel0.day0.common.enums.SavingTxnType;
import lombok.Data;
import org.springdoc.core.annotations.ParameterObject;

import java.time.Instant;

@Data
@ParameterObject
public class SavingTxnFilter {
    private Long planId;
    private Long scheduleId;
    private SavingTxnStatus status;   // RECEIVED, PROCESSING, SUCCESS, FAILED
    private SavingTxnType txnType;    // REGULAR, MISSION

    private Instant from;             // requestedAt >= from
    private Instant to;               // requestedAt < to

    private String externalTxId;      // like search
    private String idempotencyKey;    // like search
}

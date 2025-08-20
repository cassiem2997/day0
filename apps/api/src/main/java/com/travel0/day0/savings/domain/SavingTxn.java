package com.travel0.day0.savings.domain;

import com.travel0.day0.account.domain.AccountTransaction;
import com.travel0.day0.checklist.domain.UserChecklistItem;
import com.travel0.day0.common.enums.SavingTxnStatus;
import com.travel0.day0.common.enums.SavingTxnType;
import jakarta.persistence.*;
import lombok.*;
import java.math.*;
import java.time.*;

@Entity
@Table(name = "saving_txn")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavingTxn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "txn_id")
    private Long txnId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private SavingsPlan plan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id")
    private PaymentSchedule schedule;

    @Enumerated(EnumType.STRING)
    @Column(name = "txn_type", nullable = false, length = 20)
    private SavingTxnType txnType = SavingTxnType.REGULAR;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_uci_id")
    private UserChecklistItem sourceChecklistItem;

    @Column(name = "requested_at", nullable = false,
            columnDefinition = "TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3)")
    private Instant requestedAt;

    @Column(name = "processed_at")
    private Instant processedAt;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SavingTxnStatus status = SavingTxnStatus.RECEIVED;

    @Column(name = "idempotency_key", nullable = false, length = 80, unique = true)
    private String idempotencyKey;

    @Column(name = "external_tx_id", length = 100)
    private String externalTxId;

    @Column(name = "failure_reason", length = 300)
    private String failureReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "posting_tx_id")
    private AccountTransaction postingTx;
}

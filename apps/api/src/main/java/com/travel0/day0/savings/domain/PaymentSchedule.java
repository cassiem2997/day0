package com.travel0.day0.savings.domain;

import com.travel0.day0.common.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.*;
import java.time.*;

@Entity
@Table(name = "payment_schedule",
        uniqueConstraints = @UniqueConstraint(name="uq_ps_unique", columnNames = {"plan_id","plan_date"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "schedule_id")
    private Long scheduleId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private SavingsPlan plan;

    @Column(name = "plan_date", nullable = false)
    private Instant planDate;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PaymentStatus status;

    @Column(name = "executed_at")
    private Instant executedAt;

    @Column(name = "external_tx_id", length = 100)
    private String externalTxId;

    @Column(name = "failure_reason", length = 300)
    private String failureReason;

    @Column(name = "created_at", nullable = false,
            updatable = false,
            columnDefinition = "TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3)")
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
        if (status == null) status = PaymentStatus.PENDING;
        validate();
    }

    public void markProcessing() {
        this.status = PaymentStatus.PENDING;
        this.failureReason = null;
    }

    public void markSuccess(String externalTxId, Instant executedAt) {
        this.status = PaymentStatus.SUCCESS;
        this.externalTxId = externalTxId;
        this.executedAt = executedAt != null ? executedAt : Instant.now();
        this.failureReason = null;
    }

    public void markFailed(String reason) {
        this.status = PaymentStatus.FAILED;
        this.failureReason = reason;
        this.executedAt = null;
    }

    private void validate() {
        if (plan == null) {
            throw new IllegalArgumentException("plan must not be null");
        }
        if (planDate == null) {
            throw new IllegalArgumentException("planDate must not be null");
        }
        if (amount == null || amount.scale() > 2 || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("amount must be > 0 with scale <= 2");
        }
    }
}

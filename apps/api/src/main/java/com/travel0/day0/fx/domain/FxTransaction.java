package com.travel0.day0.fx.domain;

import com.travel0.day0.users.domain.User;
import com.travel0.day0.users.domain.DepartureInfo;
import com.travel0.day0.common.enums.FxTransactionStatus;
import com.travel0.day0.account.domain.AccountTransaction;
import jakarta.persistence.*;
import lombok.*;
import java.math.*;
import java.time.*;

@Entity
@Table(name = "fx_transaction")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FxTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "fx_tx_id")
    private Long fxTxId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "departure_id")
    private DepartureInfo departure;

    @Column(name = "from_ccy", nullable = false, length = 3)
    private String fromCcy;

    @Column(name = "to_ccy", nullable = false, length = 3)
    private String toCcy;

    @Column(name = "base_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal baseAmount;

    @Column(name = "quote_rate", precision = 18, scale = 6)
    private BigDecimal quoteRate;

    @Column(name = "executed_rate", precision = 18, scale = 6)
    private BigDecimal executedRate;

    @Column(name = "quote_amount", precision = 18, scale = 2)
    private BigDecimal quoteAmount;

    @Column(name = "fees", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal fees = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private FxTransactionStatus status = FxTransactionStatus.RECEIVED;

    @Column(name = "requested_at", nullable = false,
            columnDefinition = "TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3)")
    private Instant requestedAt;

    @Column(name = "processed_at")
    private Instant processedAt;

    @Column(name = "idempotency_key", nullable = false, length = 80, unique = true)
    private String idempotencyKey;

    @Column(name = "external_tx_id", length = 100)
    private String externalTxId;

    @Column(name = "failure_reason", length = 300)
    private String failureReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "debit_tx_id")
    private AccountTransaction debitTx;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_tx_id")
    private AccountTransaction creditTx;

}

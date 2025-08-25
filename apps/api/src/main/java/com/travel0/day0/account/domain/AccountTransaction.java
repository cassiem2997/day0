package com.travel0.day0.account.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name="account_transaction",
        uniqueConstraints = @UniqueConstraint(name="uq_tx_unique", columnNames={"account_id","transaction_unique_no"}),
        indexes = @Index(name="idx_tx_date_time", columnList="account_id, transaction_date, transaction_time")
)
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class AccountTransaction {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY)
    @Column(name="tx_id")
    private Long txId;

    @Column(name="account_id", nullable=false)
    private Long accountId;

    // 외부/원본 식별자
    @Column(name="transaction_unique_no", nullable=false)
    private Long transactionUniqueNo;

    @Column(name="transaction_date", length=8, nullable=false)
    private String transactionDate; // YYYYMMDD

    @Column(name="transaction_time", length=6, nullable=false)
    private String transactionTime; // HHMMSS

    // 거래 구분
    @Column(name="transaction_type", length=1, nullable=false)
    private String transactionType; // '1' 입금, '2' 출금

    @Column(name="transaction_type_name", length=20, nullable=false)
    private String transactionTypeName;

    // 상대방
    @Column(name="transaction_account_no")
    private String transactionAccountNo;

    // 금액/잔액
    @Column(name="transaction_balance", precision=18, scale=2, nullable=false)
    private BigDecimal transactionBalance;

    @Column(name="transaction_after_balance", precision=18, scale=2, nullable=false)
    private BigDecimal transactionAfterBalance;

    // 요약/메모
    @Column(name="transaction_summary", length=255)
    private String transactionSummary;

    @Column(name="transaction_memo", length=255)
    private String transactionMemo;

    // 생성/이력
    @Column(name="created_at", updatable=false, nullable=false)
    private Instant createdAt;

    @Column(name = "idempotency_key", length = 120)
    private String idempotencyKey;

    @PrePersist void pp() { this.createdAt = Instant.now(); }
}

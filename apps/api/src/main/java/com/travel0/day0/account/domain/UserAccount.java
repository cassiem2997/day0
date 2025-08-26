package com.travel0.day0.account.domain;

import com.travel0.day0.users.domain.User;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "user_account",
        uniqueConstraints = @UniqueConstraint(name = "uq_provider_account", columnNames = {"provider", "bank_code", "account_no"}),
        indexes = {
                @Index(name="idx_user_active", columnList="user_id, active"),
                @Index(name="idx_provider_acct", columnList="provider, account_no"),
                @Index(name="idx_last_tx", columnList="last_transaction_date")
        }
)
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class UserAccount {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="account_id")
    private Long accountId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name="origin", nullable=false)
    private Origin origin; // INTERNAL, EXTERNAL

    @Column(name="provider")
    private String provider;

    @Column(name="bank_code")
    private String bankCode;

    @Column(name="bank_name")
    private String bankName;

    @Column(name="account_no")
    private String accountNo;

    @Enumerated(EnumType.STRING)
    @Column(name="account_type", nullable=false)
    private AccountType accountType; // DEPOSIT, SAVINGS, FX

    @Column(name="currency", length=3, nullable=false)
    private String currency;

    @Column(name="account_balance", precision=18, scale=2, nullable=false)
    private BigDecimal accountBalance;

    @Column(name="daily_transfer_limit", precision=18, scale=0, nullable=false)
    private BigDecimal dailyTransferLimit;

    @Column(name="one_time_transfer_limit", precision=18, scale=0, nullable=false)
    private BigDecimal oneTimeTransferLimit;

    @Column(name="account_create_date")
    private LocalDate accountCreateDate;

    @Column(name="account_expire_date")
    private LocalDate accountExpireDate;

    @Column(name="last_transaction_date")
    private Instant lastTransactionDate;

    @Column(name="active", nullable=false)
    private boolean active;

    @Column(name="created_at", updatable=false)
    private Instant createdAt;

    @Column(name="updated_at")
    private Instant updatedAt;

    @PrePersist void pp() {
        this.createdAt = this.createdAt == null ? Instant.now() : this.createdAt;
        this.updatedAt = Instant.now();
        if (this.currency == null) this.currency = "KRW";
        if (this.accountBalance == null) this.accountBalance = BigDecimal.ZERO;
        if (this.oneTimeTransferLimit == null) this.oneTimeTransferLimit = new BigDecimal("100000000");
        if (this.dailyTransferLimit == null) this.dailyTransferLimit = new BigDecimal("500000000");
        if (this.origin == null) this.origin = Origin.INTERNAL;
        if (this.active == false) this.active = true;
    }
    @PreUpdate void pu() { this.updatedAt = Instant.now(); }

    public enum Origin { INTERNAL, EXTERNAL }
    public enum AccountType { DEPOSIT, SAVINGS, FX }
}

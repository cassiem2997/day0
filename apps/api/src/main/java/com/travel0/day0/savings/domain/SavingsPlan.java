package com.travel0.day0.savings.domain;

import com.travel0.day0.common.enums.SavingsFrequency;
import com.travel0.day0.users.domain.User;
import com.travel0.day0.deparatures.domain.DepartureInfo;
import jakarta.persistence.*;
import lombok.*;
import java.math.*;
import java.time.*;

@Entity
@Table(name = "savings_plan")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavingsPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plan_id")
    private Long planId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "departure_id", nullable = true)
    private DepartureInfo departure;

    @Column(name = "goal_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal goalAmount;

    @Column(name = "start_date", nullable = false)
    private Instant startDate;

    @Column(name = "end_date")
    private Instant endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "frequency", nullable = false)
    private SavingsFrequency frequency;

    @Column(name = "amount_per_period", nullable = false, precision = 18, scale = 2)
    private BigDecimal amountPerPeriod;

    @Column(name = "deposit_day")
    private Integer depositDay; // 1~28 (MONTHLY일 경우)

    @Column(name = "deposit_weekday")
    private Integer depositWeekday; // 0~6 (WEEKLY일 경우, 0=일요일)

    @Column(nullable = false)
    private Boolean active;

    @Column(name="created_at", nullable=false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null)
            createdAt = Instant.now();
        if (active == null)
            active = true;
        if (frequency == null)
            frequency = SavingsFrequency.MONTHLY;
        if (startDate == null)
            startDate = Instant.now();
        validate();
    }

    private void validate() {
        // 금액 > 0
        if (goalAmount == null || goalAmount.scale() > 2 || goalAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("goalAmount must be > 0 with scale <= 2");
        }
        if (amountPerPeriod == null || amountPerPeriod.scale() > 2 || amountPerPeriod.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("amountPerPeriod must be > 0 with scale <= 2");
        }

        // 날짜 관계
        if (endDate != null && !endDate.isAfter(startDate)) {
            throw new IllegalArgumentException("endDate must be after startDate");
        }

        // 주기별 필드 일관성
        switch (frequency) {
            case MONTHLY -> {
                if (depositDay == null || depositDay < 1 || depositDay > 28) {
                    throw new IllegalArgumentException("For MONTHLY frequency, depositDay must be in [1..28]");
                }
                if (depositWeekday != null) {
                    throw new IllegalArgumentException("For MONTHLY frequency, depositWeekday must be null");
                }
            }
            case WEEKLY -> {
                if (depositWeekday == null || depositWeekday < 0 || depositWeekday > 6) {
                    throw new IllegalArgumentException("For WEEKLY frequency, depositWeekday must be in [0..6]");
                }
                if (depositDay != null) {
                    throw new IllegalArgumentException("For WEEKLY frequency, depositDay must be null");
                }
            }
        }
    }

    public void update(BigDecimal amountPerPeriod, SavingsFrequency frequency, Boolean active) {
        if (amountPerPeriod != null) this.amountPerPeriod = amountPerPeriod;
        if (frequency != null) this.frequency = frequency;
        if (active != null) this.active = active;
    }

}

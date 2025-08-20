package com.travel0.day0.savings.domain;

import com.travel0.day0.common.enums.SavingsFrequency;
import com.travel0.day0.users.domain.User;
import com.travel0.day0.departures.domain.DepartureInfo;
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
    private SavingsFrequency frequency = SavingsFrequency.MONTHLY;

    @Column(name = "amount_per_period", nullable = false, precision = 18, scale = 2)
    private BigDecimal amountPerPeriod;

    @Column(name = "deposit_day")
    private Integer depositDay; // 1~28 (MONTHLY일 경우)

    @Column(name = "deposit_weekday")
    private Integer depositWeekday; // 0~6 (WEEKLY일 경우, 0=일요일)

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false,
            columnDefinition = "TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3)")
    private Instant createdAt;
}

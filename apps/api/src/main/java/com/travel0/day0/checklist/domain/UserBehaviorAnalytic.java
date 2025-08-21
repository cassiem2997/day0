package com.travel0.day0.checklist.domain;

import com.travel0.day0.common.enums.BehaviorType;
import com.travel0.day0.departures.domain.DepartureInfo;
import com.travel0.day0.users.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "user_behavior_analytics",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_user_departure",
                columnNames = {"user_id", "departure_id"}
        ),
        indexes = {
                @Index(name = "idx_behavior_type", columnList = "behavior_type, completion_rate")
        })
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserBehaviorAnalytic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "behavior_id")
    private Long behaviorId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "departure_id", nullable = false)
    private DepartureInfo departure;

    @Column(name = "total_items", nullable = false)
    @Builder.Default
    private Integer totalItems = 0;

    @Column(name = "completed_items", nullable = false)
    @Builder.Default
    private Integer completedItems = 0;

    @Column(name = "completion_rate", nullable = false, precision = 5, scale = 4)
    @Builder.Default
    private BigDecimal completionRate = BigDecimal.ZERO;

    // 행동 패턴 분류
    @Enumerated(EnumType.STRING)
    @Column(name = "behavior_type")
    @Builder.Default
    private BehaviorType behaviorType = BehaviorType.STEADY;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}

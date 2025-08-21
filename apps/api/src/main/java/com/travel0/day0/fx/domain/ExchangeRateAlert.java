package com.travel0.day0.fx.domain;

import com.travel0.day0.common.converter.FxDirectionConverter;
import com.travel0.day0.common.enums.FxDirection;
import com.travel0.day0.users.domain.User;
import jakarta.persistence.*;
import lombok.*;
import java.math.*;
import java.time.*;

@Entity
@Table(name = "exchange_rate_alert")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExchangeRateAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "alert_id")
    private Long alertId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "base_ccy", nullable = false, length = 3)
    private String baseCcy; // 기본 KRW

    @Column(name = "currency", nullable = false, length = 3)
    private String currency; // 모니터링 통화

    @Column(name = "target_rate", nullable = false, precision = 18, scale = 6)
    private BigDecimal targetRate;

    // DB 값: '>', '<', '>=', '<='  ↔  자바 enum: GT, LT, GTE, LTE (컨버터 사용)
    @Convert(converter = FxDirectionConverter.class)
    @Column(name = "direction", nullable = false, length = 2)
    private FxDirection direction;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "created_at", nullable = false, updatable = false,
            columnDefinition = "TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3)")
    private Instant createdAt;

}

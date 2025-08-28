package com.travel0.day0.fx.repository;

import com.travel0.day0.fx.domain.ExchangeRateAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Repository
public interface ExchangeRateAlertRepository extends JpaRepository<ExchangeRateAlert, Long> {

    // 특정 사용자의 활성 알림 목록
    @Query("SELECT a FROM ExchangeRateAlert a WHERE a.user.userId = :userId AND a.active = true")
    List<ExchangeRateAlert> findByUserIdAndActiveTrue(@Param("userId") Long userId);

    // 특정 통화의 활성 알림들 (조건별 최적화)
    @Query("SELECT a FROM ExchangeRateAlert a WHERE a.currency = :currency AND a.active = true " +
            "AND ((a.direction = 'LTE' AND a.targetRate >= :currentRate) " +
            "OR (a.direction = 'LT' AND a.targetRate > :currentRate) " +
            "OR (a.direction = 'GTE' AND a.targetRate <= :currentRate) " +
            "OR (a.direction = 'GT' AND a.targetRate < :currentRate))")
    List<ExchangeRateAlert> findTriggeredAlerts(@Param("currency") String currency,
                                                @Param("currentRate") BigDecimal currentRate);

    // 모든 활성 알림
    List<ExchangeRateAlert> findByActiveTrue();

    @Query("SELECT DISTINCT a.currency FROM ExchangeRateAlert a WHERE a.active = true")
    Set<String> findActiveCurrencies();

    @Query("SELECT DISTINCT a.user.userId FROM ExchangeRateAlert a " +
            "WHERE a.currency = :currency AND a.active = true")
    List<Long> findUserIdsByCurrencyAndActiveTrue(@Param("currency") String currency);
}


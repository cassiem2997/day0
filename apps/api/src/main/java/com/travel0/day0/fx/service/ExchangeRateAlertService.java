package com.travel0.day0.fx.service;

import com.travel0.day0.common.enums.FxDirection;
import com.travel0.day0.fx.domain.ExchangeRateAlert;
import com.travel0.day0.fx.repository.ExchangeRateAlertRepository;
import com.travel0.day0.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateAlertService {

    private final ExchangeRateAlertRepository alertRepository;
    private final UserRepository userRepository;
    private final SseEmitterManager sseEmitterManager;

    // 알림 등록
    @Transactional
    public ExchangeAlertInfo createAlert(Long userId, String baseCcy, String currency,
                                         BigDecimal targetRate, FxDirection direction) {
        log.info("환율 알림 등록: userId={}, {}/{} {} {}",
                userId, baseCcy, currency, direction, targetRate);

        var user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

        ExchangeRateAlert alert = ExchangeRateAlert.builder()
                .user(user)
                .baseCcy(baseCcy)
                .currency(currency)
                .targetRate(targetRate)
                .direction(direction)
                .active(true)
                .createdAt(Instant.now())
                .build();

        alert = alertRepository.save(alert);

        return ExchangeAlertInfo.from(alert);
    }

    // 사용자 알림 목록 조회
    public List<ExchangeAlertInfo> getUserAlerts(Long userId) {
        log.info("사용자 알림 목록 조회: userId={}", userId);

        return alertRepository.findByUserIdAndActiveTrue(userId).stream()
                .map(ExchangeAlertInfo::from)
                .toList();
    }

    // 알림 수정
    @Transactional
    public ExchangeAlertInfo updateAlert(Long alertId, BigDecimal targetRate, FxDirection direction) {
        log.info("알림 수정: alertId={}, {} {}", alertId, direction, targetRate);

        ExchangeRateAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 알림입니다: " + alertId));

        alert.setTargetRate(targetRate);
        alert.setDirection(direction);

        alert = alertRepository.save(alert);

        return ExchangeAlertInfo.from(alert);
    }

    // 알림 삭제 (비활성화)
    @Transactional
    public void deleteAlert(Long alertId) {
        log.info("알림 삭제: alertId={}", alertId);

        ExchangeRateAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 알림입니다: " + alertId));

        alert.setActive(false);
        alertRepository.save(alert);
    }

    // 알림 조건 체크 및 SSE 발송
    @Transactional
    public void checkAndTriggerAlerts(String currency, BigDecimal currentRate) {
        log.info("알림 조건 체크: {} = {}", currency, currentRate);

        List<ExchangeRateAlert> triggeredAlerts = alertRepository
                .findTriggeredAlerts(currency, currentRate);

        for (ExchangeRateAlert alert : triggeredAlerts) {
            if (isAlertConditionMet(alert, currentRate)) {
                // SSE로 실시간 알림 전송
                AlertTriggerInfo triggerInfo = AlertTriggerInfo.from(alert, currentRate);

                sseEmitterManager.sendToUser(
                        alert.getUser().getUserId(),
                        "exchange-rate-alert",
                        triggerInfo
                );

                // 알림 비활성화 (한 번만 발송)
                alert.setActive(false);
                alertRepository.save(alert);

                log.info("환율 알림 발송 완료: userId={}, {}/{} {} -> {}",
                        alert.getUser().getUserId(),
                        alert.getBaseCcy(),
                        alert.getCurrency(),
                        alert.getTargetRate(),
                        currentRate);
            }
        }
    }

    private boolean isAlertConditionMet(ExchangeRateAlert alert, BigDecimal currentRate) {
        return switch (alert.getDirection()) {
            case GT -> currentRate.compareTo(alert.getTargetRate()) > 0;
            case LT -> currentRate.compareTo(alert.getTargetRate()) < 0;
            case GTE -> currentRate.compareTo(alert.getTargetRate()) >= 0;
            case LTE -> currentRate.compareTo(alert.getTargetRate()) <= 0;
        };
    }

    // DTO Records
    public record ExchangeAlertInfo(
            Long alertId,
            Long userId,
            String baseCcy,
            String currency,
            BigDecimal targetRate,
            FxDirection direction,
            Boolean active,
            Instant createdAt
    ) {
        public static ExchangeAlertInfo from(ExchangeRateAlert alert) {
            return new ExchangeAlertInfo(
                    alert.getAlertId(),
                    alert.getUser().getUserId(),
                    alert.getBaseCcy(),
                    alert.getCurrency(),
                    alert.getTargetRate(),
                    alert.getDirection(),
                    alert.getActive(),
                    alert.getCreatedAt()
            );
        }
    }

    public record AlertTriggerInfo(
            Long userId,
            String baseCcy,
            String currency,
            BigDecimal targetRate,
            BigDecimal currentRate,
            FxDirection direction,
            String message,
            Instant triggeredAt
    ) {
        public static AlertTriggerInfo from(ExchangeRateAlert alert, BigDecimal currentRate) {
            String directionText = switch (alert.getDirection()) {
                case GT -> "초과";
                case LT -> "미만";
                case GTE -> "이상";
                case LTE -> "이하";
            };

            String message = String.format(
                    "[환율 알림] %s/%s 환율이 %.2f %s 조건을 만족했습니다! (현재: %.2f)",
                    alert.getBaseCcy(),
                    alert.getCurrency(),
                    alert.getTargetRate(),
                    directionText,
                    currentRate
            );

            return new AlertTriggerInfo(
                    alert.getUser().getUserId(),
                    alert.getBaseCcy(),
                    alert.getCurrency(),
                    alert.getTargetRate(),
                    currentRate,
                    alert.getDirection(),
                    message,
                    Instant.now()
            );
        }
    }
}

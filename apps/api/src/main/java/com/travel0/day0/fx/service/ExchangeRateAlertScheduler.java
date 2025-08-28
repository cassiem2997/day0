package com.travel0.day0.fx.service;

import com.travel0.day0.fx.port.ExchangeRateExternalPort;
import com.travel0.day0.fx.repository.ExchangeRateAlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateAlertScheduler {

    private final ExchangeRateService exchangeRateService;
    private final ExchangeRateAlertService alertService;
    private final ExchangeRateAlertRepository alertRepository;
    private final SseEmitterManager sseEmitterManager;

    @Scheduled(cron = "0 */10 * * * *")
    public void checkExchangeRateAlerts() {
        log.info("환율 알림 체크 스케줄러 시작 - 활성 연결 수: {}",
                sseEmitterManager.getActiveConnections());

        try {
            Set<String> activeCurrencies = alertRepository.findActiveCurrencies();

            if (activeCurrencies.isEmpty()) {
                log.info("활성 알림 없음 - 스케줄러 스킵");
                return;
            }

            log.info("체크할 통화: {}", activeCurrencies);

            var allRates = exchangeRateService.getCurrentExchangeRates();

            for (var rate : allRates) {
                if (activeCurrencies.contains(rate.currency())) {
                    sendCurrencyUpdateToInterestedUsers(rate.currency(), rate);
                    alertService.checkAndTriggerAlerts(rate.currency(),
                            BigDecimal.valueOf(rate.exchangeRate()));
                }
            }

            log.info("환율 알림 체크 스케줄러 완료");

        } catch (Exception e) {
            log.error("환율 알림 체크 중 오류 발생", e);
        }
    }

    private void sendCurrencyUpdateToInterestedUsers(String currency,
                                                     ExchangeRateExternalPort.ExchangeRateInfo rate) {
        try {
            // 해당 통화 알림을 설정한 사용자들 조회
            List<Long> interestedUserIds = alertRepository
                    .findUserIdsByCurrencyAndActiveTrue(currency);

            if (interestedUserIds.isEmpty()) {
                return;
            }

            Map<String, Object> rateUpdate = Map.of(
                    "type", "currency_update",
                    "currency", currency,
                    "rate", rate.exchangeRate(),
                    "timestamp", Instant.now()
            );

            // 관심있는 사용자들에게만 전송
            for (Long userId : interestedUserIds) {
                sseEmitterManager.sendToUser(userId, "exchange-rate-update", rateUpdate);
            }

            log.debug("{} 환율 업데이트를 {} 명에게 전송", currency, interestedUserIds.size());

        } catch (Exception e) {
            log.error("통화 업데이트 전송 실패: {}", currency, e);
        }
    }

    @Scheduled(cron = "0 */5 * * * *")
    public void sendHeartbeat() {
        if (sseEmitterManager.getActiveConnections() > 0) {
            Map<String, Object> heartbeat = Map.of(
                    "type", "heartbeat",
                    "timestamp", Instant.now(),
                    "connections", sseEmitterManager.getActiveConnections()
            );

            sseEmitterManager.sendToAllUsers("heartbeat", heartbeat);
            log.debug("Heartbeat 전송 완료 - 연결 수: {}", sseEmitterManager.getActiveConnections());
        }
    }
}
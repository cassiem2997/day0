package com.travel0.day0.fx.service;

import com.travel0.day0.fx.domain.ExchangeRateHistory;
import com.travel0.day0.fx.repository.ExchangeRateHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateScheduler {

    private final ExchangeRateService exchangeRateService;

    @Scheduled(cron = "0 0 * * * *")
    public void saveExchangeRateHistory() {
        log.info("환율 이력 저장 스케줄러 시작");

        try {
            exchangeRateService.saveExchangeRateHistory();
            log.info("환율 이력 저장 스케줄러 완료");
        } catch (Exception e) {
            log.error("환율 이력 저장 스케줄러 실패", e);
        }
    }
}

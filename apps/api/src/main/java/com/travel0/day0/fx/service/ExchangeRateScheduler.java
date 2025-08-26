package com.travel0.day0.fx.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateScheduler {

    private final ExchangeRateService exchangeRateService;

    // 매일 오후 3시에 환율 데이터 저장
    @Scheduled(cron = "0 0 15 * * *")
    public void saveExchangeRates() {
        log.info("환율 데이터 수집 스케줄러 시작");

        try {
            exchangeRateService.saveCurrentExchangeRates();
            log.info("환율 데이터 수집 완료");
        } catch (Exception e) {
            log.error("환율 데이터 수집 실패", e);
        }
    }
}

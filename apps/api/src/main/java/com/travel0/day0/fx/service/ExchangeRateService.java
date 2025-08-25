package com.travel0.day0.fx.service;

import com.travel0.day0.fx.port.ExchangeRateExternalPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateService {

    private final ExchangeRateExternalPort exchangeRateExternalPort;

    public List<ExchangeRateExternalPort.ExchangeRateInfo> getCurrentExchangeRates() {
        log.info("환율 조회 요청");

        try {
            var rates = exchangeRateExternalPort.inquireExchangeRates();
            log.info("환율 조회 성공: {} 개 통화", rates.size());
            return rates;
        } catch (Exception e) {
            log.error("환율 조회 실패", e);
            throw new IllegalStateException("환율 조회에 실패했습니다: " + e.getMessage(), e);
        }
    }
}


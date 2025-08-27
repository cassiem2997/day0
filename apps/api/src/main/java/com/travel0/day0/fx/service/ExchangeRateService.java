package com.travel0.day0.fx.service;

import com.travel0.day0.fx.domain.ExchangeRateHistory;
import com.travel0.day0.fx.port.ExchangeRateExternalPort;
import com.travel0.day0.fx.repository.ExchangeRateHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateService {

    private final ExchangeRateExternalPort exchangeRateExternalPort;
    private final ExchangeRateHistoryRepository exchangeRateHistoryRepository;

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

    public List<ExchangeRateChartData> getExchangeRateChart(String currency, int days) {
        log.info("환율 차트 데이터 조회: {} ({}일)", currency, days);

        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);

        var historyList = exchangeRateHistoryRepository
                .findByQuoteCcyAndRateDateBetweenOrderByRateDate(
                        currency.toUpperCase(), startDate, endDate);

        if (historyList.isEmpty()) {
            log.warn("차트 데이터가 없습니다: {}", currency);
            throw new IllegalArgumentException("차트 데이터가 없습니다: " + currency);
        }

        return historyList.stream()
                .map(history -> new ExchangeRateChartData(
                        history.getRateDate().toString(),
                        history.getRate().doubleValue()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public void saveCurrentExchangeRates() {
        log.info("환율 데이터 저장 시작");

        try {
            var currentRates = exchangeRateExternalPort.inquireExchangeRates();
            LocalDate today = LocalDate.now();
            int savedCount = 0;

            for (var rate : currentRates) {
                var existingRate = exchangeRateHistoryRepository
                        .findByQuoteCcyAndRateDate(rate.currency(), today);

                if (existingRate.isEmpty()) {
                    ExchangeRateHistory entity = ExchangeRateHistory.builder()
                            .quoteCcy(rate.currency())
                            .rate(BigDecimal.valueOf(rate.exchangeRate()))
                            .rateDate(today)
                            .build();

                    exchangeRateHistoryRepository.save(entity);
                    savedCount++;
                } else {
                    log.debug("이미 저장된 데이터: {} - {}", rate.currency(), today);
                }
            }

            log.info("환율 데이터 저장 완료: {} 건", savedCount);
        } catch (Exception e) {
            log.error("환율 데이터 저장 실패", e);
            throw new RuntimeException("환율 데이터 저장에 실패했습니다", e);
        }
    }

    public record ExchangeRateChartData(
            String date,
            Double rate
    ) {}
}


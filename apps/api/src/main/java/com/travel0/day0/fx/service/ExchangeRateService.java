package com.travel0.day0.fx.service;

import com.travel0.day0.fx.domain.ExchangeRateHistory;
import com.travel0.day0.fx.port.ExchangeRateExternalPort;
import com.travel0.day0.fx.repository.ExchangeRateHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateService {

    private final ExchangeRateExternalPort exchangeRateExternalPort;
    private final ExchangeRateHistoryRepository historyRepository;

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

        var historyList = historyRepository
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
                var existingRate = historyRepository
                        .findByQuoteCcyAndRateDate(rate.currency(), today);

                if (existingRate.isEmpty()) {
                    ExchangeRateHistory entity = ExchangeRateHistory.builder()
                            .quoteCcy(rate.currency())
                            .rate(BigDecimal.valueOf(rate.exchangeRate()))
                            .rateDate(today)
                            .build();

                    historyRepository.save(entity);
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

    public ExchangeRateExternalPort.ExchangeRateInfo getSpecificCurrencyRate(String currency) {
        log.info("특정 환율 조회: {}", currency);

        try {
            // SSAFY exchangeRateSearch API 호출
            var response = exchangeRateExternalPort.inquireSpecificExchangeRate(currency);
            return response;
        } catch (Exception e) {
            log.error("특정 환율 조회 실패: {}", currency, e);
            return null;
        }
    }

    public void saveExchangeRateHistory() {
        try {
            var allRates = getCurrentExchangeRates();
            LocalDate today = LocalDate.now();
            LocalDateTime now = LocalDateTime.now();

            for (var rate : allRates) {
                ExchangeRateHistory history = ExchangeRateHistory.builder()
                        .baseCcy("KRW")
                        .quoteCcy(rate.currency())
                        .rate(BigDecimal.valueOf(rate.exchangeRate()))
                        .rateDate(today)
                        .createdAt(now)
                        .build();

                historyRepository.save(history);
            }

            log.info("환율 이력 {} 건 저장 완료", allRates.size());

        } catch (Exception e) {
            log.error("환율 이력 저장 실패", e);
            throw e;
        }
    }

    // 환율 차트 데이터 조회
    public List<Map<String, Object>> getExchangeRateChart(String currency, Integer days) {
        List<ExchangeRateHistory> historyData;

        if (days != null && days > 0) {
            LocalDate fromDate = LocalDate.now().minusDays(days);
            historyData = historyRepository
                    .findByQuoteCcyAndRateDateAfterOrderByCreatedAtDesc(currency, fromDate);
        } else {
            Pageable limit = PageRequest.of(0, 30);
            historyData = historyRepository
                    .findByQuoteCcyOrderByCreatedAtDesc(currency, limit);
        }

        return historyData.stream()
                .map(h -> {
                    Map<String, Object> chartPoint = new HashMap<>();
                    chartPoint.put("date", h.getCreatedAt().toString());
                    chartPoint.put("value", h.getRate().doubleValue());
                    return chartPoint;
                })
                .collect(Collectors.toList());
    }

    public record ExchangeRateChartData(
            String date,
            Double rate
    ) {}
}


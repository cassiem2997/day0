package com.travel0.day0.fx.service;

import com.travel0.day0.fx.port.ExchangeExternalPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExchangeService {

    private final ExchangeExternalPort exchangeExternalPort;

    // 환전 예상 금액 조회
    public EstimateExchangeInfo estimateExchange(String fromCurrency, String toCurrency, Double amount) {
        log.info("환전 예상 금액 조회: {} {} -> {}", amount, fromCurrency, toCurrency);

        try {
            var estimate = exchangeExternalPort.estimateExchange(fromCurrency, toCurrency, amount);

            return new EstimateExchangeInfo(
                    estimate.currency(),
                    estimate.currencyName(),
                    estimate.amount(),
                    estimate.exchangeCurrency(),
                    estimate.exchangeCurrencyName(),
                    estimate.exchangeAmount()
            );
        } catch (Exception e) {
            log.error("환전 예상 금액 조회 실패", e);
            throw new IllegalStateException("환전 예상 금액 조회에 실패했습니다: " + e.getMessage(), e);
        }
    }

    // 환전 신청
    public ExchangeTransactionInfo createExchange(String userKey, String accountNo, String exchangeCurrency, Double exchangeAmount) {
        log.info("환전 신청: {} {} -> {}", exchangeAmount, accountNo, exchangeCurrency);

        try {
            var result = exchangeExternalPort.createExchange(userKey, accountNo, exchangeCurrency, exchangeAmount);

            return new ExchangeTransactionInfo(
                    result.exchangeCurrency(),
                    result.amount(),
                    result.exchangeRate(),
                    result.currency(),
                    result.currencyName(),
                    result.accountNo(),
                    result.accountAmount(),
                    result.balance()
            );
        } catch (Exception e) {
            log.error("환전 신청 실패", e);
            throw new IllegalStateException("환전 신청에 실패했습니다: " + e.getMessage(), e);
        }
    }

    // 환전 내역 조회
    public List<ExchangeHistoryInfo> getExchangeHistory(String userKey, String accountNo, LocalDate startDate, LocalDate endDate) {
        log.info("환전 내역 조회: {} {} ~ {}", accountNo, startDate, endDate);

        try {
            String startDateStr = startDate.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String endDateStr = endDate.format(DateTimeFormatter.ofPattern("yyyyMMdd"));

            var historyList = exchangeExternalPort.getExchangeHistory(userKey, accountNo, startDateStr, endDateStr);

            return historyList.stream()
                    .map(h -> new ExchangeHistoryInfo(
                            h.bankName(),
                            h.userName(),
                            h.accountNo(),
                            h.accountName(),
                            h.currency(),
                            h.currencyName(),
                            h.amount(),
                            h.exchangeCurrency(),
                            h.exchangeCurrencyName(),
                            h.exchangeAmount(),
                            h.exchangeRate(),
                            h.created()
                    ))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("환전 내역 조회 실패", e);
            throw new IllegalStateException("환전 내역 조회에 실패했습니다: " + e.getMessage(), e);
        }
    }

    // DTO Records
    public record EstimateExchangeInfo(
            String fromCurrency,
            String fromCurrencyName,
            Double amount,
            String toCurrency,
            String toCurrencyName,
            Double estimatedAmount
    ) {}

    public record ExchangeTransactionInfo(
            String exchangeCurrency,
            Double amount,
            Double exchangeRate,
            String currency,
            String currencyName,
            String accountNo,
            Double accountAmount,
            Double balance
    ) {}

    public record ExchangeHistoryInfo(
            String bankName,
            String userName,
            String accountNo,
            String accountName,
            String currency,
            String currencyName,
            Double amount,
            String exchangeCurrency,
            String exchangeCurrencyName,
            Double exchangeAmount,
            Double exchangeRate,
            String created
    ) {}
}


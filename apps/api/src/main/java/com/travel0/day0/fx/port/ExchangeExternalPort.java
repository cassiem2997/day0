package com.travel0.day0.fx.port;

import java.util.List;

public interface ExchangeExternalPort {

    // 환전 예상 금액 조회
    EstimateInfo estimateExchange(String currency, String exchangeCurrency, Double amount);

    // 환전 신청
    ExchangeResult createExchange(String userKey, String accountNo, String exchangeCurrency, Double exchangeAmount);

    // 환전 내역 조회
    List<ExchangeHistory> getExchangeHistory(String userKey, String accountNo, String startDate, String endDate);

    // DTO Records
    record EstimateInfo(
            String currency,
            String currencyName,
            Double amount,
            String exchangeCurrency,
            String exchangeCurrencyName,
            Double exchangeAmount
    ) {}

    record ExchangeResult(
            String exchangeCurrency,
            Double amount,
            Double exchangeRate,
            String currency,
            String currencyName,
            String accountNo,
            Double accountAmount,
            Double balance
    ) {}

    record ExchangeHistory(
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

package com.travel0.day0.fx.port;

import java.util.List;

public interface ExchangeRateExternalPort {
    List<ExchangeRateInfo> inquireExchangeRates();

    record ExchangeRateInfo(
            Long id,
            String currency,
            Double exchangeRate,
            Double exchangeMin,
            String created
    ) {}
}

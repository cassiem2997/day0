package com.travel0.day0.fx.adapter;

import com.travel0.day0.finopenapi.client.ExchangeRateOpenApiClient;
import com.travel0.day0.fx.port.ExchangeRateExternalPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ExchangeRateExternalAdapter implements ExchangeRateExternalPort {

    private final ExchangeRateOpenApiClient client;

    @Override
    public List<ExchangeRateInfo> inquireExchangeRates() {
        var res = client.inquireExchangeRate();
        if (res == null || res.getREC() == null)
            throw new IllegalStateException("FINOPENAPI_EXCHANGE_RATE_EMPTY");

        return res.getREC().stream()
                .map(r -> new ExchangeRateInfo(
                        r.getId(),
                        r.getCurrency(),
                        r.getExchangeRateAsDouble(),
                        r.getExchangeMinAsDouble(),
                        r.getCreated()
                ))
                .collect(Collectors.toList());
    }

    @Override
    public ExchangeRateInfo inquireSpecificExchangeRate(String currency) {
        var res = client.inquireExchangeRateSearch(currency);
        if (res == null || res.getREC() == null) {
            throw new IllegalStateException("FINOPENAPI_SPECIFIC_EXCHANGE_RATE_EMPTY: " + currency);
        }

        var rec = res.getREC();
        return new ExchangeRateInfo(
                rec.getId(),
                rec.getCurrency(),
                rec.getExchangeRateAsDouble(),
                rec.getExchangeMinAsDouble(),
                rec.getCreated()
        );
    }
}
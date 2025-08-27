package com.travel0.day0.fx.adapter;

import com.travel0.day0.finopenapi.client.ExchangeOpenApiClient;
import com.travel0.day0.fx.port.ExchangeExternalPort;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class ExchangeExternalAdapter implements ExchangeExternalPort {

    private final ExchangeOpenApiClient client;

    @Override
    public EstimateInfo estimateExchange(String currency, String exchangeCurrency, Double amount) {
        var res = client.estimateExchange(currency, exchangeCurrency, amount);
        if (res == null || res.getREC() == null)
            throw new IllegalStateException("FINOPENAPI_EXCHANGE_ESTIMATE_EMPTY");

        var rec = res.getREC();
        return new EstimateInfo(
                rec.getCurrency().getCurrency(),
                rec.getCurrency().getCurrencyName(),
                rec.getCurrency().getAmountAsDouble(),
                rec.getExchangeCurrency().getCurrency(),
                rec.getExchangeCurrency().getCurrencyName(),
                rec.getExchangeCurrency().getAmountAsDouble()
        );
    }

    @Override
    public ExchangeResult createExchange(String userKey, String accountNo, String exchangeCurrency, String exchangeAmount) {
        var res = client.createExchange(userKey, accountNo, exchangeCurrency, exchangeAmount);
        if (res == null || res.getREC() == null)
            throw new IllegalStateException("FINOPENAPI_EXCHANGE_CREATE_FAILED");

        var rec = res.getREC();
        var exchangeInfo = rec.getExchangeCurrency();
        var accountInfo = rec.getAccountInfo();

        return new ExchangeResult(
                exchangeInfo.getCurrency(),
                exchangeInfo.getAmountAsDouble(),
                exchangeInfo.getExchangeRateAsDouble(),
                "KRW",
                "원화",
                accountInfo.getAccountNo(),
                accountInfo.getAmountAsDouble(),
                accountInfo.getBalanceAsDouble()
        );
    }

    @Override
    public List<ExchangeHistory> getExchangeHistory(String userKey, String accountNo, String startDate, String endDate) {
        var res = client.getExchangeHistory(userKey, accountNo, startDate, endDate);
        if (res == null || res.getREC() == null)
            return Collections.emptyList();

        return res.getREC().stream()
                .map(r -> new ExchangeHistory(
                        r.getAccount().getBankName(),
                        r.getAccount().getUserName(),
                        r.getAccount().getAccountNo(),
                        r.getAccount().getAccountName(),
                        r.getCurrency().getCurrency(),
                        r.getCurrency().getCurrencyName(),
                        Double.parseDouble(r.getCurrency().getAmount().replace(",", "")),
                        r.getExchangeCurrency().getCurrency(),
                        r.getExchangeCurrency().getCurrencyName(),
                        r.getExchangeCurrency().getAmountAsDouble(),
                        r.getExchangeCurrency().getExchangeRateAsDouble(),
                        r.getCreated()
                ))
                .collect(Collectors.toList());
    }
}

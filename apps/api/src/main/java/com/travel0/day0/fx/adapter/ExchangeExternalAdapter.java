package com.travel0.day0.fx.adapter;

import com.travel0.day0.finopenapi.client.ExchangeOpenApiClient;
import com.travel0.day0.fx.port.ExchangeExternalPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
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
                rec.getCurrency().getAmount(),
                rec.getExchangeCurrency().getCurrency(),
                rec.getExchangeCurrency().getCurrencyName(),
                rec.getExchangeCurrency().getAmount()
        );
    }

    @Override
    public ExchangeResult createExchange(String userKey, String accountNo, String exchangeCurrency, Double exchangeAmount) {
        var res = client.createExchange(userKey, accountNo, exchangeCurrency, exchangeAmount);
        if (res == null || res.getREC() == null)
            throw new IllegalStateException("FINOPENAPI_EXCHANGE_CREATE_FAILED");

        var rec = res.getREC();
        var exchangeInfo = rec.getExchangeCurrency();
        var accountInfo = rec.getAccountInfo();

        return new ExchangeResult(
                exchangeInfo.getCurrency(),
                exchangeInfo.getAmount(),
                exchangeInfo.getExchangeRate(),
                "KRW",
                "원화",
                accountInfo.getAccountNo(),
                accountInfo.getAmount(),
                accountInfo.getBalance()
        );
    }

    @Override
    public List<ExchangeHistory> getExchangeHistory(String userKey, String accountNo, String startDate, String endDate) {
        var res = client.getExchangeHistory(userKey, accountNo, startDate, endDate);
        if (res == null || res.getREC() == null)
            return Collections.emptyList();

        return res.getREC().stream()
                .map(r -> new ExchangeHistory(
                        r.getBankName(),
                        r.getUserName(),
                        r.getAccountNo(),
                        r.getAccountName(),
                        r.getCurrency(),
                        r.getCurrencyName(),
                        r.getAmount(),
                        r.getExchangeCurrency(),
                        r.getExchangeCurrencyName(),
                        r.getExchangeAmount(),
                        r.getExchangeRate(),
                        r.getCreated()
                ))
                .collect(Collectors.toList());
    }
}

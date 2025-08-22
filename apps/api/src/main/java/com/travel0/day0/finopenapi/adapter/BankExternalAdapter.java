package com.travel0.day0.finopenapi.adapter;

import com.travel0.day0.bank.port.BankExternalPort;
import com.travel0.day0.finopenapi.client.BankOpenApiClient;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.util.stream.Collectors;
import java.util.List;

@Component
@RequiredArgsConstructor
public class BankExternalAdapter implements BankExternalPort {

    private final BankOpenApiClient client;

    @Override
    public List<BankCode> inquireBankCodes() {
        var res = client.inquireBankCodes();
        if (res == null || res.getREC() == null)
            throw new IllegalStateException("FINOPENAPI_BANK_CODES_EMPTY");
        return res.getREC().stream()
                .map(r -> new BankCode(r.getBankCode(), r.getBankName()))
                .collect(Collectors.toList());
    }

    @Override
    public DemandDepositDtos.CreateDemandDepositRes registerProduct(String bankCode, String name, String desc) {
        var res = client.createDepositProduct(bankCode, name, desc);
        if (res == null || res.getREC() == null || res.getREC().isEmpty()) {
            throw new IllegalStateException("FINOPENAPI_DEMAND_DEPOSIT_EMPTY");
        }
        return res;
    }
}

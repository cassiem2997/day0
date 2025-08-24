package com.travel0.day0.finopenapi.adapter;

import com.travel0.day0.finopenapi.client.DemandDepositOpenApiClient;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos;
import com.travel0.day0.savings.port.DemandDepositExternalPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DemandDepositExternalAdapter implements DemandDepositExternalPort {

    private final DemandDepositOpenApiClient client;

    @Override
    public List<DemandDepositDtos.Rec> inquireDemandDepositList() {
        var res = client.InquireDemandDepositList();
        if (res == null || res.getREC() == null || res.getREC().isEmpty()) {
            throw new IllegalStateException("FINOPENAPI_DEMAND_DEPOSIT_LIST_EMPTY");
        }
        return res.getREC();
    }

    @Override
    public DemandDepositDtos.CreateDemandDepositAccountRes createAccount(String accountTypeUniqueNo, String userKey) {
        var res = client.createDemandDepositAccount(accountTypeUniqueNo, userKey);
        if (res == null || res.getREC() == null || res.getREC().isEmpty()) {
            throw new IllegalStateException("FINOPENAPI_DEMAND_DEPOSIT_ACCOUNT_EMPTY");
        }
        return res;
    }
}

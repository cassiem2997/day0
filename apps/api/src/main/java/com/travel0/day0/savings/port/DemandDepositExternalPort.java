package com.travel0.day0.savings.port;

import com.travel0.day0.finopenapi.dto.DemandDepositDtos;

import java.util.List;

public interface DemandDepositExternalPort {
    List<DemandDepositDtos.Rec> inquireDemandDepositList();
    DemandDepositDtos.CreateDemandDepositAccountRes createAccount(String accountTypeUniqueNo, String userKey);
}

package com.travel0.day0.savings.service;

import com.travel0.day0.finopenapi.config.FinOpenApiProperties;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos;
import com.travel0.day0.savings.port.DemandDepositExternalPort;
import com.travel0.day0.users.service.UserKeyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DemandDepositService {

    private final DemandDepositExternalPort externalPort;
    private final FinOpenApiProperties finOpenApiProperties;
    private final UserKeyService userKeyService;

    /**
     * 수시입출금 상품 목록 조회
     */
    public List<DemandDepositDtos.Rec> listProducts() {
        return externalPort.inquireDemandDepositList();
    }

    /**
     * 수시입출금 계좌 생성
     */
    public DemandDepositDtos.CreateDemandDepositAccountRes createAccount(
            Long localUserId,
            String accountTypeUniqueNo
    ) {
        String apiKey = finOpenApiProperties.getApiKey();
        String userKey = userKeyService.searchUserKey(localUserId, apiKey);
        return externalPort.createAccount(accountTypeUniqueNo, userKey);
    }
}

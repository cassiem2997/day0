package com.travel0.day0.bank.service;

import com.travel0.day0.bank.port.BankExternalPort;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BankService {

    private final BankExternalPort external;

    public List<BankExternalPort.BankCode> getBankCodes() {
        return external.inquireBankCodes();
    }

    public DemandDepositDtos.CreateDemandDepositRes register(String bankCode, String name, String desc) {
        return external.registerProduct(bankCode, name, desc);
    }
}

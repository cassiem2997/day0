package com.travel0.day0.bank.port;

import com.travel0.day0.finopenapi.dto.DemandDepositDtos;

import java.util.List;

public interface BankExternalPort {
    List<BankCode> inquireBankCodes();

    record BankCode(String bankCode, String bankName) {}

    DemandDepositDtos.CreateDemandDepositRes registerProduct(String bankCode, String name, String desc);
}
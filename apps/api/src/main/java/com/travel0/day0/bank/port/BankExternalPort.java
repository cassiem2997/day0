package com.travel0.day0.bank.port;

import java.util.List;

public interface BankExternalPort {
    List<BankCode> inquireBankCodes();

    record BankCode(String bankCode, String bankName) {}
}
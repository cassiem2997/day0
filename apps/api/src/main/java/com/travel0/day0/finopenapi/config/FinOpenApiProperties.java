package com.travel0.day0.finopenapi.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@ConfigurationProperties(prefix = "finopenapi")
@Getter
@Setter
public class FinOpenApiProperties {
    private String baseUrl;
    private String institutionCode;
    private String fintechAppNo;
    private String apiKey;
    private String managerId;

    // 앱 사용자
    private String member = "member";
    private String memberSearch = "member/search";

    // 은행 - 정보
    private String inquireBankCodes = "inquireBankCodes";
    private String inquireBankCurrency = "inquireBankCurrency";

    // 은행 - 수시입출금
    private String createDemandDeposit = "createDemandDeposit";
    private String inquireDemandDepositList = "inquireDemandDepositList";
    private String createDemandDepositAccount = "createDemandDepositAccount";
    private String inquireDemandDepositAccountList = "inquireDemandDepositAccountList";
    private String inquireDemandDepositAccount = "inquireDemandDepositAccount";
    private String inquireDemandDepositAccountHolderName = "inquireDemandDepositAccountHolderName";
    private String inquireDemandDepositAccountBalance = "inquireDemandDepositAccountBalance";
    private String updateDemandDepositAccountWithdrawal = "updateDemandDepositAccountWithdrawal";
    private String updateDemandDepositAccountDeposit = "updateDemandDepositAccountDeposit";
    private String updateDemandDepositAccountTransfer = "updateDemandDepositAccountTransfer";
    private String updateTransferLimit = "updateTransferLimit";
    private String inquireTransactionHistoryList = "inquireTransactionHistoryList";
    private String inquireTransactionHistory = "inquireTransactionHistory";
    private String deleteDemandDepositAccount = "deleteDemandDepositAccount";

    // 은행 - 적금
    private String createSavingsProduct = "createProduct";
    private String inquireSavingsProducts = "inquireSavingsProducts";
    private String createSavingsAccount = "createAccount";
    private String inquireSavingsAccountList = "inquireAccountList";
    private String inquireSavingsAccount = "inquireAccount";
    private String inquireSavingsPayment = "inquirePayment";
    private String inquireSavingsExpiryInterest = "inquireExpiryInterest";
    private String inquireSavingsEarlyTerminationInterest = "inquireEarlyTerminationInterest";
    private String deleteSavingsAccount = "deleteAccount";

    // 환율
    private String inquireExchangeRate = "exchangeRate";
    private String exchangeRateSearch = "exchangeRateSearch";

    // 환전
    private String estimateExchange = "estimate";
    private String createExchange = "exchange";
    private String inquireExchangeHistory = "exchangeHistory";

    // 외화 수시입출금
    private String createForeignCurrencyDemandDeposit = "createForeignCurrencyDemandDeposit";
    private String inquireForeignCurrencyDemandDepositList = "inquireForeignCurrencyDemandDepositList";
    private String createForeignCurrencyDemandDepositAccount = "createForeignCurrencyDemandDepositAccount";
    private String inquireForeignCurrencyDemandDepositAccountList = "inquireForeignCurrencyDemandDepositAccountList";
    private String inquireForeignCurrencyDemandDepositAccount = "inquireForeignCurrencyDemandDepositAccount";
    private String inquireForeignCurrencyDemandDepositAccountHolderName = "inquireForeignCurrencyDemandDepositAccountHolderName";
    private String inquireForeignCurrencyDemandDepositAccountBalance = "inquireForeignCurrencyDemandDepositAccountBalance";
    private String updateForeignCurrencyDemandDepositAccountWithdrawal = "updateForeignCurrencyDemandDepositAccountWithdrawal";
    private String updateForeignCurrencyDemandDepositAccountDeposit = "updateForeignCurrencyDemandDepositAccountDeposit";
    private String updateForeignCurrencyDemandDepositAccountTransfer = "updateForeignCurrencyDemandDepositAccountTransfer";
    private String updateForeignCurrencyTransferLimit = "updateForeignCurrencyTransferLimit";
    private String inquireForeignCurrencyTransactionHistoryList = "inquireForeignCurrencyTransactionHistoryList";
    private String inquireForeignCurrencyTransactionHistory = "inquireForeignCurrencyTransactionHistory";
    private String deleteForeignCurrencyDemandDepositAccount = "deleteForeignCurrencyDemandDepositAccount";

    // 거래메모
    private String transactionMemo = "transactionMemo";
}

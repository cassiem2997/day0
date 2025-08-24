package com.travel0.day0.savings.port;

import com.travel0.day0.finopenapi.dto.DemandDepositDtos.*;

import java.util.List;

public interface DemandDepositExternalPort {
    List<Rec> inquireDemandDepositList();
    CreateDemandDepositAccountRes createAccount(String accountTypeUniqueNo, String userKey);
    List<AccountListRec> inquireAccountList(String userKey);
    AccountListRec inquireAccount(String accountNo, String userKey);
    AccountHolderRec inquireAccountHolderName(String accountNo, String userKey);
    AccountBalanceRec inquireAccountBalance(String accountNo, String userKey);
    InquireDemandDepositAccountWithdrawalRes withdraw(String accountNo, Long amount, String summary, String userKey);
    updateDemandDepositAccountDepositRes deposit(String accountNo, Long amount, String summary, String userKey);
    updateDemandDepositAccountTransferRes transfer(String withdrawalAccountNo, String depositAccountNo, Long amount, String withdrawalSummary, String depositSummary, String userKey);
    updateTransferLimitRes updateTransferLimit(String accountNo, Long oneTimeLimit, Long dailyLimit, String userKey);
    inquireTransactionHistoryListRes inquireTransactionHistoryList(String accountNo, String startDate, String endDate, String transactionType, String orderByType, String userKey);
    inquireTransactionHistoryRes inquireTransactionHistory(String accountNo, Long transactionUniqueNo, String userKey);
    deleteDemandDepositAccountRes deleteAccount(String accountNo, String refundAccountNo, String userKey);
    public transactionMemoRes getMemo(String accountNo, Long transactionUniqueNo, String transactionMemo, String userKey);
    }

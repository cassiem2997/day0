package com.travel0.day0.savings.service;

import com.travel0.day0.finopenapi.config.FinOpenApiProperties;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos.*;
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

    private String resolveUserKey(Long localUserId) {
        String apiKey = finOpenApiProperties.getApiKey();
        return userKeyService.searchUserKey(localUserId, apiKey);
    }

    public List<Rec> listProducts() {
        return externalPort.inquireDemandDepositList();
    }

    public CreateDemandDepositAccountRes createAccount(Long localUserId, String accountTypeUniqueNo) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.createAccount(accountTypeUniqueNo, userKey);
    }

    public List<AccountListRec> listAccounts(Long localUserId) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.inquireAccountList(userKey);
    }

    public AccountListRec getAccount(Long localUserId, String accountNo) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.inquireAccount(accountNo, userKey);
    }

    public AccountHolderRec getAccountHolder(Long localUserId, String accountNo) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.inquireAccountHolderName(accountNo, userKey);
    }

    public AccountBalanceRec getBalance(Long localUserId, String accountNo) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.inquireAccountBalance(accountNo, userKey);
    }

    public InquireDemandDepositAccountWithdrawalRes withdraw(Long localUserId, String accountNo, Long amount, String summary) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.withdraw(accountNo, amount, summary, userKey);
    }

    public updateDemandDepositAccountDepositRes deposit(Long localUserId, String accountNo, Long amount, String summary) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.deposit(accountNo, amount, summary, userKey);
    }

    public updateDemandDepositAccountTransferRes transfer(Long localUserId, String withdrawalAccountNo, String depositAccountNo,
                                                          Long amount, String withdrawalSummary, String depositSummary) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.transfer(withdrawalAccountNo, depositAccountNo, amount, withdrawalSummary, depositSummary, userKey);
    }

    public updateTransferLimitRes updateLimit(Long localUserId, String accountNo, Long oneTimeLimit, Long dailyLimit) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.updateTransferLimit(accountNo, oneTimeLimit, dailyLimit, userKey);
    }

    public inquireTransactionHistoryListRes listTransactions(Long localUserId, String accountNo, String startDate, String endDate,
                                                             String transactionType, String orderByType) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.inquireTransactionHistoryList(accountNo, startDate, endDate, transactionType, orderByType, userKey);
    }

    public inquireTransactionHistoryRes getTransaction(Long localUserId, String accountNo, Long transactionUniqueNo) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.inquireTransactionHistory(accountNo, transactionUniqueNo, userKey);
    }

    public deleteDemandDepositAccountRes deleteAccount(Long localUserId, String accountNo, String refundAccountNo) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.deleteAccount(accountNo, refundAccountNo, userKey);
    }

    public transactionMemoRes getMemo(Long localUserId, String accountNo, Long transactionUniqueNo, String transactionMemo) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.getMemo(accountNo, transactionUniqueNo, transactionMemo, userKey);
    }
}

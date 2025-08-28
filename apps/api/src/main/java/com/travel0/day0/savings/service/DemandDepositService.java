package com.travel0.day0.savings.service;

import com.travel0.day0.account.domain.UserAccount;
import com.travel0.day0.account.repository.UserAccountRepository;
import com.travel0.day0.finopenapi.config.FinOpenApiProperties;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos.*;
import com.travel0.day0.savings.port.DemandDepositExternalPort;
import com.travel0.day0.users.service.UserKeyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static com.travel0.day0.savings.service.SavingsPlanService.nvl;

@Service
@RequiredArgsConstructor
public class DemandDepositService {

    private final DemandDepositExternalPort externalPort;
    private final FinOpenApiProperties finOpenApiProperties;
    private final UserAccountRepository accountRepository;
    private final UserKeyService userKeyService;
    private final LedgerService ledgerService;

    private String resolveUserKey(Long localUserId) {
        String apiKey = finOpenApiProperties.getApiKey();
        return userKeyService.searchUserKey(localUserId, apiKey);
    }

    @Transactional(readOnly = true)
    public List<Rec> listProducts() {
        return externalPort.inquireDemandDepositList();
    }

    @Transactional
    public CreateDemandDepositAccountRes createAccount(Long localUserId, String accountTypeUniqueNo) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.createAccount(accountTypeUniqueNo, userKey);
    }

    @Transactional(readOnly = true)
    public List<AccountListRec> listAccounts(Long localUserId) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.inquireAccountList(userKey);
    }

    @Transactional(readOnly = true)
    public AccountListRec getAccount(Long localUserId, String accountNo) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.inquireAccount(accountNo, userKey);
    }

    @Transactional(readOnly = true)
    public AccountHolderRec getAccountHolder(Long localUserId, String accountNo) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.inquireAccountHolderName(accountNo, userKey);
    }

    @Transactional(readOnly = true)
    public AccountBalanceRec getBalance(Long localUserId, String accountNo) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.inquireAccountBalance(accountNo, userKey);
    }

    @Transactional
    public InquireDemandDepositAccountWithdrawalRes withdraw(Long localUserId, String accountNo, Long amount, String summary) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.withdraw(accountNo, amount, summary, userKey);
    }

    @Transactional
    public updateDemandDepositAccountDepositRes deposit(Long localUserId, String accountNo, Long amount, String summary) {
        UserAccount acc = accountRepository.findByAccountNo(accountNo)
                .orElseThrow(() -> new IllegalArgumentException("account not found: " + accountNo));

        // 외부 입금 실행
        String userKey = resolveUserKey(localUserId);
        var res = externalPort.deposit(accountNo, amount, summary, userKey);

        // 외부 거래번호/멱등키
        String extTxId = String.valueOf(res.getREC().getTransactionUniqueNo());
        String idem   = "DEP-" + accountNo + "-" + extTxId;

        // 내부 장부 반영(입금)
        ledgerService.postTxn(
                acc,
                true,
                BigDecimal.valueOf(amount),
                (summary == null || summary.isBlank()) ? "입금(이체)" : summary,
                "입금",
                null,
                extTxId,
                idem
        );
        return res;
    }

    @Transactional
    public updateDemandDepositAccountTransferRes transfer(Long localUserId, String withdrawalAccountNo, String depositAccountNo,
                                                          Long amount, String withdrawalSummary, String depositSummary) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.transfer(withdrawalAccountNo, depositAccountNo, amount, withdrawalSummary, depositSummary, userKey);
    }

    @Transactional
    public updateTransferLimitRes updateLimit(Long localUserId, String accountNo, Long oneTimeLimit, Long dailyLimit) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.updateTransferLimit(accountNo, oneTimeLimit, dailyLimit, userKey);
    }

    @Transactional(readOnly = true)
    public inquireTransactionHistoryListRes listTransactions(Long localUserId, String accountNo, String startDate, String endDate,
                                                             String transactionType, String orderByType) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.inquireTransactionHistoryList(accountNo, startDate, endDate, transactionType, orderByType, userKey);
    }

    @Transactional(readOnly = true)
    public inquireTransactionHistoryRes getTransaction(Long localUserId, String accountNo, Long transactionUniqueNo) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.inquireTransactionHistory(accountNo, transactionUniqueNo, userKey);
    }

    @Transactional
    public deleteDemandDepositAccountRes deleteAccount(Long localUserId, String accountNo, String refundAccountNo) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.deleteAccount(accountNo, refundAccountNo, userKey);
    }

    @Transactional(readOnly = true)
    public transactionMemoRes getMemo(Long localUserId, String accountNo, Long transactionUniqueNo, String transactionMemo) {
        String userKey = resolveUserKey(localUserId);
        return externalPort.getMemo(accountNo, transactionUniqueNo, transactionMemo, userKey);
    }
}

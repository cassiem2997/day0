package com.travel0.day0.finopenapi.adapter;

import com.travel0.day0.finopenapi.client.DemandDepositOpenApiClient;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos.*;
import com.travel0.day0.savings.port.DemandDepositExternalPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DemandDepositExternalAdapter implements DemandDepositExternalPort {

    private final DemandDepositOpenApiClient client;

    @Override
    public List<Rec> inquireDemandDepositList() {
        var res = client.InquireDemandDepositList();
        if (res == null || res.getREC() == null || res.getREC().isEmpty()) {
            throw new IllegalStateException("FINOPENAPI_DEMAND_DEPOSIT_LIST_EMPTY");
        }
        return res.getREC();
    }

    @Override
    public CreateDemandDepositAccountRes createAccount(String accountTypeUniqueNo, String userKey) {
        var res = client.createDemandDepositAccount(accountTypeUniqueNo, userKey);
        if (res == null || res.getREC() == null || res.getREC().isEmpty()) {
            throw new IllegalStateException("FINOPENAPI_DEMAND_DEPOSIT_ACCOUNT_EMPTY");
        }
        return res;
    }

    /** 계좌 목록 조회 */
    @Override
    public List<AccountListRec> inquireAccountList(String userKey) {
        var res = client.inquireDemandDepositAccountList(userKey);
        if (res == null || res.getREC() == null || res.getREC().isEmpty()) {
            throw new IllegalStateException("FINOPENAPI_ACCOUNT_LIST_EMPTY");
        }
        return res.getREC();
    }

    /** 계좌 단건 조회 */
    @Override
    public AccountListRec inquireAccount(String accountNo, String userKey) {
        var res = client.inquireDemandDepositAccount(accountNo, userKey);
        if (res == null || res.getREC() == null) {
            throw new IllegalStateException("FINOPENAPI_ACCOUNT_EMPTY");
        }
        return res.getREC();
    }

    /** 예금주명 조회 */
    @Override
    public AccountHolderRec inquireAccountHolderName(String accountNo, String userKey) {
        var res = client.inquireDemandDepositAccountHolderName(accountNo, userKey);
        if (res == null || res.getREC() == null) {
            throw new IllegalStateException("FINOPENAPI_ACCOUNT_HOLDER_EMPTY");
        }
        return res.getREC();
    }

    /** 계좌 잔액 조회 */
    @Override
    public AccountBalanceRec inquireAccountBalance(String accountNo, String userKey) {
        var res = client.inquireDemandDepositAccountBalance(accountNo, userKey);
        if (res == null || res.getREC() == null) {
            throw new IllegalStateException("FINOPENAPI_ACCOUNT_BALANCE_EMPTY");
        }
        return res.getREC();
    }

    /* =========================
     *  입·출금/이체/한도
     * ========================= */

    /** 출금 */
    @Override
    public InquireDemandDepositAccountWithdrawalRes withdraw(
            String accountNo, Long amount, String summary, String userKey
    ) {
        var res = client.withdrawDemandDepositAccount(accountNo, amount, summary, userKey);
        if (res == null || res.getREC() == null) {
            throw new IllegalStateException("FINOPENAPI_WITHDRAW_EMPTY");
        }
        return res;
    }

    /** 입금 */
    @Override
    public updateDemandDepositAccountDepositRes deposit(
            String accountNo, Long amount, String summary, String userKey
    ) {
        var res = client.depositDemandDepositAccount(accountNo, amount, summary, userKey);
        if (res == null || res.getREC() == null) {
            throw new IllegalStateException("FINOPENAPI_DEPOSIT_EMPTY");
        }
        return res;
    }

    /** 이체 */
    @Override
    public updateDemandDepositAccountTransferRes transfer(
            String withdrawalAccountNo, String depositAccountNo, Long amount,
            String withdrawalSummary, String depositSummary, String userKey
    ) {
        var res = client.transferDemandDepositAccount(
                withdrawalAccountNo, depositAccountNo, amount, withdrawalSummary, depositSummary, userKey
        );
        if (res == null || res.getREC() == null || res.getREC().isEmpty()) {
            throw new IllegalStateException("FINOPENAPI_TRANSFER_EMPTY");
        }
        return res;
    }

    /** 이체 한도 변경 */
    @Override
    public updateTransferLimitRes updateTransferLimit(
            String accountNo, Long oneTimeLimit, Long dailyLimit, String userKey
    ) {
        var res = client.updateTransferLimit(accountNo, oneTimeLimit, dailyLimit, userKey);
        if (res == null || res.getREC() == null) {
            throw new IllegalStateException("FINOPENAPI_UPDATE_LIMIT_EMPTY");
        }
        return res;
    }

    /* =========================
     *  거래내역
     * ========================= */

    /** 거래내역 목록 */
    @Override
    public inquireTransactionHistoryListRes inquireTransactionHistoryList(
            String accountNo, String startDate, String endDate,
            String transactionType, String orderByType, String userKey
    ) {
        var res = client.inquireTransactionHistoryList(
                accountNo, startDate, endDate, transactionType, orderByType, userKey
        );
        if (res == null || res.getREC() == null
                || res.getREC().getList() == null || res.getREC().getList().isEmpty()) {
            throw new IllegalStateException("FINOPENAPI_TXN_LIST_EMPTY");
        }
        return res;
    }

    /** 거래내역 단건 */
    @Override
    public inquireTransactionHistoryRes inquireTransactionHistory(
            String accountNo, Long transactionUniqueNo, String userKey
    ) {
        var res = client.inquireTransactionHistory(accountNo, transactionUniqueNo, userKey);
        if (res == null || res.getREC() == null) {
            throw new IllegalStateException("FINOPENAPI_TXN_EMPTY");
        }
        return res;
    }

    /* =========================
     *  해지
     * ========================= */

    /** 계좌 해지 */
    @Override
    public deleteDemandDepositAccountRes deleteAccount(String accountNo, String refundAccountNo, String userKey) {
        var res = client.deleteDemandDepositAccount(accountNo, refundAccountNo, userKey);
        if (res == null || res.getREC() == null) {
            throw new IllegalStateException("FINOPENAPI_DELETE_ACCOUNT_EMPTY");
        }
        return res;
    }

    /* =========================
     *  거래 내역
     * ========================= */

    /** 거래 내역*/
    @Override
    public transactionMemoRes getMemo(String accountNo, Long transactionUniqueNo, String transactionMemo, String userKey) {
        var res = client.getTransactionMemo(accountNo, transactionUniqueNo, transactionMemo, userKey);
        if (res == null || res.getREC() == null) {
            throw new IllegalStateException("FINOPENAPI_DELETE_ACCOUNT_EMPTY");
        }
        return res;
    }
}

package com.travel0.day0.finopenapi.client;

import com.travel0.day0.finopenapi.config.FinOpenApiProperties;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos.*;
import com.travel0.day0.finopenapi.support.HeaderFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;


@Component
@RequiredArgsConstructor
public class DemandDepositOpenApiClient {

    private final WebClient finWebClient;
    private final FinOpenApiProperties props;
    private final HeaderFactory headers;

    /* 공통 POST 처리 */
    private <T> T postJson(String path, Object body, Class<T> type) {
        return finWebClient.post()
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchangeToMono(res -> {
                    var ct = res.headers().contentType().orElse(MediaType.APPLICATION_OCTET_STREAM);
                    if (!ct.isCompatibleWith(MediaType.APPLICATION_JSON)) {
                        return res.bodyToMono(String.class).defaultIfEmpty("")
                                .flatMap(b -> Mono.error(new IllegalStateException(
                                        "FINOPENAPI_NON_JSON_RESPONSE: " + ct + " body=" + snippet(b))));
                    }
                    if (res.statusCode().isError()) {
                        return res.bodyToMono(String.class).defaultIfEmpty("")
                                .flatMap(b -> Mono.error(new IllegalStateException(
                                        "FINOPENAPI_ERROR: " + snippet(b))));
                    }
                    return res.bodyToMono(type);
                })
                .block();
    }

    /** 수시 입출금 상품 조회 */
    public InquireDemandDepositListRes InquireDemandDepositList() {
        final String code = props.getInquireDemandDepositList();
        final String path = "/ssafy/api/v1/edu/demandDeposit/" + code;

        var header = headers.build(code, code);
        var body = InquireDemandDepositListReq.builder()
                .Header(header)
                .build();

        return postJson(path, body, InquireDemandDepositListRes.class);
    }

    /** 수시입출금 계좌 생성 */
    public CreateDemandDepositAccountRes createDemandDepositAccount(
            String accountTypeUniqueNo,
            String userKey
    ) {
        final String code = props.getCreateDemandDepositAccount();
        final String path = "/ssafy/api/v1/edu/demandDeposit/" + code;

        var header = headers.build(code, code, userKey);

        var body = CreateDemandDepositAccountReq.builder()
                .Header(header)
                .accountTypeUniqueNo(accountTypeUniqueNo)
                .build();

        return postJson(path, body, CreateDemandDepositAccountRes.class);
    }

    /** 계좌 목록 조회 */
    public InquireDemandDepositAccountListRes inquireDemandDepositAccountList(String userKey) {
        final String code = props.getInquireDemandDepositAccountList();
        final String path = "/ssafy/api/v1/edu/demandDeposit/" + code;

        var header = headers.build(code, code, userKey);
        var body = InquireDemandDepositAccountListReq.builder()
                .Header(header)
                .build();

        return postJson(path, body, InquireDemandDepositAccountListRes.class);
    }

    /** 계좌 단건 조회 */
    public InquireDemandDepositAccountRes inquireDemandDepositAccount(String accountNo, String userKey) {
        final String code = props.getInquireDemandDepositAccount();
        final String path = "/ssafy/api/v1/edu/demandDeposit/" + code;

        var header = headers.build(code, code, userKey);
        var body = InquireDemandDepositAccountReq.builder()
                .Header(header)
                .accountNo(accountNo)
                .build();

        return postJson(path, body, InquireDemandDepositAccountRes.class);
    }

    /** 예금주명 조회 */
    public InquireDemandDepositAccountHolderNameRes inquireDemandDepositAccountHolderName(String accountNo, String userKey) {
        final String code = props.getInquireDemandDepositAccountHolderName();
        final String path = "/ssafy/api/v1/edu/demandDeposit/" + code;

        var header = headers.build(code, code, userKey);
        var body = InquireDemandDepositAccountHolderNameReq.builder()
                .Header(header)
                .accountNo(accountNo)
                .build();

        return postJson(path, body, InquireDemandDepositAccountHolderNameRes.class);
    }

    /** 계좌 잔액 조회 */
    public InquireDemandDepositAccountBalanceRes inquireDemandDepositAccountBalance(String accountNo, String userKey) {
        final String code = props.getInquireDemandDepositAccountBalance();
        final String path = "/ssafy/api/v1/edu/demandDeposit/" + code;

        var header = headers.build(code, code, userKey);
        var body = InquireDemandDepositAccountBalanceReq.builder()
                .Header(header)
                .accountNo(accountNo)
                .build();

        return postJson(path, body, InquireDemandDepositAccountBalanceRes.class);
    }

    /* =========================
     *  입·출금/이체/한도 Related
     * ========================= */

    /** 계좌 출금 */
    public InquireDemandDepositAccountWithdrawalRes withdrawDemandDepositAccount(
            String accountNo, Long transactionBalance, String transactionSummary, String userKey
    ) {
        final String code = props.getUpdateDemandDepositAccountWithdrawal();
        final String path = "/ssafy/api/v1/edu/demandDeposit/" + code;

        var header = headers.build(code, code, userKey);
        var body = InquireDemandDepositAccountWithdrawalReq.builder()
                .Header(header)
                .accountNo(accountNo)
                .transactionBalance(transactionBalance)
                .transactionSummary(transactionSummary)
                .build();

        return postJson(path, body, InquireDemandDepositAccountWithdrawalRes.class);
    }

    /** 계좌 입금 */
    public updateDemandDepositAccountDepositRes depositDemandDepositAccount(
            String accountNo, Long transactionBalance, String transactionSummary, String userKey
    ) {
        final String code = props.getUpdateDemandDepositAccountDeposit();
        final String path = "/ssafy/api/v1/edu/demandDeposit/" + code;

        var header = headers.build(code, code, userKey);
        var body = updateDemandDepositAccountDepositReq.builder()
                .Header(header)
                .accountNo(accountNo)
                .transactionBalance(transactionBalance)
                .transactionSummary(transactionSummary)
                .build();

        return postJson(path, body, updateDemandDepositAccountDepositRes.class);
    }

    /** 계좌 이체 */
    public updateDemandDepositAccountTransferRes transferDemandDepositAccount(
            String withdrawalAccountNo, String depositAccountNo, Long transactionBalance,
            String withdrawalSummary, String depositSummary, String userKey
    ) {
        final String code = props.getUpdateDemandDepositAccountTransfer();
        final String path = "/ssafy/api/v1/edu/demandDeposit/" + code;

        var header = headers.build(code, code, userKey);
        var body = updateDemandDepositAccountTransferReq.builder()
                .Header(header)
                .withdrawalAccountNo(withdrawalAccountNo)
                .depositAccountNo(depositAccountNo)
                .transactionBalance(transactionBalance)
                .withdrawalTransactionSummary(withdrawalSummary)
                .depositTransactionSummary(depositSummary)
                .build();

        return postJson(path, body, updateDemandDepositAccountTransferRes.class);
    }

    /** 이체 한도 변경 */
    public updateTransferLimitRes updateTransferLimit(
            String accountNo, Long oneTimeTransferLimit, Long dailyTransferLimit, String userKey
    ) {
        final String code = props.getUpdateTransferLimit();
        final String path = "/ssafy/api/v1/edu/demandDeposit/" + code;

        var header = headers.build(code, code, userKey);
        var body = updateTransferLimitReq.builder()
                .Header(header)
                .accountNo(accountNo)
                .oneTimeTransferLimit(oneTimeTransferLimit)
                .dailyTransferLimit(dailyTransferLimit)
                .build();

        return postJson(path, body, updateTransferLimitRes.class);
    }

    /* =========================
     *  거래내역 Related
     * ========================= */

    /** 계좌 거래 내역 조회(목록) */
    public inquireTransactionHistoryListRes inquireTransactionHistoryList(
            String accountNo, String startDate, String endDate,
            String transactionType, String orderByType, String userKey
    ) {
        final String code = props.getInquireTransactionHistoryList();
        final String path = "/ssafy/api/v1/edu/demandDeposit/" + code;

        var header = headers.build(code, code, userKey);
        var body = inquireTransactionHistoryListReq.builder()
                .Header(header)
                .accountNo(accountNo)
                .startDate(startDate)
                .endDate(endDate)
                .transactionType(transactionType)   // M:입금 D:출금 A:전체
                .orderByType(orderByType)           // ASC(이전) / DESC(최근)
                .build();

        return postJson(path, body, inquireTransactionHistoryListRes.class);
    }

    /** 계좌 거래 내역 조회(단건) */
    public inquireTransactionHistoryRes inquireTransactionHistory(
            String accountNo, Long transactionUniqueNo, String userKey
    ) {
        final String code = props.getInquireTransactionHistory();
        final String path = "/ssafy/api/v1/edu/demandDeposit/" + code;

        var header = headers.build(code, code, userKey);
        var body = inquireTransactionHistoryReq.builder()
                .Header(header)
                .accountNo(accountNo)
                .transactionUniqueNo(transactionUniqueNo)
                .build();

        return postJson(path, body, inquireTransactionHistoryRes.class);
    }

    /* =========================
     *  계좌 해지 Related
     * ========================= */

    /** 계좌 해지 */
    public deleteDemandDepositAccountRes deleteDemandDepositAccount(
            String accountNo, String refundAccountNo, String userKey
    ) {
        final String code = props.getDeleteDemandDepositAccount();
        final String path = "/ssafy/api/v1/edu/demandDeposit/" + code;

        var header = headers.build(code, code, userKey);
        var body = deleteDemandDepositAccountReq.builder()
                .Header(header)
                .accountNo(accountNo)
                .refundAccountNo(refundAccountNo)
                .build();

        return postJson(path, body, deleteDemandDepositAccountRes.class);
    }

    /* =========================
     *  거래 내역 Related
     * ========================= */

    /** 거래 내역 */
    public transactionMemoRes getTransactionMemo(
            String accountNo, Long transactionUniqueNo, String transactionMemo, String userKey
    ) {
        final String code = props.getTransactionMemo();
        final String path = "/ssafy/api/v1/edu/" + code;

        var header = headers.build(code, code, userKey);
        var body = transactionMemoReq.builder()
                .Header(header)
                .accountNo(accountNo)
                .transactionUniqueNo(transactionUniqueNo)
                .transactionMemo(transactionMemo)
                .build();

        return postJson(path, body, transactionMemoRes.class);
    }

    private static String snippet(String s){
        if (s == null) return "null";
        return s.length() > 600 ? s.substring(0, 600) + "..." : s;
    }

}

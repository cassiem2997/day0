package com.travel0.day0.finopenapi.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

public class DemandDepositDtos {

    /** 수시 입출금 상품 클래스 */
    @JsonIgnoreProperties(ignoreUnknown = true)
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class Rec {
        private String accountTypeUniqueNo;
        private String bankCode;
        private String bankName;
        private String accountTypeCode;    // 1:수시입출금, 2:정기예금, 3:정기적금, 4:대출
        private String accountTypeName;
        private String accountName;
        private String accountDescription;
        private String accountType;
    }

    /** 상품 등록 */
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class CreateDemandDepositReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header; // userKey 없음
        private String bankCode;
        private String accountName;
        private String accountDescription;
    }

    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class CreateDemandDepositRes {
        @JsonProperty("Header")
        private CommonHeader.Req Header; // userKey 없음
        @JsonProperty("REC")
        private Rec REC;
    }

    /** 상품 조회 */
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class InquireDemandDepositListReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header; // userKey 없음
    }

    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class InquireDemandDepositListRes {
        @JsonProperty("Header")
        private CommonHeader.Req Header; // userKey 없음
        @JsonProperty("REC")
        private List<Rec> REC;
    }

    /** 계좌 생성에 필요한 클래스 */
    @JsonIgnoreProperties(ignoreUnknown = true)
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class AccountRec {
        private String bankCode;
        private String accountNo;

        @JsonFormat(with = JsonFormat.Feature.ACCEPT_SINGLE_VALUE_AS_ARRAY)
        private List<Currency> currency;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class Currency {
        private String currency;
        private String currencyName;
    }

    /** 계좌 생성 */
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class CreateDemandDepositAccountReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        private String accountTypeUniqueNo;
    }

    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class CreateDemandDepositAccountRes {
        @JsonProperty("Header")
        private CommonHeader.Res Header;
        @JsonProperty("REC")
        @JsonFormat(with = JsonFormat.Feature.ACCEPT_SINGLE_VALUE_AS_ARRAY)
        private List<AccountRec> REC;
    }

    /** 수시 입출금 계좌 클래스 */
    @JsonIgnoreProperties(ignoreUnknown = true)
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class AccountListRec {
        private String bankCode;
        private String bankName;
        private String userName;
        private String accountNo;
        private String accountName;
        private String accountTypeCode;    // 1:수시입출금, 2:정기예금, 3:정기적금, 4:대출
        private String accountTypeName;
        private String accountCreatedDate;
        private String accountExpiryDate;
        private Long dailyTransferLimit;  // 1일 이체 한도 (5억)
        private Long oneTimeTransferLimit;    // 1회 이체 한도 (1억)
        private Long accountBalance;
        private String lastTransactionDate;
        private String currency;
    }

    /** 계좌 목록 조회 */
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class InquireDemandDepositAccountListReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
    }

    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class InquireDemandDepositAccountListRes {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        @JsonProperty("REC")
        private List<AccountListRec> REC;
    }

    /** 계좌 단건 조회 */
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class InquireDemandDepositAccountReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        private String accountNo;
    }

    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class InquireDemandDepositAccountRes {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        @JsonProperty("REC")
        private AccountListRec REC;
    }

    /** 수시 입출금 예금주명 조회 클래스 */
    @JsonIgnoreProperties(ignoreUnknown = true)
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class AccountHolderRec {
        private String bankCode;
        private String bankName;
        private String accountNo;
        private String userName;
        private String currency;
    }

    /** 예금주명 조회 */
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class InquireDemandDepositAccountHolderNameReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        private String accountNo; // 외화 계좌 가능
    }

    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class InquireDemandDepositAccountHolderNameRes {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        @JsonProperty("REC")
        private AccountHolderRec REC;
    }

    /** 수시 입출금 계좌 잔액 클래스 */
    @JsonIgnoreProperties(ignoreUnknown = true)
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class AccountBalanceRec {
        private String bankCode;
        private String accountNo;
        private Long accountBalance;
        private String accountCreatedDate;
        private String accountExpiryDate;
        private String lastTransactionDate;
        private String currency;
    }

    /** 계좌 잔액 조회 */
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class InquireDemandDepositAccountBalanceReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        private String accountNo;
    }

    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class InquireDemandDepositAccountBalanceRes {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        @JsonProperty("REC")
        private AccountBalanceRec REC;
    }

    /** 수시 입출금 계좌 출금 클래스 */
    @JsonIgnoreProperties(ignoreUnknown = true)
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class AccountWithdrawalRec {
        private Long transactionUniqueNo;
        private String transactionDate;
    }

    /** 계좌 출금 */
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class InquireDemandDepositAccountWithdrawalReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        private String accountNo;
        private Long transactionBalance;
        private String transactionSummary;
    }

    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class InquireDemandDepositAccountWithdrawalRes {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        @JsonProperty("REC")
        private AccountWithdrawalRec REC;
    }

    /** 계좌 입금 */
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class updateDemandDepositAccountDepositReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        private String accountNo;
        private Long transactionBalance;
        private String transactionSummary;
    }

    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class updateDemandDepositAccountDepositRes {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        @JsonProperty("REC")
        private AccountWithdrawalRec REC;
    }

    /** 수시 입출금 계좌 이체 클래스 */
    @JsonIgnoreProperties(ignoreUnknown = true)
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class AccountTransferRec {
        private Long transactionUniqueNo;
        private String accountNo;
        private String transactionDate;
        private String transactionType;
        private String transactionTypeName;
        private String transactionAccountNo;
    }

    /** 계좌 이체 */
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class updateDemandDepositAccountTransferReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        private String depositAccountNo; // 원화, 외화 계좌 가능
        private Long transactionBalance;
        private String withdrawalAccountNo; // 원화 계좌만 가능
        private String depositTransactionSummary;
        private String withdrawalTransactionSummary;
    }

    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class updateDemandDepositAccountTransferRes {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        @JsonProperty("REC")
        private List<AccountTransferRec> REC;
    }

    /** 계좌 이체 한도 변경 */
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class updateTransferLimitReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        private String accountNo;
        private Long oneTimeTransferLimit;  // 1~100억
        private Long dailyTransferLimit;    // 1~2000억
    }

    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class updateTransferLimitRes {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        @JsonProperty("REC")
        private AccountListRec REC;
    }

    /** 거래내역 컨테이너 */
    @JsonIgnoreProperties(ignoreUnknown = true)
    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @Setter
    @ToString
    @Builder
    public static class TransactionRec {
        private String totalCount;
        private List<eachTransactionRec> list;
    }

    /** 거래내역 응답 클래스 */
    @JsonIgnoreProperties(ignoreUnknown = true)
    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @Setter
    @ToString
    @Builder
    public static class eachTransactionRec {
        private Long transactionUniqueNo;    // 거래 고유번호
        private String transactionDate;      // 거래일자 (YYYYMMDD)
        private String transactionTime;      // 거래시각 (HHMMSS)
        private String transactionType;      // 입금/출금 구분 (1,2)
        private String transactionTypeName;  // 입출금 구분명 (입금, 출금 등)
        private String transactionAccountNo; // 거래계좌번호
        private Long transactionBalance;     // 거래금액
        private Long transactionAfterBalance;// 거래후 잔액
        private String transactionSummary;   // 거래 요약내용
        private String transactionMemo;      // 거래 메모
    }

    /** 계좌 거래 내역 조회 */
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class inquireTransactionHistoryListReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        private String accountNo;
        private String startDate;   // YYYYMMDD
        private String endDate;     // YYYYMMDD
        private String transactionType;    // M 입금 D 출금 A 전체
        private String orderByType;        // 가래 고유번호 기준 ASC(이전) DESC(최근)
    }

    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class inquireTransactionHistoryListRes {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        @JsonProperty("REC")
        private TransactionRec REC;
    }

    /** 계좌 거래 내역 조회 (단건) */
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class inquireTransactionHistoryReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        private String accountNo;
        private Long transactionUniqueNo;
    }

    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class inquireTransactionHistoryRes {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        @JsonProperty("REC")
        private eachTransactionRec REC;
    }

    /** 계좌 해지 클래스 */
    @JsonIgnoreProperties(ignoreUnknown = true)
    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @Setter
    @ToString
    @Builder
    public static class deleteDemandDepositAccountRec {
        private String status;
        private String accountNo;
        private String refundAccountNo;
        private String transactionTypeName;
        private Long accountBalance;
    }

    /** 계좌 해지 */
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class deleteDemandDepositAccountReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        private String accountNo;
        private String refundAccountNo;
    }

    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class deleteDemandDepositAccountRes {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        @JsonProperty("REC")
        private deleteDemandDepositAccountRec REC;
    }

    /** 거래 메모 클래스 */
    @JsonIgnoreProperties(ignoreUnknown = true)
    @NoArgsConstructor
    @AllArgsConstructor
    @Getter
    @Setter
    @ToString
    @Builder
    public static class transactionMemoRec {
        private Long memoUniqueNo;
        private String accountNo;
        private Long transactionUniqueNo;
        private String transactionMemo;
        private String created;
    }

    /** 거래내역 메모 작성 및 수정 */
    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class transactionMemoReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        private String accountNo; // 원화, 외화 가능
        private Long transactionUniqueNo;
        private String transactionMemo;
    }

    @NoArgsConstructor @AllArgsConstructor @Getter @Setter @ToString @Builder
    public static class transactionMemoRes {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        @JsonProperty("REC")
        private transactionMemoRec REC;
    }
}

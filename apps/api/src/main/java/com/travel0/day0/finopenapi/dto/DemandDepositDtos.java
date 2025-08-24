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

    /* 상품 등록 */
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

    /* 상품 조회 */
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

    /* 계좌 생성 */
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
}

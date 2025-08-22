package com.travel0.day0.finopenapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.List;

public class DemandDepositDtos {

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
        private List<Rec> REC;

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
    }
}

package com.travel0.day0.finopenapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.util.List;

public class BankExternalDtos {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class InquireBankCodesReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header; // userKey 없음
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class InquireBankCodesRes {
        private CommonHeader.Res Header;
        @JsonProperty("REC")
        private List<Rec> REC;
        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class Rec {
            private String bankCode;
            private String bankName;
        }
    }
}
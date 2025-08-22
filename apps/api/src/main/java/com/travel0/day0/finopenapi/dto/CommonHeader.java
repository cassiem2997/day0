package com.travel0.day0.finopenapi.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

public class CommonHeader {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Req {
        @NotBlank private String apiName;
        /** YYYYMMDD */
        @NotBlank private String transmissionDate;
        /** HHmmss */
        @NotBlank private String transmissionTime;
        @NotBlank private String institutionCode;
        @NotBlank private String fintechAppNo;
        @NotBlank private String apiServiceCode;
        @NotBlank private String institutionTransactionUniqueNo;
        @NotBlank private String apiKey;
        /** 회원 userKey (필요한 API만 세팅) */
        private String userKey;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Res {
        private String responseCode;
        private String responseMessage;
        private String apiName;
        private String transmissionDate;
        private String transmissionTime;
        private String institutionCode;
        private String apiKey;
        private String apiServiceCode;
        private String institutionTransactionUniqueNo;
    }
}

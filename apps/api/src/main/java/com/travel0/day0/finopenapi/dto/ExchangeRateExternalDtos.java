package com.travel0.day0.finopenapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.util.List;

public class ExchangeRateExternalDtos {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class InquireExchangeRateReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header; // userKey 없음
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class InquireExchangeRateRes {
        private CommonHeader.Res Header;
        @JsonProperty("REC")
        private List<Rec> REC;

        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class Rec {
            private Long id;
            private String currency;
            private String exchangeRate;
            private String exchangeMin;
            private String created;

            public Double getExchangeRateAsDouble() {
                if (exchangeRate == null) return null;
                return Double.parseDouble(exchangeRate.replace(",", ""));
            }

            public Double getExchangeMinAsDouble() {
                if (exchangeMin == null) return null;
                return Double.parseDouble(exchangeMin.replace(",", ""));
            }
        }
    }
}

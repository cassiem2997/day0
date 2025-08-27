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

            @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
            public static class InquireExchangeRateSearchReq {
                @JsonProperty("Header")
                private CommonHeader.Req Header;
                private String currency; // "USD", "EUR" 등
            }

            // 특정 통화 환율 조회 응답
            @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
            public static class InquireExchangeRateSearchRes {
                private CommonHeader.Res Header;
                @JsonProperty("REC")
                private ExchangeRateRec REC;

                @Getter
                @Setter
                @NoArgsConstructor
                @AllArgsConstructor
                @Builder
                public static class ExchangeRateRec {
                    private Long id;
                    private String currency;
                    private Object exchangeRate;
                    private Object exchangeMin;
                    private String created;

                    public Double getExchangeRateAsDouble() {
                        if (exchangeRate == null) return null;
                        if (exchangeRate instanceof Number) return ((Number) exchangeRate).doubleValue();
                        if (exchangeRate instanceof String) {
                            return Double.parseDouble(((String) exchangeRate).replace(",", ""));
                        }
                        return null;
                    }

                    public Double getExchangeMinAsDouble() {
                        if (exchangeMin == null) return null;
                        if (exchangeMin instanceof Number) return ((Number) exchangeMin).doubleValue();
                        if (exchangeMin instanceof String) {
                            return Double.parseDouble(((String) exchangeMin).replace(",", ""));
                        }
                        return null;
                    }
                }
            }
        }
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class InquireExchangeRateSearchReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        private String currency; // "USD", "EUR" 등
    }

    // 특정 통화 환율 조회 응답
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class InquireExchangeRateSearchRes {
        private CommonHeader.Res Header;
        @JsonProperty("REC")
        private ExchangeRateRec REC;

        @Getter
        @Setter
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        public static class ExchangeRateRec {
            private Long id;
            private String currency;
            private Object exchangeRate;
            private Object exchangeMin;
            private String created;

            public Double getExchangeRateAsDouble() {
                if (exchangeRate == null) return null;
                if (exchangeRate instanceof Number) return ((Number) exchangeRate).doubleValue();
                if (exchangeRate instanceof String) {
                    return Double.parseDouble(((String) exchangeRate).replace(",", ""));
                }
                return null;
            }

            public Double getExchangeMinAsDouble() {
                if (exchangeMin == null) return null;
                if (exchangeMin instanceof Number) return ((Number) exchangeMin).doubleValue();
                if (exchangeMin instanceof String) {
                    return Double.parseDouble(((String) exchangeMin).replace(",", ""));
                }
                return null;
            }
        }
    }
}

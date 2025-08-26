package com.travel0.day0.finopenapi.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import lombok.*;

import java.util.List;

public class ExchangeExternalDtos {

    // 환전 예상 금액 조회 요청
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class EstimateExchangeReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        private String currency;
        private String exchangeCurrency;
        private Double amount;
    }

    // 환전 예상 금액 조회 응답
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class EstimateExchangeRes {
        private CommonHeader.Res Header;
        @JsonProperty("REC")
        private EstimateRec REC;

        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class EstimateRec {
            private CurrencyInfo currency;
            private CurrencyInfo exchangeCurrency;

            @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
            public static class CurrencyInfo {
                private Object amount;
                private String currency;
                private String currencyName;

                public Double getAmountAsDouble() {
                    if (amount == null) return null;
                    if (amount instanceof Number) return ((Number) amount).doubleValue();
                    if (amount instanceof String) {
                        return Double.parseDouble(((String) amount).replace(",", ""));
                    }
                    return null;
                }
            }
        }
    }

    // 환전 신청 요청
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateExchangeReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        private String accountNo;        // 출금계좌번호
        private String exchangeCurrency; // 환전할 통화코드
        private String exchangeAmount;   // 환전금액
    }

    // 환전 신청 응답
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateExchangeRes {
        private CommonHeader.Res Header;
        @JsonProperty("REC")
        private ExchangeRec REC;

        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class ExchangeRec {
            private ExchangeCurrencyInfo exchangeCurrency;
            private AccountInfo accountInfo;

            @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
            public static class ExchangeCurrencyInfo {
                private Object amount;
                private Object exchangeRate;
                private String currency;
                private String currencyName;

                public Double getAmountAsDouble() {
                    if (amount == null) return null;
                    if (amount instanceof Number) return ((Number) amount).doubleValue();
                    if (amount instanceof String) {
                        return Double.parseDouble(((String) amount).replace(",", ""));
                    }
                    return null;
                }

                public Double getExchangeRateAsDouble() {
                    if (exchangeRate == null) return null;
                    if (exchangeRate instanceof Number) return ((Number) exchangeRate).doubleValue();
                    if (exchangeRate instanceof String) {
                        return Double.parseDouble(((String) exchangeRate).replace(",", ""));
                    }
                    return null;
                }
            }

            @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
            public static class AccountInfo {
                private String accountNo;
                private Object amount;
                private Object balance;

                public Double getAmountAsDouble() {
                    if (amount == null) return null;
                    if (amount instanceof Number) return ((Number) amount).doubleValue();
                    if (amount instanceof String) {
                        return Double.parseDouble(((String) amount).replace(",", ""));
                    }
                    return null;
                }

                public Double getBalanceAsDouble() {
                    if (balance == null) return null;
                    if (balance instanceof Number) return ((Number) balance).doubleValue();
                    if (balance instanceof String) {
                        return Double.parseDouble(((String) balance).replace(",", ""));
                    }
                    return null;
                }
            }
        }
    }

    // 환전 내역 조회 요청
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ExchangeHistoryReq {
        @JsonProperty("Header")
        private CommonHeader.Req Header;
        private String accountNo;  // 계좌번호 (선택)
        private String startDate;  // 조회시작일 (YYYYMMDD)
        private String endDate;    // 조회종료일 (YYYYMMDD)
    }

    // 환전 내역 조회 응답
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ExchangeHistoryRes {
        private CommonHeader.Res Header;
        @JsonProperty("REC")
        private List<HistoryRec> REC;

        @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
        public static class HistoryRec {
            private AccountInfo account;
            private CurrencyInfo currency;
            private ExchangeCurrencyInfo exchangeCurrency;
            private String created;

            @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
            public static class AccountInfo {
                private String bankName;
                private String userName;
                private String accountNo;
                private String accountName;
            }

            @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
            public static class CurrencyInfo {
                private String currency;
                private String currencyName;
                private String amount;
            }

            @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
            public static class ExchangeCurrencyInfo {
                private String currency;
                private String currencyName;
                private String amount;
                private String exchangeRate;

                public Double getAmountAsDouble() {
                    if (amount == null) return null;
                    return Double.parseDouble(amount.replace(",", ""));
                }

                public Double getExchangeRateAsDouble() {
                    if (exchangeRate == null) return null;
                    return Double.parseDouble(exchangeRate.replace(",", ""));
                }
            }
        }
    }
}

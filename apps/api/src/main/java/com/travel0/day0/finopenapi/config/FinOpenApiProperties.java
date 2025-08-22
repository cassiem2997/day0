package com.travel0.day0.finopenapi.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "finopenapi")
@Getter
@Setter
public class FinOpenApiProperties {
    private String baseUrl;
    private String institutionCode;
    private String fintechAppNo;
    private String apiKey;
    private String managerId;

    private Savings savings;
    private DemandDeposit demandDeposit;


    @Getter @Setter
    public static class Savings {
        private String productsPath;
        private String createPath;
        private String accountPath;
        private String schedulePath;
        private String expiryPath;
        private String earlyPath;
        private String deletePath;
        private String accountListPath;

        private String productsCode;
        private String createCode;
        private String accountCode;
        private String accountListCode;
        private String scheduleCode;
        private String expiryCode;
        private String earlyCode;
        private String deleteCode;
    }

    @Getter @Setter
    public static class DemandDeposit {
        private String transferPath;
        private String transferCode;
    }
}

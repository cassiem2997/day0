package com.travel0.day0.finopenapi.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel0.day0.finopenapi.config.FinOpenApiProperties;
import com.travel0.day0.finopenapi.dto.BankExternalDtos.*;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos.*;
import com.travel0.day0.finopenapi.support.HeaderFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.*;
import java.time.format.DateTimeFormatter;

@Slf4j
@Component
@RequiredArgsConstructor
public class BankOpenApiClient {

    private final WebClient finWebClient;
    private final FinOpenApiProperties props;
    private final HeaderFactory headers;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter D = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter T = DateTimeFormatter.ofPattern("HHmmss");

    public InquireBankCodesRes inquireBankCodes() {
        final String code = props.getInquireBankCodes();
        final String path = "/ssafy/api/v1/edu/bank/" + code;

        var header = headers.build(code, code);
        var body = InquireBankCodesReq.builder()
                .Header(header)
                .build();

        log.info("[FIN-REQ] POST {} | code={} inst={} appNo={} mgr={} key={}",
                path,
                code,
                props.getInstitutionCode(),
                props.getFintechAppNo(),
                props.getManagerId(),
                mask(props.getApiKey()));
        logJson("FIN-REQ-BODY", body);

        return finWebClient.post()
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchangeToMono(res -> {
                    var ct = res.headers().contentType().orElse(MediaType.APPLICATION_OCTET_STREAM);

                    if (!ct.isCompatibleWith(MediaType.APPLICATION_JSON)) {
                        return res.bodyToMono(String.class)
                                .defaultIfEmpty("")
                                .flatMap(b -> {
                                    log.warn("[FIN-RES-NONJSON] status={} body={}",
                                            res.statusCode(), snippet(b));
                                    return Mono.error(new IllegalStateException(
                                            "FINOPENAPI_NON_JSON_RESPONSE: " + ct + " body=" + snippet(b)));
                                });
                    }
                    if (res.statusCode().isError()) {
                        return res.bodyToMono(String.class)
                                .defaultIfEmpty("")
                                .flatMap(b -> {
                                    log.warn("[FIN-RES-ERROR] status={} body={}",
                                            res.statusCode(), snippet(b));
                                    return Mono.error(new IllegalStateException(
                                            "FINOPENAPI_ERROR: " + snippet(b)));
                                });
                    }

                    return res.bodyToMono(InquireBankCodesRes.class)
                            .doOnNext(ok -> logJson("FIN-RES-BODY", ok));
                })
                .block();
    }

    /** 상품 등록 */
    public CreateDemandDepositRes createDepositProduct(String bankCode, String accountName, String accountDescription) {
        final String code = props.getCreateDemandDeposit();
        final String path = "/ssafy/api/v1/edu/demandDeposit/" + code;

        var header = headers.build(code, code);
        DemandDepositDtos.CreateDemandDepositReq body =
                DemandDepositDtos.CreateDemandDepositReq.builder()
                        .Header(header) // userKey 없음
                        .bankCode(bankCode)
                        .accountName(accountName)
                        .accountDescription(accountDescription)
                        .build();

        log.info("[FIN-REQ] POST {} | code={} inst={} appNo={} mgr={} key={}",
                path,
                code,
                props.getInstitutionCode(),
                props.getFintechAppNo(),
                props.getManagerId(),
                mask(props.getApiKey()));
        logJson("FIN-REQ-BODY", body);

        return finWebClient.post()
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchangeToMono(res -> {
                var ct = res.headers().contentType().orElse(MediaType.APPLICATION_OCTET_STREAM);

                if (!ct.isCompatibleWith(MediaType.APPLICATION_JSON)) {
                    return res.bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .flatMap(b -> {
                                log.warn("[FIN-RES-NONJSON] status={} body={}",
                                        res.statusCode(), snippet(b));
                                return Mono.error(new IllegalStateException(
                                        "FINOPENAPI_NON_JSON_RESPONSE: " + ct + " body=" + snippet(b)));
                            });
                }
                if (res.statusCode().isError()) {
                    return res.bodyToMono(String.class)
                            .defaultIfEmpty("")
                            .flatMap(b -> {
                                log.warn("[FIN-RES-ERROR] status={} body={}",
                                        res.statusCode(), snippet(b));
                                return Mono.error(new IllegalStateException(
                                        "FINOPENAPI_ERROR: " + snippet(b)));
                            });
                }

                return res.bodyToMono(CreateDemandDepositRes.class)
                        .doOnNext(ok -> logJson("FIN-RES-BODY", ok));
            })
                    .block();
        }

    private void logJson(String tag, Object obj) {
        try {
            String json = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(obj);
            // apiKey 치환 마스킹
            json = json.replace(props.getApiKey(), mask(props.getApiKey()));
            log.info("[{}]\n{}", tag, json);
        } catch (JsonProcessingException e) {
            log.warn("[{}] (failed to serialize json): {}", tag, e.getMessage());
        }
    }

    private static String mask(String s) {
        if (s == null || s.isEmpty()) return String.valueOf(s);
        int maskLen = Math.max(0, s.length() - 4);
        return "*".repeat(maskLen) + s.substring(Math.max(0, s.length() - 4));
    }

    private static String snippet(String s){
        if (s == null) return "null";
        return s.length() > 600 ? s.substring(0, 600) + "..." : s;
    }

}

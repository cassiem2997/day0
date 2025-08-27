package com.travel0.day0.finopenapi.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel0.day0.finopenapi.config.FinOpenApiProperties;
import com.travel0.day0.finopenapi.dto.ExchangeRateExternalDtos;
import com.travel0.day0.finopenapi.support.HeaderFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExchangeRateOpenApiClient {

    private final WebClient finWebClient;
    private final FinOpenApiProperties props;
    private final HeaderFactory headers;
    private final ObjectMapper objectMapper;

    public ExchangeRateExternalDtos.InquireExchangeRateRes inquireExchangeRate() {
        final String code = props.getInquireExchangeRate();
        final String path = "/ssafy/api/v1/edu/" + code;

        var header = headers.build(code, code);
        var body = ExchangeRateExternalDtos.InquireExchangeRateReq.builder()
                .Header(header)
                .build();

        log.info("[FIN-REQ] POST {} | code={} inst={} appNo={} key={}",
                path,
                code,
                props.getInstitutionCode(),
                props.getFintechAppNo(),
                mask(props.getApiKey(), 4));
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

                    return res.bodyToMono(ExchangeRateExternalDtos.InquireExchangeRateRes.class)
                            .doOnNext(ok -> logJson("FIN-RES-BODY", ok));
                })
                .block();
    }

    public ExchangeRateExternalDtos.InquireExchangeRateSearchRes inquireExchangeRateSearch(String currency) {
        final String code = "exchangeRateSearch"; // API 코드명
        final String path = "/ssafy/api/v1/edu/" + code;

        var header = headers.build(code, code);
        var body = ExchangeRateExternalDtos.InquireExchangeRateSearchReq.builder()
                .Header(header)
                .currency(currency)
                .build();

        log.info("[FIN-REQ] POST {} | code={} currency={} key={}",
                path, code, currency, mask(props.getApiKey(), 4));
        logJson("FIN-REQ-BODY", body);

        return finWebClient.post()
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchangeToMono(res -> {
                    return res.bodyToMono(ExchangeRateExternalDtos.InquireExchangeRateSearchRes.class)
                            .doOnNext(ok -> logJson("FIN-RES-BODY", ok));
                })
                .block();
    }

    private void logJson(String tag, Object obj) {
        try {
            String json = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(obj);
            // apiKey 치환 마스킹
            json = json.replace(props.getApiKey(), mask(props.getApiKey(), 4));
            log.info("[{}]\n{}", tag, json);
        } catch (JsonProcessingException e) {
            log.warn("[{}] (failed to serialize json): {}", tag, e.getMessage());
        }
    }

    private static String mask(String s, int visibleTail) {
        if (s == null || s.isEmpty()) return String.valueOf(s);
        int maskLen = Math.max(0, s.length() - visibleTail);
        return "*".repeat(maskLen) + s.substring(Math.max(0, s.length() - visibleTail));
    }

    private static String snippet(String s){
        if (s == null) return "null";
        return s.length() > 600 ? s.substring(0, 600) + "..." : s;
    }
}

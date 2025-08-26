package com.travel0.day0.finopenapi.client;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel0.day0.finopenapi.config.FinOpenApiProperties;
import com.travel0.day0.finopenapi.dto.ExchangeExternalDtos;
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
public class ExchangeOpenApiClient {

    private final WebClient finWebClient;
    private final FinOpenApiProperties props;
    private final HeaderFactory headers;
    private final ObjectMapper objectMapper;

    // 환전 예상 금액 조회
    public ExchangeExternalDtos.EstimateExchangeRes estimateExchange(String currency, String exchangeCurrency, Double amount) {
        final String code = props.getEstimateExchange();
        final String path = "/ssafy/api/v1/edu/exchange/" + code;

        var header = headers.build(code, code);
        var body = ExchangeExternalDtos.EstimateExchangeReq.builder()
                .Header(header)
                .currency(currency)
                .exchangeCurrency(exchangeCurrency)
                .amount(amount)
                .build();

        log.info("[FIN-REQ] POST {} | 예상환전조회 {}->{}:{}", path, currency, exchangeCurrency, amount);
        logJson("FIN-REQ-BODY", body);
        return finWebClient.post()
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchangeToMono(res -> handleResponse(res, ExchangeExternalDtos.EstimateExchangeRes.class))
                .block();
    }

    // 환전 신청
    public ExchangeExternalDtos.CreateExchangeRes createExchange(String userKey, String accountNo, String exchangeCurrency, String exchangeAmount) {
        final String code = props.getCreateExchange();
        final String path = "/ssafy/api/v1/edu/" + code;

        var header = headers.build(code, code, userKey);
        var body = ExchangeExternalDtos.CreateExchangeReq.builder()
                .Header(header)
                .accountNo(accountNo)
                .exchangeCurrency(exchangeCurrency)
                .exchangeAmount(exchangeAmount)
                .build();

        log.info("[FIN-REQ] POST {} | 환전신청 {}->{}:{}", path, accountNo, exchangeCurrency, exchangeAmount);
        logJson("FIN-REQ-BODY", body);
        log.info("실제 API 요청 - URL: {}", path);
        log.info("실제 API 요청 - userKey 존재: {}", userKey != null && !userKey.isEmpty());
        log.info("실제 API 요청 - Header userKey: {}", header.getUserKey() != null ? "있음" : "없음");

        return finWebClient.post()
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchangeToMono(res -> handleResponse(res, ExchangeExternalDtos.CreateExchangeRes.class))
                .block();
    }

    // 환전 내역 조회
    public ExchangeExternalDtos.ExchangeHistoryRes getExchangeHistory(String userKey, String accountNo, String startDate, String endDate) {
        final String code = props.getInquireExchangeHistory();
        final String path = "/ssafy/api/v1/edu/exchange/" + code;

        var header = headers.build(code, code, userKey);
        var body = ExchangeExternalDtos.ExchangeHistoryReq.builder()
                .Header(header)
                .accountNo(accountNo)
                .startDate(startDate)
                .endDate(endDate)
                .build();

        log.info("[FIN-REQ] POST {} | 환전내역조회 {}:{}-{}", path, accountNo, startDate, endDate);
        logJson("FIN-REQ-BODY", body);

        return finWebClient.post()
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchangeToMono(res -> handleResponse(res, ExchangeExternalDtos.ExchangeHistoryRes.class))
                .block();
    }

    // 공통 응답 처리
    private <T> Mono<T> handleResponse(org.springframework.web.reactive.function.client.ClientResponse res, Class<T> responseType) {
        var ct = res.headers().contentType().orElse(MediaType.APPLICATION_OCTET_STREAM);

        if (!ct.isCompatibleWith(MediaType.APPLICATION_JSON)) {
            return res.bodyToMono(String.class)
                    .defaultIfEmpty("")
                    .flatMap(b -> {
                        log.warn("[FIN-RES-NONJSON] status={} body={}", res.statusCode(), snippet(b));
                        return Mono.error(new IllegalStateException(
                                "FINOPENAPI_NON_JSON_RESPONSE: " + ct + " body=" + snippet(b)));
                    });
        }
        if (res.statusCode().isError()) {
            return res.bodyToMono(String.class)
                    .defaultIfEmpty("")
                    .flatMap(b -> {
                        log.warn("[FIN-RES-ERROR] status={} body={}", res.statusCode(), snippet(b));
                        return Mono.error(new IllegalStateException("FINOPENAPI_ERROR: " + snippet(b)));
                    });
        }

        return res.bodyToMono(responseType)
                .doOnNext(ok -> logJson("FIN-RES-BODY", ok));
    }

    private void logJson(String tag, Object obj) {
        try {
            String json = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(obj);
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

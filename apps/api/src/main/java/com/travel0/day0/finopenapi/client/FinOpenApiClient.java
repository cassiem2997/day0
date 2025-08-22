package com.travel0.day0.finopenapi.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel0.day0.finopenapi.config.FinOpenApiProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class FinOpenApiClient {

    private final WebClient finWebClient;
    private final ObjectMapper objectMapper;

    public <T> T post(String path, Object req, Class<T> type) {
        return finWebClient.post()
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(req)
                .exchangeToMono(res -> res.bodyToMono(String.class)
                        .flatMap(body -> {
                            var ct = res.headers().contentType().orElse(null);
                            log.info("[FinOpenAPI] {} -> status={}, ct={}, body={}",
                                    path, res.statusCode(), ct, body);
                            if (!res.statusCode().is2xxSuccessful()) {
                                return Mono.error(new IllegalStateException("Non-2xx: " + res.statusCode() + ", body=" + body));
                            }
                            if (ct == null || !ct.getSubtype().contains("json")) {
                                return Mono.error(new IllegalStateException("Unexpected Content-Type: " + ct + ", body=" + body));
                            }
                            try {
                                return Mono.just(objectMapper.readValue(body, type));
                            } catch (Exception e) {
                                return Mono.error(new IllegalStateException("JSON parse error: " + body, e));
                            }
                        }))
                .block();
    }
}

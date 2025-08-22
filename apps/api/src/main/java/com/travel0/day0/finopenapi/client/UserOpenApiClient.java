package com.travel0.day0.finopenapi.client;

import com.travel0.day0.finopenapi.config.FinOpenApiProperties;
import com.travel0.day0.finopenapi.dto.UserExternalDtos.MemberReq;
import com.travel0.day0.finopenapi.dto.UserExternalDtos.MemberRes;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Component
@RequiredArgsConstructor
public class UserOpenApiClient {

    private final WebClient finWebClient;
    private final FinOpenApiProperties props;

    public MemberRes createMember(String apiKey, String userId) {
        MemberReq body = new MemberReq(apiKey, userId);

        return finWebClient.post()
                .uri("/ssafy/api/v1/" + props.getMember())
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .onStatus(s -> s.is4xxClientError() || s.is5xxServerError(),
                        resp -> resp.bodyToMono(String.class)
                                .defaultIfEmpty("")
                                .flatMap(msg -> Mono.error(new IllegalStateException("FINOPENAPI_ERROR: " + msg))))
                .bodyToMono(MemberRes.class)
                .block();
    }

    public MemberRes searchMember(String apiKey, String userId) {
        MemberReq body = new MemberReq(apiKey, userId);

        return finWebClient.post()
                .uri("/ssafy/api/v1/" + props.getMemberSearch())
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .onStatus(s -> s.is4xxClientError() || s.is5xxServerError(),
                        resp -> resp.bodyToMono(String.class)
                                .defaultIfEmpty("")
                                .flatMap(msg -> Mono.error(new IllegalStateException("FINOPENAPI_ERROR: " + msg))))
                .bodyToMono(MemberRes.class)
                .block();
    }
}

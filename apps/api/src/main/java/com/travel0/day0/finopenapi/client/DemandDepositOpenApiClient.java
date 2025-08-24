package com.travel0.day0.finopenapi.client;

import com.travel0.day0.finopenapi.config.FinOpenApiProperties;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos;
import com.travel0.day0.finopenapi.support.HeaderFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;


@Component
@RequiredArgsConstructor
public class DemandDepositOpenApiClient {

    private final WebClient finWebClient;
    private final FinOpenApiProperties props;
    private final HeaderFactory headers;

    /** 수시 입출금 상품 조회 */
    public DemandDepositDtos.InquireDemandDepositListRes InquireDemandDepositList() {
        final String code = props.getInquireDemandDepositList();
        final String path = "/ssafy/api/v1/edu/demandDeposit/" + code;

        var header = headers.build(code, code);
        var body = DemandDepositDtos.InquireDemandDepositListReq.builder()
                .Header(header)
                .build();

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
                                    return Mono.error(new IllegalStateException(
                                            "FINOPENAPI_NON_JSON_RESPONSE: " + ct + " body=" + snippet(b)));
                                });
                    }
                    if (res.statusCode().isError()) {
                        return res.bodyToMono(String.class)
                                .defaultIfEmpty("")
                                .flatMap(b -> {
                                    return Mono.error(new IllegalStateException(
                                            "FINOPENAPI_ERROR: " + snippet(b)));
                                });
                    }

                    return res.bodyToMono(DemandDepositDtos.InquireDemandDepositListRes.class);
                })
                .block();
    }

    /** 수시입출금 계좌 생성 */
    public DemandDepositDtos.CreateDemandDepositAccountRes createDemandDepositAccount(
            String accountTypeUniqueNo,
            String userKey
    ) {
        final String code = props.getCreateDemandDepositAccount();
        final String path = "/ssafy/api/v1/edu/demandDeposit/" + code;

        var header = headers.build(code, code, userKey);

        var body = DemandDepositDtos.CreateDemandDepositAccountReq.builder()
                .Header(header)
                .accountTypeUniqueNo(accountTypeUniqueNo)
                .build();

        return finWebClient.post()
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .exchangeToMono(res -> {
                    var ct = res.headers().contentType().orElse(MediaType.APPLICATION_OCTET_STREAM);
                    if (!ct.isCompatibleWith(MediaType.APPLICATION_JSON)) {
                        return res.bodyToMono(String.class).defaultIfEmpty("")
                                .flatMap(b -> Mono.error(new IllegalStateException(
                                        "FINOPENAPI_NON_JSON_RESPONSE: " + ct + " body=" + snippet(b))));
                    }
                    if (res.statusCode().isError()) {
                        return res.bodyToMono(String.class).defaultIfEmpty("")
                                .flatMap(b -> Mono.error(new IllegalStateException(
                                        "FINOPENAPI_ERROR: " + snippet(b))));
                    }
                    return res.bodyToMono(DemandDepositDtos.CreateDemandDepositAccountRes.class);
                })
                .block();
    }

    private static String snippet(String s){
        if (s == null) return "null";
        return s.length() > 600 ? s.substring(0, 600) + "..." : s;
    }

}

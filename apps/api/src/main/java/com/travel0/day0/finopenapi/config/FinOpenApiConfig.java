package com.travel0.day0.finopenapi.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@Configuration
@EnableConfigurationProperties(FinOpenApiProperties.class)
public class FinOpenApiConfig {

    @Bean
    public WebClient finWebClient(FinOpenApiProperties props) {
        return WebClient.builder()
                .baseUrl(props.getBaseUrl())
//                .defaultHeaders(h -> {
//                    h.setContentType(MediaType.APPLICATION_JSON);
//                    h.setAccept(List.of(MediaType.APPLICATION_JSON));
//                    h.set("X-Institution-Code", props.getInstitutionCode());
//                    h.set("X-Fintech-App-No", props.getFintechAppNo());
//                    h.set("apiKey", props.getApiKey());
//                })
//                .exchangeStrategies(ExchangeStrategies.builder()
//                        .codecs(c -> c.defaultCodecs().maxInMemorySize(4 * 1024 * 1024))
//                        .build())
                .build();
    }
}

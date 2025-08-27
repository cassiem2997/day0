package com.travel0.day0.finopenapi.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@EnableConfigurationProperties(FinOpenApiProperties.class)
public class FinOpenApiConfig {

    @Bean
    public WebClient finWebClient(FinOpenApiProperties props) {
        return WebClient.builder()
                .baseUrl(props.getBaseUrl())
                .build();
    }
}

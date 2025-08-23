package com.travel0.day0.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * RestTemplate 설정
 * AI 서비스 호출을 위한 HTTP 클라이언트 최적화
 */
@Configuration
public class RestTemplateConfig {

    @Value("${http.client.connect-timeout:5000}")
    private int connectTimeout;

    @Value("${http.client.read-timeout:10000}")
    private int readTimeout;

    @Bean
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();

        // 타임아웃 설정
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);

        // 버퍼링 설정 (큰 응답 처리)
        factory.setBufferRequestBody(false);

        return new RestTemplate(factory);
    }
}
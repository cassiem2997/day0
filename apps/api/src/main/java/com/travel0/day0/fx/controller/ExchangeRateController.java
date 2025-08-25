package com.travel0.day0.fx.controller;

import com.travel0.day0.fx.port.ExchangeRateExternalPort;
import com.travel0.day0.fx.service.ExchangeRateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exchange")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class ExchangeRateController {

    private final ExchangeRateService exchangeRateService;

    @GetMapping("/rates")
    public ResponseEntity<Map<String, Object>> getExchangeRates() {
        log.info("환율 조회 API 요청");

        try {
            List<ExchangeRateExternalPort.ExchangeRateInfo> rates =
                    exchangeRateService.getCurrentExchangeRates();

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "환율 조회 성공");
            response.put("data", rates);
            response.put("count", rates.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("환율 조회 API 실패", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "환율 조회에 실패했습니다: " + e.getMessage());
            errorResponse.put("data", null);

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "UP");
        response.put("service", "Exchange Rate Service");
        return ResponseEntity.ok(response);
    }
}

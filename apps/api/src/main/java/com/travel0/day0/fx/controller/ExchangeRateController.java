package com.travel0.day0.fx.controller;

import com.travel0.day0.fx.port.ExchangeRateExternalPort;
import com.travel0.day0.fx.service.ExchangeRateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/exchange")
@RequiredArgsConstructor
@Slf4j
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

    @GetMapping("/rates/chart/{currency}")
    public ResponseEntity<Map<String, Object>> getExchangeRateChart(
            @PathVariable String currency,
            @RequestParam(required = false) Integer days) {

        log.info("환율 차트 데이터 조회 API 요청: {} ({}일)", currency, days);

        try {
            List<Map<String, Object>> chartData =
                    exchangeRateService.getExchangeRateChart(currency, days); // 서비스 호출

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("currency", currency.toUpperCase());
            response.put("chartData", chartData);
            response.put("count", chartData.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("환율 차트 데이터 조회 실패", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "차트 데이터 조회에 실패했습니다: " + e.getMessage());

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

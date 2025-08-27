package com.travel0.day0.fx.controller;

import com.travel0.day0.common.enums.FxDirection;
import com.travel0.day0.fx.service.ExchangeRateAlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/fx/alerts")
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateAlertController {

    private final ExchangeRateAlertService alertService;

    // 알림 등록
    @PostMapping
    public ResponseEntity<Map<String, Object>> createAlert(@RequestBody AlertRequest request) {
        log.info("환율 알림 등록 API: {}", request);

        try {
            var alert = alertService.createAlert(
                    request.userId(),
                    request.baseCcy(),
                    request.currency(),
                    request.targetRate(),
                    request.direction()
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", alert);
            response.put("message", "환율 알림이 등록되었습니다");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("환율 알림 등록 실패", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // 사용자 알림 목록 조회
    @GetMapping
    public ResponseEntity<Map<String, Object>> getUserAlerts(@RequestParam Long userId) {
        log.info("사용자 알림 목록 조회 API: userId={}", userId);

        try {
            List<ExchangeRateAlertService.ExchangeAlertInfo> alerts =
                    alertService.getUserAlerts(userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", alerts);
            response.put("count", alerts.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("사용자 알림 목록 조회 실패", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // 알림 수정
    @PutMapping("/{alertId}")
    public ResponseEntity<Map<String, Object>> updateAlert(
            @PathVariable Long alertId,
            @RequestBody AlertUpdateRequest request) {

        log.info("환율 알림 수정 API: {} -> {}", alertId, request);

        try {
            var alert = alertService.updateAlert(alertId, request.targetRate(), request.direction());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", alert);
            response.put("message", "환율 알림이 수정되었습니다");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("환율 알림 수정 실패", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // 알림 삭제
    @DeleteMapping("/{alertId}")
    public ResponseEntity<Map<String, Object>> deleteAlert(@PathVariable Long alertId) {
        log.info("환율 알림 삭제 API: alertId={}", alertId);

        try {
            alertService.deleteAlert(alertId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "환율 알림이 삭제되었습니다");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("환율 알림 삭제 실패", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // 요청 DTO
    public record AlertRequest(
            Long userId,
            String baseCcy,      // KRW
            String currency,     // USD, EUR 등
            BigDecimal targetRate,
            FxDirection direction // GT, LT, GTE, LTE
    ) {}

    public record AlertUpdateRequest(
            BigDecimal targetRate,
            FxDirection direction
    ) {}
}

package com.travel0.day0.fx.controller;

import com.travel0.day0.fx.service.ExchangeService;
import com.travel0.day0.users.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/fx")
@RequiredArgsConstructor
@Slf4j
public class ExchangeController {

    private final ExchangeService exchangeService;
    private final UserService userService;

    // 환전 예상 금액 조회
    @GetMapping("/estimate")
    @Operation(summary = "환전 예상 금액 조회")
    public ResponseEntity<Map<String, Object>> estimateExchange(
            @RequestParam String fromCurrency,
            @RequestParam String toCurrency,
            @RequestParam Double amount) {

        log.info("환전 예상 금액 조회 API: {} {} -> {}", amount, fromCurrency, toCurrency);

        try {
            var estimate = exchangeService.estimateExchange(fromCurrency, toCurrency, amount);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", estimate);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("환전 예상 금액 조회 실패", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // 환전 신청
    @PostMapping("/exchange")
    @Operation(summary = "환전 신청")
    public ResponseEntity<Map<String, Object>> createExchange(@RequestBody ExchangeRequest request,
                                                              @RequestParam Long userId) {
        log.info("환전 신청 API: {}", request);

        try {
            var result = exchangeService.createExchange(
                    request.userId(),
                    request.accountNo(),
                    request.exchangeCurrency(),
                    String.valueOf(request.exchangeAmount().intValue())
            );

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", result);
            response.put("message", "환전이 성공적으로 처리되었습니다");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("환전 신청 실패", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // 환전 내역 조회
    @GetMapping("/transactions")
    @Operation(summary = "환전 내역 조회")
    public ResponseEntity<Map<String, Object>> getExchangeHistory(
            @RequestParam Long userId,
            @RequestParam String accountNo,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate startDate,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate endDate) {

        log.info("환전 내역 조회 API: {} {} ~ {}", accountNo, startDate, endDate);

        try {
            List<ExchangeService.ExchangeHistoryInfo> history =
                    exchangeService.getExchangeHistory(userId, accountNo, startDate, endDate);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", history);
            response.put("count", history.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("환전 내역 조회 실패", e);

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());

            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    // 요청 DTO
    public record ExchangeRequest(
            Long userId,
            String accountNo,
            String exchangeCurrency,
            Double exchangeAmount
    ) {}
}

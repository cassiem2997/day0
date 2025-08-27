package com.travel0.day0.fx.controller;

import com.travel0.day0.fx.service.SseEmitterManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/fx/alerts")
@RequiredArgsConstructor
@Slf4j
public class ExchangeRateSSEController {

    private final SseEmitterManager sseEmitterManager;

    // SSE 연결 엔드포인트
    @GetMapping(value = "/stream/{userId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamAlerts(@PathVariable Long userId) {
        log.info("SSE 스트림 연결 요청: userId={}", userId);
        return sseEmitterManager.createEmitter(userId);
    }

    // 연결 상태 확인
    @GetMapping("/stream/status")
    public Map<String, Object> getStreamStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("activeConnections", sseEmitterManager.getActiveConnections());
        status.put("timestamp", Instant.now());
        return status;
    }

    // 연결 해제
    @DeleteMapping("/stream/{userId}")
    public ResponseEntity<Void> disconnectStream(@PathVariable Long userId) {
        sseEmitterManager.removeEmitter(userId);
        return ResponseEntity.ok().build();
    }
}

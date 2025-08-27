package com.travel0.day0.fx.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class SseEmitterManager {

    private final Map<Long, SseEmitter> emitters = new ConcurrentHashMap<>();
    private static final long TIMEOUT = 60 * 60 * 1000L; // 1시간

    public SseEmitter createEmitter(Long userId) {
        SseEmitter emitter = new SseEmitter(TIMEOUT);

        emitters.put(userId, emitter);
        log.info("SSE 연결 생성: userId={}", userId);

        emitter.onCompletion(() -> {
            emitters.remove(userId);
            log.info("SSE 연결 완료: userId={}", userId);
        });

        emitter.onTimeout(() -> {
            emitters.remove(userId);
            log.warn("SSE 연결 타임아웃: userId={}", userId);
        });

        emitter.onError(throwable -> {
            emitters.remove(userId);
            log.error("SSE 연결 오류: userId={}", userId, throwable);
        });

        try {
            // 연결 성공 이벤트 전송
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("SSE 연결이 성공했습니다."));
        } catch (IOException e) {
            emitters.remove(userId);
            log.error("초기 이벤트 전송 실패: userId={}", userId, e);
        }

        return emitter;
    }

    public void sendToUser(Long userId, String eventName, Object data) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(data));
                log.info("SSE 이벤트 전송 성공: userId={}, event={}", userId, eventName);
            } catch (IOException e) {
                emitters.remove(userId);
                log.error("SSE 이벤트 전송 실패: userId={}, event={}", userId, eventName, e);
            }
        } else {
            log.debug("SSE 연결 없음: userId={}", userId);
        }
    }

    public void sendToAllUsers(String eventName, Object data) {
        emitters.forEach((userId, emitter) -> {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(data));
            } catch (IOException e) {
                emitters.remove(userId);
                log.error("브로드캐스트 실패: userId={}", userId, e);
            }
        });
    }

    public int getActiveConnections() {
        return emitters.size();
    }

    public void removeEmitter(Long userId) {
        emitters.remove(userId);
        log.info("SSE 연결 수동 제거: userId={}", userId);
    }
}

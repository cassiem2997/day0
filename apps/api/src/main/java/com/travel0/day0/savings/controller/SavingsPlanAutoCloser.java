package com.travel0.day0.savings.controller;

import com.travel0.day0.savings.domain.SavingsPlan;
import com.travel0.day0.savings.repository.SavingsPlanRepository;
import com.travel0.day0.savings.service.SavingsPlanService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;

/* 적금 해지 날짜가 되면 자동으로 정각에 해지시키는 클래스 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SavingsPlanAutoCloser {

    private final SavingsPlanRepository planRepo;
    private final SavingsPlanService planService;

    // 매일 3시 정각에 실행 (KST)
    @Scheduled(cron = "0 0 15 * * *", zone = "Asia/Seoul")
    public void closeExpiredPlansHourly() {
        Instant now = Instant.now();
        List<SavingsPlan> targets = planRepo.findByActiveTrueAndEndDateBefore(now);
        if (targets.isEmpty()) return;

        log.info("Auto-closing {} expired savings plans", targets.size());
        for (SavingsPlan p : targets) {
            try {
                planService.deactivate(p.getPlanId());  // (미래 스케줄 SKIPPED + 계좌해지)
            } catch (Exception ex) {
                // 실패한 건 로그 남기고 다음으로 넘어감
                log.warn("Auto-close failed for planId={}: {}", p.getPlanId(), ex.getMessage(), ex);
            }
        }
    }
}

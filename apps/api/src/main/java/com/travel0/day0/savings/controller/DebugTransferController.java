package com.travel0.day0.savings.controller;

import com.travel0.day0.checklist.domain.UserChecklistItem;
import com.travel0.day0.checklist.dto.UserChecklistItemResponse;
import com.travel0.day0.checklist.repository.UserChecklistItemRepository;
import com.travel0.day0.checklist.service.UserChecklistService;
import com.travel0.day0.savings.service.SavingTxnService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.Instant;

// 디버깅용
@RestController
@Profile("dev")
@RequiredArgsConstructor
class DebugTransferController {
    private final SavingTxnService svc;
    private final UserChecklistService ucs;
    private final UserChecklistItemRepository userChecklistItemRepository;

//    @PostMapping("/__debug/transfer/one/{scheduleId}")
//    public String runOne(@PathVariable Long scheduleId) {
//        svc.executeOne(scheduleId);
//        return "OK";
//    }
//
//    @PostMapping("/__debug/transfer/batch")
//    public String runBatch(@RequestParam(defaultValue="100") int limit) {
//        svc.executeBatchInternal(Instant.now(), limit);
//        return "OK";
//    }

//    @PostMapping("/__debug/mission/{userId}/{uciId}")
//    public String runMission(@PathVariable Long userId, @PathVariable Long uciId) {
//        // DTO로 소유자/상태 확인
//        ucs.getUserChecklistItemById(uciId, userId);
//
//        // 엔티티 로드
//        UserChecklistItem uciEntity = userChecklistItemRepository
//                .findByUciIdAndUserChecklistUserUserId(uciId, userId)
//                .orElseThrow(() -> new IllegalArgumentException("User checklist item not found"));
//
//        // 기존 시그니처 그대로 호출
//        svc.missionDeposit(userId, uciEntity);
//
//        return "OK";
//    }
}


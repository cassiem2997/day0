package com.travel0.day0.savings.controller;

import com.travel0.day0.auth.service.PrincipalDetails;
import com.travel0.day0.savings.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.apache.coyote.BadRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.travel0.day0.savings.domain.SavingsPlan;
import com.travel0.day0.savings.service.SavingsPlanService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.travel0.day0.savings.dto.CreatePlanRequest;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/savings")
@RequiredArgsConstructor
@Tag(name = "적금 플랜", description = "적금 플랜 API")
public class SavingsPlanController {

    private final SavingsPlanService planService;

    @PostMapping("/plans")
    @Operation(summary = "적금 플랜 생성")
    public ResponseEntity<CreatePlanResponse> create(@Valid @RequestBody CreatePlanRequest req) throws BadRequestException {
        CreatePlanResponse res = planService.create(req);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping("/plans/{planId}")
    @Operation(summary = "적금 플랜 상세 조회")
    public SavingsPlanDto get(@PathVariable Long planId) {
        return planService.get(planId);
    }

    @GetMapping
    @Operation(summary = "적금 플랜 목록 조회", description = "활성화되어 있는 내 적금 플랜")
    public List<SavingsPlanListDto> my(@RequestParam(name="me", required=false) Boolean me,
                                @RequestParam(name="active", required=false) Boolean active,
                                @AuthenticationPrincipal PrincipalDetails user) {
        if (Boolean.TRUE.equals(me)) {
            return planService.listMy(user.getUserId(), active);
        }
        return planService.listMy(user.getUserId(), active);
    }

    @PatchMapping("/plans/{planId}")
    @Operation(summary = "적금 플랜 수정")
    public void patch(@PathVariable Long planId, @RequestBody UpdatePlanRequest req) throws BadRequestException {
        planService.update(planId, req);
    }

    @DeleteMapping("/plans/{planId}")
    @Operation(summary = "적금 플랜 해지 (soft delete)")
    public void deactivate(@PathVariable Long planId) {
        planService.deactivate(planId);
    }
}

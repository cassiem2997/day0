package com.travel0.day0.departures.controller;

import com.travel0.day0.auth.service.PrincipalDetails;
import com.travel0.day0.common.enums.DepartureStatus;
import com.travel0.day0.departures.dto.DepartureCreateRequest;
import com.travel0.day0.departures.dto.DepartureInfoResponse;
import com.travel0.day0.departures.dto.DepartureUpdateRequest;
import com.travel0.day0.departures.service.DepartureService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/departures")
@RequiredArgsConstructor
public class DepartureController {
    private final DepartureService departureService;

    @PostMapping
    @Operation(summary = "출국 정보 입력", description = "출국정보(university, programType, countryCode, startDate, endDate) 입력")
    public ResponseEntity<DepartureInfoResponse> createDeparture(
            @RequestBody DepartureCreateRequest request){
        DepartureInfoResponse response = departureService.createDeparture(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{departureId}")
    @Operation(summary = "출국 정보 상세 조회", description = "departureId로 출국정보 조회")
    public ResponseEntity<DepartureInfoResponse> getDepartureInfo(
            @PathVariable Long departureId){
        DepartureInfoResponse response = departureService.getDepartureInfo(departureId);

        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "출국정보 목록 조회", description = "사용자의 출국 정보 목록 조회")
    public ResponseEntity<List<DepartureInfoResponse>> getDepartureInfoList(
            @RequestParam(required = false) DepartureStatus status,
            @RequestParam Long userId
            ){
        List<DepartureInfoResponse> response = departureService.getDepartureInfoList(userId, status);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{departureId}")
    @Operation(summary = "출국 정보 수정")
    public ResponseEntity<DepartureInfoResponse> updateDepartureInfo(
            @PathVariable Long departureId,
            @RequestBody DepartureUpdateRequest req
    ){
        DepartureInfoResponse response = departureService.updateDepartureInfo(departureId, req);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{departureId}")
    @Operation(summary = "출국 정보 삭제")
    public ResponseEntity<Void> deleteDepartureInfo(
            @PathVariable Long departureId
    ){
        departureService.deleteDeparture(departureId);
        return ResponseEntity.ok().build();
    }

}

package com.travel0.day0.deparatures.controller;

import com.travel0.day0.deparatures.dto.DepartureCreateRequest;
import com.travel0.day0.deparatures.dto.DepartureInfoResponse;
import com.travel0.day0.deparatures.dto.DepartureUpdateRequest;
import com.travel0.day0.deparatures.service.DepartureService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/departures")
@RequiredArgsConstructor
public class DepartureController {
    private final DepartureService departureService;

    @PostMapping
    public ResponseEntity<DepartureInfoResponse> createDeparture(
            @RequestBody DepartureCreateRequest request){
        DepartureInfoResponse response = departureService.createDeparture(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{departureId}")
    public ResponseEntity<DepartureInfoResponse> getDepartureInfo(
            @PathVariable Long departureId){
        DepartureInfoResponse response = departureService.getDepartureInfo(departureId);

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<DepartureInfoResponse>> getDepartureInfoList(
            @RequestParam Long userId
    ){
        List<DepartureInfoResponse> response = departureService.getDepartureInfoList(userId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{departureId}")
    public ResponseEntity<DepartureInfoResponse> updateDepartureInfo(
            @PathVariable Long departureId,
            @RequestBody DepartureUpdateRequest req
    ){
        DepartureInfoResponse response = departureService.updateDepartureInfo(departureId, req);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{departureId}")
    public ResponseEntity<Void> deleteDepartureInfo(
            @PathVariable Long departureId
    ){
        departureService.deleteDeparture(departureId);
        return ResponseEntity.ok().build();
    }

}

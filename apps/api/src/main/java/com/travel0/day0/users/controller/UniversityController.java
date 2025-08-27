package com.travel0.day0.users.controller;

import com.travel0.day0.users.dto.CountryResponse;
import com.travel0.day0.users.dto.UniversityResponse;
import com.travel0.day0.users.service.UniversityService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/universities")
@RequiredArgsConstructor
public class UniversityController {

    private final UniversityService universityService;

    @GetMapping("/home")
    @Operation(summary = "국내 대학 목록 조회")
    public ResponseEntity<List<UniversityResponse>> getHomeUniversities(){
        List<UniversityResponse> universities = universityService.getUniversitiesByCountryCode("KR");
        return ResponseEntity.ok(universities);
    }

    @GetMapping("/countries")
    @Operation(summary = "국가 코드 목록 조회")
    public ResponseEntity<List<CountryResponse>> getAvailableCountries() {
        List<CountryResponse> countries = universityService.getAvailableCountries();
        return ResponseEntity.ok(countries);
    }

    @GetMapping("/dest/{countryCode}")
    @Operation(summary = "해외 대학 목록 조회")
    public ResponseEntity<List<UniversityResponse>> getDestUniversities(
            @PathVariable String countryCode
    ){
        List<UniversityResponse> universities = universityService.getUniversitiesByCountryCode(countryCode);
        return ResponseEntity.ok(universities);
    }
}

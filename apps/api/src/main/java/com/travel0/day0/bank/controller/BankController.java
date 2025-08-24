package com.travel0.day0.bank.controller;

import com.travel0.day0.bank.port.BankExternalPort.BankCode;
import com.travel0.day0.bank.service.BankService;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/banks")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "[관리자] 은행", description = "은행 공통 API")
public class BankController {

    private final BankService service;

    @Operation(summary = "은행코드 조회")
    @GetMapping("/codes")
    public List<BankCode> inquireBankCodes() {
        return service.getBankCodes();
    }

    @Operation(summary = "은행별 수시입출금 상품 등록")
    @PostMapping(value = "/demand-deposit", consumes = MediaType.APPLICATION_JSON_VALUE)
    public DemandDepositDtos.CreateDemandDepositRes create(@RequestBody CreateReq req) {
        log.info("REQ -> bankCode={}, accountName={}, accountDescription={}",
                req.getBankCode(), req.getAccountName(), req.getAccountDescription());
        return service.register(req.bankCode, req.accountName, req.accountDescription);
    }

    @Data
    public static class CreateReq {
        @NotBlank
        private String bankCode;
        @NotBlank private String accountName;
        private String accountDescription;
    }
}

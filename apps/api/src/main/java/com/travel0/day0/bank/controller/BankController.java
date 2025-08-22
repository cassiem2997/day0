package com.travel0.day0.bank.controller;

import com.travel0.day0.bank.port.BankExternalPort.BankCode;
import com.travel0.day0.bank.service.BankService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/banks")
@RequiredArgsConstructor
@Tag(name = "[관리자] 은행", description = "은행 공통 API")
public class BankController {

    private final BankService service;

    @Operation(description = "은행코드 조회")
    @GetMapping("/codes")
    public List<BankCode> inquireBankCodes() {
        return service.getBankCodes();
    }
}

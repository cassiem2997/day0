package com.travel0.day0.savings.controller;

import com.travel0.day0.finopenapi.dto.DemandDepositDtos;
import com.travel0.day0.savings.service.DemandDepositService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 수시입출금 API
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "수시입출금", description = "수시입출금 API")
@RequestMapping("/banks/demand-deposit")
public class DemandDepositController {

    private final DemandDepositService demandDepositService;

    /**
     * 수시입출금 상품 목록 조회
     */
    @GetMapping("/products")
    @Operation(summary = "수시입출금 상품 목록 조회")
    public ResponseEntity<List<DemandDepositDtos.Rec>> listProducts() {
        List<DemandDepositDtos.Rec> products = demandDepositService.listProducts();
        return ResponseEntity.ok(products);
    }

    /**
     * 수시입출금 계좌 생성
     */
    @Operation(summary = "수시입출금 계좌 생성")
    @PostMapping("/accounts")
    public ResponseEntity<DemandDepositDtos.CreateDemandDepositAccountRes> createAccount(
            @RequestParam Long localUserId,     // TO DO : AuthenticationPrincipal
            @RequestBody CreateAccountReq req
    ) {
        var res = demandDepositService.createAccount(localUserId, req.accountTypeUniqueNo());
        return ResponseEntity.ok(res);
    }

    /** 요청 바디 */
    public record CreateAccountReq(String accountTypeUniqueNo) { }

}

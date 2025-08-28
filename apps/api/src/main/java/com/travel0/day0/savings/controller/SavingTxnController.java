package com.travel0.day0.savings.controller;

import com.travel0.day0.savings.dto.SavingTxnDto;
import com.travel0.day0.savings.dto.SavingTxnFilter;
import com.travel0.day0.savings.service.SavingTxnService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/savings")
@Tag(name = "적금 거래내역", description = "적금 거래내역 API")
@RequiredArgsConstructor
public class SavingTxnController {

    private final SavingTxnService savingTxnService;

    @GetMapping("/transactions")
    @Operation(summary = "납입 내역 목록 조회")
    public Page<SavingTxnDto> listTransactions(
            @ParameterObject SavingTxnFilter filter,
            @ParameterObject Pageable pageable
    ) {
        return savingTxnService.list(filter, pageable);
    }
}

package com.travel0.day0.account.controller;

import com.travel0.day0.savings.controller.DemandDepositController.*;
import com.travel0.day0.account.service.UserAccountService;
import com.travel0.day0.auth.service.PrincipalDetails;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos.*;
import com.travel0.day0.savings.service.DemandDepositService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "사용자 계좌", description = "사용자 수시입출금 계좌")
@RequestMapping("/accounts")
public class AccountController {

    private final UserAccountService userAccountService;

    // 상품 목록 조회
    @GetMapping("/products")
    @Operation(summary = "상품 목록 조회")
    public ResponseEntity<List<Rec>> listProducts() {
        return ResponseEntity.ok(userAccountService.listProducts());
    }

    // 계좌 생성
    @PostMapping("/products/{productId}")
    @Operation(summary = "계좌 생성")
    public ResponseEntity<CreateDemandDepositAccountRes> createAccount(
            @AuthenticationPrincipal PrincipalDetails user,
            @PathVariable Long productId
    ) {
        var res = userAccountService.createAccount(user, productId);
        return ResponseEntity.ok(res);
    }

    // 계좌 목록 조회
    @GetMapping("")
    @Operation(summary = "계좌 목록 조회", description = "활성화되어 있는 사용자 보유 계좌")
    public ResponseEntity<List<AccountListRec>> listAccounts(
            @AuthenticationPrincipal PrincipalDetails user
    ) {
        var res = userAccountService.listAccounts(user);
        return ResponseEntity.ok(res);
    }

    // 계좌 단건 조회
    @GetMapping("/{accountId}")
    @Operation(summary = "계좌 단건 조회")
    public ResponseEntity<AccountListRec> getAccount(
            @AuthenticationPrincipal PrincipalDetails user,
            @PathVariable Long accountId
    ) {
        var res = userAccountService.getAccount(user, accountId);
        return ResponseEntity.ok(res);
    }

    // 계좌 잔액 조회
    @GetMapping("/accounts/{accountId}/balance")
    @Operation(summary = "계좌 잔액 조회")
    public ResponseEntity<AccountBalanceRec> getBalance(
            @AuthenticationPrincipal PrincipalDetails user,
            @PathVariable Long accountId
    ) {
        var res = userAccountService.getBalance(user.getUserId(), accountId);
        return ResponseEntity.ok(res);
    }

    // 거래 내역 조회
    @GetMapping("/accounts/{accountId}/transactions")
    @Operation(summary = "거래내역 목록 조회")
    public ResponseEntity<inquireTransactionHistoryListRes> listTransactions(
            @AuthenticationPrincipal PrincipalDetails user,
            @PathVariable Long accountId,
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(defaultValue = "A") String transactionType,
            @RequestParam(defaultValue = "DESC") String orderByType
    ) {
        var res = userAccountService.listTransactions(
                user.getUserId(), accountId, startDate, endDate, transactionType, orderByType
        );
        return ResponseEntity.ok(res);
    }

    // 계좌 번호로 계좌 id 찾는 API
    @GetMapping("/accounts/{accountNo}/find")
    @Operation(summary = "계좌 id 조회", description = "계좌 번호로 계좌 id 찾는 API")
    public ResponseEntity<Long> getAccountId(
            @PathVariable String accountNo
    ) {
        var res = userAccountService.getAccountByAccountNo(accountNo);
        return ResponseEntity.ok(res.get().getAccountId());
    }


    /* ===== Request DTOs ===== */
    public record AmountSummaryReq(Long amount, String summary) { }
    public record TransferReq(String withdrawalAccountNo, String depositAccountNo, Long amount,
                              String withdrawalSummary, String depositSummary) { }
    public record UpdateLimitReq(BigDecimal oneTimeLimit, BigDecimal dailyLimit) { }
    public record DeleteAccountReq(String refundAccountNo) { }
    public record MemoReq(String memo) {}
}

package com.travel0.day0.savings.controller;

import com.travel0.day0.auth.service.PrincipalDetails;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos.*;
import com.travel0.day0.savings.service.DemandDepositService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 수시입출금 API
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "수시입출금", description = "수시입출금 금융 API")
@RequestMapping("/banks/demand-deposit")
public class DemandDepositController {

    private final DemandDepositService demandDepositService;

    @GetMapping("/products")
    @Operation(summary = "수시입출금 상품 목록 조회")
    public ResponseEntity<List<Rec>> listProducts() {
        return ResponseEntity.ok(demandDepositService.listProducts());
    }

    @PostMapping("/accounts")
    @Operation(summary = "수시입출금 계좌 생성")
    public ResponseEntity<CreateDemandDepositAccountRes> createAccount(
            @AuthenticationPrincipal PrincipalDetails user,
            @RequestBody CreateAccountReq req
    ) {
        var res = demandDepositService.createAccount(user.getUserId(), req.accountTypeUniqueNo());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/accounts")
    @Operation(summary = "계좌 목록 조회")
    public ResponseEntity<List<AccountListRec>> listAccounts(
            @AuthenticationPrincipal PrincipalDetails user
    ) {
        var res = demandDepositService.listAccounts(user.getUserId());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/accounts/{accountNo}")
    @Operation(summary = "계좌 단건 조회")
    public ResponseEntity<AccountListRec> getAccount(
            @AuthenticationPrincipal PrincipalDetails user,
            @PathVariable String accountNo
    ) {
        var res = demandDepositService.getAccount(user.getUserId(), accountNo);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/accounts/{accountNo}/holder")
    @Operation(summary = "예금주명 조회")
    public ResponseEntity<AccountHolderRec> getAccountHolder(
            @AuthenticationPrincipal PrincipalDetails user,
            @PathVariable String accountNo
    ) {
        var res = demandDepositService.getAccountHolder(user.getUserId(), accountNo);
        return ResponseEntity.ok(res);
    }

    @GetMapping("/accounts/{accountNo}/balance")
    @Operation(summary = "계좌 잔액 조회")
    public ResponseEntity<AccountBalanceRec> getBalance(
            @AuthenticationPrincipal PrincipalDetails user,
            @PathVariable String accountNo
    ) {
        var res = demandDepositService.getBalance(user.getUserId(), accountNo);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/accounts/{accountNo}/withdraw")
    @Operation(summary = "계좌 출금")
    public ResponseEntity<InquireDemandDepositAccountWithdrawalRes> withdraw(
            @AuthenticationPrincipal PrincipalDetails user,
            @PathVariable String accountNo,
            @RequestBody AmountSummaryReq req
    ) {
        var res = demandDepositService.withdraw(user.getUserId(), accountNo, req.amount(), req.summary());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/accounts/{accountNo}/deposit")
    @Operation(summary = "계좌 입금")
    public ResponseEntity<updateDemandDepositAccountDepositRes> deposit(
            @AuthenticationPrincipal PrincipalDetails user,
            @PathVariable String accountNo,
            @RequestBody AmountSummaryReq req
    ) {
        var res = demandDepositService.deposit(user.getUserId(), accountNo, req.amount(), req.summary());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/transfer")
    @Operation(summary = "계좌 이체")
    public ResponseEntity<updateDemandDepositAccountTransferRes> transfer(
            @AuthenticationPrincipal PrincipalDetails user,
            @RequestBody TransferReq req
    ) {
        var res = demandDepositService.transfer(
                user.getUserId(),
                req.withdrawalAccountNo(),
                req.depositAccountNo(),
                req.amount(),
                req.withdrawalSummary(),
                req.depositSummary()
        );
        return ResponseEntity.ok(res);
    }

    @PatchMapping("/accounts/{accountNo}/limits")
    @Operation(summary = "이체 한도 변경")
    public ResponseEntity<updateTransferLimitRes> updateLimit(
            @AuthenticationPrincipal PrincipalDetails user,
            @PathVariable String accountNo,
            @RequestBody UpdateLimitReq req
    ) {
        var res = demandDepositService.updateLimit(user.getUserId(), accountNo, req.oneTimeLimit(), req.dailyLimit());
        return ResponseEntity.ok(res);
    }

    @GetMapping("/accounts/{accountNo}/transactions")
    @Operation(summary = "거래내역 목록 조회")
    public ResponseEntity<inquireTransactionHistoryListRes> listTransactions(
            @AuthenticationPrincipal PrincipalDetails user,
            @PathVariable String accountNo,
            @RequestParam String startDate,
            @RequestParam String endDate,
            @RequestParam(defaultValue = "A") String transactionType,
            @RequestParam(defaultValue = "DESC") String orderByType
    ) {
        var res = demandDepositService.listTransactions(
                user.getUserId(), accountNo, startDate, endDate, transactionType, orderByType
        );
        return ResponseEntity.ok(res);
    }

    @GetMapping("/accounts/{accountNo}/transactions/{transactionUniqueNo}")
    @Operation(summary = "거래내역 단건 조회")
    public ResponseEntity<inquireTransactionHistoryRes> getTransaction(
            @AuthenticationPrincipal PrincipalDetails user,
            @PathVariable String accountNo,
            @PathVariable Long transactionUniqueNo
    ) {
        var res = demandDepositService.getTransaction(user.getUserId(), accountNo, transactionUniqueNo);
        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/accounts/{accountNo}")
    @Operation(summary = "계좌 해지")
    public ResponseEntity<deleteDemandDepositAccountRes> deleteAccount(
            @AuthenticationPrincipal PrincipalDetails user,
            @PathVariable String accountNo,
            @RequestBody DeleteAccountReq req
    ) {
        var res = demandDepositService.deleteAccount(user.getUserId(), accountNo, req.refundAccountNo());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/accounts/{accountNo}/transactions/{transactionUniqueNo}/memo")
    @Operation(summary = "거래내역 메모 작성/수정")
    public ResponseEntity<transactionMemoRes> upsertTransactionMemo(
            @AuthenticationPrincipal PrincipalDetails user,
            @PathVariable String accountNo,
            @PathVariable Long transactionUniqueNo,
            @RequestBody MemoReq req
    ) {
        String memo = req.memo();
        var res = demandDepositService.getMemo(user.getUserId(), accountNo, transactionUniqueNo, memo);
        return ResponseEntity.ok(res);
    }

    /* ===== Request DTOs ===== */

    public record CreateAccountReq(String accountTypeUniqueNo) { }
    public record AmountSummaryReq(Long amount, String summary) { }
    public record TransferReq(String withdrawalAccountNo, String depositAccountNo, Long amount,
                              String withdrawalSummary, String depositSummary) { }
    public record UpdateLimitReq(Long oneTimeLimit, Long dailyLimit) { }
    public record DeleteAccountReq(String refundAccountNo) { }
    public record MemoReq(String memo) {}
}

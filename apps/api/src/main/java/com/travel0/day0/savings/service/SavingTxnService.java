package com.travel0.day0.savings.service;

import com.travel0.day0.account.domain.AccountTransaction;
import com.travel0.day0.account.domain.UserAccount;
import com.travel0.day0.account.repository.TransactionRepository;
import com.travel0.day0.account.repository.UserAccountRepository;
import com.travel0.day0.common.enums.PaymentStatus;
import com.travel0.day0.common.enums.SavingTxnStatus;
import com.travel0.day0.savings.domain.PaymentSchedule;
import com.travel0.day0.savings.domain.SavingTxn;
import com.travel0.day0.savings.domain.SavingsPlan;
import com.travel0.day0.savings.dto.SavingTxnDto;
import com.travel0.day0.savings.dto.SavingTxnFilter;
import com.travel0.day0.savings.port.DemandDepositExternalPort;
import com.travel0.day0.savings.repository.PaymentScheduleRepository;
import com.travel0.day0.savings.repository.SavingTxnRepository;
import com.travel0.day0.savings.repository.SavingsPlanRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SavingTxnService {

    private final SavingTxnRepository savingTxnRepository;
    private final PaymentScheduleRepository scheduleRepository;
    private final SavingsPlanRepository planRepository;
    private final LedgerService ledgerService;
    private final DemandDepositService demandDepositService;

    @Transactional(readOnly = true)
    public Page<SavingTxnDto> list(SavingTxnFilter filter, Pageable pageable) {
        // 기본 정렬: requestedAt DESC
        Sort sort = pageable.getSort().isSorted()
                ? pageable.getSort()
                : Sort.by(Sort.Direction.DESC, "requestedAt");
        Pageable pageReq = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        Specification<SavingTxn> spec = buildSpec(filter);

        Page<SavingTxn> page = savingTxnRepository.findAll(spec, pageReq);
        return page.map(SavingTxnDto::from);
    }

    private Specification<SavingTxn> buildSpec(SavingTxnFilter f) {
        return (root, query, cb) -> {
            List<Predicate> ps = new ArrayList<>();

            if (f.getPlanId() != null) {
                ps.add(cb.equal(root.get("plan").get("planId"), f.getPlanId()));
            }
            if (f.getScheduleId() != null) {
                ps.add(cb.equal(root.get("schedule").get("scheduleId"), f.getScheduleId()));
            }
            if (f.getStatus() != null) {
                ps.add(cb.equal(root.get("status"), f.getStatus()));
            }
            if (f.getTxnType() != null) {
                ps.add(cb.equal(root.get("txnType"), f.getTxnType()));
            }
            if (f.getFrom() != null) {
                ps.add(cb.greaterThanOrEqualTo(root.get("requestedAt"), f.getFrom()));
            }
            if (f.getTo() != null) {
                ps.add(cb.lessThan(root.get("requestedAt"), f.getTo()));
            }
            if (f.getExternalTxId() != null && !f.getExternalTxId().isBlank()) {
                ps.add(cb.like(cb.lower(root.get("externalTxId")),
                        "%" + f.getExternalTxId().toLowerCase() + "%"));
            }
            if (f.getIdempotencyKey() != null && !f.getIdempotencyKey().isBlank()) {
                ps.add(cb.like(cb.lower(root.get("idempotencyKey")),
                        "%" + f.getIdempotencyKey().toLowerCase() + "%"));
            }

            return cb.and(ps.toArray(new Predicate[0]));
        };
    }

    @Scheduled(cron = "0 1 15 * * *", zone = "Asia/Seoul") // 매일 오후 3시 1분에만 실행.
    public void executeBatch() {
        executeBatchInternal(Instant.now(), 100);
    }

    @Transactional
    void executeBatchInternal(Instant asOf, int limit) {
        var due = scheduleRepository.claimDueForUpdateSkipLocked(asOf, limit);
        for (var ps : due) {
            executeOne(ps.getScheduleId());
        }
    }

    @Transactional
    public void executeOne(Long scheduleId) {
        PaymentSchedule ps = scheduleRepository.findById(scheduleId)
                .orElseThrow(() -> new IllegalArgumentException("schedule not found: " + scheduleId));

        if (ps.getStatus() != PaymentStatus.PENDING) return;

        // plan + 계좌 로딩
        SavingsPlan plan = planRepository.findByIdWithAccounts(ps.getPlan().getPlanId())
                .orElseThrow(() -> new IllegalStateException("plan not found: " + ps.getPlan().getPlanId()));

        var withdraw = plan.getWithdrawAccount();  // 외부 EXTERNAL
        var saving = plan.getSavingAccount();    // 내부 INTERNAL (적금)
        if (withdraw == null || saving == null) {
            fail(ps, "CONFIG", "계좌 연결 누락");
            return;
        }

        // 0) 한도/상태 체크
        ensureActive(withdraw);
        ensureActive(saving);
        ensureLimits(withdraw, ps.getAmount()); // one-time / daily limit

        // 1) saving_txn (RECEIVED) 생성 (멱등 PS-<scheduleId>)
        String idem = "PS-" + ps.getScheduleId();
        SavingTxn txn = savingTxnRepository.findByPlan_PlanIdAndIdempotencyKey(plan.getPlanId(), idem)
                .orElseGet(() -> savingTxnRepository.save(SavingTxn.received(
                        plan, ps, ps.getAmount(), idem
                )));

        txn.markProcessing();

        // 이미 성공 처리된 멱등 요청이면 skip
        if (txn.getStatus() == SavingTxnStatus.SUCCESS) {
            markScheduleSuccess(ps, txn.getExternalTxId());
            return;
        }

        // 2) 외부 이체 호출
        updateDemandDepositAccountTransferRes res;
        try {
            res = demandDepositService.transfer(plan.getUser().getUserId(), withdraw.getAccountNo(),
                    saving.getAccountNo(), ps.getAmount().longValue(), "적금 자동이체", "적금 입금");
        } catch (Exception e) {
            // 재시도: FAILED 로 두고 종료 (백오프 전략이 필요하면 ps에 next_attempt_at 등 칼럼 추가)
            fail(ps, "BANK_API", e.getMessage());
            savingTxnRepository.markFailed(txn.getTxnId(), e.getMessage());
            return;
        }

        // 외부 거래번호
        String externalTxId = safe(String.valueOf(res.getREC().get(0).getTransactionUniqueNo()));

        // 3) 내부 회계 — account_transaction 2건 + 잔액 반영
        var debit = ledgerService.postTxn(withdraw, false, ps.getAmount(), "출금(적금이체)", "적금 자동이체",
                saving.getAccountNo(), externalTxId, idem + "-D");
        var credit = ledgerService.postTxn(saving, true, ps.getAmount(), "입금(적금이체)", "적금 입금",
                withdraw.getAccountNo(), externalTxId, idem + "-C");

        // 4) saving_txn 성공 반영 (posting_tx_id: 내부 입금 tx_id)
        savingTxnRepository.markSuccess(txn.getTxnId(), externalTxId, credit);

        // 5) 스케줄 성공
        markScheduleSuccess(ps, externalTxId);
    }

    // ===== Helper =====

    private void ensureActive(UserAccount acc) {
        if (!acc.isActive())
            throw new IllegalStateException("비활성 계좌");
    }

    private void ensureLimits(UserAccount withdraw, BigDecimal amount) {
        if (amount.longValue() > withdraw.getOneTimeTransferLimit().longValue())
            throw new IllegalStateException("1회 이체 한도 초과");
        // 일일 누적은 txRepo.sumToday(withdraw) 등으로 합산 체크
    }

    private void markScheduleSuccess(PaymentSchedule ps, String extTxId) {
        ps.setStatus(PaymentStatus.SUCCESS);
        ps.setExecutedAt(Instant.now());
        ps.setExternalTxId(truncate(extTxId, 100));
        ps.setFailureReason(null);
    }

    private void fail(PaymentSchedule ps, String code, String reason) {
        ps.setStatus(PaymentStatus.FAILED);
        ps.setExecutedAt(Instant.now());
        ps.setFailureReason(truncate(code + ":" + String.valueOf(reason), 300));
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }

    private static String safe(String... cands) {
        for (String c : cands) if (c != null && !c.isBlank()) return c;
        return null;
    }
}

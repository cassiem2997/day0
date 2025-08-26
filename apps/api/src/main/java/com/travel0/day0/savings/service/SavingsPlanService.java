package com.travel0.day0.savings.service;

import com.travel0.day0.account.domain.UserAccount;
import com.travel0.day0.account.repository.UserAccountRepository;
import com.travel0.day0.finopenapi.config.FinOpenApiProperties;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos;
import com.travel0.day0.savings.domain.SavingsPlan;
import com.travel0.day0.savings.dto.CreatePlanRequest;
import com.travel0.day0.savings.dto.UpdatePlanRequest;
import com.travel0.day0.savings.port.DemandDepositExternalPort;
import com.travel0.day0.savings.repository.SavingsPlanRepository;
import com.travel0.day0.departures.domain.DepartureInfo;
import com.travel0.day0.users.domain.User;
import com.travel0.day0.users.repository.UserRepository;
import com.travel0.day0.departures.repository.DepartureInfoRepository;
import com.travel0.day0.users.service.UserKeyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavingsPlanService {
    private final SavingsPlanRepository planRepo;
    private final UserRepository userRepo;
    private final DepartureInfoRepository departureRepo;
    private final UserAccountRepository accountRepo;
    private final UserKeyService userKeyService;
    private final DemandDepositExternalPort externalPort;
    private final FinOpenApiProperties finOpenApiProperties;

    @Transactional
    public Long create(CreatePlanRequest req) {
        User userRef = userRepo.getReferenceById(req.userId());

        DepartureInfo departureRef = null;
        if (req.departureId() != null) {
            departureRef = departureRepo.getReferenceById(req.departureId());
        }

        // 출금 계좌
        UserAccount withdrawAccount = accountRepo.getReferenceById(req.withdrawAccountId());

        // 적금 계좌
        String userKey = userKeyService.searchUserKey(userRef.getUserId(), finOpenApiProperties.getApiKey());

        DemandDepositDtos.CreateDemandDepositAccountRes createRes =
                externalPort.createAccount("999-1-b24384dcd11c46", userKey);

        DemandDepositDtos.AccountRec created = (createRes.getREC() != null && !createRes.getREC().isEmpty())
                ? createRes.getREC().get(0) : null;
        if (created == null) throw new IllegalStateException("계좌 생성 응답에 REC가 없습니다.");

        String accountNo = created.getAccountNo();

        // 상세 조회
        DemandDepositDtos.AccountListRec d = externalPort.inquireAccount(accountNo, userKey);
        if (d == null) throw new IllegalStateException("계좌 상세 조회 응답에 REC가 없습니다.");

        // DB에 저장
        UserAccount savingAccount = UserAccount.builder()
                .user(userRef)
                .origin(UserAccount.Origin.INTERNAL)
                .accountType(UserAccount.AccountType.SAVINGS)
                .bankCode("999")
                .bankName("싸피은행")
                .accountNo(accountNo)
                .currency(nvlUpper(d.getCurrency(), "KRW"))
                .accountBalance(toDecimal(d.getAccountBalance()))
                .dailyTransferLimit(toDecimal(d.getDailyTransferLimit()))
                .oneTimeTransferLimit(toDecimal(d.getOneTimeTransferLimit()))
                .accountCreateDate(parseYyyyMmDd(d.getAccountCreatedDate()))
                .accountExpireDate(parseYyyyMmDd(d.getAccountExpiryDate()))
                .lastTransactionDate(parseLastTx(d.getLastTransactionDate()))
                .active(true)
                .build();
        savingAccount = accountRepo.save(savingAccount);

        SavingsPlan plan = SavingsPlan.builder()
                .user(userRef)
                .departure(departureRef)
                .withdrawAccount(withdrawAccount)
                .savingAccount(savingAccount)
                .goalAmount(req.goalAmount())
                .startDate(req.startDate())
                .endDate(req.endDate())
                .frequency(req.frequency())
                .amountPerPeriod(req.amountPerPeriod())
                .depositDay(req.depositDay())
                .depositWeekday(req.depositWeekday())
                .active(true)
                .build();

        Long planId = planRepo.save(plan).getPlanId();
        log.info("Savings plan created successfully with planId={}", planId);
        return planId;
    }

    @Transactional(readOnly = true)
    public SavingsPlan get(Long planId) {
        log.debug("Fetching savings plan planId={}", planId);
        return planRepo.findById(planId).orElseThrow();
    }

    @Transactional(readOnly = true)
    public List<SavingsPlan> listMy(Long userId, Boolean active) {
        log.debug("Listing savings plans for userId={}, active={}", userId, active);
        if (active == null)
            return planRepo.findByUser_UserIdAndActive(userId, true);
        return planRepo.findByUser_UserIdAndActive(userId, active);
    }

    @Transactional
    public void update(Long planId, UpdatePlanRequest req) {
        log.info("Updating savings plan planId={} with amountPerPeriod={}, frequency={}, active={}",
                planId, req.amountPerPeriod(), req.frequency(), req.active());
        SavingsPlan plan = planRepo.findById(planId).orElseThrow();
        plan.update(req.amountPerPeriod(), req.frequency(), req.active());
    }

    @Transactional
    public void deactivate(Long planId) {
        log.info("Deactivating savings plan planId={}", planId);
        SavingsPlan plan = planRepo.findById(planId).orElseThrow();
        plan.update(null, null, false);
    }

    // ----- 유틸 -----
    private static String nvl(String v, String def) {
        return (v == null || v.isBlank()) ? def : v;
    }
    private static String nvlUpper(String v, String def) {
        return (v == null || v.isBlank()) ? def : v.toUpperCase();
    }
    private static BigDecimal toDecimal(Long v) {
        if (v == null) return new BigDecimal("0");
        return new BigDecimal(v);
    }
    private static LocalDate parseYyyyMmDd(String s) {
        if (s == null || s.isBlank()) return null;
        return LocalDate.parse(s, DateTimeFormatter.BASIC_ISO_DATE);
    }
    private static Instant parseLastTx(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return Instant.parse(s);
        } catch (Exception e) {
            return null;
        }
    }
}

package com.travel0.day0.savings.service;

import com.travel0.day0.account.domain.UserAccount;
import com.travel0.day0.account.repository.UserAccountRepository;
import com.travel0.day0.common.enums.PaymentStatus;
import com.travel0.day0.common.enums.SavingsFrequency;
import com.travel0.day0.finopenapi.config.FinOpenApiProperties;
import com.travel0.day0.finopenapi.dto.DemandDepositDtos;
import com.travel0.day0.savings.domain.PaymentSchedule;
import com.travel0.day0.savings.domain.SavingsPlan;
import com.travel0.day0.savings.dto.*;
import com.travel0.day0.savings.port.DemandDepositExternalPort;
import com.travel0.day0.savings.repository.PaymentScheduleRepository;
import com.travel0.day0.savings.repository.SavingsPlanRepository;
import com.travel0.day0.departures.domain.DepartureInfo;
import com.travel0.day0.users.domain.User;
import com.travel0.day0.users.repository.UserRepository;
import com.travel0.day0.departures.repository.DepartureInfoRepository;
import com.travel0.day0.users.service.UserKeyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.coyote.BadRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
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
    private final PaymentScheduleRepository scheduleRepo;

    private static final ZoneId ZONE = ZoneId.of("Asia/Seoul");


    @Transactional
    public CreatePlanResponse  create(CreatePlanRequest req) throws BadRequestException {
        // 사용자, 출국정보
        User userRef = userRepo.getReferenceById(req.userId());
        DepartureInfo departureRef = (req.departureId() != null)
                ? departureRepo.getReferenceById(req.departureId())
                : null;

        // 출금 계좌
        UserAccount withdraw = accountRepo.findById(req.withdrawAccountId())
                .orElseThrow(() -> bad("withdrawAccountId not found: " + req.withdrawAccountId()));
        if (!withdraw.getUser().getUserId().equals(userRef.getUserId())) {
            throw bad("withdrawAccount does not belong to user");
        }

        // 적금 계좌 - 내부 계좌 신규 생성
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

        // start/end 계산
        Instant startDate = Instant.now();
        LocalDate startLocal = LocalDateTime.ofInstant(startDate, ZONE).toLocalDate();

        // 최대 4년 클램프
        LocalDate maxEndLocal = startLocal.plusYears(4);

        LocalDate endLocal = (req.endDate() == null) ? maxEndLocal
                : req.endDate().isAfter(maxEndLocal) ? maxEndLocal
                : req.endDate();

        Instant endDate = endLocal.atTime(15, 00, 00).atZone(ZONE).toInstant();

        // 회차 계산
        List<LocalDate> dates = switch (req.frequency()) {
            case MONTHLY -> ScheduleCalculator.monthlyDates(startDate, endDate, req.depositDay(), ZONE);
            case WEEKLY  -> ScheduleCalculator.weeklyDates(startDate, endDate, req.depositWeekday(), ZONE);
        };
        if (dates.isEmpty()) {
            throw bad("No payable periods in range (check depositDay/weekday, start/end)");
        }
        int periodCount = dates.size();

        // 목표 금액 계산
        BigDecimal goalAmount = req.amountPerPeriod()
                .multiply(BigDecimal.valueOf(periodCount))
                .setScale(2, RoundingMode.HALF_UP);

        // 플랜 저장
        SavingsPlan plan = SavingsPlan.builder()
                .user(userRef)
                .departure(departureRef)
                .withdrawAccount(withdraw)
                .savingAccount(savingAccount)
                .goalAmount(goalAmount)
                .startDate(startDate)
                .endDate(endDate)
                .frequency(req.frequency())
                .amountPerPeriod(req.amountPerPeriod())
                .depositDay(req.depositDay())
                .depositWeekday(req.depositWeekday())
                .active(true)
                .build();
        planRepo.save(plan);

        // 스케줄 저장 (payment_schedule)
        var schedules = dates.stream()
                .map(ld -> PaymentSchedule.builder()
                        .plan(plan)
                        .planDate(ld.atStartOfDay(ZONE).toInstant()) // 정책: 00:00 실행
                        .amount(req.amountPerPeriod())
                        .status(PaymentStatus.PENDING)
                        .build())
                .toList();
        scheduleRepo.saveAll(schedules);

        return new CreatePlanResponse(
                plan.getPlanId(),
                plan.getStartDate(),
                plan.getGoalAmount(),
                userRef.getUserId(),
                (plan.getDeparture() != null ? plan.getDeparture().getDepartureId() : null),
                plan.getWithdrawAccount().getAccountId(),
                plan.getSavingAccount().getAccountId(),
                plan.getEndDate(),
                plan.getFrequency(),
                plan.getAmountPerPeriod(),
                plan.getDepositDay(),
                plan.getDepositWeekday()
        );
    }

    @Transactional(readOnly = true)
    public SavingsPlanDto get(Long planId) {
        var plan = planRepo.findDetailById(planId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "plan not found: " + planId));

        return SavingsPlanDto.from(plan);
    }

    @Transactional(readOnly = true)
    public List<SavingsPlanListDto> listMy(Long userId, Boolean active) {
        log.debug("Listing savings plans for userId={}, active={}", userId, active);
        boolean activeVal = (active == null || active);
        return planRepo.findByUser_UserIdAndActive(userId, activeVal)
                .stream()
                .map(SavingsPlanListDto::from)
                .toList();
    }

    @Transactional
    public void update(Long planId, UpdatePlanRequest req) throws BadRequestException {
        final ZoneId ZONE = ZoneId.of("Asia/Seoul");

        SavingsPlan plan = planRepo.findById(planId)
                .orElseThrow(() -> bad("plan not found: " + planId));

        // endDate: 연장만 가능, 최대 4년(시작일 기준)
        Instant oldEnd = plan.getEndDate();
        Instant start  = plan.getStartDate();
        Instant maxEnd = ZonedDateTime.ofInstant(start, ZONE)
                .plusYears(4)
                .toInstant();
        if (req.endDate() != null) {
            Instant requested = req.endDate();
            if (requested.isBefore(oldEnd))
                throw bad("endDate can only be extended (must be >= current endDate)");
            Instant clamped = requested.isAfter(maxEnd) ? maxEnd : requested;
            plan.setEndDate(clamped);
        }

        // 주기/일자/요일/회차금액: 부분 수정 허용
        if (req.frequency() != null) {
            plan.setFrequency(req.frequency());
        }
        if (req.amountPerPeriod() != null) {
            if (req.amountPerPeriod().signum() <= 0) throw bad("amountPerPeriod must be > 0");
            plan.setAmountPerPeriod(req.amountPerPeriod());
        }
        if (plan.getFrequency() == SavingsFrequency.MONTHLY) {
            // MONTHLY면 depositDay 필요(1~31). null이면 기존값 유지, 둘 다 null이면 에러
            Integer newDay = firstNonNull(req.depositDay(), plan.getDepositDay());
            if (newDay == null) throw bad("depositDay required for MONTHLY");
            if (newDay < 1 || newDay > 31) throw bad("depositDay must be 1..31");
            plan.setDepositDay(newDay);
            plan.setDepositWeekday(null);
        } else { // WEEKLY
            Integer newWd = firstNonNull(req.depositWeekday(), plan.getDepositWeekday());
            if (newWd == null) throw bad("depositWeekday required for WEEKLY");
            if (newWd < 0 || newWd > 6) throw bad("depositWeekday must be 0..6");
            plan.setDepositWeekday(newWd);
            plan.setDepositDay(null);
        }

        // ========== 2) 스케줄 재계산 대상 여부 ==========
        // 재계산 트리거: frequency / depositDay / depositWeekday / endDate / amountPerPeriod /
        boolean needRebuild = req.frequency() != null
                || req.depositDay() != null
                || req.depositWeekday() != null
                || req.endDate() != null
                || req.amountPerPeriod() != null;

        if (!needRebuild) return; // 변경 없음 → 끝

        // ========== 3) 기존 스케줄 처리 ==========
        // 성공한 건 보존, 나머지 삭제
        var deletable = List.of(PaymentStatus.PENDING, PaymentStatus.FAILED, PaymentStatus.SKIPPED);
        scheduleRepo.deleteByPlanIdAndStatusIn(planId, deletable);

        // 보존된 SUCCESS 건수
        long successCount = scheduleRepo.findByPlan_PlanId(planId).stream()
                .filter(ps -> ps.getStatus() == PaymentStatus.SUCCESS)
                .count();

        // ========== 4) 새 스케줄 생성 ==========
        Instant end = plan.getEndDate();
        List<LocalDate> dates = switch (plan.getFrequency()) {
            case MONTHLY -> ScheduleCalculator.monthlyDates(
                    plan.getStartDate(), end, safeDay(plan.getDepositDay()), ZONE);
            case WEEKLY  -> ScheduleCalculator.weeklyDates(
                    plan.getStartDate(), end, safeWeekday(plan.getDepositWeekday()), ZONE);
        };

        // 이미 성공한 회차의 planDate는 보존됐으므로, 새로 만들 것만 필터링
        var existingSuccessInstants = scheduleRepo.findByPlan_PlanId(planId).stream()
                .filter(ps -> ps.getStatus() == PaymentStatus.SUCCESS)
                .map(PaymentSchedule::getPlanDate)
                .collect(java.util.stream.Collectors.toSet());

        var newSchedules = dates.stream()
                .map(ld -> ld.atTime(LocalTime.of(9, 0)).atZone(ZONE).toInstant())
                .filter(inst -> !existingSuccessInstants.contains(inst)) // 성공분 제외
                .map(inst -> PaymentSchedule.builder()
                        .plan(plan)
                        .planDate(inst)
                        .amount(plan.getAmountPerPeriod())
                        .status(PaymentStatus.PENDING)
                        .build())
                .toList();
        scheduleRepo.saveAll(newSchedules);

        // ========== 5) goalAmount 재계산 ==========
        long newPendingCount = newSchedules.size();
        long totalPeriods = successCount + newPendingCount;
        var newGoal = plan.getAmountPerPeriod()
                .multiply(BigDecimal.valueOf(totalPeriods))
                .setScale(2, RoundingMode.HALF_UP);
        plan.setGoalAmount(newGoal);
    }

    @Transactional
    public void deactivate(Long planId) {
        SavingsPlan plan = planRepo.findByIdWithAccounts(planId)
                .orElseThrow(() -> bad("plan not found: " + planId));

        if (Boolean.FALSE.equals(plan.getActive())) {
            log.info("Plan {} already inactive", planId);
            return;
        }

        Instant now = Instant.now();
        plan.setActive(false);
        plan.setEndDate(now);

        // 1) 미래 스케줄 SKIPPED 처리
        var toSkip = List.of(PaymentStatus.PENDING, PaymentStatus.FAILED, PaymentStatus.SKIPPED);
        int affected = scheduleRepo.skipFuture(planId, now, toSkip, PaymentStatus.SKIPPED, "Plan deactivated");
        log.info("Skipped {} future schedules for plan {}", affected, planId);

        // 2) 내부 적금 계좌만 해지
        UserAccount saving = plan.getSavingAccount();
        boolean isInternalSavings = saving != null
                && saving.getOrigin() == UserAccount.Origin.INTERNAL
                && saving.getAccountType() == UserAccount.AccountType.SAVINGS;

        if (isInternalSavings) {
            String savingAccountNo = saving.getAccountNo();
            String refundAccountNo = plan.getWithdrawAccount().getAccountNo();
            Long localUserId = plan.getUser().getUserId();
            String apiKey = finOpenApiProperties.getApiKey();

            String userKey = userKeyService.searchUserKey(localUserId, apiKey);
            DemandDepositDtos.deleteDemandDepositAccountRes dddar = externalPort.deleteAccount(savingAccountNo, refundAccountNo, userKey);

            saving.setActive(false);
            saving.setAccountExpireDate(ZonedDateTime.ofInstant(now, ZONE).toLocalDate());
        }
    }

    private ResponseStatusException bad(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
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
    private static <T> T firstNonNull(T a, T b) { return a != null ? a : b; }
    private static int safeDay(Integer d) {
        if (d == null) throw new IllegalStateException("depositDay required for MONTHLY");
        return d;
    }
    private static int safeWeekday(Integer w) {
        if (w == null) throw new IllegalStateException("depositWeekday required for WEEKLY");
        return w;
    }

}

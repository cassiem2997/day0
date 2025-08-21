package com.travel0.day0.savings.service;

import com.travel0.day0.savings.domain.SavingsPlan;
import com.travel0.day0.savings.dto.CreatePlanRequest;
import com.travel0.day0.savings.dto.UpdatePlanRequest;
import com.travel0.day0.savings.repository.SavingsPlanRepository;
import com.travel0.day0.users.domain.DepartureInfo;
import com.travel0.day0.users.domain.User;
import com.travel0.day0.users.repository.UserRepository;
import com.travel0.day0.users.repository.DepartureInfoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SavingsPlanService {
    private final SavingsPlanRepository planRepo;
    private final UserRepository userRepo;
    private final DepartureInfoRepository departureRepo;

    @Transactional
    public Long create(CreatePlanRequest req) {
        User userRef = userRepo.getReferenceById(req.userId());

        DepartureInfo departureRef = null;
        if (req.departureId() != null) {
            departureRef = departureRepo.getReferenceById(req.departureId());
        }

        SavingsPlan plan = SavingsPlan.builder()
                .user(userRef)
                .departure(departureRef)
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
}

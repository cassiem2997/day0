package com.travel0.day0.community.service;

import com.travel0.day0.users.domain.User;
import com.travel0.day0.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 마일리지 관리 서비스
 * 커뮤니티 활동에 따른 포인트 적립/차감 관리
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MileageService {

    private final UserRepository userRepository;

    // 마일리지 적립 기준 (기획서 기준)
    private static final int MILEAGE_POST_CREATE = 100;      // 질문 등록
    private static final int MILEAGE_REPLY_ADOPTED = 200;    // 답변 채택 받음 (답변자)
    private static final int MILEAGE_ADOPT_REPLY = 50;       // 답변 채택 함 (질문자)
    private static final int MILEAGE_CHECKLIST_SHARE = 500;  // 체크리스트 공유
    private static final int MILEAGE_REPLY_CREATE = 50;      // 댓글 작성

    /**
     * 마일리지 적립
     */
    @Transactional
    public void awardMileage(Long userId, int amount, String reason, String details) {
        log.info("마일리지 적립: userId={}, amount={}, reason={}", userId, amount, reason);

        User user = getUserById(userId);
        
        // 현재 마일리지에 추가
        long currentMileage = user.getMileage() != null ? user.getMileage() : 0L;
        user.setMileage(currentMileage + amount);
        
        userRepository.save(user);

        // 마일리지 거래 내역 저장 (추후 MileageTransaction 엔티티 구현 시)
        // saveMileageTransaction(userId, amount, "EARNED", reason, details);

        log.info("마일리지 적립 완료: userId={}, newBalance={}", userId, user.getMileage());
    }

    /**
     * 마일리지 차감
     */
    @Transactional
    public boolean spendMileage(Long userId, int amount, String reason, String details) {
        log.info("마일리지 차감 요청: userId={}, amount={}, reason={}", userId, amount, reason);

        User user = getUserById(userId);
        long currentMileage = user.getMileage() != null ? user.getMileage() : 0L;

        // 잔액 부족 확인
        if (currentMileage < amount) {
            log.warn("마일리지 부족: userId={}, required={}, current={}", userId, amount, currentMileage);
            return false;
        }

        // 마일리지 차감
        user.setMileage(currentMileage - amount);
        userRepository.save(user);

        // 마일리지 거래 내역 저장 (추후 구현)
        // saveMileageTransaction(userId, -amount, "SPENT", reason, details);

        log.info("마일리지 차감 완료: userId={}, newBalance={}", userId, user.getMileage());
        return true;
    }

    /**
     * 게시글 작성 시 마일리지 적립
     */
    @Transactional
    public void awardPostCreation(Long userId, Long postId) {
        awardMileage(userId, MILEAGE_POST_CREATE, "질문 작성", "게시글 ID: " + postId);
    }

    /**
     * 댓글 작성 시 마일리지 적립
     */
    @Transactional
    public void awardReplyCreation(Long userId, Long postId, Long replyId) {
        awardMileage(userId, MILEAGE_REPLY_CREATE, "댓글 작성", 
                "게시글 ID: " + postId + ", 댓글 ID: " + replyId);
    }

    /**
     * 답변 채택 시 마일리지 적립 (질문자와 답변자 모두)
     */
    @Transactional
    public void awardReplyAdoption(Long questionAuthorId, Long replyAuthorId, Long replyId) {
        // 답변자에게 마일리지 적립 (채택됨) +200M
        awardMileage(replyAuthorId, MILEAGE_REPLY_ADOPTED, "답변 채택됨", "댓글 ID: " + replyId);
        
        // 질문자에게도 마일리지 적립 (채택함) +50M
        awardMileage(questionAuthorId, MILEAGE_ADOPT_REPLY, "답변 채택함", "댓글 ID: " + replyId);
    }

    /**
     * 체크리스트 공유 시 마일리지 적립
     */
    @Transactional
    public void awardChecklistShare(Long userId, Long checklistId) {
        awardMileage(userId, MILEAGE_CHECKLIST_SHARE, "체크리스트 공유", 
                "체크리스트 ID: " + checklistId);
    }

    /**
     * 환전 우대 쿠폰 구매 (마일리지 차감)
     */
    @Transactional
    public boolean purchaseExchangeRateCoupon(Long userId, int couponType) {
        int cost = switch (couponType) {
            case 1 -> 1000; // 1% 우대 쿠폰
            case 2 -> 2000; // 2% 우대 쿠폰
            default -> throw new IllegalArgumentException("지원하지 않는 쿠폰 타입입니다.");
        };

        return spendMileage(userId, cost, "환전 우대 쿠폰 구매", 
                "쿠폰 타입: " + couponType + "% 우대");
    }

    /**
     * 보험 할인 쿠폰 구매 (마일리지 차감)
     */
    @Transactional
    public boolean purchaseInsuranceDiscountCoupon(Long userId, int discountPercent) {
        int cost = discountPercent * 100; // 10% 할인 = 1000 마일리지

        return spendMileage(userId, cost, "보험 할인 쿠폰 구매", 
                "할인율: " + discountPercent + "%");
    }

    /**
     * 사용자 마일리지 잔액 조회
     */
    public long getUserMileageBalance(Long userId) {
        User user = getUserById(userId);
        return user.getMileage() != null ? user.getMileage() : 0L;
    }

    /**
     * 마일리지 잔액이 충분한지 확인
     */
    public boolean hasEnoughMileage(Long userId, int requiredAmount) {
        long currentBalance = getUserMileageBalance(userId);
        return currentBalance >= requiredAmount;
    }

    // =========================================================
    // Helper Methods
    // =========================================================

    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
    }

    // 추후 구현할 거래 내역 저장 메서드
    /*
    private void saveMileageTransaction(Long userId, int amount, String type, String reason, String details) {
        MileageTransaction transaction = MileageTransaction.builder()
                .userId(userId)
                .amount(amount)
                .transactionType(type)
                .reason(reason)
                .details(details)
                .createdAt(Instant.now())
                .build();
        
        mileageTransactionRepository.save(transaction);
    }
    */
}
package com.travel0.day0.checklist.repository;

import com.travel0.day0.checklist.domain.UserChecklist;
import com.travel0.day0.common.enums.ChecklistVisibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserChecklistRepository extends JpaRepository<UserChecklist, Long> {

    // 서비스에서 지금 호출하는 시그니처 (페이지네이션 없음)
    List<UserChecklist> findByUserUserIdOrderByCreatedAtDesc(Long userId);

    // 필요하면 페이지네이션 버전도 유지
    Page<UserChecklist> findByUserUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    // 단건 조회 (서비스에서 쓰는 시그니처)
    Optional<UserChecklist> findByUserChecklistIdAndUserUserId(Long userChecklistId, Long userId);

    /**
     * 공유 체크리스트 목록 조회
     */
    @Query("""
        SELECT uc FROM UserChecklist uc 
        JOIN FETCH uc.user u 
        JOIN FETCH uc.departure d 
        LEFT JOIN FETCH d.university univ
        LEFT JOIN FETCH d.programType pt
        WHERE uc.visibility = :visibility
          AND (:countryCode IS NULL OR d.countryCode = :countryCode)
          AND (:universityId IS NULL OR univ.universityId = :universityId)
        ORDER BY uc.createdAt DESC
        """)
    Page<UserChecklist> findSharedChecklists(
            @Param("visibility") ChecklistVisibility visibility,
            @Param("countryCode") String countryCode,
            @Param("universityId") Long universityId,
            Pageable pageable
    );

    /**
     * 공개된 체크리스트 단건 조회
     */
    @Query("""
        SELECT uc FROM UserChecklist uc 
        JOIN FETCH uc.user u 
        JOIN FETCH uc.departure d 
        LEFT JOIN FETCH d.university univ
        LEFT JOIN FETCH d.programType pt
        LEFT JOIN FETCH uc.items items
        WHERE uc.userChecklistId = :checklistId 
          AND uc.visibility = :visibility
        """)
    Optional<UserChecklist> findSharedChecklistById(
            @Param("checklistId") Long checklistId,
            @Param("visibility") ChecklistVisibility visibility
    );
}

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

    // 공유 리스트 조회 (앞에서 만들었던 JPQL)
    @Query("""
        select ucl
        from UserChecklist ucl
        where ucl.visibility = :visibility
          and (:countryCode is null or ucl.departure.countryCode = :countryCode)
          and (:universityId is null or ucl.departure.university.universityId = :universityId)
        order by ucl.createdAt desc
        """)
    Page<UserChecklist> findSharedChecklists(@Param("visibility") ChecklistVisibility visibility,
                                             @Param("countryCode") String countryCode,
                                             @Param("universityId") Long universityId,
                                             Pageable pageable);
}

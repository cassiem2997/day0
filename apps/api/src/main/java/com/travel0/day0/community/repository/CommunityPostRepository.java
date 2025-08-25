package com.travel0.day0.community.repository;

import com.travel0.day0.community.entity.CommunityPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

    // 통계용 (그룹핑)
    @Query("""
        select cp.countryCode, cp.university.universityId, count(cp)
        from CommunityPost cp
        where (:countryCode is null or cp.countryCode = :countryCode)
          and (:universityId is null or cp.university.universityId = :universityId)
        group by cp.countryCode, cp.university.universityId
        """)
    List<Object[]> findGroupStatistics(@Param("countryCode") String countryCode,
                                       @Param("universityId") Long universityId);

    // 필터 검색
    @Query("""
        select cp
        from CommunityPost cp
        where (:countryCode is null or cp.countryCode = :countryCode)
          and (:universityId is null or cp.university.universityId = :universityId)
          and (:category is null or cp.category = :category)
          and (:keyword is null 
               or lower(cp.title) like lower(concat('%', :keyword, '%'))
               or lower(cp.content) like lower(concat('%', :keyword, '%')))
        order by cp.createdAt desc
        """)
    Page<CommunityPost> findPostsWithFilters(@Param("countryCode") String countryCode,
                                             @Param("universityId") Long universityId,
                                             @Param("category") String category,
                                             @Param("keyword") String keyword,
                                             Pageable pageable);
}

package com.travel0.day0.community.repository;

import com.travel0.day0.community.domain.CommunityPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

    /**
     * 검색/필터 통합 조회
     * - keyword: title OR body(캐스팅) LIKE
     * - universityId / countryCode / category: 선택 필터 (null이면 무시)
     * - schema.sql 유지: community_post.title = VARCHAR(200), body = MEDIUMTEXT
     *
     * JPQL에서 CLOB(TEXT)에 lower()를 쓰면 Hibernate가 타입 검증 단계에서 에러가 나므로
     * 네이티브 쿼리 + CAST 로 처리한다.
     */
    @Query(
            value = """
            SELECT
                p.*
            FROM community_post p
            WHERE
                (:keyword IS NULL OR :keyword = ''
                    OR LOWER(p.title) LIKE CONCAT('%', LOWER(:keyword), '%')
                    OR LOWER(CAST(p.body AS CHAR)) LIKE CONCAT('%', LOWER(:keyword), '%')
                )
              AND (:universityId IS NULL OR p.university_id = :universityId)
              AND (:countryCode IS NULL OR p.country_code = :countryCode)
              AND (:category IS NULL OR p.category = :category)
            ORDER BY p.created_at DESC
            """,
            countQuery = """
            SELECT
                COUNT(*)
            FROM community_post p
            WHERE
                (:keyword IS NULL OR :keyword = ''
                    OR LOWER(p.title) LIKE CONCAT('%', LOWER(:keyword), '%')
                    OR LOWER(CAST(p.body AS CHAR)) LIKE CONCAT('%', LOWER(:keyword), '%')
                )
              AND (:universityId IS NULL OR p.university_id = :universityId)
              AND (:countryCode IS NULL OR p.country_code = :countryCode)
              AND (:category IS NULL OR p.category = :category)
            """,
            nativeQuery = true
    )
    Page<CommunityPost> findPostsWithFilters(
            @Param("keyword") String keyword,
            @Param("universityId") Long universityId,
            @Param("countryCode") String countryCode,
            @Param("category") String category,
            Pageable pageable
    );

    /**
     * 그룹별 통계 조회 (국가/대학별 게시글 수 및 멤버 수)
     * CommunityService.getGroups()에서 호출하는 메서드
     */
    @Query(value = """
            SELECT 
                p.country_code as countryCode,
                COALESCE(u.name, '전체') as universityName,
                p.university_id as universityId,
                COUNT(p.post_id) as postCount,
                COUNT(DISTINCT p.user_id) as memberCount
            FROM community_post p
            LEFT JOIN universities u ON p.university_id = u.university_id
            WHERE (:countryCode IS NULL OR p.country_code = :countryCode)
              AND (:universityId IS NULL OR p.university_id = :universityId)
            GROUP BY p.country_code, p.university_id, u.name
            ORDER BY postCount DESC, memberCount DESC
            """, nativeQuery = true)
    List<Object[]> findGroupStatistics(@Param("countryCode") String countryCode, 
                                     @Param("universityId") Long universityId);
}
package com.travel0.day0.community.repository;

import com.travel0.day0.community.domain.CommunityPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

    /**
     * 검색/필터 통합 조회 - 파라미터 순서 수정
     */
    @Query(
            value = """
            SELECT p.*
            FROM community_post p
            WHERE 
                (:keyword IS NULL OR :keyword = '' 
                    OR LOWER(p.title) LIKE CONCAT('%', LOWER(:keyword), '%')
                    OR LOWER(CAST(p.body AS CHAR)) LIKE CONCAT('%', LOWER(:keyword), '%')
                )
              AND (:countryCode IS NULL OR p.country_code = :countryCode)
              AND (:universityId IS NULL OR p.university_id = :universityId)  
              AND (:category IS NULL OR p.category = :category)
            ORDER BY p.created_at DESC
            """,
            countQuery = """
            SELECT COUNT(*)
            FROM community_post p
            WHERE 
                (:keyword IS NULL OR :keyword = ''
                    OR LOWER(p.title) LIKE CONCAT('%', LOWER(:keyword), '%')
                    OR LOWER(CAST(p.body AS CHAR)) LIKE CONCAT('%', LOWER(:keyword), '%')
                )
              AND (:countryCode IS NULL OR p.country_code = :countryCode)
              AND (:universityId IS NULL OR p.university_id = :universityId)
              AND (:category IS NULL OR p.category = :category)
            """,
            nativeQuery = true
    )
    Page<CommunityPost> findPostsWithFilters(
            @Param("keyword") String keyword,
            @Param("countryCode") String countryCode,
            @Param("universityId") Long universityId,
            @Param("category") String category,
            Pageable pageable
    );

    /**
     * 그룹 통계 조회 메서드 추가
     */
    @Query(
            value = """
            SELECT 
                COALESCE(p.country_code, 'ALL') as country_code,
                COALESCE(u.name, '전체') as university_name,
                p.university_id,
                COUNT(p.post_id) as post_count,
                COUNT(DISTINCT p.user_id) as member_count
            FROM community_post p
            LEFT JOIN universities u ON p.university_id = u.university_id
            WHERE (:countryCode IS NULL OR p.country_code = :countryCode)
              AND (:universityId IS NULL OR p.university_id = :universityId)
            GROUP BY p.country_code, p.university_id, u.name
            HAVING COUNT(p.post_id) > 0
            ORDER BY post_count DESC
            """,
            nativeQuery = true
    )
    List<Object[]> findGroupStatistics(
            @Param("countryCode") String countryCode,
            @Param("universityId") Long universityId
    );

    /**
     * 간단한 게시글 목록 조회 (fallback용)
     */
    @Query("SELECT p FROM CommunityPost p WHERE " +
            "(:countryCode IS NULL OR p.countryCode = :countryCode) AND " +
            "(:universityId IS NULL OR p.university.universityId = :universityId) AND " +
            "(:category IS NULL OR p.category = :category)")
    Page<CommunityPost> findPostsSimple(
            @Param("countryCode") String countryCode,
            @Param("universityId") Long universityId,
            @Param("category") String category,
            Pageable pageable
    );
}
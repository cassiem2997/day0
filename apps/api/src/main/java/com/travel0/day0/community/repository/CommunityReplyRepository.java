package com.travel0.day0.community.repository;

import com.travel0.day0.community.domain.CommunityReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommunityReplyRepository extends JpaRepository<CommunityReply, Long> {

    // 특정 게시글의 댓글 목록 (JPA 네이밍 컨벤션)
    List<CommunityReply> findByPostPostIdOrderByCreatedAtAsc(Long postId);
    
    // 댓글 수 조회
    Long countByPostPostId(Long postId);
    
    // 특정 사용자의 댓글 목록
    List<CommunityReply> findByUserUserIdOrderByCreatedAtDesc(Long userId);
    
    // 채택된 답변 조회 (JPA가 자동으로 WHERE is_adopted = true 쿼리 생성)
    Optional<CommunityReply> findByPostPostIdAndIsAdoptedTrue(Long postId);
    
    // 채택된 답변 존재 여부 확인
    boolean existsByPostPostIdAndIsAdoptedTrue(Long postId);
    
    // 특정 사용자가 채택받은 답변 수
    Long countByUserUserIdAndIsAdoptedTrue(Long userId);
}

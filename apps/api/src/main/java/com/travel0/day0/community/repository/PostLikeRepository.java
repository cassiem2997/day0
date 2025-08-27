package com.travel0.day0.community.repository;

import com.travel0.day0.community.domain.PostLike;
import com.travel0.day0.community.domain.PostLikeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, PostLikeId> {

    // 특정 게시글의 좋아요 수
    Long countByPostPostId(Long postId);

    // 특정 사용자가 특정 게시글에 좋아요를 눌렀는지 확인
    boolean existsByPostPostIdAndUserUserId(Long postId, Long userId);

    // 특정 사용자가 좋아요한 게시글들
    List<PostLike> findByUserUserIdOrderByCreatedAtDesc(Long userId);

    // 특정 게시글을 좋아요한 사용자들
    List<PostLike> findByPostPostIdOrderByCreatedAtDesc(Long postId);

    // 특정 사용자의 총 좋아요 수
    Long countByUserUserId(Long userId);
}

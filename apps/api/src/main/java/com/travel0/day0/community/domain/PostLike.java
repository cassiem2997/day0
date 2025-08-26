//package com.travel0.day0.community.domain;
//
//import com.travel0.day0.users.domain.User;
//import jakarta.persistence.*;
//import lombok.*;
//import java.io.*;
//import java.time.Instant;
//
//@Entity
//@Table(name = "post_like")
//@Getter
//@Setter
//@NoArgsConstructor
//@AllArgsConstructor
//@Builder
//public class PostLike {
//
//    @EmbeddedId
//    private PostLikeId id;
//
//    @ManyToOne(fetch = FetchType.LAZY, optional = false)
//    @MapsId("postId")
//    @JoinColumn(name = "post_id", nullable = false)
//    private CommunityPost post;
//
//    @ManyToOne(fetch = FetchType.LAZY, optional = false)
//    @MapsId("userId")
//    @JoinColumn(name = "user_id", nullable = false)
//    private User user;
//
//    @Column(name = "created_at", nullable = false, updatable = false,
//            columnDefinition = "TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3)")
//    private Instant createdAt;
//
//}

//package com.travel0.day0.community.domain;
//
//import com.travel0.day0.users.domain.University;
//import com.travel0.day0.users.domain.User;
//import jakarta.persistence.*;
//import lombok.*;
//import java.time.*;
//
//@Entity
//@Table(name = "community_post")
//@Getter
//@Setter
//@NoArgsConstructor
//@AllArgsConstructor
//@Builder
//public class CommunityPost {
//
//    @Id
//    @GeneratedValue(strategy = GenerationType.IDENTITY)
//    @Column(name = "post_id")
//    private Long postId;
//
//    @ManyToOne(fetch = FetchType.LAZY, optional = false)
//    @JoinColumn(name = "user_id", nullable = false)
//    private User user;
//
//    @Column(name = "country_code", length = 2)
//    private String countryCode;
//
//    @ManyToOne(fetch = FetchType.LAZY)
//    @JoinColumn(name = "university_id")
//    private University university;
//
//    @Column(nullable = false, length = 200)
//    private String title;
//
//    @Lob
//    @Column(nullable = false, columnDefinition = "MEDIUMTEXT")
//    private String body;
//
//    @Column(length = 50)
//    private String category;
//
//    @Column(name = "created_at", nullable = false, updatable = false,
//            columnDefinition = "TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3)")
//    private Instant createdAt;
//
//    @Column(name = "updated_at", nullable = false,
//            columnDefinition = "TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)")
//    private Instant updatedAt;
//
//}

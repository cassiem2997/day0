package com.travel0.day0.checklist.domain;

import com.travel0.day0.common.enums.ChecklistTag;
import com.travel0.day0.users.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "ai_recommendations",
        indexes = {
                @Index(name = "idx_user_recommendations", columnList = "user_id, created_at"),
                @Index(name = "idx_checklist_recommendations", columnList = "user_checklist_id, created_at"),
                @Index(name = "idx_applied", columnList = "is_applied, confidence_score")
        })
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AiRecommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rec_id")
    private Long recId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_checklist_id", nullable = false)
    private UserChecklist userChecklist;

    // 추천 항목 정보
    @Column(name = "recommended_item_title", nullable = false, length = 150)
    private String recommendedItemTitle;

    @Column(name = "recommended_item_description", columnDefinition = "TEXT")
    private String recommendedItemDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "recommended_tag")
    @Builder.Default
    private ChecklistTag recommendedTag = ChecklistTag.NONE;

    @Column(name = "recommended_offset_days")
    private Integer recommendedOffsetDays;

    @Column(name = "recommended_amount", precision = 18, scale = 2)
    private BigDecimal recommendedAmount;

    // AI 분석 결과
    @Column(name = "confidence_score", nullable = false, precision = 5, scale = 4)
    private BigDecimal confidenceScore;

    @Column(name = "reason_text", length = 200)
    private String reasonText;

    // 사용자 반응
    @Column(name = "is_applied")
    @Builder.Default
    private Boolean isApplied = false;

    @Column(name = "is_dismissed")
    @Builder.Default
    private Boolean isDismissed = false;

    @Column(name = "applied_at")
    private Instant appliedAt;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;
}

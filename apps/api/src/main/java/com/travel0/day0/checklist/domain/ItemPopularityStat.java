package com.travel0.day0.checklist.domain;

import com.travel0.day0.common.enums.ChecklistTag;
import com.travel0.day0.users.domain.ProgramType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "item_popularity_stats",
        indexes = {
                @Index(name = "idx_country_program",
                        columnList = "country_code, program_type_id, popularity_rate DESC")
        })
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ItemPopularityStat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stat_id")
    private Long statId;

    @Column(name = "country_code", nullable = false, length = 2)
    private String countryCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "program_type_id", nullable = false)
    private ProgramType programType;

    @Column(name = "item_title", nullable = false, length = 150)
    private String itemTitle;

    @Column(name = "item_description", columnDefinition = "TEXT")
    private String itemDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_tag")
    @Builder.Default
    private ChecklistTag itemTag = ChecklistTag.NONE;

    @Column(name = "popularity_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal popularityRate;

    @Column(name = "avg_offset_days", nullable = false)
    private Integer avgOffsetDays;

    @Column(name = "priority_score", nullable = false)
    @Builder.Default
    private Integer priorityScore = 5;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;
}

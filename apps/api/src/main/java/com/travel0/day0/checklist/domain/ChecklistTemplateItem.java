package com.travel0.day0.checklist.domain;

import com.travel0.day0.common.enums.ChecklistTag;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "checklist_template_item")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ChecklistTemplateItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "template_item_id")
    private Long templateItemId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "template_id",
            foreignKey = @ForeignKey(name = "fk_titem_tpl"),
            nullable = false)
    private ChecklistTemplate template;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "offset_days", nullable = false)
    @Builder.Default
    private Integer offsetDays = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "tag", nullable = false)
    @Builder.Default
    private ChecklistTag tag = ChecklistTag.NONE;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}

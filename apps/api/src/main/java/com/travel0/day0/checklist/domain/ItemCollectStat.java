package com.travel0.day0.checklist.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.Instant;

@Entity
@Table(name = "item_collect_stat",
        indexes = {
                @Index(name = "idx_item_collect_count", columnList = "template_item_id, collect_count DESC"),
                @Index(name = "idx_checklist_popularity", columnList = "source_checklist_id, collect_count DESC")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemCollectStat {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long statId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_checklist_id", nullable = false)
    private UserChecklist sourceChecklist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_item_id")
    private ChecklistTemplateItem templateItem;

    @Column(name = "item_title", nullable = false)
    private String itemTitle;

    @Column(name = "collect_count", nullable = false)
    @Builder.Default
    private Integer collectCount = 0;

    @CreationTimestamp
    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
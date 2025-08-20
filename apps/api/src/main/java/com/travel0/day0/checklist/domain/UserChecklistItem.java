package com.travel0.day0.checklist.domain;

import com.travel0.day0.common.enums.ChecklistItemStatus;
import com.travel0.day0.common.enums.ChecklistTag;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "user_checklist_item",
        indexes = {
                @Index(name = "idx_uci_progress", columnList = "user_checklist_id, status, due_date"),
                @Index(name = "idx_uci_due", columnList = "due_date")
        })
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserChecklistItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "uci_id")
    private Long uciId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_checklist_id",
            foreignKey = @ForeignKey(name = "fk_uci_ucl"),
            nullable = false)
    private UserChecklist userChecklist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_item_id",
            foreignKey = @ForeignKey(name = "fk_uci_titem"))
    private ChecklistTemplateItem templateItem;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "due_date")
    private Instant dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private ChecklistItemStatus status = ChecklistItemStatus.TODO;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "tag", nullable = false)
    @Builder.Default
    private ChecklistTag tag = ChecklistTag.NONE;

    @Column(name = "linked_amount", precision = 18, scale = 2)
    private BigDecimal linkedAmount;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}

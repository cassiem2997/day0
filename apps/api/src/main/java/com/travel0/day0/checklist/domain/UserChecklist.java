package com.travel0.day0.checklist.domain;

import com.travel0.day0.common.enums.ChecklistVisibility;
import com.travel0.day0.users.domain.DepartureInfo;
import com.travel0.day0.users.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "user_checklist",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_ucl_user_dep_tpl",
                columnNames = {"user_id", "departure_id", "template_id"}
        ),
        indexes = {
                @Index(name = "idx_ucl_user_dep", columnList = "user_id, departure_id, created_at")
        })
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class UserChecklist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_checklist_id")
    private Long userChecklistId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id",
            foreignKey = @ForeignKey(name = "fk_ucl_user"),
            nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "departure_id",
            foreignKey = @ForeignKey(name = "fk_ucl_dep"),
            nullable = false)
    private DepartureInfo departure;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id",
            foreignKey = @ForeignKey(name = "fk_ucl_tpl"))
    private ChecklistTemplate template;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(name = "visibility", nullable = false)
    @Builder.Default
    private ChecklistVisibility visibility = ChecklistVisibility.PUBLIC;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}

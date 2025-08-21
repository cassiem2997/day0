package com.travel0.day0.deparatures.domain;

import com.travel0.day0.common.enums.DepartureStatus;
import com.travel0.day0.users.domain.ProgramType;
import com.travel0.day0.users.domain.University;
import com.travel0.day0.users.domain.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "departure_info",
        indexes = {
                @Index(name = "idx_dep_user_dates", columnList = "user_id, start_date"),
                @Index(name = "idx_dep_country_dates", columnList = "country_code, start_date"),
                @Index(name = "idx_dep_status_dates", columnList = "status, start_date")
        })
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class DepartureInfo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "departure_id")
    private Long departureId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id",
            foreignKey = @ForeignKey(name = "fk_dep_user"),
            nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "university_id",
            foreignKey = @ForeignKey(name = "fk_dep_univ"))
    private University university; // 목적지 대학

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "program_type_id",
            foreignKey = @ForeignKey(name = "fk_dep_progtype"))
    private ProgramType programType;

    @Column(name = "country_code", nullable = false, length = 2)
    private String countryCode;

    @Column(name = "start_date", nullable = false)
    private Instant startDate;

    @Column(name = "end_date")
    private Instant endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private DepartureStatus status = DepartureStatus.PLANNED;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
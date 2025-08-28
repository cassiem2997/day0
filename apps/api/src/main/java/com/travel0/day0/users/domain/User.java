package com.travel0.day0.users.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.travel0.day0.common.enums.DepartureStatus;
import com.travel0.day0.common.enums.Gender;
import com.travel0.day0.departures.domain.DepartureInfo;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "nickname", nullable = false, length = 50)
    private String nickname;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private Gender gender;

    @Column(name = "birth")
    private LocalDate birth;

    @Column(name = "profile_image", length = 500)
    private String profileImage;

    @Column(name = "mileage", nullable = false)
    @Builder.Default
    private Long mileage = 0L;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "home_university_id", foreignKey = @ForeignKey(name = "fk_user_home"))
    @JsonIgnore
    private University homeUniversity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dest_university_id", foreignKey = @ForeignKey(name = "fk_user_dest"))
    @JsonIgnore
    private University destUniversity;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "user_key",unique = true, length = 64)
    private String userKey;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY)
    private List<DepartureInfo> departureInfos;

    public DepartureInfo getCurrentDepartureInfo() {
        return departureInfos.stream()
                .filter(dep -> dep.getStatus() == DepartureStatus.PLANNED)
                .findFirst()
                .orElse(null);
    }
}

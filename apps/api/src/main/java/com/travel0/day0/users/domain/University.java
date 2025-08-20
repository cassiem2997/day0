package com.travel0.day0.users.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "universities",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_univ",
                columnNames = {"country_code", "name"}
        ))
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class University {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "university_id")
    private Long universityId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "country_code", nullable = false, length = 2)
    private String countryCode;

    @Column(name = "email", length = 255)
    private String email;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "homeUniversity", fetch = FetchType.LAZY)
    private List<User> homeUsers = new ArrayList<>();

    @OneToMany(mappedBy = "destUniversity", fetch = FetchType.LAZY)
    private List<User> destUsers = new ArrayList<>();
}

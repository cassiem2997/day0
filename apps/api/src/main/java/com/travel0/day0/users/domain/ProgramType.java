package com.travel0.day0.users.domain;

import com.travel0.day0.common.enums.ProgramTypeCode;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "program_type")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ProgramType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "program_type_id")
    private Long programTypeId;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private ProgramTypeCode code;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @OneToMany(mappedBy = "programType", fetch = FetchType.LAZY)
    @Builder.Default
    private List<DepartureInfo> departureInfos = new ArrayList<>();
}

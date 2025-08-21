package com.travel0.day0.users.repository;

import com.travel0.day0.users.domain.University;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UniversityRepository extends JpaRepository<University, Long> {
}

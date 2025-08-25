package com.travel0.day0.checklist.repository;

import com.travel0.day0.checklist.domain.ChecklistTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChecklistTemplateRepository extends JpaRepository<ChecklistTemplate, Long> {
    @Query("SELECT t FROM ChecklistTemplate t " +
            "WHERE t.countryCode = :countryCode " +
            "AND t.university.universityId = :universityId " +
            "ORDER BY t.createdAt DESC")
    Optional<ChecklistTemplate> findByCountryCodeAndUniversityOrderByCreatedAtDesc(String countryCode, Long universityId);

    @Query("SELECT t FROM ChecklistTemplate t " +
            "WHERE t.countryCode = :countryCode " +
            "AND t.university IS NULL " +
            "ORDER BY t.createdAt DESC")
    Optional<ChecklistTemplate> findByCountryCodeOnlyOrderByCreatedAtDesc(String countryCode);
}

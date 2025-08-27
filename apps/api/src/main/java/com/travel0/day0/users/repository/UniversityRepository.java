package com.travel0.day0.users.repository;

import com.travel0.day0.users.domain.University;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface UniversityRepository extends JpaRepository<University, Long> {
    List<University> findByCountryCodeOrderByName(String countryCode);

    @Query("SELECT DISTINCT u.countryCode FROM University u")
    List<String> findDistinctCountries();
}

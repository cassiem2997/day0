package com.travel0.day0.users.service;

import com.travel0.day0.users.domain.University;
import com.travel0.day0.users.dto.CountryResponse;
import com.travel0.day0.users.dto.UniversityResponse;
import com.travel0.day0.users.repository.UniversityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UniversityService {
    private final UniversityRepository universityRepository;

    public List<UniversityResponse> getUniversitiesByCountryCode(String countryCode) {
        return universityRepository.findByCountryCodeOrderByName(countryCode).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<CountryResponse> getAvailableCountries() {
        return universityRepository.findDistinctCountries().stream()
                .map(this::convertToCountryResponse)
                .sorted(Comparator.comparing(country -> country.getCountryName()))
                .collect(Collectors.toList());
    }

    private UniversityResponse convertToDto(University university) {
        return new UniversityResponse(
                university.getUniversityId(),
                university.getName()
        );
    }

    private CountryResponse convertToCountryResponse(String countryCode) {
        String countryName = getCountryName(countryCode);
        return new CountryResponse(countryCode, countryName);
    }

    private String getCountryName(String countryCode) {
        try {
            Locale locale = new Locale("", countryCode);
            return locale.getDisplayCountry(Locale.KOREAN);
        } catch (Exception e) {
            return countryCode;
        }
    }
}

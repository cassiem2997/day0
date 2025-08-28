package com.travel0.day0.fx.repository;

import com.travel0.day0.fx.domain.ExchangeRateHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ExchangeRateHistoryRepository extends JpaRepository<ExchangeRateHistory, Long> {

    @Query("SELECT h FROM ExchangeRateHistory h " +
            "WHERE h.quoteCcy = :currency " +
            "ORDER BY h.createdAt DESC")
    List<ExchangeRateHistory> findByQuoteCcyOrderByCreatedAtDesc(
            @Param("currency") String currency,
            Pageable pageable);

    @Query("SELECT h FROM ExchangeRateHistory h " +
            "WHERE h.quoteCcy = :currency " +
            "AND h.rateDate >= :fromDate " +
            "ORDER BY h.createdAt DESC")
    List<ExchangeRateHistory> findByQuoteCcyAndRateDateAfterOrderByCreatedAtDesc(
            @Param("currency") String currency,
            @Param("fromDate") LocalDate fromDate);

    List<ExchangeRateHistory> findByQuoteCcyAndRateDateBetweenOrderByRateDate(String upperCase, LocalDate startDate, LocalDate endDate);

    Optional<ExchangeRateHistory> findByQuoteCcyAndRateDate(String currency, LocalDate today);
}
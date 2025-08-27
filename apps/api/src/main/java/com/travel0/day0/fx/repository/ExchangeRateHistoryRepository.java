package com.travel0.day0.fx.repository;

import com.travel0.day0.fx.domain.ExchangeRateHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExchangeRateHistoryRepository extends JpaRepository<ExchangeRateHistory, Long> {
    List<ExchangeRateHistory> findByQuoteCcyAndRateDateBetweenOrderByRateDate(
            String quoteCcy, LocalDate startDate, LocalDate endDate);

    Optional<ExchangeRateHistory> findByQuoteCcyAndRateDate(String quoteCcy, LocalDate rateDate);

    @Query("SELECT DISTINCT h.quoteCcy FROM ExchangeRateHistory h ORDER BY h.quoteCcy")
    List<String> findAllDistinctCurrencies();
}

package com.travel0.day0.checklist.repository;

import com.travel0.day0.checklist.domain.ItemCollectStat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ItemCollectStatRepository extends JpaRepository<ItemCollectStat, Long> {

    @Query("SELECT ics FROM ItemCollectStat ics WHERE ics.sourceChecklist.userChecklistId = :checklistId AND ics.itemTitle = :itemTitle")
    Optional<ItemCollectStat> findBySourceChecklistIdAndItemTitle(@Param("checklistId") Long checklistId, @Param("itemTitle") String itemTitle);

    @Modifying
    @Query("UPDATE ItemCollectStat ics SET ics.collectCount = ics.collectCount + 1, ics.updatedAt = CURRENT_TIMESTAMP WHERE ics.statId = :statId")
    void incrementCollectCount(@Param("statId") Long statId);

    @Query("SELECT SUM(ics.collectCount) FROM ItemCollectStat ics WHERE ics.sourceChecklist.userChecklistId = :checklistId")
    Long getTotalCollectCountByChecklistId(@Param("checklistId") Long checklistId);

    @Query("SELECT ics.sourceChecklist.userChecklistId, SUM(ics.collectCount) as totalCollects FROM ItemCollectStat ics WHERE ics.sourceChecklist.visibility = 'PUBLIC' GROUP BY ics.sourceChecklist.userChecklistId ORDER BY totalCollects DESC")
    List<Object[]> findPopularChecklists();
}
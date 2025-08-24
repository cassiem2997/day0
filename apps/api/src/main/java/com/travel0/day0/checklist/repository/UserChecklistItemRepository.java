package com.travel0.day0.checklist.repository;

import com.travel0.day0.checklist.domain.UserChecklistItem;
import com.travel0.day0.common.enums.ChecklistItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserChecklistItemRepository extends JpaRepository<UserChecklistItem, Long> {
    @Query("SELECT i FROM UserChecklistItem i " +
            "WHERE i.userChecklist.userChecklistId = :checklistId " +
            "ORDER BY i.dueDate ASC NULLS LAST, i.createdAt ASC")
    List<UserChecklistItem> findAllItemsByChecklistId(Long checklistId);

    @Query("SELECT i FROM UserChecklistItem i " +
            "WHERE i.userChecklist.userChecklistId = :checklistId " +
            "AND i.status = 'TODO' " +
            "ORDER BY " +
            "CASE WHEN i.dueDate IS NULL THEN 1 ELSE 0 END, " +
            "i.dueDate ASC, " +
            "i.createdAt ASC")
    List<UserChecklistItem> findTodoItemsByChecklistId(Long checklistId);

    Optional<UserChecklistItem> findByUciIdAndUserChecklistUserUserId(Long itemId, Long userId);

    @Query("SELECT i FROM UserChecklistItem i " +
            "WHERE i.userChecklist.userChecklistId = :checklistId " +
            "AND i.isFixed = true " +
            "AND i.dueDate IS NOT NULL " +
            "ORDER BY i.dueDate ASC")
    List<UserChecklistItem> findFixedItemsByChecklistId(Long checklistId);

    @Query("SELECT uci FROM UserChecklistItem uci " +
            "WHERE uci.userChecklist.userChecklistId = :checklistId " +
            "ORDER BY uci.dueDate ASC NULLS LAST")
    List<UserChecklistItem> findByUserChecklistUserChecklistIdOrderByDueDateAscNullsLast(Long checklistId);

    @Query("SELECT i FROM UserChecklistItem i " +
            "WHERE i.userChecklist.userChecklistId = :checklistId " +
            "AND (:status IS NULL OR i.status = :status) " +
            "AND (:dueBefore IS NULL OR i.dueDate <= :dueBefore) " +
            "ORDER BY i.dueDate ASC NULLS LAST, i.createdAt ASC")
    List<UserChecklistItem> findItemsWithFilters(Long checklistId, ChecklistItemStatus status,Instant dueBefore);
}
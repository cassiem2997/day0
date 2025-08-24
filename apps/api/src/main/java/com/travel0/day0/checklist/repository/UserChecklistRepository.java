package com.travel0.day0.checklist.repository;

import com.travel0.day0.checklist.domain.UserChecklist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserChecklistRepository extends JpaRepository<UserChecklist, Long> {
    @Query("SELECT uc FROM UserChecklist uc " +
            "WHERE uc.user.userId = :userId " +
            "ORDER BY uc.createdAt DESC")
    List<UserChecklist> findByUserUserIdOrderByCreatedAtDesc(Long userId);

    Optional<UserChecklist> findByUserChecklistIdAndUserUserId(Long checklistId, Long userId);
}


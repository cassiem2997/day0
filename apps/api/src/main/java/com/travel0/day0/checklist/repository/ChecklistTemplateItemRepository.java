package com.travel0.day0.checklist.repository;

import com.travel0.day0.checklist.domain.ChecklistTemplateItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChecklistTemplateItemRepository extends JpaRepository<ChecklistTemplateItem, Long> {
    List<ChecklistTemplateItem> findByTemplateTemplateIdOrderByOffsetDaysAsc(Long templateId);
}

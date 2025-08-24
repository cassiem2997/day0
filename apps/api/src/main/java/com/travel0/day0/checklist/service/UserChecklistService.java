package com.travel0.day0.checklist.service;

import com.travel0.day0.checklist.domain.ChecklistTemplate;
import com.travel0.day0.checklist.domain.ChecklistTemplateItem;
import com.travel0.day0.checklist.domain.UserChecklist;
import com.travel0.day0.checklist.domain.UserChecklistItem;
import com.travel0.day0.checklist.dto.*;
import com.travel0.day0.checklist.repository.ChecklistTemplateItemRepository;
import com.travel0.day0.checklist.repository.ChecklistTemplateRepository;
import com.travel0.day0.checklist.repository.UserChecklistItemRepository;
import com.travel0.day0.checklist.repository.UserChecklistRepository;
import com.travel0.day0.common.enums.ChecklistItemStatus;
import com.travel0.day0.departures.domain.DepartureInfo;
import com.travel0.day0.departures.repository.DepartureInfoRepository;
import com.travel0.day0.users.domain.User;
import com.travel0.day0.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserChecklistService {
    private final ChecklistTemplateRepository templateRepository;
    private final ChecklistTemplateItemRepository templateItemRepository;
    private final UserChecklistRepository userChecklistRepository;
    private final UserChecklistItemRepository userChecklistItemRepository;
    private final UserRepository userRepository;
    private final DepartureInfoRepository departureInfoRepository;

    @Transactional
    public UserChecklistResponse createUserChecklistFromTemplate(Long userId, CreateUserChecklistRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        DepartureInfo departure = departureInfoRepository.findById(request.getDepartureId())
                .orElseThrow(() -> new IllegalArgumentException("출국 정보를 찾을 수 없습니다."));

        ChecklistTemplate template = findTemplate(departure);

        UserChecklist userChecklist = UserChecklist.builder()
                .user(user)
                .departure(departure)
                .template(template)
                .title(request.getTitle())
                .visibility(request.getVisibility())
                .build();

        userChecklist = userChecklistRepository.save(userChecklist);

        if (template != null) {
            List<ChecklistTemplateItem> templateItems = templateItemRepository
                    .findByTemplateTemplateIdOrderByOffsetDaysAsc(template.getTemplateId());

            for (ChecklistTemplateItem templateItem : templateItems) {
                Instant dueDate = null;
                if (departure.getStartDate() != null && templateItem.getOffsetDays() != null) {
                    dueDate = departure.getStartDate().minusSeconds(templateItem.getOffsetDays() * 24 * 60 * 60);
                }

                UserChecklistItem userItem = UserChecklistItem.builder()
                        .userChecklist(userChecklist)
                        .templateItem(templateItem)
                        .title(templateItem.getTitle())
                        .description(templateItem.getDescription())
                        .dueDate(dueDate)
                        .status(ChecklistItemStatus.TODO)
                        .tag(templateItem.getTag())
                        .linkedAmount(templateItem.getDefaultAmount())
                        .build();

                userChecklistItemRepository.save(userItem);
            }
        }

        return getUserChecklistById(userChecklist.getUserChecklistId(), userId);
    }

    private ChecklistTemplate findTemplate(DepartureInfo departure) {
        String countryCode = departure.getCountryCode();

        if (departure.getUniversity() != null) {
            Optional<ChecklistTemplate> exactMatch = templateRepository
                    .findByCountryCodeAndUniversityOrderByCreatedAtDesc(countryCode, departure.getUniversity().getUniversityId());
            if (exactMatch.isPresent()) {
                return exactMatch.get();
            }
        }

        Optional<ChecklistTemplate> countryMatch = templateRepository
                .findByCountryCodeOnlyOrderByCreatedAtDesc(countryCode);
        return countryMatch.orElse(null);
    }

    public List<UserChecklistResponse> getUserChecklists(Long userId) {
        return userChecklistRepository.findByUserUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::convertToResponse).toList();
    }

    public UserChecklistResponse getUserChecklistById(Long checklistId, Long userId) {
        UserChecklist checklist = userChecklistRepository.findByUserChecklistIdAndUserUserId(checklistId, userId)
                .orElseThrow(() -> new IllegalArgumentException("체크리스트를 찾을 수 없습니다."));

        UserChecklistResponse response = convertToResponse(checklist);
        List<UserChecklistItemResponse> items = userChecklistItemRepository
                .findByUserChecklistUserChecklistIdOrderByDueDateAscNullsLast(checklistId)
                .stream()
                .map(this::convertToItemResponse)
                .collect(Collectors.toList());
        response.setItems(items);

        return response;
    }

    @Transactional
    public void deleteUserChecklist(Long checklistId, Long userId) {
        UserChecklist checklist = userChecklistRepository.findByUserChecklistIdAndUserUserId(checklistId, userId)
                .orElseThrow(() -> new IllegalArgumentException("User checklist not found"));

        userChecklistRepository.delete(checklist);
    }

    @Transactional
    public UserChecklistResponse updateUserChecklist(Long checklistId, Long userId, UpdateUserChecklistRequest request) {
        UserChecklist checklist = userChecklistRepository.findByUserChecklistIdAndUserUserId(checklistId, userId)
                .orElseThrow(() -> new IllegalArgumentException("User checklist not found"));

        if (request.getTitle() != null) {
            checklist.setTitle(request.getTitle());
        }
        if (request.getVisibility() != null) {
            checklist.setVisibility(request.getVisibility());
        }

        checklist = userChecklistRepository.save(checklist);
        return convertToResponse(checklist);
    }

    public List<UserChecklistItemResponse> getAllUserChecklistItems(Long checklistId) {
        return userChecklistItemRepository.findAllItemsByChecklistId(checklistId)
                .stream().map(this::convertToItemResponse).toList();
    }

    public List<UserChecklistItemResponse> getTodoUserChecklistItems(Long checklistId) {
        return userChecklistItemRepository.findTodoItemsByChecklistId(checklistId)
                .stream().map(this::convertToItemResponse).toList();
    }

    public UserChecklistItemResponse getUserChecklistItemById(Long itemId, Long userId) {
        UserChecklistItem item = userChecklistItemRepository.findByUciIdAndUserChecklistUserUserId(itemId, userId)
                .orElseThrow(() -> new IllegalArgumentException("User checklist item not found"));

        return convertToItemResponse(item);
    }

    public List<UserChecklistItemResponse> getUserChecklistItems(Long checklistId, ChecklistItemStatus status, Instant dueBefore) {
        return userChecklistItemRepository.findItemsWithFilters(checklistId, status, dueBefore)
                .stream().map(this::convertToItemResponse).toList();
    }

    @Transactional
    public UserChecklistItemResponse createUserChecklistItem(Long checklistId, Long userId, CreateUserChecklistItemRequest request) {
        UserChecklist checklist = userChecklistRepository.findByUserChecklistIdAndUserUserId(checklistId, userId)
                .orElseThrow(() -> new IllegalArgumentException("User checklist not found"));

        UserChecklistItem item = UserChecklistItem.builder()
                .userChecklist(checklist)
                .title(request.getTitle())
                .dueDate(request.getDueDate())
                .status(ChecklistItemStatus.TODO)
                .tag(request.getTag())
                .linkedAmount(request.getLinkedAmount())
                .build();

        item = userChecklistItemRepository.save(item);
        return convertToItemResponse(item);
    }

    @Transactional
    public UserChecklistItemResponse updateUserChecklistItem(Long itemId, Long userId, UpdateUserChecklistItemRequest request) {
        UserChecklistItem item = userChecklistItemRepository.findByUciIdAndUserChecklistUserUserId(itemId, userId)
                .orElseThrow(() -> new IllegalArgumentException("User checklist item not found"));

        if (request.getTitle() != null) {
            item.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            item.setDescription(request.getDescription());
        }
        if (request.getDueDate() != null) {
            item.setDueDate(request.getDueDate());
        }
        if (request.getStatus() != null) {
            item.setStatus(request.getStatus());
            if (request.getStatus() == ChecklistItemStatus.DONE) {
                item.setCompletedAt(Instant.now());
            } else {
                item.setCompletedAt(null);
            }
        }
        if (request.getTag() != null) {
            item.setTag(request.getTag());
        }
        if (request.getLinkedAmount() != null) {
            item.setLinkedAmount(request.getLinkedAmount());
        }
        if(request.getIsFixed() != null){
            item.setIsFixed(request.getIsFixed());
        }

        item = userChecklistItemRepository.save(item);
        return convertToItemResponse(item);
    }

    @Transactional
    public void deleteUserChecklistItem(Long itemId, Long userId) {
        UserChecklistItem item = userChecklistItemRepository.findByUciIdAndUserChecklistUserUserId(itemId, userId)
                .orElseThrow(() -> new IllegalArgumentException("User checklist item not found"));

        userChecklistItemRepository.delete(item);
    }

    public List<UserChecklistItemResponse> getFixedItemsForCalendar(Long checklistId, Long userId) {
        userChecklistRepository.findByUserChecklistIdAndUserUserId(checklistId, userId)
                .orElseThrow(() -> new IllegalArgumentException("User checklist not found"));

        List<UserChecklistItem> fixedItems = userChecklistItemRepository.findFixedItemsByChecklistId(checklistId);
        return fixedItems.stream()
                .map(this::convertToItemResponse)
                .collect(Collectors.toList());
    }

    private UserChecklistResponse convertToResponse(UserChecklist checklist) {
        return UserChecklistResponse.builder()
                .userChecklistId(checklist.getUserChecklistId())
                .userId(checklist.getUser().getUserId())
                .departureId(checklist.getDeparture().getDepartureId())
                .templateId(checklist.getTemplate() != null ? checklist.getTemplate().getTemplateId() : null)
                .title(checklist.getTitle())
                .visibility(checklist.getVisibility())
                .createdAt(checklist.getCreatedAt())
                .build();
    }

    private UserChecklistItemResponse convertToItemResponse(UserChecklistItem item) {
        return UserChecklistItemResponse.builder()
                .uciId(item.getUciId())
                .userChecklistId(item.getUserChecklist().getUserChecklistId())
                .templateItemId(item.getTemplateItem() != null ? item.getTemplateItem().getTemplateItemId() : null)
                .title(item.getTitle())
                .description(item.getDescription())
                .dueDate(item.getDueDate())
                .status(item.getStatus())
                .completedAt(item.getCompletedAt())
                .tag(item.getTag())
                .linkedAmount(item.getLinkedAmount())
                .isFixed(item.getIsFixed())
                .createdAt(item.getCreatedAt())
                .build();
    }
}

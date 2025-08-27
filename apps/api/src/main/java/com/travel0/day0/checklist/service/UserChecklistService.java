package com.travel0.day0.checklist.service;

import com.travel0.day0.checklist.domain.ChecklistTemplate;
import com.travel0.day0.checklist.domain.ChecklistTemplateItem;
import com.travel0.day0.checklist.domain.UserChecklist;
import com.travel0.day0.checklist.domain.UserChecklistItem;
import com.travel0.day0.checklist.domain.ItemCollectStat;
import com.travel0.day0.checklist.dto.*;
import com.travel0.day0.checklist.repository.ChecklistTemplateItemRepository;
import com.travel0.day0.checklist.repository.ChecklistTemplateRepository;
import com.travel0.day0.checklist.repository.UserChecklistItemRepository;
import com.travel0.day0.checklist.repository.UserChecklistRepository;
import com.travel0.day0.checklist.repository.ItemCollectStatRepository;
import com.travel0.day0.common.enums.ChecklistItemStatus;
import com.travel0.day0.common.enums.ChecklistVisibility;

import com.travel0.day0.departures.domain.DepartureInfo;
import com.travel0.day0.departures.repository.DepartureInfoRepository;
import com.travel0.day0.users.domain.User;
import com.travel0.day0.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.travel0.day0.common.dto.PagedResponse;
import org.springframework.data.domain.PageImpl;


import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
//@Transactional(readOnly = true)
public class UserChecklistService {
    private final ChecklistTemplateRepository templateRepository;
    private final ChecklistTemplateItemRepository templateItemRepository;
    private final UserChecklistRepository userChecklistRepository;
    private final UserChecklistItemRepository userChecklistItemRepository;
    private final UserRepository userRepository;
    private final DepartureInfoRepository departureInfoRepository;
    private final ItemCollectStatRepository collectStatRepository;

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

    /**
     * 공개 체크리스트 목록 조회
     */
    public PagedResponse<PublicChecklistResponse> getPublicChecklists(String sort, String countryCode,
                                                                      Long universityId, Pageable pageable, Long currentUserId) {

        Page<UserChecklist> checklists;

        if ("popular".equals(sort)) {
            // 인기순 정렬 (가져오기 횟수 기준)
            checklists = userChecklistRepository.findPublicChecklistsOrderByPopularity(
                    countryCode, universityId, pageable);
        } else {
            // 최신순 정렬 (기본)
            checklists = userChecklistRepository.findSharedChecklists(
                    ChecklistVisibility.PUBLIC, countryCode, universityId, pageable);
        }

        List<PublicChecklistResponse> content = checklists.getContent().stream()
                .map(checklist -> convertToPublicChecklistResponse(checklist, currentUserId))
                .collect(Collectors.toList());

        return PagedResponse.<PublicChecklistResponse>builder()
                .content(content)
                .currentPage(checklists.getNumber())
                .totalPages(checklists.getTotalPages())
                .totalElements(checklists.getTotalElements())
                .pageSize(checklists.getSize())
                .hasNext(checklists.hasNext())
                .hasPrevious(checklists.hasPrevious())
                .build();
    }

    /**
     * 공개 체크리스트 상세 조회
     */
    public PublicChecklistDetailResponse getPublicChecklistDetail(Long checklistId, Long currentUserId) {
        UserChecklist checklist = userChecklistRepository.findSharedChecklistById(
                        checklistId, ChecklistVisibility.PUBLIC)
                .orElseThrow(() -> new IllegalArgumentException("공개된 체크리스트를 찾을 수 없습니다."));

        List<PublicChecklistItemResponse> items = userChecklistItemRepository
                .findByUserChecklistUserChecklistIdOrderByDueDateAscNullsLast(checklistId)
                .stream()
                .map(this::convertToPublicItemResponse)
                .collect(Collectors.toList());

        PublicChecklistResponse basicInfo = convertToPublicChecklistResponse(checklist, currentUserId);

        return PublicChecklistDetailResponse.builder()
                .checklist(basicInfo)
                .items(items)
                .build();
    }

    /**
     * 항목 가져오기 (개별 항목 수집)
     */
    @Transactional
    public UserChecklistItemResponse collectItemToMyChecklist(Long myChecklistId, Long userId, Long sourceItemId) {
        // 1. 내 체크리스트 확인
        UserChecklist myChecklist = userChecklistRepository.findByUserChecklistIdAndUserUserId(myChecklistId, userId)
                .orElseThrow(() -> new IllegalArgumentException("내 체크리스트를 찾을 수 없습니다."));

        // 2. 원본 항목 조회
        UserChecklistItem sourceItem = userChecklistItemRepository.findById(sourceItemId)
                .orElseThrow(() -> new IllegalArgumentException("원본 항목을 찾을 수 없습니다."));

        // 3. 원본 체크리스트가 PUBLIC인지 확인
        if (!ChecklistVisibility.PUBLIC.equals(sourceItem.getUserChecklist().getVisibility())) {
            throw new IllegalArgumentException("공개된 체크리스트의 항목만 가져올 수 있습니다.");
        }

        // 4. 중복 확인 (제목 기준)
        List<UserChecklistItem> myItems = userChecklistItemRepository
                .findByUserChecklistUserChecklistIdOrderByDueDateAscNullsLast(myChecklistId);

        boolean isDuplicate = myItems.stream()
                .anyMatch(item -> item.getTitle().equals(sourceItem.getTitle()));

        if (isDuplicate) {
            throw new IllegalArgumentException("이미 동일한 항목이 있습니다.");
        }

        // 5. 새 항목 생성
        UserChecklistItem newItem = UserChecklistItem.builder()
                .userChecklist(myChecklist)
                .templateItem(sourceItem.getTemplateItem())
                .title(sourceItem.getTitle())
                .description(sourceItem.getDescription())
                .dueDate(sourceItem.getDueDate())
                .status(ChecklistItemStatus.TODO)
                .tag(sourceItem.getTag())
                .linkedAmount(sourceItem.getLinkedAmount())
                .isFixed(false)
                .build();

        UserChecklistItem savedItem = userChecklistItemRepository.save(newItem);

        // 6. 가져오기 통계 업데이트
        updateCollectStat(sourceItem.getUserChecklist().getUserChecklistId(), sourceItem.getTitle());

        return convertToItemResponse(savedItem);
    }

    /**
     * 인기 체크리스트 조회
     */
    public List<PublicChecklistResponse> getPopularChecklists(String countryCode, int limit) {
        List<Object[]> popularStats = collectStatRepository.findPopularChecklists();

        return popularStats.stream()
                .limit(limit)
                .map(stat -> {
                    Long checklistId = (Long) stat[0];
                    UserChecklist checklist = userChecklistRepository.findById(checklistId).orElse(null);
                    return checklist != null ? convertToPublicChecklistResponse(checklist, null) : null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    /**
     * 가져오기 통계 업데이트
     */
    @Transactional
    protected void updateCollectStat(Long sourceChecklistId, String itemTitle) {
        Optional<ItemCollectStat> existingStat = collectStatRepository
                .findBySourceChecklistIdAndItemTitle(sourceChecklistId, itemTitle);

        if (existingStat.isPresent()) {
            // 기존 통계 증가
            collectStatRepository.incrementCollectCount(existingStat.get().getStatId());
        } else {
            // 새 통계 생성
            UserChecklist sourceChecklist = userChecklistRepository.findById(sourceChecklistId).orElse(null);
            if (sourceChecklist != null) {
                ItemCollectStat newStat = ItemCollectStat.builder()
                        .sourceChecklist(sourceChecklist)
                        .itemTitle(itemTitle)
                        .collectCount(1)
                        .build();
                collectStatRepository.save(newStat);
            }
        }
    }

    // Converter methods
    private PublicChecklistResponse convertToPublicChecklistResponse(UserChecklist checklist, Long currentUserId) {
        // 가져오기 횟수 조회
        Long totalCollects = collectStatRepository.getTotalCollectCountByChecklistId(checklist.getUserChecklistId());

        // 통계 계산
        int totalItems = checklist.getItems() != null ? checklist.getItems().size() : 0;
        int completedItems = checklist.getItems() != null ?
                (int) checklist.getItems().stream()
                        .filter(item -> ChecklistItemStatus.DONE.equals(item.getStatus()))
                        .count() : 0;
        double completionRate = totalItems > 0 ? (double) completedItems / totalItems : 0.0;

        return PublicChecklistResponse.builder()
                .userChecklistId(checklist.getUserChecklistId())
                .title(checklist.getTitle())
                .authorNickname(checklist.getUser().getNickname())
                .authorProfileImage(checklist.getUser().getProfileImage())
                .countryCode(checklist.getDeparture().getCountryCode())
                .countryName(getCountryName(checklist.getDeparture().getCountryCode()))
                .universityName(checklist.getDeparture().getUniversity() != null ?
                        checklist.getDeparture().getUniversity().getName() : null)
                .programTypeName(checklist.getDeparture().getProgramType() != null ?
                        checklist.getDeparture().getProgramType().getName() : null)
                .totalItems(totalItems)
                .completedItems(completedItems)
                .completionRate(completionRate)
                .totalCollects(totalCollects != null ? totalCollects : 0L) // 가져오기 횟수
                .departureDate(checklist.getDeparture().getStartDate())
                .createdAt(checklist.getCreatedAt())
                .build();
    }

    private PublicChecklistItemResponse convertToPublicItemResponse(UserChecklistItem item) {
        return PublicChecklistItemResponse.builder()
                .uciId(item.getUciId())
                .title(item.getTitle())
                .description(item.getDescription())
                .tag(item.getTag())
                .dueDate(item.getDueDate())
                .linkedAmount(item.getLinkedAmount())
                .build();
    }

    private String getCountryName(String countryCode) {
        // 간단한 국가명 매핑
        return switch (countryCode) {
            case "US" -> "미국";
            case "JP" -> "일본";
            case "DE" -> "독일";
            case "KR" -> "한국";
            default -> countryCode;
        };
    }


}

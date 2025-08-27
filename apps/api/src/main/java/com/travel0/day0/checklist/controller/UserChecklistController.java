package com.travel0.day0.checklist.controller;

import com.travel0.day0.checklist.dto.*;
import com.travel0.day0.common.dto.PagedResponse;
import com.travel0.day0.checklist.service.UserChecklistService;
import com.travel0.day0.common.enums.ChecklistItemStatus;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/user-checklists")
@RequiredArgsConstructor
public class UserChecklistController {

   private final UserChecklistService userChecklistService;

   @PostMapping
   @Operation(summary = "사용자 체크리스트 생성 (매칭되는 템플릿 찾아서 복제)", description = "체크리스트 생성 버튼에 연결")
   public ResponseEntity<UserChecklistResponse> createUserChecklist(
           @RequestParam Long userId,
           @RequestBody CreateUserChecklistRequest request) {
       UserChecklistResponse checklist = userChecklistService.createUserChecklistFromTemplate(userId, request);
       return ResponseEntity.status(HttpStatus.CREATED).body(checklist);
   }

   @GetMapping
   @Operation(summary = "사용자 체크리스트 템플릿 목록 조회", description = "출국 정보에 해당하는 체크리스트 조회")
   public ResponseEntity<List<UserChecklistResponse>> getUserChecklists(
           @RequestParam Long userId,
           @RequestParam(required = false) Long departureId) {
       List<UserChecklistResponse> checklists = userChecklistService.getUserChecklists(userId);
       return ResponseEntity.ok(checklists);
   }

   @GetMapping("/{checklistId}")
   @Operation(summary = "사용자 체크리스트 템플릿 상세 조회")
   public ResponseEntity<UserChecklistResponse> getUserChecklist(
           @RequestParam Long userId,
           @PathVariable Long checklistId) {
       UserChecklistResponse checklist = userChecklistService.getUserChecklistById(checklistId, userId);
       return ResponseEntity.ok(checklist);
   }

   @PatchMapping("/{checklistId}")
   @Operation(summary = "사용자 체크리스트 템플릿 수정")
   public ResponseEntity<UserChecklistResponse> updateUserChecklist(
           @RequestParam Long userId,
           @PathVariable Long checklistId,
           @Valid @RequestBody UpdateUserChecklistRequest request) {
       UserChecklistResponse checklist = userChecklistService.updateUserChecklist(checklistId, userId, request);
       return ResponseEntity.ok(checklist);
   }

   @DeleteMapping("/{checklistId}")
   @Operation(summary = "사용자 체크리스트 삭제")
   public ResponseEntity<Void> deleteUserChecklist(
           @RequestParam Long userId,
           @PathVariable Long checklistId) {
       userChecklistService.deleteUserChecklist(checklistId, userId);
       return ResponseEntity.noContent().build();
   }

   @GetMapping("/{checklistId}/calendar")
   @Operation(summary = "달력용 고정 항목 조회")
   public ResponseEntity<List<UserChecklistItemResponse>> getFixedItemsForCalendar(
           @RequestParam Long userId,
           @PathVariable Long checklistId) {
       List<UserChecklistItemResponse> fixedItems = userChecklistService.getFixedItemsForCalendar(checklistId, userId);
       return ResponseEntity.ok(fixedItems);
   }

   @GetMapping("/{checklistId}/items")
   @Operation(summary = "유저 체크리스트 항목 목록 조회", description = "todoOnly: todo 상태인 것만 dueDate 순으로 조회")
   public ResponseEntity<List<UserChecklistItemResponse>> getUserChecklistItems(
           @PathVariable Long checklistId,
           @RequestParam(required = false) ChecklistItemStatus status,
           @RequestParam(required = false) Instant dueBefore,
           @RequestParam(defaultValue = "false") boolean todoOnly) {
       List<UserChecklistItemResponse> items;

       if (todoOnly) {
           items = userChecklistService.getTodoUserChecklistItems(checklistId);
       } else if (status == null && dueBefore == null) {
           items = userChecklistService.getAllUserChecklistItems(checklistId);
       } else {
           items = userChecklistService.getUserChecklistItems(checklistId, status, dueBefore);
       }

       return ResponseEntity.ok(items);
   }

   @GetMapping("/items/{itemId}")
   @Operation(summary = "유저 체크리스트 항목 상세 조회")
   public ResponseEntity<UserChecklistItemResponse> getUserChecklistItem(
           @RequestParam Long userId,
           @PathVariable Long itemId) {
       UserChecklistItemResponse item = userChecklistService.getUserChecklistItemById(itemId, userId);
       return ResponseEntity.ok(item);
   }

   @PostMapping("/{checklistId}/items")
   @Operation(summary = "유저 체크리스트 항목 생성")
   public ResponseEntity<UserChecklistItemResponse> createUserChecklistItem(
           @RequestParam Long userId,
           @PathVariable Long checklistId,
           @RequestBody CreateUserChecklistItemRequest request) {
       UserChecklistItemResponse item = userChecklistService.createUserChecklistItem(checklistId, userId, request);
       return ResponseEntity.status(HttpStatus.CREATED).body(item);
   }

   @PatchMapping("/items/{itemId}")
   @Operation(summary = "유저 체크리스트 항목 수정")
   public ResponseEntity<UserChecklistItemResponse> updateUserChecklistItem(
           @RequestParam Long userId,
           @PathVariable Long itemId,
           @Valid @RequestBody UpdateUserChecklistItemRequest request) {
       UserChecklistItemResponse item = userChecklistService.updateUserChecklistItem(itemId, userId, request);
       return ResponseEntity.ok(item);
   }

   @DeleteMapping("/items/{itemId}")
   @Operation(summary = "유저 체크리스트 항목 삭제")
   public ResponseEntity<Void> deleteUserChecklistItem(
           @RequestParam Long userId,
           @PathVariable Long itemId) {
       userChecklistService.deleteUserChecklistItem(itemId, userId);
       return ResponseEntity.noContent().build();
   }

    /**
     * 공개된 체크리스트 목록 조회 (인기순/최신순)
     * GET /api/checklist/user-checklists/public?sort=popular&country=US&page=0&size=10
     */
    @GetMapping("/public")
    @Operation(summary = "공개 체크리스트 목록", description = "다른 사용자들의 공개 체크리스트 조회")
    public ResponseEntity<PagedResponse<PublicChecklistResponse>> getPublicChecklists(
            @RequestParam(defaultValue = "latest") String sort, // popular, latest
            @RequestParam(required = false) String country,
            @RequestParam(required = false) Long universityId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long userId) {

        Pageable pageable = PageRequest.of(page, size);
        PagedResponse<PublicChecklistResponse> response = userChecklistService.getPublicChecklists(
                sort, country, universityId, pageable, userId);

        return ResponseEntity.ok(response);
    }

    /**
     * 공개 체크리스트 상세 조회 (항목 포함)
     * GET /api/checklist/user-checklists/public/{checklistId}?userId=1
     */
    @GetMapping("/public/{checklistId}")
    @Operation(summary = "공개 체크리스트 상세", description = "공개 체크리스트의 모든 항목 조회")
    public ResponseEntity<PublicChecklistDetailResponse> getPublicChecklistDetail(
            @PathVariable Long checklistId,
            @RequestParam(required = false) Long userId) {

        PublicChecklistDetailResponse response = userChecklistService.getPublicChecklistDetail(checklistId, userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 항목 가져오기 (다른 사용자의 공개 체크리스트 항목을 내 체크리스트에 추가)
     * POST /api/checklist/user-checklists/{myChecklistId}/collect-item?userId=1&sourceItemId=5
     */
    @PostMapping("/{myChecklistId}/collect-item")
    @Operation(summary = "항목 가져오기", description = "다른 사용자의 체크리스트 항목을 내 체크리스트에 추가")
    public ResponseEntity<UserChecklistItemResponse> collectItem(
            @PathVariable Long myChecklistId,
            @RequestParam Long userId,
            @RequestParam Long sourceItemId) {

        UserChecklistItemResponse response = userChecklistService.collectItemToMyChecklist(
                myChecklistId, userId, sourceItemId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 인기 체크리스트 TOP 10
     * GET /api/checklist/user-checklists/popular-top?country=US
     */
    @GetMapping("/popular-top")
    @Operation(summary = "인기 체크리스트 TOP", description = "가져오기 횟수가 많은 인기 체크리스트")
    public ResponseEntity<List<PublicChecklistResponse>> getPopularChecklists(
            @RequestParam(required = false) String country,
            @RequestParam(defaultValue = "10") int limit) {

        List<PublicChecklistResponse> response = userChecklistService.getPopularChecklists(country, limit);
        return ResponseEntity.ok(response);
    }
}

//
//package com.travel0.day0.community.controller;
//
//import com.travel0.day0.community.dto.*;
//import com.travel0.day0.community.service.CommunityService;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.data.domain.PageRequest;
//import org.springframework.data.domain.Pageable;
//import org.springframework.data.domain.Sort;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//import org.springframework.context.annotation.Profile;
//
//import jakarta.validation.Valid;
//import java.util.List;
//
///**
// * 커뮤니티 기능 REST API 컨트롤러
// */
//@Slf4j
//@Profile("!default")
//@RestController
//@RequestMapping("/api/community")
//@RequiredArgsConstructor
//public class CommunityController {
//
//    private final CommunityService communityService;
//
//    // =========================================================
//    // 그룹 관련
//    // =========================================================
//
//    /**
//     * 그룹 목록 조회 (국가/대학 필터)
//     * GET /api/community/groups?country=US&universityId=10
//     */
//    @GetMapping("/groups")
//    public ResponseEntity<ApiResponse<List<CommunityGroupResponse>>> getGroups(
//            @RequestParam(required = false) String country,
//            @RequestParam(required = false) Long universityId) {
//
//        try {
//            log.info("커뮤니티 그룹 목록 조회: country={}, universityId={}", country, universityId);
//
//            List<CommunityGroupResponse> groups = communityService.getGroups(country, universityId);
//
//            return ResponseEntity.ok(ApiResponse.success(groups));
//
//        } catch (Exception e) {
//            log.error("그룹 목록 조회 실패", e);
//            return ResponseEntity.internalServerError()
//                    .body(ApiResponse.error("그룹 목록 조회에 실패했습니다.", "GROUP_FETCH_ERROR"));
//        }
//    }
//
//    // =========================================================
//    // 게시글 관련
//    // =========================================================
//
//    /**
//     * 게시글 작성
//     * POST /api/community/posts
//     */
//    @PostMapping("/posts")
//    public ResponseEntity<ApiResponse<PostResponse>> createPost(
//            @Valid @RequestBody CreatePostRequest request,
//            @RequestParam Long userId) {
//
//        try {
//            log.info("게시글 작성 요청: userId={}, title={}", userId, request.getTitle());
//
//            PostResponse response = communityService.createPost(request, userId);
//
//            return ResponseEntity.ok(ApiResponse.success(response, "게시글이 성공적으로 작성되었습니다."));
//
//        } catch (Exception e) {
//            log.error("게시글 작성 실패: userId={}", userId, e);
//            return ResponseEntity.internalServerError()
//                    .body(ApiResponse.error("게시글 작성에 실패했습니다.", "POST_CREATE_ERROR"));
//        }
//    }
//
//    /**
//     * 그룹별 게시글 목록 조회 (검색/카테고리/정렬)
//     * GET /api/community/posts?groupId=1&category=TIPS&q=환전&sort=latest&page=0&size=20
//     */
//    @GetMapping("/posts")
//    public ResponseEntity<ApiResponse<PagedResponse<PostSummaryResponse>>> getPosts(
//            @RequestParam(required = false) String country,
//            @RequestParam(required = false) Long universityId,
//            @RequestParam(required = false) String category,
//            @RequestParam(required = false) String q,
//            @RequestParam(defaultValue = "latest") String sort,
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "20") int size) {
//
//        try {
//            log.info("게시글 목록 조회: country={}, universityId={}, category={}, q={}, sort={}, page={}, size={}",
//                    country, universityId, category, q, sort, page, size);
//
//            // 정렬 기준 설정
//            Sort sortObj = createSort(sort);
//            Pageable pageable = PageRequest.of(page, size, sortObj);
//
//            PagedResponse<PostSummaryResponse> response = communityService.getPosts(
//                    country, universityId, category, q, pageable);
//
//            return ResponseEntity.ok(ApiResponse.success(response));
//
//        } catch (Exception e) {
//            log.error("게시글 목록 조회 실패", e);
//            return ResponseEntity.internalServerError()
//                    .body(ApiResponse.error("게시글 목록 조회에 실패했습니다.", "POST_LIST_ERROR"));
//        }
//    }
//
//    /**
//     * 게시글 상세 조회
//     * GET /api/community/posts/{postId}
//     */
//    @GetMapping("/posts/{postId}")
//    public ResponseEntity<ApiResponse<PostResponse>> getPost(
//            @PathVariable Long postId,
//            @RequestParam(required = false) Long userId) {
//
//        try {
//            log.info("게시글 상세 조회: postId={}, userId={}", postId, userId);
//
//            PostResponse response = communityService.getPost(postId, userId);
//
//            return ResponseEntity.ok(ApiResponse.success(response));
//
//        } catch (IllegalArgumentException e) {
//            log.warn("게시글 상세 조회 실패 - 존재하지 않는 게시글: postId={}", postId);
//            return ResponseEntity.badRequest()
//                    .body(ApiResponse.error("존재하지 않는 게시글입니다.", "POST_NOT_FOUND"));
//        } catch (Exception e) {
//            log.error("게시글 상세 조회 실패: postId={}", postId, e);
//            return ResponseEntity.internalServerError()
//                    .body(ApiResponse.error("게시글 조회에 실패했습니다.", "POST_FETCH_ERROR"));
//        }
//    }
//
//    /**
//     * 게시글 수정
//     * PATCH /api/community/posts/{postId}
//     */
//    @PatchMapping("/posts/{postId}")
//    public ResponseEntity<ApiResponse<PostResponse>> updatePost(
//            @PathVariable Long postId,
//            @Valid @RequestBody UpdatePostRequest request,
//            @RequestParam Long userId) {
//
//        try {
//            log.info("게시글 수정 요청: postId={}, userId={}", postId, userId);
//
//            PostResponse response = communityService.updatePost(postId, request, userId);
//
//            return ResponseEntity.ok(ApiResponse.success(response, "게시글이 성공적으로 수정되었습니다."));
//
//        } catch (IllegalArgumentException e) {
//            log.warn("게시글 수정 실패: {}", e.getMessage());
//            return ResponseEntity.badRequest()
//                    .body(ApiResponse.error(e.getMessage(), "POST_UPDATE_ERROR"));
//        } catch (Exception e) {
//            log.error("게시글 수정 실패: postId={}, userId={}", postId, userId, e);
//            return ResponseEntity.internalServerError()
//                    .body(ApiResponse.error("게시글 수정에 실패했습니다.", "POST_UPDATE_ERROR"));
//        }
//    }
//
//    /**
//     * 게시글 삭제
//     * DELETE /api/community/posts/{postId}
//     */
//    @DeleteMapping("/posts/{postId}")
//    public ResponseEntity<ApiResponse<Void>> deletePost(
//            @PathVariable Long postId,
//            @RequestParam Long userId) {
//
//        try {
//            log.info("게시글 삭제 요청: postId={}, userId={}", postId, userId);
//
//            communityService.deletePost(postId, userId);
//
//            return ResponseEntity.ok(ApiResponse.success(null, "게시글이 성공적으로 삭제되었습니다."));
//
//        } catch (IllegalArgumentException e) {
//            log.warn("게시글 삭제 실패: {}", e.getMessage());
//            return ResponseEntity.badRequest()
//                    .body(ApiResponse.error(e.getMessage(), "POST_DELETE_ERROR"));
//        } catch (Exception e) {
//            log.error("게시글 삭제 실패: postId={}, userId={}", postId, userId, e);
//            return ResponseEntity.internalServerError()
//                    .body(ApiResponse.error("게시글 삭제에 실패했습니다.", "POST_DELETE_ERROR"));
//        }
//    }
//
//    // =========================================================
//    // 댓글 관련
//    // =========================================================
//
//    /**
//     * 댓글 작성
//     * POST /api/community/posts/{postId}/replies
//     */
//    @PostMapping("/posts/{postId}/replies")
//    public ResponseEntity<ApiResponse<ReplyResponse>> createReply(
//            @PathVariable Long postId,
//            @Valid @RequestBody CreateReplyRequest request,
//            @RequestParam Long userId) {
//
//        try {
//            log.info("댓글 작성 요청: postId={}, userId={}", postId, userId);
//
//            ReplyResponse response = communityService.createReply(postId, request, userId);
//
//            return ResponseEntity.ok(ApiResponse.success(response, "댓글이 성공적으로 작성되었습니다."));
//
//        } catch (IllegalArgumentException e) {
//            log.warn("댓글 작성 실패: {}", e.getMessage());
//            return ResponseEntity.badRequest()
//                    .body(ApiResponse.error(e.getMessage(), "REPLY_CREATE_ERROR"));
//        } catch (Exception e) {
//            log.error("댓글 작성 실패: postId={}, userId={}", postId, userId, e);
//            return ResponseEntity.internalServerError()
//                    .body(ApiResponse.error("댓글 작성에 실패했습니다.", "REPLY_CREATE_ERROR"));
//        }
//    }
//
//    /**
//     * 게시글의 댓글 목록 조회
//     * GET /api/community/posts/{postId}/replies
//     */
//    @GetMapping("/posts/{postId}/replies")
//    public ResponseEntity<ApiResponse<List<ReplyResponse>>> getReplies(@PathVariable Long postId) {
//
//        try {
//            log.info("댓글 목록 조회: postId={}", postId);
//
//            List<ReplyResponse> replies = communityService.getReplies(postId);
//
//            return ResponseEntity.ok(ApiResponse.success(replies));
//
//        } catch (Exception e) {
//            log.error("댓글 목록 조회 실패: postId={}", postId, e);
//            return ResponseEntity.internalServerError()
//                    .body(ApiResponse.error("댓글 목록 조회에 실패했습니다.", "REPLY_LIST_ERROR"));
//        }
//    }
//
//    /**
//     * 댓글 삭제
//     * DELETE /api/community/replies/{replyId}
//     */
//    @DeleteMapping("/replies/{replyId}")
//    public ResponseEntity<ApiResponse<Void>> deleteReply(
//            @PathVariable Long replyId,
//            @RequestParam Long userId) {
//
//        try {
//            log.info("댓글 삭제 요청: replyId={}, userId={}", replyId, userId);
//
//            communityService.deleteReply(replyId, userId);
//
//            return ResponseEntity.ok(ApiResponse.success(null, "댓글이 성공적으로 삭제되었습니다."));
//
//        } catch (IllegalArgumentException e) {
//            log.warn("댓글 삭제 실패: {}", e.getMessage());
//            return ResponseEntity.badRequest()
//                    .body(ApiResponse.error(e.getMessage(), "REPLY_DELETE_ERROR"));
//        } catch (Exception e) {
//            log.error("댓글 삭제 실패: replyId={}, userId={}", replyId, userId, e);
//            return ResponseEntity.internalServerError()
//                    .body(ApiResponse.error("댓글 삭제에 실패했습니다.", "REPLY_DELETE_ERROR"));
//        }
//    }
//
//    /**
//     * 답변 채택 (질문자만 가능)
//     * POST /api/community/replies/{replyId}/adopt
//     */
//    @PostMapping("/replies/{replyId}/adopt")
//    public ResponseEntity<ApiResponse<Void>> adoptReply(
//            @PathVariable Long replyId,
//            @RequestParam Long userId) {
//
//        try {
//            log.info("답변 채택 요청: replyId={}, userId={}", replyId, userId);
//
//            communityService.adoptReply(replyId, userId);
//
//            return ResponseEntity.ok(ApiResponse.success(null, "답변이 채택되었습니다."));
//
//        } catch (IllegalArgumentException e) {
//            log.warn("답변 채택 실패: {}", e.getMessage());
//            return ResponseEntity.badRequest()
//                    .body(ApiResponse.error(e.getMessage(), "REPLY_ADOPT_ERROR"));
//        } catch (Exception e) {
//            log.error("답변 채택 실패: replyId={}, userId={}", replyId, userId, e);
//            return ResponseEntity.internalServerError()
//                    .body(ApiResponse.error("답변 채택에 실패했습니다.", "REPLY_ADOPT_ERROR"));
//        }
//    }
//
//    /**
//     * 답변 채택 취소 (질문자만 가능)
//     * DELETE /api/community/replies/{replyId}/adopt
//     */
//    @DeleteMapping("/replies/{replyId}/adopt")
//    public ResponseEntity<ApiResponse<Void>> unadoptReply(
//            @PathVariable Long replyId,
//            @RequestParam Long userId) {
//
//        try {
//            log.info("답변 채택 취소 요청: replyId={}, userId={}", replyId, userId);
//
//            communityService.unadoptReply(replyId, userId);
//
//            return ResponseEntity.ok(ApiResponse.success(null, "답변 채택이 취소되었습니다."));
//
//        } catch (IllegalArgumentException e) {
//            log.warn("답변 채택 취소 실패: {}", e.getMessage());
//            return ResponseEntity.badRequest()
//                    .body(ApiResponse.error(e.getMessage(), "REPLY_UNADOPT_ERROR"));
//        } catch (Exception e) {
//            log.error("답변 채택 취소 실패: replyId={}, userId={}", replyId, userId, e);
//            return ResponseEntity.internalServerError()
//                    .body(ApiResponse.error("답변 채택 취소에 실패했습니다.", "REPLY_UNADOPT_ERROR"));
//        }
//    }
//
//    // =========================================================
//    // 좋아요 관련
//    // =========================================================
//
//    /**
//     * 좋아요 추가
//     * POST /api/community/posts/{postId}/like
//     */
//    @PostMapping("/posts/{postId}/like")
//    public ResponseEntity<ApiResponse<Void>> likePost(
//            @PathVariable Long postId,
//            @RequestParam Long userId) {
//
//        try {
//            log.info("좋아요 추가 요청: postId={}, userId={}", postId, userId);
//
//            communityService.likePost(postId, userId);
//
//            return ResponseEntity.ok(ApiResponse.success(null, "좋아요가 추가되었습니다."));
//
//        } catch (IllegalArgumentException e) {
//            log.warn("좋아요 추가 실패: {}", e.getMessage());
//            return ResponseEntity.badRequest()
//                    .body(ApiResponse.error(e.getMessage(), "LIKE_ERROR"));
//        } catch (Exception e) {
//            log.error("좋아요 추가 실패: postId={}, userId={}", postId, userId, e);
//            return ResponseEntity.internalServerError()
//                    .body(ApiResponse.error("좋아요 추가에 실패했습니다.", "LIKE_ERROR"));
//        }
//    }
//
//    /**
//     * 좋아요 취소
//     * DELETE /api/community/posts/{postId}/like
//     */
//    @DeleteMapping("/posts/{postId}/like")
//    public ResponseEntity<ApiResponse<Void>> unlikePost(
//            @PathVariable Long postId,
//            @RequestParam Long userId) {
//
//        try {
//            log.info("좋아요 취소 요청: postId={}, userId={}", postId, userId);
//
//            communityService.unlikePost(postId, userId);
//
//            return ResponseEntity.ok(ApiResponse.success(null, "좋아요가 취소되었습니다."));
//
//        } catch (IllegalArgumentException e) {
//            log.warn("좋아요 취소 실패: {}", e.getMessage());
//            return ResponseEntity.badRequest()
//                    .body(ApiResponse.error(e.getMessage(), "UNLIKE_ERROR"));
//        } catch (Exception e) {
//            log.error("좋아요 취소 실패: postId={}, userId={}", postId, userId, e);
//            return ResponseEntity.internalServerError()
//                    .body(ApiResponse.error("좋아요 취소에 실패했습니다.", "UNLIKE_ERROR"));
//        }
//    }
//
//    // =========================================================
//    // 체크리스트 공유 관련
//    // =========================================================
//
//    /**
//     * 공유된 체크리스트 목록 조회
//     * GET /api/community/shared-checklists?visibility=public&country=US&sort=popular
//     */
//    @GetMapping("/shared-checklists")
//    public ResponseEntity<ApiResponse<PagedResponse<SharedChecklistResponse>>> getSharedChecklists(
//            @RequestParam(defaultValue = "PUBLIC") String visibility,
//            @RequestParam(required = false) String country,
//            @RequestParam(required = false) Long universityId,
//            @RequestParam(defaultValue = "latest") String sort,
//            @RequestParam(defaultValue = "0") int page,
//            @RequestParam(defaultValue = "20") int size) {
//
//        try {
//            log.info("공유 체크리스트 목록 조회: visibility={}, country={}, sort={}, page={}, size={}",
//                    visibility, country, sort, page, size);
//
//            Sort sortObj = createSort(sort);
//            Pageable pageable = PageRequest.of(page, size, sortObj);
//
//            PagedResponse<SharedChecklistResponse> response = communityService.getSharedChecklists(
//                    visibility, country, universityId, pageable);
//
//            return ResponseEntity.ok(ApiResponse.success(response));
//
//        } catch (Exception e) {
//            log.error("공유 체크리스트 목록 조회 실패", e);
//            return ResponseEntity.internalServerError()
//                    .body(ApiResponse.error("공유 체크리스트 목록 조회에 실패했습니다.", "SHARED_CHECKLIST_LIST_ERROR"));
//        }
//    }
//
//    /**
//     * 공유 체크리스트 상세 조회
//     * GET /api/community/shared-checklists/{checklistId}?visibility=public
//     */
//    @GetMapping("/shared-checklists/{checklistId}")
//    public ResponseEntity<ApiResponse<SharedChecklistResponse>> getSharedChecklist(
//            @PathVariable Long checklistId,
//            @RequestParam(defaultValue = "PUBLIC") String visibility,
//            @RequestParam(required = false) Long userId) {
//
//        try {
//            log.info("공유 체크리스트 상세 조회: checklistId={}, visibility={}, userId={}",
//                    checklistId, visibility, userId);
//
//            SharedChecklistResponse response = communityService.getSharedChecklist(
//                    checklistId, visibility, userId);
//
//            return ResponseEntity.ok(ApiResponse.success(response));
//
//        } catch (IllegalArgumentException e) {
//            log.warn("공유 체크리스트 조회 실패: {}", e.getMessage());
//            return ResponseEntity.badRequest()
//                    .body(ApiResponse.error(e.getMessage(), "SHARED_CHECKLIST_NOT_FOUND"));
//        } catch (Exception e) {
//            log.error("공유 체크리스트 상세 조회 실패: checklistId={}", checklistId, e);
//            return ResponseEntity.internalServerError()
//                    .body(ApiResponse.error("공유 체크리스트 조회에 실패했습니다.", "SHARED_CHECKLIST_FETCH_ERROR"));
//        }
//    }
//
//    // =========================================================
//    // Helper Methods
//    // =========================================================
//
//    private Sort createSort(String sortType) {
//        return switch (sortType) {
//            case "popular" -> Sort.by(Sort.Direction.DESC, "likeCount", "createdAt");
//            case "replies" -> Sort.by(Sort.Direction.DESC, "replyCount", "createdAt");
//            case "oldest" -> Sort.by(Sort.Direction.ASC, "createdAt");
//            default -> Sort.by(Sort.Direction.DESC, "createdAt"); // latest
//        };
//    }
//}

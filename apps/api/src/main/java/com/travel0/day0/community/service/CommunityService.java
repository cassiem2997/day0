//
//package com.travel0.day0.community.service;
//
//import com.travel0.day0.community.domain.*;
//import com.travel0.day0.community.dto.*;
//import com.travel0.day0.community.repository.*;
//import com.travel0.day0.users.domain.User;
//import com.travel0.day0.users.domain.University;
//import com.travel0.day0.users.repository.UserRepository;
//import com.travel0.day0.users.repository.UniversityRepository;
//import com.travel0.day0.common.enums.ChecklistVisibility;
//import com.travel0.day0.checklist.domain.UserChecklist;
//import com.travel0.day0.checklist.repository.UserChecklistRepository;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.data.domain.Page;
//import org.springframework.data.domain.Pageable;
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import java.time.Instant;
//import java.util.List;
//import java.util.Map;
//import java.util.stream.Collectors;
//
//@Slf4j
//@Service
//@RequiredArgsConstructor
//@Transactional(readOnly = true)
//public class CommunityService {
//
//    private final CommunityPostRepository postRepository;
//    private final CommunityReplyRepository replyRepository;
//    private final PostLikeRepository postLikeRepository;
//    private final UserRepository userRepository;
//    private final UniversityRepository universityRepository;
//    private final UserChecklistRepository userChecklistRepository;
//    private final MileageService mileageService;
//
//    // =========================================================
//    // 그룹 관련
//    // =========================================================
//
//     public List<CommunityGroupResponse> getGroups(String countryCode, Long universityId) {
//         log.info("커뮤니티 그룹 목록 조회 시작: countryCode={}, universityId={}", countryCode, universityId);
//
//         // 그룹별 통계 조회 (게시글 수, 멤버 수)
//          List<Object[]> groupStats = postRepository.findGroupStatistics(countryCode, universityId);
//
//         return groupStats.stream()
//                 .map(this::convertToGroupResponse)
//                 .collect(Collectors.toList());
//     }
//
//    // =========================================================
//    // 게시글 관련
//    // =========================================================
//
//    @Transactional
//    public PostResponse createPost(CreatePostRequest request, Long userId) {
//        log.info("게시글 생성 시작: userId={}, title={}", userId, request.getTitle());
//
//        User author = getUserById(userId);
//
//        University university = null;
//        if (request.getUniversityId() != null) {
//            university = getUniversityById(request.getUniversityId());
//        }
//
//        CommunityPost post = CommunityPost.builder()
//                .user(author)
//                .countryCode(request.getCountryCode())
//                .university(university)
//                .title(request.getTitle())
//                .body(request.getBody())
//                .category(request.getCategory())
//                .createdAt(Instant.now())
//                .updatedAt(Instant.now())
//                .build();
//
//        CommunityPost savedPost = postRepository.save(post);
//
//        // 마일리지 적립 (+100M)
//        mileageService.awardMileage(userId, 100, "질문 작성", "게시글 ID: " + savedPost.getPostId());
//
//        log.info("게시글 생성 완료: postId={}", savedPost.getPostId());
//        return convertToPostResponse(savedPost, userId);
//    }
//
//    public PagedResponse<PostSummaryResponse> getPosts(String countryCode, Long universityId,
//                                                      String category, String searchQuery,
//                                                      Pageable pageable) {
//        log.info("게시글 목록 조회: country={}, university={}, category={}, q={}",
//                countryCode, universityId, category, searchQuery);
//
//        Page<CommunityPost> posts = postRepository.findPostsWithFilters(
//                countryCode, universityId, category, searchQuery, pageable);
//
//        List<PostSummaryResponse> content = posts.getContent().stream()
//                .map(this::convertToPostSummaryResponse)
//                .collect(Collectors.toList());
//
//        return PagedResponse.<PostSummaryResponse>builder()
//                .content(content)
//                .currentPage(posts.getNumber())
//                .totalPages(posts.getTotalPages())
//                .totalElements(posts.getTotalElements())
//                .pageSize(posts.getSize())
//                .hasNext(posts.hasNext())
//                .hasPrevious(posts.hasPrevious())
//                .build();
//    }
//
//    public PostResponse getPost(Long postId, Long userId) {
//        log.info("게시글 상세 조회: postId={}, userId={}", postId, userId);
//
//        CommunityPost post = getPostById(postId);
//        return convertToPostResponse(post, userId);
//    }
//
//    @Transactional
//    public PostResponse updatePost(Long postId, UpdatePostRequest request, Long userId) {
//        log.info("게시글 수정: postId={}, userId={}", postId, userId);
//
//        CommunityPost post = getPostById(postId);
//
//        // 작성자 확인
//        if (!post.getUser().getUserId().equals(userId)) {
//            throw new IllegalArgumentException("게시글 수정 권한이 없습니다.");
//        }
//
//        // 수정
//        if (request.getTitle() != null) {
//            post.setTitle(request.getTitle());
//        }
//        if (request.getBody() != null) {
//            post.setBody(request.getBody());
//        }
//        if (request.getCategory() != null) {
//            post.setCategory(request.getCategory());
//        }
//        post.setUpdatedAt(Instant.now());
//
//        CommunityPost updatedPost = postRepository.save(post);
//        return convertToPostResponse(updatedPost, userId);
//    }
//
//    @Transactional
//    public void deletePost(Long postId, Long userId) {
//        log.info("게시글 삭제: postId={}, userId={}", postId, userId);
//
//        CommunityPost post = getPostById(postId);
//
//        // 작성자 확인
//        if (!post.getUser().getUserId().equals(userId)) {
//            throw new IllegalArgumentException("게시글 삭제 권한이 없습니다.");
//        }
//
//        // 관련 데이터 삭제 (댓글, 좋아요 등 - cascade로 처리됨)
//        postRepository.delete(post);
//
//        log.info("게시글 삭제 완료: postId={}", postId);
//    }
//
//    // =========================================================
//    // 댓글 관련
//    // =========================================================
//
//    @Transactional
//    public ReplyResponse createReply(Long postId, CreateReplyRequest request, Long userId) {
//        log.info("댓글 생성: postId={}, userId={}", postId, userId);
//
//        CommunityPost post = getPostById(postId);
//        User author = getUserById(userId);
//
//        CommunityReply reply = CommunityReply.builder()
//                .post(post)
//                .user(author)
//                .body(request.getBody())
//                .createdAt(Instant.now())
//                .build();
//
//        CommunityReply savedReply = replyRepository.save(reply);
//
//        // 마일리지 적립 (+50M)
//        mileageService.awardMileage(userId, 50, "댓글 작성", "게시글 ID: " + postId);
//
//        log.info("댓글 생성 완료: replyId={}", savedReply.getReplyId());
//        return convertToReplyResponse(savedReply);
//    }
//
//    public List<ReplyResponse> getReplies(Long postId) {
//        log.info("댓글 목록 조회: postId={}", postId);
//
//        // 게시글 존재 확인
//        getPostById(postId);
//
//        List<CommunityReply> replies = replyRepository.findByPostPostIdOrderByCreatedAtAsc(postId);
//
//        return replies.stream()
//                .map(this::convertToReplyResponse)
//                .collect(Collectors.toList());
//    }
//
//    @Transactional
//    public void deleteReply(Long replyId, Long userId) {
//        log.info("댓글 삭제: replyId={}, userId={}", replyId, userId);
//
//        CommunityReply reply = getReplyById(replyId);
//
//        // 작성자 확인
//        if (!reply.getUser().getUserId().equals(userId)) {
//            throw new IllegalArgumentException("댓글 삭제 권한이 없습니다.");
//        }
//
//        replyRepository.delete(reply);
//        log.info("댓글 삭제 완료: replyId={}", replyId);
//    }
//
//    // =========================================================
//    // 답변 채택 관련
//    // =========================================================
//
//    @Transactional
//    public void adoptReply(Long replyId, Long userId) {
//        log.info("답변 채택: replyId={}, userId={}", replyId, userId);
//
//        CommunityReply reply = getReplyById(replyId);
//        CommunityPost post = reply.getPost();
//
//        // 질문 작성자만 채택 가능
//        if (!post.getUser().getUserId().equals(userId)) {
//            throw new IllegalArgumentException("답변 채택 권한이 없습니다. 질문 작성자만 가능합니다.");
//        }
//
//        // QNA 카테고리인지 확인 (선택적)
//        if (!"QNA".equals(post.getCategory())) {
//            throw new IllegalArgumentException("Q&A 게시글에서만 답변 채택이 가능합니다.");
//        }
//
//        // 이미 채택된 답변이 있는지 확인
//        boolean hasAdoptedReply = replyRepository.existsByPostPostIdAndIsAdoptedTrue(post.getPostId());
//        if (hasAdoptedReply) {
//            throw new IllegalArgumentException("이미 채택된 답변이 있습니다. 기존 채택을 취소한 후 다시 시도해주세요.");
//        }
//
//        // 자신의 답변은 채택 불가
//        if (reply.getUser().getUserId().equals(userId)) {
//            throw new IllegalArgumentException("자신의 답변은 채택할 수 없습니다.");
//        }
//
//        // 답변 채택 처리
//        reply.setIsAdopted(true);
//        reply.setAdoptedAt(Instant.now());
//        replyRepository.save(reply);
//
//        // 답변자에게 마일리지 적립 (+200M), 질문자에게도 채택 마일리지 적립 (+50M)
//        try {
//            mileageService.awardReplyAdoption(userId, reply.getUser().getUserId(), replyId);
//            log.info("답변 채택 마일리지 적립 완료: questionAuthorId={}, replyAuthorId={}, replyId={}",
//                    userId, reply.getUser().getUserId(), replyId);
//        } catch (Exception e) {
//            log.error("답변 채택 마일리지 적립 실패: replyId={}", replyId, e);
//            // 마일리지 실패해도 채택은 성공으로 처리
//        }
//
//        log.info("답변 채택 완료: replyId={}, adopterId={}", replyId, userId);
//    }
//
//    @Transactional
//    public void unadoptReply(Long replyId, Long userId) {
//        log.info("답변 채택 취소: replyId={}, userId={}", replyId, userId);
//
//        CommunityReply reply = getReplyById(replyId);
//        CommunityPost post = reply.getPost();
//
//        // 질문 작성자만 채택 취소 가능
//        if (!post.getUser().getUserId().equals(userId)) {
//            throw new IllegalArgumentException("답변 채택 취소 권한이 없습니다. 질문 작성자만 가능합니다.");
//        }
//
//        // 채택된 답변인지 확인
//        if (!Boolean.TRUE.equals(reply.getIsAdopted())) {
//            throw new IllegalArgumentException("채택되지 않은 답변입니다.");
//        }
//
//        // 채택 취소 처리
//        reply.setIsAdopted(false);
//        reply.setAdoptedAt(null);
//        replyRepository.save(reply);
//
//        // 마일리지 차감 (선택적 - 정책에 따라)
//        // mileageService.deductReplyAdoption(reply.getUser().getUserId(), replyId);
//
//        log.info("답변 채택 취소 완료: replyId={}, cancelerId={}", replyId, userId);
//    }
//
//    // =========================================================
//    // 좋아요 관련
//    // =========================================================
//
//    @Transactional
//    public void likePost(Long postId, Long userId) {
//        log.info("좋아요 추가: postId={}, userId={}", postId, userId);
//
//        CommunityPost post = getPostById(postId);
//        User user = getUserById(userId);
//
//        // 이미 좋아요 했는지 확인
//        boolean alreadyLiked = postLikeRepository.existsByPostPostIdAndUserUserId(postId, userId);
//        if (alreadyLiked) {
//            throw new IllegalArgumentException("이미 좋아요를 누른 게시글입니다.");
//        }
//
//        PostLikeId likeId = new PostLikeId(postId, userId);
//        PostLike postLike = PostLike.builder()
//                .id(likeId)
//                .post(post)
//                .user(user)
//                .createdAt(Instant.now())
//                .build();
//
//        postLikeRepository.save(postLike);
//        log.info("좋아요 추가 완료: postId={}, userId={}", postId, userId);
//    }
//
//    @Transactional
//    public void unlikePost(Long postId, Long userId) {
//        log.info("좋아요 취소: postId={}, userId={}", postId, userId);
//
//        PostLikeId likeId = new PostLikeId(postId, userId);
//        PostLike postLike = postLikeRepository.findById(likeId)
//                .orElseThrow(() -> new IllegalArgumentException("좋아요를 누르지 않은 게시글입니다."));
//
//        postLikeRepository.delete(postLike);
//        log.info("좋아요 취소 완료: postId={}, userId={}", postId, userId);
//    }
//
//    // =========================================================
//    // 체크리스트 공유 관련
//    // =========================================================
//
//    public PagedResponse<SharedChecklistResponse> getSharedChecklists(String visibility,
//                                                                     String countryCode,
//                                                                     Long universityId,
//                                                                     Pageable pageable) {
//        log.info("공유 체크리스트 목록 조회: visibility={}, country={}, university={}",
//                visibility, countryCode, universityId);
//
//        // visibility 검증 및 변환
//        com.travel0.day0.common.enums.ChecklistVisibility visibilityEnum =
//                com.travel0.day0.common.enums.ChecklistVisibility.valueOf(visibility.toUpperCase());
//
//        Page<UserChecklist> checklists = userChecklistRepository.findSharedChecklists(
//                visibilityEnum, countryCode, universityId, pageable);
//
//        List<SharedChecklistResponse> content = checklists.getContent().stream()
//                .map(this::convertToSharedChecklistResponse)
//                .collect(Collectors.toList());
//
//        return PagedResponse.<SharedChecklistResponse>builder()
//                .content(content)
//                .currentPage(checklists.getNumber())
//                .totalPages(checklists.getTotalPages())
//                .totalElements(checklists.getTotalElements())
//                .pageSize(checklists.getSize())
//                .hasNext(checklists.hasNext())
//                .hasPrevious(checklists.hasPrevious())
//                .build();
//    }
//
//    public SharedChecklistResponse getSharedChecklist(Long checklistId, String visibility, Long userId) {
//        log.info("공유 체크리스트 상세 조회: checklistId={}, visibility={}, userId={}",
//                checklistId, visibility, userId);
//
//        com.travel0.day0.common.enums.ChecklistVisibility visibilityEnum =
//                com.travel0.day0.common.enums.ChecklistVisibility.valueOf(visibility.toUpperCase());
//
//        UserChecklist checklist = userChecklistRepository.findById(checklistId)
//                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 체크리스트입니다."));
//
//        // 공개 여부 확인
//        if (!checklist.getVisibility().equals(visibilityEnum)) {
//            throw new IllegalArgumentException("접근할 수 없는 체크리스트입니다.");
//        }
//
//        return convertToSharedChecklistResponse(checklist, userId);
//    }
//
//    // =========================================================
//    // Helper Methods - Converters
//    // =========================================================
//
//    private CommunityGroupResponse convertToGroupResponse(Object[] row) {
//        String countryCode = (String) row[0];
//        String universityName = (String) row[1];
//        Long universityId = (Long) row[2];
//        Long postCount = (Long) row[3];
//        Long memberCount = (Long) row[4]; // 추정치
//
//        return CommunityGroupResponse.builder()
//                .groupKey(countryCode + "_" + (universityId != null ? universityId : "ALL"))
//                .groupName(getCountryName(countryCode) + " " + (universityName != null ? universityName : "전체"))
//                .countryCode(countryCode)
//                .countryName(getCountryName(countryCode))
//                .universityId(universityId)
//                .universityName(universityName)
//                .postCount(postCount)
//                .memberCount(memberCount != null ? memberCount : 0L)
//                .build();
//    }
//
//    private PostResponse convertToPostResponse(CommunityPost post, Long currentUserId) {
//        // 좋아요 수 조회
//        Long likeCount = postLikeRepository.countByPostPostId(post.getPostId());
//
//        // 댓글 수 조회
//        Long replyCount = replyRepository.countByPostPostId(post.getPostId());
//
//        // 채택된 댓글 조회
//        CommunityReply adoptedReply = replyRepository.findByPostPostIdAndIsAdoptedTrue(post.getPostId())
//        .orElse(null);
//
//        // 현재 사용자의 좋아요 여부
//        Boolean isLiked = currentUserId != null ?
//                postLikeRepository.existsByPostPostIdAndUserUserId(post.getPostId(), currentUserId) :
//                false;
//
//        return PostResponse.builder()
//                .postId(post.getPostId())
//                .title(post.getTitle())
//                .body(post.getBody())
//                .countryCode(post.getCountryCode())
//                .category(post.getCategory())
//                .authorId(post.getUser().getUserId())
//                .authorNickname(post.getUser().getNickname())
//                .authorProfileImage(post.getUser().getProfileImage())
//                .universityId(post.getUniversity() != null ? post.getUniversity().getUniversityId() : null)
//                .universityName(post.getUniversity() != null ? post.getUniversity().getName() : null)
//                .likeCount(likeCount)
//                .replyCount(replyCount)
//                .hasAdoptedReply(adoptedReply != null)
//                .adoptedReplyId(adoptedReply != null ? adoptedReply.getReplyId() : null)
//                .isLikedByCurrentUser(isLiked)
//                .createdAt(post.getCreatedAt())
//                .updatedAt(post.getUpdatedAt())
//                .build();
//    }
//
//    private PostSummaryResponse convertToPostSummaryResponse(CommunityPost post) {
//        // 통계 정보 조회
//        Long likeCount = postLikeRepository.countByPostPostId(post.getPostId());
//        Long replyCount = replyRepository.countByPostPostId(post.getPostId());
//
//        return PostSummaryResponse.builder()
//                .postId(post.getPostId())
//                .title(post.getTitle())
//                .category(post.getCategory())
//                .countryCode(post.getCountryCode())
//                .authorNickname(post.getUser().getNickname())
//                .likeCount(likeCount)
//                .replyCount(replyCount)
//                .createdAt(post.getCreatedAt())
//                .build();
//    }
//
//    private ReplyResponse convertToReplyResponse(CommunityReply reply) {
//        return ReplyResponse.builder()
//                .replyId(reply.getReplyId())
//                .body(reply.getBody())
//                .authorId(reply.getUser().getUserId())
//                .authorNickname(reply.getUser().getNickname())
//                .authorProfileImage(reply.getUser().getProfileImage())
//                .isAdopted(Boolean.TRUE.equals(reply.getIsAdopted()))
//                .adoptedAt(reply.getAdoptedAt())
//                .createdAt(reply.getCreatedAt())
//                .build();
//    }
//
//    private SharedChecklistResponse convertToSharedChecklistResponse(UserChecklist checklist) {
//        return convertToSharedChecklistResponse(checklist, null);
//    }
//
//    private SharedChecklistResponse convertToSharedChecklistResponse(UserChecklist checklist, Long currentUserId) {
//        // 체크리스트 통계 계산
//        int totalItems = checklist.getItems() != null ? checklist.getItems().size() : 0;
//        int completedItems = checklist.getItems() != null ?
//                (int) checklist.getItems().stream()
//                        .filter(item -> "DONE".equals(item.getStatus().name()))
//                        .count() : 0;
//        double completionRate = totalItems > 0 ? (double) completedItems / totalItems : 0.0;
//
//        return SharedChecklistResponse.builder()
//                .userChecklistId(checklist.getUserChecklistId())
//                .title(checklist.getTitle())
//                .description("") // 필요시 추가
//                .sharerNickname(checklist.getUser().getNickname())
//                .sharerProfileImage(checklist.getUser().getProfileImage())
//                .countryCode(checklist.getDeparture().getCountryCode())
//                .countryName(getCountryName(checklist.getDeparture().getCountryCode()))
//                .universityName(checklist.getDeparture().getUniversity() != null ?
//                        checklist.getDeparture().getUniversity().getName() : null)
//                .programTypeName(checklist.getDeparture().getProgramType() != null ?
//                        checklist.getDeparture().getProgramType().getName() : null)
//                .totalItems(totalItems)
//                .completedItems(completedItems)
//                .completionRate(completionRate)
//                .likeCount(0L) // 추후 구현
//                .scrapCount(0L) // 추후 구현
//                .departureDate(checklist.getDeparture().getStartDate())
//                .createdAt(checklist.getCreatedAt())
//                .isScrapedByCurrentUser(false) // 추후 구현
//                .build();
//    }
//
//    // =========================================================
//    // Helper Methods - Getters
//    // =========================================================
//
//    private User getUserById(Long userId) {
//        return userRepository.findById(userId)
//                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
//    }
//
//    private University getUniversityById(Long universityId) {
//        return universityRepository.findById(universityId)
//                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 대학입니다."));
//    }
//
//    private CommunityPost getPostById(Long postId) {
//        return postRepository.findById(postId)
//                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글입니다."));
//    }
//
//    private CommunityReply getReplyById(Long replyId) {
//        return replyRepository.findById(replyId)
//                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 댓글입니다."));
//    }
//
//    private String getCountryName(String countryCode) {
//        // 간단한 국가명 매핑 - 실제로는 별도 서비스나 상수로 관리
//        return switch (countryCode) {
//            case "US" -> "미국";
//            case "JP" -> "일본";
//            case "DE" -> "독일";
//            case "KR" -> "한국";
//            default -> countryCode;
//        };
//    }
//}

// src/api/community.ts
import api from "./axiosInstance";

/* ---------- 공통 타입 ---------- */
export type Cat = "CHECKLIST" | "FREE" | "QNA";
export type CommunitySort = "latest" | "popular";

/* ---------- 글 작성 ---------- */
export interface CommunityPostPayload {
  title: string;
  body: string;
  category: Cat;
  countryCode: string;
  universityId: number;
}

/** 글 작성: POST /community/posts  (query: userId) */
export async function createCommunityPost(
  payload: CommunityPostPayload,
  userId: number
) {
  return api.post("/community/posts", payload, {
    params: { userId },
    headers: { "Content-Type": "application/json" },
  });
}

/* ---------- 목록 조회 ---------- */
export interface GetPostsParams {
  country?: string; // ISO2
  universityId?: number;
  category?: Cat;
  q?: string;
  sort?: CommunitySort; // default: latest
  page?: number; // default: 0
  size?: number; // default: 20
}

export interface PostSummary {
  postId: number;
  title: string;
  category: Cat | string;
  countryCode: string;
  authorNickname: string;
  likeCount: number;
  replyCount: number;
  createdAt: string; // ISO
  bodyPreview: string;
}

export interface PageBlock<T> {
  content: T[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface GetPostsResponse {
  success: boolean;
  data: PageBlock<PostSummary>;
  message?: string;
  errorCode?: string;
}

export async function getCommunityPosts(params: GetPostsParams) {
  const { data } = await api.get<GetPostsResponse>("/community/posts", {
    params,
  });
  return data;
}

/* ---------- 상세 조회 ---------- */
export interface PostDetail {
  postId: number;
  title: string;
  body: string;
  category: Cat | string;
  countryCode: string;
  universityId: number;
  authorId: number;
  authorNickname: string;
  likeCount: number;
  replyCount: number;
  createdAt: string; // ISO
  liked?: boolean;
  bookmarked?: boolean;
  imageUrl?: string;
}

export interface GetPostDetailResponse {
  success: boolean;
  data: PostDetail;
  message?: string;
  errorCode?: string;
}

/** 특정 게시글 조회: GET /community/posts/{postId}?userId=xx */
export async function getCommunityPostDetail(postId: number, userId?: number) {
  const { data } = await api.get<GetPostDetailResponse>(
    `/community/posts/${postId}`,
    { params: { userId } }
  );
  return data;
}

/* ---------- 게시글 수정 ---------- */
export interface UpdateCommunityPostPayload {
  title: string;
  body: string;
  category: Cat;
}

export interface UpdateCommunityPostResponse {
  success: boolean;
  data: PostDetail; // 수정 후 결과 반환
  message?: string;
  errorCode?: string;
}

/** 게시글 수정: PATCH /community/posts/{postId}?userId=xx */
export async function updateCommunityPost(
  postId: number,
  payload: UpdateCommunityPostPayload,
  userId: number
) {
  const { data } = await api.patch<UpdateCommunityPostResponse>(
    `/community/posts/${postId}`,
    payload,
    { params: { userId } }
  );
  return data;
}

/* ---------- 게시글 삭제 ---------- */
export interface DeleteCommunityPostResponse {
  success: boolean;
  data: any; // {}
  message?: string;
  errorCode?: string;
}

/** 게시글 삭제: DELETE /community/posts/{postId}?userId=xx */
export async function deleteCommunityPost(postId: number, userId: number) {
  const { data } = await api.delete<DeleteCommunityPostResponse>(
    `/community/posts/${postId}`,
    { params: { userId } }
  );
  return data;
}

/* ---------- 게시글 좋아요 ---------- */
export interface LikePostResponse {
  success: boolean;
  data: any; // {}
  message?: string;
  errorCode?: string;
}

/** 게시글 좋아요: POST /community/posts/{postId}/like?userId=xx */
export async function likeCommunityPost(postId: number, userId: number) {
  const { data } = await api.post<LikePostResponse>(
    `/community/posts/${postId}/like`,
    {},
    { params: { userId } }
  );
  return data;
}

/** 게시글 좋아요 취소: DELETE /community/posts/{postId}/like?userId=xx */
export async function unlikeCommunityPost(postId: number, userId: number) {
  const { data } = await api.delete<LikePostResponse>(
    `/community/posts/${postId}/like`,
    { params: { userId } }
  );
  return data;
}

/* ---------- 댓글 작성/조회/삭제 ---------- */
export interface CreateReplyPayload {
  body: string;
}

export interface Reply {
  replyId: number;
  postId: number;
  authorId: number;
  authorNickname: string;
  body: string;
  createdAt: string; // ISO
  adopted?: boolean; // 채택 여부 (백엔드 필드명과 맞춰 사용)
  adoptedAt?: string; // 선택
}

export interface CreateReplyResponse {
  success: boolean;
  data: Reply;
  message?: string;
  errorCode?: string;
}

/** 댓글 작성: POST /community/posts/{postId}/replies?userId=xx */
export async function createCommunityReply(
  postId: number,
  userId: number,
  payload: CreateReplyPayload
) {
  const { data } = await api.post<CreateReplyResponse>(
    `/community/posts/${postId}/replies`,
    payload,
    { params: { userId } }
  );
  return data;
}

export interface GetRepliesResponse {
  success: boolean;
  data: Reply[];
  message?: string;
  errorCode?: string;
}

/** 댓글 조회: GET /community/posts/{postId}/replies */
export async function getCommunityReplies(postId: number) {
  const { data } = await api.get<GetRepliesResponse>(
    `/community/posts/${postId}/replies`
  );
  return data;
}

export interface DeleteReplyResponse {
  success: boolean;
  data: any; // {}
  message?: string;
  errorCode?: string;
}

/** 댓글 삭제: DELETE /community/replies/{replyId}?userId=xx */
export async function deleteCommunityReply(replyId: number, userId: number) {
  const { data } = await api.delete<DeleteReplyResponse>(
    `/community/replies/${replyId}`,
    { params: { userId } }
  );
  return data;
}

/* ---------- 댓글 채택/취소 ---------- */
export interface AdoptReplyResponse {
  success: boolean;
  data: any; // {}
  message?: string;
  errorCode?: string;
}

/** 댓글 채택: POST /community/replies/{replyId}/adopt?userId=xx */
export async function adoptReply(replyId: number, userId: number) {
  const { data } = await api.post<AdoptReplyResponse>(
    `/community/replies/${replyId}/adopt`,
    {},
    { params: { userId } }
  );
  return data;
}

/** 댓글 채택 취소: DELETE /community/replies/{replyId}/adopt?userId=xx */
export async function cancelAdoptReply(replyId: number, userId: number) {
  const { data } = await api.delete<AdoptReplyResponse>(
    `/community/replies/${replyId}/adopt`,
    { params: { userId } }
  );
  return data;
}

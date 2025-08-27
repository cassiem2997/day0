// src/api/community.ts
import api from "./axiosInstance";

/* ---------- 공통 타입 ---------- */
export type Cat = "CHECKLIST" | "FREE" | "QNA";
export type CommunitySort = "latest" | "popular";

export interface CommunityPostPayload {
  title: string;
  body: string;
  category: Cat;
  countryCode: string;
  universityId: number;
}

/** 글 작성: application/json + query(userId) */
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
    {
      params: { userId },
    }
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
  data: any; // 보통 빈 객체 {} 반환
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

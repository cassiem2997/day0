// src/api/checklist.ts
import api from "./axiosInstance";

/* =======================
 * Create User Checklist
 * ======================= */
export interface CreateUserChecklistPayload {
  userId: number;
  departureId: number;
  title?: string;
  visibility?: "PUBLIC" | "PRIVATE" | "UNLISTED";
  templateId?: number | null;
}
export async function createUserChecklist(payload: CreateUserChecklistPayload) {
  const res = await api.post("/user-checklists", payload);
  return res.data; // { userChecklistId, ... } 가정
}

/* =======================
 * Get One User Checklist
 * ======================= */
export async function getUserChecklist(checklistId: number | string) {
  const res = await api.get(`/user-checklists/${checklistId}`);
  return res.data;
}

/* =======================
 * Get Checklist Items (with filters)
 * ======================= */
export interface GetChecklistItemsParams {
  status?: "TODO" | "DOING" | "DONE" | "SKIP";
  dueBefore?: string; // 'YYYY-MM-DD'
  departureId?: number;
}
export interface UserChecklistItem {
  uciId: number;
  userChecklistId: number;
  templateItemId: number;
  title: string;
  description: string;
  dueDate: string; // ISO
  status: "TODO" | "DONE" | string;
  completedAt: string | null;
  tag: string;
  linkedAmount: number;
  isFixed: boolean;
  createdAt: string;
}

export async function getUserChecklistItems(
  checklistId: number
): Promise<UserChecklistItem[]> {
  const { data } = await api.get(`/user-checklists/${checklistId}/items`);
  return data;
}

/* =======================
 * Add Checklist Item
 * ======================= */
export interface AddChecklistItemPayload {
  title: string;
  description?: string;
  tag?: "NONE" | "SAVING" | "EXCHANGE" | "INSURANCE" | "DOCUMENT" | "ETC";
  dueDate?: string | null; // ISO or 'YYYY-MM-DD'
}
export async function addUserChecklistItem(
  checklistId: number | string,
  payload: AddChecklistItemPayload
) {
  const res = await api.post(`/user-checklists/${checklistId}/items`, payload);
  return res.data;
}

/* =======================
 * Patch Checklist Item
 * ======================= */
export interface PatchChecklistItemPayload {
  title?: string;
  description?: string;
  status?: "TODO" | "DOING" | "DONE" | "SKIP";
  dueDate?: string | null;
  tag?: "NONE" | "SAVING" | "EXCHANGE" | "INSURANCE" | "DOCUMENT" | "ETC";
}
export async function patchUserChecklistItem(
  itemId: number | string,
  payload: PatchChecklistItemPayload
) {
  const res = await api.patch(`/user-checklists/items/${itemId}`, payload);
  return res.data;
}

/* =======================
 * Delete Checklist Item
 * ======================= */
export async function deleteUserChecklistItem(itemId: number | string) {
  const res = await api.delete(`/user-checklists/items/${itemId}`);
  return res.data;
}

export interface ListUserChecklistsParams {
  departureId?: number;
  page?: number;
  size?: number;
  sort?: string;
}

/** 서버 원본(예상 스키마: Swagger Example 기준) */
export interface UserChecklistItemRaw {
  ucid: number;
  userChecklistId: number;
  templateItemId?: number | null;
  title: string;
  description?: string | null;
  dueDate?: string | null; // ISO
  status: "TODO" | "DOING" | "DONE" | "SKIP";
  completedAt?: string | null; // ISO
  tag: "NONE" | "SAVING" | "EXCHANGE" | "INSURANCE" | "DOCUMENT" | "ETC";
  linkedAmount?: number | null;
  isFixed?: boolean;
  createdAt: string; // ISO
}

export interface UserChecklistSummaryRaw {
  userChecklistId: number;
  userId: number;
  departureId: number;
  templateId?: number | null;
  title: string;
  visibility: "PUBLIC" | "PRIVATE" | "UNLISTED";
  createdAt: string; // ISO
  items: UserChecklistItemRaw[];
  amount?: number; // 예시 상 존재
}

/** 화면에서 바로 쓸 타입 (MyPageChecklist props와 동일 구조) */
export type ChecklistListItemUI = {
  id: number;
  visibility: "Public" | "Private";
  title: string;
  status: "완료" | "진행중" | "미완료";
};

function toVisibilityLabel(
  v: UserChecklistSummaryRaw["visibility"]
): "Public" | "Private" {
  if (v === "PRIVATE") return "Private";
  // UNLISTED는 일단 공개 배지로 취급(팀 정책에 맞춰 조정 가능)
  return "Public";
}

function toStatusFromItems(
  items: UserChecklistItemRaw[]
): "완료" | "진행중" | "미완료" {
  if (items.some((it) => it.status === "DOING")) return "진행중";
  if (items.length > 0 && items.every((it) => it.status === "DONE"))
    return "완료";
  return "미완료";
}

function sortByStatus(a: ChecklistListItemUI, b: ChecklistListItemUI) {
  const rank = (s: ChecklistListItemUI["status"]) =>
    s === "진행중" ? 0 : s === "미완료" ? 1 : 2;
  return rank(a.status) - rank(b.status);
}

export async function listUserChecklists(
  params: ListUserChecklistsParams
): Promise<ChecklistListItemUI[]> {
  const { data } = await api.get<UserChecklistSummaryRaw[]>(
    "/user-checklists",
    {
      params,
    }
  );

  const normalized: ChecklistListItemUI[] = Array.isArray(data)
    ? data.map((r) => ({
        id: r.userChecklistId,
        title: r.title,
        visibility: toVisibilityLabel(r.visibility),
        status: toStatusFromItems(r.items || []),
      }))
    : [];

  return normalized.sort(sortByStatus);
}
// =======================
// Popular Top (인기 체크리스트 TOP)
// =======================
export interface PopularTopParams {
  country?: string; // 예: "KR" (미지정이면 서버 기본)
  limit?: number; // 기본 10
}

// 서버 응답(스웨거 예시 기준, 일부 필드는 옵션 처리)
export interface PopularChecklistRaw {
  userChecklistId: number;
  title: string;
  authorNickname?: string;
  authorProfileImage?: string | null;
  countryCode?: string;
  countryName?: string;
  universityName?: string;
  programTypeName?: string;
  likeCount?: number; // 서버에 따라 saveCount만 있을 수도 있어 둘 다 대비
  saveCount?: number;
  totalItemCount?: number; // 총 항목 수
  doneItemCount?: number; // 완료 항목 수
}

// 화면에서 쓸 형태(CommunityBest에서 사용)
export type PopularBestItem = {
  id: number;
  title: string;
  done: number;
  total: number;
  star: number; // 좋아요/저장 등 지표
  author: string;
  authorProfileImage?: string | null;
};

export async function fetchPopularTop(
  params: PopularTopParams = {}
): Promise<PopularBestItem[]> {
  const { data } = await api.get<PopularChecklistRaw[]>(
    "/user-checklists/popular-top",
    { params: { country: params.country, limit: params.limit } }
  );

  const toNum = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // 방어적으로 키 매핑
  return Array.isArray(data)
    ? data.map((r) => ({
        id: r.userChecklistId,
        title: r.title ?? "",
        done: toNum(r.doneItemCount),
        total: toNum(r.totalItemCount),
        star: toNum(r.likeCount ?? r.saveCount),
        author: (r.authorNickname ?? "").trim() || "알 수 없음",
        authorProfileImage: r.authorProfileImage ?? null,
      }))
    : [];
}

// =======================
// Collect Item (다른 사용자의 항목을 내 체크리스트로 가져오기)
// POST /user-checklists/{myChecklistId}/collect-item?userId=&sourceItemId=
// =======================
export interface CollectItemParams {
  myChecklistId: number | string;
  userId: number | string; // 원본 항목의 사용자 ID
  sourceItemId: number | string; // 가져올 항목 ID
}

export interface CollectItemResponse {
  // 서버 스키마에 맞춰 필요 시 구체화하세요.
  // 예: { newItemId: number, ... }
  [key: string]: any;
}

export async function collectChecklistItem({
  myChecklistId,
  userId,
  sourceItemId,
}: CollectItemParams): Promise<CollectItemResponse> {
  const { data } = await api.post(
    `/user-checklists/${myChecklistId}/collect-item`,
    null, // 바디 없음
    { params: { userId, sourceItemId } } // 쿼리 파라미터
  );
  return data;
}

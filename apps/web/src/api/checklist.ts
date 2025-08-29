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

export interface UserChecklistResponse {
  userChecklistId: number;
  userId: number;
  departureId: number;
  templateId: number | null;
  title: string;
  visibility: "PUBLIC" | "PRIVATE" | "UNLISTED";
  createdAt: string;
  items: any[] | null;
  amount: number | null;
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

/** getUserChecklistById 는 getUserChecklist와 동일 (하위 호환성) */
export const getUserChecklistById = getUserChecklist;

/** 체크리스트 업데이트를 위한 인터페이스 */
export interface UpdateUserChecklistPayload {
  title?: string;
  visibility?: "PUBLIC" | "PRIVATE" | "UNLISTED";
}

/** PATCH /user-checklists/{checklistId} */
export async function updateUserChecklist(
  checklistId: number | string,
  payload: UpdateUserChecklistPayload
) {
  const res = await api.patch(`/user-checklists/${checklistId}`, payload);
  return res.data;
}

/** 체크리스트의 linked_amount 업데이트 */
export interface UpdateChecklistLinkedAmountPayload {
  linkedAmount: number;
}

export async function updateChecklistLinkedAmount(
  checklistId: number | string,
  linkedAmount: number
) {
  const res = await api.patch(`/user-checklists/${checklistId}/linked-amount`, {
    linkedAmount
  });
  return res.data;
}

/** GET /user-checklists/{checklistId}/items` with filters */
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
  dueDate: string;   // ISO
  status: "TODO" | "DONE" | string;
  completedAt: string | null;
  tag: string;
  linkedAmount: number;
  isFixed: boolean;
  createdAt: string;
}

export async function getUserChecklistItems(checklistId: number): Promise<UserChecklistItem[]> {
  const { data } = await api.get(`/user-checklists/${checklistId}/items`);
  return data;
}

export interface ChecklistItemResponse {
  uciId: number;
  title: string;
  description?: string;
  tag: "NONE" | "SAVING" | "EXCHANGE" | "INSURANCE" | "DOCUMENT" | "ETC";
  status: "TODO" | "DOING" | "DONE" | "SKIP";
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}


/** POST /user-checklists/{checklistId}/items */
/* =======================
 * Add Checklist Item
 * ======================= */
export interface AddChecklistItemPayload {
  title: string;
  description?: string;
  dueDate?: string; // ISO format: "2025-08-28T06:41:03.572Z"
  tag?: "NONE" | "SAVING" | "EXCHANGE" | "INSURANCE" | "DOCUMENT" | "ETC";
  linkedAmount?: number;
  isFixed?: boolean;
}

export interface AddChecklistItemResponse {
  uciId: number;
  title: string;
  description?: string;
  tag: "NONE" | "SAVING" | "EXCHANGE" | "INSURANCE" | "DOCUMENT" | "ETC";
  status: "TODO" | "DOING" | "DONE" | "SKIP";
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function addUserChecklistItem(
  checklistId: number | string,
  payload: AddChecklistItemPayload
): Promise<AddChecklistItemResponse> {
  const res = await api.post(`/user-checklists/${checklistId}/items`, payload);
  return res.data;
}

/** PATCH /user-checklists/items/{uciId} */
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
  uciId: number | string,
  payload: PatchChecklistItemPayload
) {
  const res = await api.patch(`/user-checklists/items/${uciId}`, payload);
  return res.data;
}

/** DELETE /user-checklists/items/{uciId} */
export async function deleteUserChecklistItem(uciId: number | string) {
  const res = await api.delete(`/user-checklists/items/${uciId}`);
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

/* =======================
 * Get User Checklist by Departure ID
 * ======================= */
export async function getUserChecklistByDepartureId(departureId: number) {
  const res = await api.get(`/user-checklists`, {
    params: { departureId }
  });
  return res.data;
}

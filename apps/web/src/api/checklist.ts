// src/api/checklist.ts
import api from "./axiosInstance";

/** POST /user-checklists */
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
  return res.data; // { userChecklistId, ... } 형태라고 가정
}

/** GET /user-checklists - departureId로 체크리스트 조회 */
export async function getUserChecklistByDepartureId(departureId: number): Promise<UserChecklistResponse | null> {
  // 일반적인 GET은 쿼리스트링으로 전달
  try {
    const res = await api.get('/user-checklists', {
      params: { departureId },
    });
    return res.data ?? null;
  } catch (error) {
    // 404 또는 비어있는 경우 null 반환하도록 관용 처리
    return null;
  }
}

/** GET /user-checklists/{checklistId} */
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
export interface PatchChecklistItemPayload {
  title?: string;
  description?: string;
  status?: "TODO" | "DOING" | "DONE" | "SKIP";
  dueDate?: string | null;
  linkedAmount?: number;
  tag?:
    | "NONE"
    | "SAVING"
    | "EXCHANGE"
    | "INSURANCE"
    | "DOCUMENT"
    | "ETC";
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

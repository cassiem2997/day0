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
export async function createUserChecklist(payload: CreateUserChecklistPayload) {
  const res = await api.post("/user-checklists", payload);
  return res.data; // { userChecklistId, ... } 형태라고 가정
}

/** GET /user-checklists/{checklistId} */
export async function getUserChecklist(checklistId: number | string) {
  const res = await api.get(`/user-checklists/${checklistId}`);
  return res.data;
}

/** GET /user-checklists/{checklistId}/items` with filters */
export interface GetChecklistItemsParams {
  status?: "TODO" | "DOING" | "DONE" | "SKIP";
  dueBefore?: string; // 'YYYY-MM-DD'
  departureId?: number;
}
export async function getUserChecklistItems(
  checklistId: number | string,
  params?: GetChecklistItemsParams
) {
  const res = await api.get(`/user-checklists/${checklistId}/items`, {
    params,
  });
  return res.data; // { items: [...] } 가정
}

/** POST /user-checklists/{checklistId}/items */
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

/** PATCH /user-checklists/items/{itemId} */
export interface PatchChecklistItemPayload {
  title?: string;
  description?: string;
  status?: "TODO" | "DOING" | "DONE" | "SKIP";
  dueDate?: string | null;
  tag?:
    | "NONE"
    | "SAVING"
    | "EXCHANGE"
    | "INSURANCE"
    | "DOCUMENT"
    | "ETC";
}
export async function patchUserChecklistItem(
  itemId: number | string,
  payload: PatchChecklistItemPayload
) {
  const res = await api.patch(`/user-checklists/items/${itemId}`, payload);
  return res.data;
}

/** DELETE /user-checklists/items/{itemId} */
export async function deleteUserChecklistItem(itemId: number | string) {
  const res = await api.delete(`/user-checklists/items/${itemId}`);
  return res.data;
}

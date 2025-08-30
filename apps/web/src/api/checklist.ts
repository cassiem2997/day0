import api from "./axiosInstance";
import { getCookie } from "../utils/cookieUtils";

/* =======================
 * Create User Checklist
 * ======================= */
export interface CreateUserChecklistPayload {
  userId: number; // 세션으로 대체 가능하면 서버에서 무시해도 됨
  departureId: number;
  title?: string;
  visibility?: "PUBLIC" | "PRIVATE" | "UNLISTED";
  templateId?: number | null;
  amount?: number;
}

export interface CreateUserChecklistResult {
  userChecklistId: number;
  raw: any;
}

<<<<<<< Updated upstream
export async function createUserChecklist(
  payload: CreateUserChecklistPayload
): Promise<CreateUserChecklistResult> {
  console.log("[API] POST /user-checklists payload:", payload);
  const res = await api.post("/user-checklists", payload);
  console.log("[API] /user-checklists response:", {
    status: res.status,
    headers: res.headers,
    data: res.data,
  });

  // 1) 바디에서 바로 찾기
  let id = (res.data && (res.data.userChecklistId ?? res.data.id)) as
    | number
    | undefined;

  // 2) Location 헤더에서 찾기
  if (!id) {
    const loc =
      (res.headers && (res.headers["location"] || res.headers["Location"])) ||
      "";
    const m =
      typeof loc === "string" ? loc.match(/user-checklists\/(\d+)/) : null;
    if (m && m[1]) id = Number(m[1]);
  }

  // 3) 중첩 구조 방어
  if (!id && res.data && typeof res.data === "object") {
    const cand =
      res.data.userChecklist?.userChecklistId ??
      res.data.data?.userChecklistId ??
      res.data.data?.id;
    if (Number.isFinite(Number(cand))) id = Number(cand);
  }

  if (!id || !Number.isFinite(id)) {
    console.error("[API] createUserChecklist: ID not found in response!");
    throw new Error("userChecklistId를 확인할 수 없습니다.");
  }

  return { userChecklistId: id, raw: res.data };
=======
export async function createUserChecklist(payload: CreateUserChecklistPayload) {
  console.log("체크리스트 생성 요청 데이터:", payload);
  
  // 토큰 확인 및 디버깅
  const token = localStorage.getItem("accessToken");
  console.log("🔑 현재 localStorage의 토큰:", token ? `${token.substring(0, 20)}...` : "없음");
  
  // 쿠키에서 직접 토큰 확인
  const cookies = document.cookie.split('; ');
  let tokenFromCookie = null;
  for (const cookie of cookies) {
    if (cookie.startsWith('accessToken=')) {
      tokenFromCookie = cookie.split('=')[1];
      console.log("🍪 쿠키에서 토큰 찾음:", tokenFromCookie ? `${tokenFromCookie.substring(0, 20)}...` : "없음");
      break;
    }
  }
  
  // 토큰 직접 지정하여 요청
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (tokenFromCookie) {
    headers['Authorization'] = `Bearer ${tokenFromCookie}`;
    // 토큰을 localStorage에도 저장
    localStorage.setItem("accessToken", tokenFromCookie);
  }
  
  try {
    const res = await api.post("/user-checklists", payload, { headers });
    console.log("createUserChecklist 응답:", res.data);
    return res.data; // { userChecklistId, ... } 가정
  } catch (error: any) {
    console.error("createUserChecklist 오류:", error);
    
    // 토큰 문제인 경우 쿠키에서 다시 시도
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (tokenFromCookie && (!token || token !== tokenFromCookie)) {
        console.log("🔄 쿠키의 토큰으로 재시도");
        localStorage.setItem("accessToken", tokenFromCookie);
        const retryRes = await api.post("/user-checklists", payload, {
          headers: { 'Authorization': `Bearer ${tokenFromCookie}` }
        });
        console.log("재시도 응답:", retryRes.data);
        return retryRes.data;
      }
    }
    
    throw error;
  }
>>>>>>> Stashed changes
}

/* =======================
 * Get One User Checklist
 * ======================= */
export async function getUserChecklist(checklistId: number | string) {
  console.log("[API] GET /user-checklists/:id", checklistId);
  const res = await api.get(`/user-checklists/${checklistId}`);
  return res.data;
}
export const getUserChecklistById = getUserChecklist;

/** 체크리스트 업데이트 */
export interface UpdateUserChecklistPayload {
  title?: string;
  visibility?: "PUBLIC" | "PRIVATE" | "UNLISTED";
}

export async function updateUserChecklist(
  checklistId: number | string,
  payload: UpdateUserChecklistPayload
) {
  console.log("[API] PATCH /user-checklists/:id", checklistId, payload);
  const res = await api.patch(`/user-checklists/${checklistId}`, payload);
  return res.data;
}

/** linked_amount 업데이트 */
export async function updateChecklistLinkedAmount(
  checklistId: number | string,
  linkedAmount: number
) {
  console.log(
    "[API] PATCH /user-checklists/:id/linked-amount",
    checklistId,
    linkedAmount
  );
  const res = await api.patch(`/user-checklists/${checklistId}/linked-amount`, {
    linkedAmount,
  });
  return res.data;
}

/* =======================
 * Get Checklist Items
 * ======================= */
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
  console.log("[API] GET /user-checklists/:id/items", checklistId);
  const { data } = await api.get(`/user-checklists/${checklistId}/items`);
  return data;
}

/* =======================
 * Add Checklist Item
 * ======================= */
export interface AddChecklistItemPayload {
  title: string;
  description?: string;
  dueDate?: string;
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
  console.log("[API] POST /user-checklists/:id/items", checklistId, payload);
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
  linkedAmount?: number;
}
export async function patchUserChecklistItem(
  uciId: number | string,
  payload: PatchChecklistItemPayload
) {
  console.log("[API] PATCH /user-checklists/items/:uciId", uciId, payload);
  const res = await api.patch(`/user-checklists/items/${uciId}`, payload);
  return res.data;
}

/** DELETE /user-checklists/items/{uciId} */
export async function deleteUserChecklistItem(uciId: number | string) {
  console.log("[API] DELETE /user-checklists/items/:uciId", uciId);
  const res = await api.delete(`/user-checklists/items/${uciId}`);
  return res.data;
}

/* =======================
 * List User Checklists (UI용 가공 반환)
 * ======================= */
export interface UserChecklistItemRaw {
  ucid: number;
  userChecklistId: number;
  templateItemId?: number | null;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  status: "TODO" | "DOING" | "DONE" | "SKIP";
  completedAt?: string | null;
  tag: "NONE" | "SAVING" | "EXCHANGE" | "INSURANCE" | "DOCUMENT" | "ETC";
  linkedAmount?: number | null;
  isFixed?: boolean;
  createdAt: string;
}
export interface UserChecklistSummaryRaw {
  userChecklistId: number;
  userId: number;
  departureId: number;
  templateId?: number | null;
  title: string;
  visibility: "PUBLIC" | "PRIVATE" | "UNLISTED";
  createdAt: string;
  items: UserChecklistItemRaw[];
  amount?: number;
}
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

export async function listUserChecklists(params: {
  departureId?: number;
  page?: number;
  size?: number;
  sort?: string;
}): Promise<ChecklistListItemUI[]> {
  console.log("[API] GET /user-checklists (list)", params);
  const { data } = await api.get<UserChecklistSummaryRaw[]>(
    "/user-checklists",
    { params }
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
  console.log("[API] GET /user-checklists?departureId=", departureId);
  const res = await api.get(`/user-checklists`, { params: { departureId } });
  return res.data;
}

/* =======================
 * Get User's Checklists
 * ======================= */
export async function getUserChecklists(userId: number) {
  try {
    console.log("[API] GET /user-checklists?userId=", userId);
    const res = await api.get(`/user-checklists`, { params: { userId } });
    return res.data;
  } catch (error) {
    console.error("[API] getUserChecklists FAIL:", error);
    return null;
  }
}
// =======================
// Popular Top (인기 체크리스트 TOP)
// =======================
export interface PopularTopParams {
  country?: string; // 예: "KR" (미지정이면 서버 기본)
  limit?: number; // 기본 10
}

export interface PopularChecklistRaw {
  userChecklistId: number;
  title: string;
  authorNickname?: string;
  authorProfileImage?: string | null;
  countryCode?: string;
  countryName?: string;
  universityName?: string;
  programTypeName?: string;
  likeCount?: number;
  saveCount?: number;
  totalItemCount?: number;
  doneItemCount?: number;
}

export type PopularBestItem = {
  id: number;
  title: string;
  done: number;
  total: number;
  star: number;
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

// 체크리스트 캘린더 항목 인터페이스
export interface ChecklistCalendarItem {
  category: string;
  title: string;
  dueDate: string;
  dDay: number;
}

// 체크리스트 캘린더 데이터 가져오기
export async function getChecklistCalendar(checklistId: number | string): Promise<ChecklistCalendarItem[]> {
  try {
    const { data } = await api.get(`/user-checklists/${checklistId}/calendar`);
    return data;
  } catch (error) {
    console.error('체크리스트 캘린더 데이터 가져오기 실패:', error);
    return [];
  }
}

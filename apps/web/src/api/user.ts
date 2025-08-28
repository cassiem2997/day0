import api from "./axiosInstance";

/* =======================
 * 공통 타입
 * ======================= */
export type Gender = "MALE" | "FEMALE";

/* =======================
 * 회원가입 (multipart/form-data)
 * ======================= */
export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  nickname: string;
  gender: Gender;
  birth: string; // YYYY-MM-DD
  homeUniversityId: number;
}
export interface SignUpResponse {
  message: string;
  email?: string;
  userId?: number;
}
export async function signUp(
  user: SignUpPayload,
  profileImage?: File | Blob
): Promise<SignUpResponse> {
  const formData = new FormData();
  const userBlob = new Blob([JSON.stringify(user)], {
    type: "application/json",
  });
  formData.append("user", userBlob);
  if (profileImage) formData.append("profileImage", profileImage);

  const { data } = await api.post<SignUpResponse>("/auth/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/* =======================
 * 로그인 (쿠키 기반)
 * ======================= */
export interface LoginPayload {
  email: string;
  password: string;
}
export interface LoginResponse {
  message: string;
  email?: string;
  userId?: number;
}
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", payload);
  return data;
}

/* =======================
 * 로그아웃 / 내 정보 / 리프레시
 * ======================= */
export interface LogoutResponse {
  message: string;
  email?: string;
  userId?: number;
}
export async function logout(): Promise<LogoutResponse> {
  const { data } = await api.post<LogoutResponse>("/auth/logout");
  return data;
}

export interface MeResponse {
  message: string;
  email?: string;
  userId?: number;
}
export async function me(): Promise<MeResponse> {
  const { data } = await api.get<MeResponse>("/auth/me");
  return data;
}

/** 선택: 세션 갱신 */
export async function refresh(): Promise<void> {
  await api.post("/auth/refresh");
}

/* =======================
 * 사용자 프로필 조회 / 수정
 * ======================= */
export interface UserProfile {
  userId: number;
  name: string;
  email: string;
  nickname: string;
  gender: Gender | string;
  birth: string; // YYYY-MM-DD
  profileImage?: string | null; // URL
  mileage?: number;
  homeUnivId?: number;
  destUnivId?: number;
}

/** 서버가 래핑해서 줄 수도 있고(success/data), 바로 UserProfile을 줄 수도 있음 */
export interface GetUserProfileResponse {
  success: boolean;
  data: UserProfile;
  message?: string;
  errorCode?: string;
}

/** 프로필 조회: GET /users/profile?userId=xx  (래핑/비래핑 모두 지원) */
export async function getUserProfile(
  userId: number
): Promise<GetUserProfileResponse> {
  const { data } = await api.get<GetUserProfileResponse | UserProfile>(
    "/users/profile",
    {
      params: { userId },
    }
  );

  // 래핑 응답
  if ((data as any)?.success !== undefined) {
    const res = data as GetUserProfileResponse;
    if (!res.success || !res.data)
      throw new Error(res.message ?? "프로필 조회 실패");
    return res;
  }

  // 비래핑 응답
  const u = data as UserProfile;
  if (!u || typeof u !== "object" || u.userId == null)
    throw new Error("프로필 조회 실패");
  return { success: true, data: u };
}

export interface UpdateUserProfileBody {
  name?: string;
  nickname?: string;
  gender?: Gender;
  birth?: string; // YYYY-MM-DD
  homeUnivId?: number;
  destUnivId?: number;
  deleteProfileImage?: boolean;
}
export interface UpdateUserProfileResponse {
  success: boolean;
  data: UserProfile;
  message?: string;
  errorCode?: string;
}

/** 프로필 수정: PATCH /users/profile?userId=xx (multipart/form-data)
 *  → 응답이 래핑/비래핑 어떤 형태든 항상 { success, data }로 정규화해서 반환
 */
export async function updateUserProfile(
  userId: number,
  user: UpdateUserProfileBody,
  profileImage?: File | Blob | null
): Promise<UpdateUserProfileResponse> {
  const formData = new FormData();
  const userBlob = new Blob([JSON.stringify(user)], {
    type: "application/json",
  });
  formData.append("user", userBlob);
  if (profileImage) formData.append("profileImage", profileImage);

  const { data } = await api.patch<UpdateUserProfileResponse | UserProfile>(
    "/users/profile",
    formData,
    {
      params: { userId },
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  // 래핑 응답
  if ((data as any)?.success !== undefined) {
    const res = data as UpdateUserProfileResponse;
    if (!res.success || !res.data)
      throw new Error(res.message ?? "프로필 수정 실패");
    return res;
  }

  // 비래핑 응답
  const u = data as UserProfile;
  if (!u || typeof u !== "object" || u.userId == null)
    throw new Error("프로필 수정 실패");
  return { success: true, data: u };
}

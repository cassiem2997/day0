// src/api/user.ts
import api from "./axiosInstance";

/* =======================
 * 회원가입 (multipart/form-data)
 * ======================= */
export type Gender = "MALE" | "FEMALE";

export interface SignUpPayload {
  name: string;
  email: string;
  password: string;
  nickname: string;
  gender: Gender;
  birth: string;
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

  if (profileImage) {
    formData.append("profileImage", profileImage);
  }

  const { data } = await api.post<SignUpResponse>("/auth/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/* =======================
 * 로그인 (쿠키 기반)
 *  - 백엔드가 accessToken/refreshToken 을 HttpOnly 쿠키로 내려줌
 *  - 응답 바디에는 메시지/이메일/유저ID 정도만 옴
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
 * 로그아웃 / 내 정보 / 리프레시 (옵션)
 * ======================= */
export async function logout(): Promise<void> {
  await api.post("/auth/logout"); // 서버가 쿠키 삭제
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
  birth: string; // ISO (YYYY-MM-DD)
  profileImage?: string | null; // 이미지 URL
  mileage?: number;
  homeUnivId?: number;
  destUnivId?: number;
}

export interface GetUserProfileResponse {
  success: boolean;
  data: UserProfile;
  message?: string;
  errorCode?: string;
}

/** 프로필 조회: GET /users/profile?userId=xx */
export async function getUserProfile(userId: number) {
  const { data } = await api.get<GetUserProfileResponse>("/users/profile", {
    params: { userId },
  });
  return data;
}

export interface UpdateUserProfileBody {
  name?: string;
  nickname?: string;
  gender?: Gender;
  birth?: string; // YYYY-MM-DD
  homeUnivId?: number;
  destUnivId?: number;
  deleteProfileImage?: boolean; // 프로필 사진 삭제 시 true
}

export interface UpdateUserProfileResponse {
  success: boolean;
  data: UserProfile;
  message?: string;
  errorCode?: string;
}

/** 프로필 수정: PATCH /users/profile?userId=xx (multipart/form-data) */
export async function updateUserProfile(
  userId: number,
  user: UpdateUserProfileBody,
  profileImage?: File | Blob | null
) {
  const formData = new FormData();

  // JSON 본문을 Blob 으로 넣어줌
  const userBlob = new Blob([JSON.stringify(user)], {
    type: "application/json",
  });
  formData.append("user", userBlob);

  if (profileImage) {
    formData.append("profileImage", profileImage);
  }

  const { data } = await api.patch<UpdateUserProfileResponse>(
    "/users/profile",
    formData,
    {
      params: { userId },
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return data;
}

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
  // 필요 시 destUniversityId 등 다른 필드는 여기에 추가
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
  // 쿠키는 브라우저가 자동으로 저장/전송하므로 따로 처리할 것 없음
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
  // 쿠키의 refreshToken을 사용해 서버가 accessToken 쿠키 재발급
  await api.post("/auth/refresh");
}

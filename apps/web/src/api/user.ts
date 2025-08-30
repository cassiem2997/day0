import api from "./axiosInstance";
import { getCookie } from "../utils/cookieUtils";

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
  accessToken?: string; // JWT 토큰 추가
}
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login", payload);
  
  console.log("🔍 로그인 응답 전체:", response);
  console.log("🔍 응답 헤더:", response.headers);
  console.log("🔍 응답 데이터:", response.data);
  console.log("🔍 Set-Cookie 헤더:", response.headers['set-cookie']);
  
  // 응답 헤더에서 Authorization 토큰 확인
  const authHeader = response.headers.authorization || response.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    localStorage.setItem("accessToken", token);
    console.log("🔑 JWT Token saved from Authorization header:", token.substring(0, 20) + "...");
  } else {
    console.log("❌ Authorization 헤더에 토큰 없음");
  }
  
  // 응답 본문에서 토큰 확인
  if (response.data.accessToken) {
    localStorage.setItem("accessToken", response.data.accessToken);
    console.log("🔑 JWT Token saved from response body:", response.data.accessToken.substring(0, 20) + "...");
  } else {
    console.log("❌ 응답 본문에 accessToken 없음");
  }
  
  // 로그인 후 잠시 대기 후 쿠키 확인
  setTimeout(() => {
    const cookieToken = getCookie("accessToken");
    if (cookieToken) {
      console.log("🔑 JWT Token found in cookie:", cookieToken.substring(0, 20) + "...");
      // localStorage에 토큰이 없는 경우 쿠키에서 가져오기
      if (!localStorage.getItem("accessToken")) {
        localStorage.setItem("accessToken", cookieToken);
        console.log("🔑 Copied token from cookie to localStorage");
      }
    }
    console.log("🍪 로그인 후 document.cookie:", document.cookie);
  }, 1000);
  
  return response.data;
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
  
  // 로컬 스토리지에서 JWT 토큰 제거
  localStorage.removeItem("accessToken");
  sessionStorage.removeItem("accessToken");
  console.log("🔑 JWT Token removed from storage");
  
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

// ---------------- 사용자 정보 조회 ----------------
export interface UserInfo {
  id: number;
  email: string;
  name: string;
  nickname: string;
  // 다른 필드들...
}

export async function getCurrentUser(): Promise<UserInfo> {
  const res = await api.get<UserInfo>("/auth/me"); // 또는 /users/me
  return res.data;
}
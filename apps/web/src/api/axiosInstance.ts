// src/api/axiosInstance.ts
import axios, { AxiosError } from "axios";
import { getCookie } from "../utils/cookieUtils";

// 백엔드 서버 URL 설정
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
console.log("현재 설정된 API 서버 URL:", baseURL);

console.log("🔧 API BaseURL:", baseURL);

const api = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

// 요청 인터셉터 추가
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log("🍪🍪🍪 Cookies:", document.cookie);
    
    // 토큰 검색 함수 - 유효한 토큰인지 확인
    const isValidToken = (token: string | null | undefined): boolean => {
      return !!token && token !== "undefined" && token !== "null" && token.trim() !== "";
    };
    
    // 1. 쿠키에서 직접 토큰 확인 (가장 확실한 방법)
    let tokenFromCookie = null;
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
      if (cookie.startsWith('accessToken=')) {
        tokenFromCookie = cookie.split('=')[1];
        if (isValidToken(tokenFromCookie)) {
          console.log("🍪🍪🍪 쿠키에서 직접 토큰 찾음:", tokenFromCookie.substring(0, 20) + "...");
          // 찾은 토큰을 localStorage에도 저장
          localStorage.setItem("accessToken", tokenFromCookie);
          break;
        }
      }
    }
    
    // 2. getCookie 유틸리티로 쿠키 확인
    const cookieToken = getCookie("accessToken");
    if (isValidToken(cookieToken)) {
      console.log("🍪 getCookie 유틸리티로 토큰 찾음:", cookieToken!.substring(0, 20) + "...");
      // 찾은 토큰을 localStorage에도 저장
      localStorage.setItem("accessToken", cookieToken!);
    }
    
    // 3. localStorage에서 JWT 토큰 확인
    const localToken = localStorage.getItem("accessToken");
    const sessionToken = sessionStorage.getItem("accessToken");
    
    // 우선순위: 쿠키 직접 > getCookie > localStorage > sessionStorage
    const token = tokenFromCookie || cookieToken || localToken || sessionToken;
    
    if (isValidToken(token)) {
      // 토큰 형식 확인 (Bearer 접두사가 있는지)
      if (token!.startsWith('Bearer ')) {
        config.headers.Authorization = token;
        console.log("🔑 JWT Token (with Bearer) added to Authorization header");
      } else {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("🔑 JWT Token added with Bearer prefix to Authorization header");
      }
      console.log("🔑 Token value:", token!.substring(0, 20) + "...");
      
      // 토큰을 모든 저장소에 동기화
      if (token !== localToken && isValidToken(token)) {
        localStorage.setItem("accessToken", token!);
      }
    } else {
      // HttpOnly 쿠키는 JS에서 읽을 수 없지만 자동으로 전송됨
      console.log("ℹ️ JavaScript에서 쿠키를 읽을 수 없지만 HttpOnly 쿠키가 자동 전송될 수 있습니다.");
      console.log("⚠️ 어떤 방법으로도 토큰을 찾을 수 없습니다!");
    }
    
    // 항상 Content-Type 설정
    if (!config.headers["Content-Type"] && !config.headers["content-type"]) {
      config.headers["Content-Type"] = "application/json";
      console.log("📝 Content-Type 헤더 추가: application/json");
    }
    
    console.log("🔑 Headers:", config.headers);
    return config;
  },
  (error) => {
    console.error("🔴 Request Interceptor Error:", error);
    return Promise.reject(error);
  }
);

// refresh 전용(인터셉터 미적용)
const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
});

console.log("🔧 Refresh Client BaseURL:", baseURL);

api.interceptors.response.use(
  (res) => {
    console.log(`✅ API Response: ${res.config.url} - ${res.status}`);
    console.log("📤 Response Headers:", res.headers);
    console.log("📦 Response Data:", res.data);
    return res;
  },
  async (err: AxiosError) => {
    const status = err.response?.status;
    const url = err.config?.url ?? "";
    
    console.error(`❌ API Error: ${url} - ${status}`, err.response?.data);
    
    // 403 에러에 대한 상세 로깅
    if (status === 403) {
      console.error("🚫 403 Forbidden Error Details:");
      console.error("URL:", url);
      console.error("Error Data:", err.response?.data);
      console.error("Headers:", err.config?.headers);
      console.error("Authorization Header:", err.config?.headers?.Authorization);
      console.error("Current Token:", localStorage.getItem("accessToken"));
      console.error("Cookies:", document.cookie);
    }
    
    const original = err.config as any;
    const isAuthPath = /\/auth\/(login|register|refresh)(\?|$)/.test(url);

    if (status === 401 && !original?._retry && !isAuthPath) {
      original._retry = true;
      try {
        console.log("🔄 Attempting token refresh...");
        await refreshClient.post("/auth/refresh");
        return api(original); // 원래 요청 재시도
      } catch (refreshError) {
        console.error("❌ Token refresh failed:", refreshError);
        // refresh 실패 -> 그대로 에러 반환
      }
    }
    
    // 403 에러인 경우 사용자에게 친화적인 메시지 표시
    if (status === 403 && url.includes("/savings/plans")) {
      console.log("💡 적금 플랜 생성 권한이 없습니다. 미션 적금을 사용해주세요.");
    }
    
    return Promise.reject(err);
  }
);

export default api;

// import axios, { AxiosError } from "axios";

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
//   withCredentials: true,
// });

// api.interceptors.request.use((config) => {
//   const cand =
//     localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

//   const token =
//     cand && cand !== "undefined" && cand !== "null" && cand.trim() !== ""
//       ? cand
//       : null;

//   config.headers = config.headers ?? {};

//   if (token) {
//     (config.headers as any).Authorization = `Bearer ${token}`;
//   } else {
//     // ❗ 절대 'Bearer undefined'가 나가지 않도록 보장
//     delete (config.headers as any).Authorization;
//   }

//   return config;
// });

// export default api;

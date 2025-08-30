// src/api/axiosInstance.ts
import axios, { AxiosError } from "axios";
import { getCookie } from "../utils/cookieUtils";

const baseURL = "http://localhost:8080"; // 직접 백엔드 서버로 연결

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
    console.log("🍪 Cookies:", document.cookie);
    
    // 1. localStorage에서 JWT 토큰 확인
    const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    if (token && token !== "undefined" && token !== "null" && token.trim() !== "") {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔑 JWT Token added to Authorization header");
    } else {
      // 2. 쿠키에서 accessToken 확인
      const cookieToken = getCookie("accessToken");
      if (cookieToken && cookieToken !== "undefined" && cookieToken !== "null" && cookieToken.trim() !== "") {
        config.headers.Authorization = `Bearer ${cookieToken}`;
        console.log("🔑 JWT Token from cookie added to Authorization header");
      }
    }
    
    console.log("🔑 Headers:", config.headers);
    return config;
  },
  (error) => {
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

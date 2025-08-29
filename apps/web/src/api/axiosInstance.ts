// src/api/axiosInstance.ts
import axios, { AxiosError } from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

const api = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true,
  headers: { Accept: "application/json" },
});

// refresh 전용(인터셉터 미적용)
const refreshClient = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const status = err.response?.status;
    const original = err.config as any;

    const url = (original?.url ?? "") as string;
    const isAuthPath = /\/auth\/(login|register|refresh)(\?|$)/.test(url);

    if (status === 401 && !original?._retry && !isAuthPath) {
      original._retry = true;
      try {
        await refreshClient.post("/auth/refresh");
        return api(original); // 원래 요청 재시도
      } catch {
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

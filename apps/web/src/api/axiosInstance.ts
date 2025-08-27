// src/api/axiosInstance.ts
import axios, { AxiosError } from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",
  timeout: 30000,
  withCredentials: true, // 쿠키로 변경
  headers: { Accept: "application/json" },
});

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const status = err.response?.status;
    const original = err.config as any;
    if (status === 401 && !original?._retry) {
      original._retry = true;
      try {
        await api.post("/auth/refresh"); // 쿠키에서 refresh 읽어 새 access 쿠키 발급
        return api(original);            // 원래 요청 재시도
      } catch {
      }
    }
    return Promise.reject(err);
  }
);

export default api;

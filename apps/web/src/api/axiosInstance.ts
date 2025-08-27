// src/api/axiosInstance.ts
import axios, { AxiosError } from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/",
  timeout: 8000,
  headers: {
    Accept: "application/json", // ← 이 정도만 전역으로
  },
  // withCredentials: true, // 쿠키 기반이면 사용
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    console.error("API Error:", err);
    return Promise.reject(err);
  }
);

export default api;

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
=======
import axios from "axios";

// 공통 인스턴스 생성
const api = axios.create({
  baseURL: "http://localhost:8080/api", // 나중에 수정 필요
  timeout: 5000, 
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken"); // 토큰 가져오기
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default api;

// src/api/departure.ts
import api from "./axiosInstance";
import { getCookie } from "../utils/cookieUtils";

export type DepartureStatus =
  | "PLANNED"
  | "ONGOING"
  | "COMPLETED"
  | "CANCELED"
  | "CANCELLED";

export interface Departure {
  departureId: number;
  userId: number;
  countryCode: string;
  startDate: string;        
  endDate?: string | null;   
  status: DepartureStatus;
}

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: "USD", CA: "CAD", GB: "GBP", DE: "EUR", FR: "EUR",
  IT: "EUR", ES: "EUR", NL: "EUR", JP: "JPY", CN: "CNY",
  CH: "CHF", AU: "AUD", KR: "KRW", SG: "SGD", HK: "HKD",
};

const parseList = (raw: any): any[] =>
  Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];

const normalizeStatus = (s?: string | null): DepartureStatus | undefined => {
  if (!s) return undefined;
  const up = s.toUpperCase();
  if (["PLANNED", "ONGOING", "COMPLETED", "CANCELED", "CANCELLED"].includes(up))
    return up as DepartureStatus;
  return undefined;
};

export interface CreateDeparturePayload {
  userId: number;
  universityId: number | null;
  programTypeId: number | null;
  countryCode: string;
  startDate: string;
  endDate?: string | null;
  status: DepartureStatus; 
}

export interface DepartureResponse {
  departureId: number;
  userId: number;
  userName: string;
  userNickname: string;
  universityId: number;
  universityName: string;
  programTypeId: number;
  programTypeName: string;
  programTypeCode: string;
  countryCode: string;
  startDate: string;
  endDate: string | null;
  status: "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELED";
  createdAt: string;
}

export async function createDeparture(payload: CreateDeparturePayload) {
  console.log("createDeparture 요청 데이터:", payload);
  
  // 토큰 확인 및 디버깅
  const token = localStorage.getItem("accessToken");
  console.log("🔑 현재 localStorage의 토큰:", token ? `${token.substring(0, 20)}...` : "없음");
  
  // getCookie 유틸리티를 사용하여 토큰 확인
  const tokenFromCookie = getCookie("accessToken");
  if (tokenFromCookie) {
    console.log("🍪 쿠키에서 토큰 찾음:", `${tokenFromCookie.substring(0, 20)}...`);
  } else {
    console.log("🍪 쿠키에서 토큰을 찾을 수 없음");
  }
  
  // 다양한 방법으로 시도
  try {
    // 1. 직접 axios 사용 (axiosInstance 우회)
    console.log("📡 직접 axios 요청 시도");
    const axios = (await import("axios")).default;
    const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
    
    const effectiveToken = token || tokenFromCookie;
    if (!effectiveToken) {
      throw new Error("유효한 토큰을 찾을 수 없습니다");
    }
    
    // 요청 헤더 설정 - 토큰 형식 확인
    let authHeader: string;
    if (effectiveToken.startsWith('Bearer ')) {
      authHeader = effectiveToken;
      console.log("📡 Bearer 접두사가 이미 있는 토큰 사용");
    } else {
      authHeader = `Bearer ${effectiveToken}`;
      console.log("📡 Bearer 접두사 추가");
    }
    
    const headers = {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    };
    
    console.log("📡 요청 URL:", `${baseURL}/departures`);
    console.log("📡 요청 헤더:", headers);
    
    // 직접 axios로 요청
    const res = await axios.post(`${baseURL}/departures`, payload, {
      headers,
      withCredentials: true
    });
    
    console.log("createDeparture 응답:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("createDeparture 오류:", error);
    
    // 오류 상세 정보 출력
    if (error.response) {
      console.error("응답 상태:", error.response.status);
      console.error("응답 데이터:", error.response.data);
      console.error("응답 헤더:", error.response.headers);
    }
    
    // 백업 시도: 원래 api 인스턴스 사용
    try {
      console.log("🔄 백업 시도: 원래 api 인스턴스 사용");
      const backupRes = await api.post("/departures", payload);
      console.log("백업 시도 응답:", backupRes.data);
      return backupRes.data;
    } catch (backupError: any) {
      console.error("백업 시도 실패:", backupError);
      
      // 마지막 시도: 서버 상태 확인
      try {
        console.log("🔄 서버 상태 확인 중...");
        const statusAxios = (await import("axios")).default;
        const statusBaseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
        const statusRes = await statusAxios.get(`${statusBaseURL}/actuator/health`);
        console.log("서버 상태:", statusRes.data);
      } catch (statusError) {
        console.error("서버 상태 확인 실패:", statusError);
      }
      
      throw backupError;
    }
  }
}

/** GET /departures - userId로 출국 정보 조회 */
export async function getDeparturesByUserId(userId: number): Promise<DepartureResponse[]> {
  const res = await api.get("/departures", {
    params: { userId }
  });
  return res.data;
}

export async function getDepartures(
  userId: number,
  status?: DepartureStatus
): Promise<Departure[]> {
  const params: Record<string, any> = {
    userId,
    ...(status && { status }),
  };

  const res = await api.get<any>("/departures", { params });

  const list = parseList(res.data).map((x: any) => ({
    departureId: x.departureId ?? x.id,
    userId: x.userId,
    countryCode: x.countryCode,
    startDate: x.startDate,
    endDate: x.endDate ?? null,
    status: normalizeStatus(x.status) ?? "PLANNED",
  })) as Departure[];

  return status ? list.filter(d => normalizeStatus(d.status) === status) : list;
}

export async function getPlannedTripCurrency(userId: number): Promise<string> {
  try {

    const departures = await getDepartures(userId, "PLANNED");
    console.log("조회된 departures:", departures);

    if (!departures.length) {
      return "USD";
    }

    const first = [...departures].sort(
      (a, b) => Date.parse(a.startDate) - Date.parse(b.startDate)
    )[0];

    const cc = first?.countryCode;
    if (cc) {
      const currency = COUNTRY_TO_CURRENCY[cc] || "USD";
      console.log("countryCode:", cc, "→ currency:", currency);
      return currency;
    }

    return "USD";
  } catch (e) {
    return "USD";
  }
}


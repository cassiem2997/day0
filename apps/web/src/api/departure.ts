// src/api/departure.ts
import api from "./axiosInstance";

export interface DeparturePayload {
  userId: number;
  universityId: number | null;
  programTypeId: number | null;
  countryCode: string;
  startDate: string;
  endDate?: string | null;
  status: "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELED";
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

export async function createDeparture(payload: DeparturePayload) {
  const res = await api.post("/departures", payload);
  return res.data;
}

/** GET /departures - userId로 출국 정보 조회 */
export async function getDeparturesByUserId(userId: number): Promise<DepartureResponse[]> {
  const res = await api.get("/departures", {
    params: { userId }
  });
  return res.data;
}

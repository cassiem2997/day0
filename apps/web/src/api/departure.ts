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

export async function createDeparture(payload: DeparturePayload) {
  const res = await api.post("/departures", payload);
  return res.data;
}

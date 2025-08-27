// src/api/university.ts
import api from "./axiosInstance";

export interface UniversityHome {
  universityId: number;
  name: string;
}

export async function getHomeUniversities(): Promise<UniversityHome[]> {
  const { data } = await api.get<UniversityHome[]>("/universities/home");
  return data;
}

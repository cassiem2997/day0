// src/api/university.ts
import api from "./axiosInstance";

export type CountryItem = { countryCode: string; countryName: string };

export type UniversityItem = { id: number; name: string };

export type UniversityHome = { universityId: number; name: string };

export async function getHomeUniversities(): Promise<UniversityHome[]> {
  const { data } = await api.get<Array<{ universityId: number; name: string }>>(
    "/universities/home"
  );
  if (!Array.isArray(data)) return [];
  return data
    .map((u) => ({
      universityId: Number(u.universityId),
      name: String(u.name),
    }))
    .filter(
      (u) =>
        Number.isFinite(u.universityId) &&
        typeof u.name === "string" &&
        u.name.length > 0
    );
}

/** GET /universities/countries → [{ countryCode, countryName }] */
export async function fetchCountryCodes(): Promise<CountryItem[]> {
  const { data } = await api.get<CountryItem[]>("/universities/countries");
  return Array.isArray(data) ? data : [];
}

/** GET /universities/dest/{countryCode} → [{ universityId, name }] */
export async function fetchUniversitiesByCountry(
  countryCode: string
): Promise<UniversityItem[]> {
  const { data } = await api.get<Array<{ universityId: number; name: string }>>(
    `/universities/dest/${encodeURIComponent(countryCode)}`
  );
  if (!Array.isArray(data)) return [];
  return data
    .map((u) => ({ id: Number(u.universityId), name: String(u.name) }))
    .filter((u) => Number.isFinite(u.id) && u.name.length > 0);
}

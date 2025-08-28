import api from "./axiosInstance";

export interface CountryItem {
  countryCode: string;
  countryName: string;
}
export interface UniversityItem {
  id: number;
  name: string;
}

export interface HomeUniversityItem {
  id: number;
  name: string;
}

/** GET /universities/home  → [{ universityId, name }] */
export async function getHomeUniversities(): Promise<HomeUniversityItem[]> {
  const { data } = await api.get<Array<{ universityId: number; name: string }>>(
    "/universities/home"
  );

  if (!Array.isArray(data)) return [];
  return data
    .map((u) => ({ id: Number(u.universityId), name: String(u.name) }))
    .filter((u) => Number.isFinite(u.id) && u.name.length > 0);
}

export async function fetchCountryCodes(): Promise<CountryItem[]> {
  const { data } = await api.get<CountryItem[]>("/universities/countries");
  return Array.isArray(data) ? data : [];
}

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

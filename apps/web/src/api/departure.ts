// src/api/departure.ts
import api from "./axiosInstance";

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

export async function createDeparture(payload: CreateDeparturePayload) {
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

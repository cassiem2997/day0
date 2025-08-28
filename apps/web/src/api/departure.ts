// src/api/departure.ts
import api from "./axiosInstance";

export type DepartureStatus = 'PLANNED' | 'COMPLETED' | 'CANCELLED';

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

const COUNTRY_TO_CURRENCY: { [key: string]: string } = {
  'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR',
  'IT': 'EUR', 'ES': 'EUR', 'NL': 'EUR', 'JP': 'JPY', 'CN': 'CNY',
  'CH': 'CHF', 'AU': 'AUD', 'KR': 'KRW', 'SG': 'SGD', 'HK': 'HKD'
};

export async function getPlannedTripCurrency(userId: number): Promise<string> {
  try {
    console.log('계획된 여행 조회 시작, userId:', userId);
    const departures = await getDepartures(userId, 'PLANNED');
    console.log('조회된 departures:', departures);
    
    if (departures && departures.length > 0) {
      const countryCode = departures[0].countryCode;
      console.log('countryCode:', countryCode);
      
      if (countryCode) {
        const currency = COUNTRY_TO_CURRENCY[countryCode] || 'USD';
        console.log('매핑된 currency:', currency);
        return currency;
      }
    }
    
    console.log('계획된 여행 없음 또는 countryCode 없음, USD 반환');
    return 'USD';
  } catch (error) {
    console.error('계획된 여행 정보 조회 실패:', error);
    return 'USD';
  }
}

export async function getDepartures(userId: number, status?: DepartureStatus): Promise<DeparturePayload[]> {
  const params = { userId, ...(status && { status }) };
  const response = await api.get<{data: DeparturePayload[]}>("/departures", { params });
  return response.data.data;
}
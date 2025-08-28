import api from "./axiosInstance";

export type FxEstimateResponse = {
  data: {
    fromCurrency: string;
    fromCurrencyName: string;
    amount: number;
    toCurrency: string;
    toCurrencyName: string;
    estimatedAmount: number;
  };
  success: boolean;
};

export async function getFxEstimate(params: {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
}) {
  const response = await api.get<FxEstimateResponse>("/fx/estimate", { params });
  return response.data.data;
}

// 환율 알림 관련 타입
export type FxAlertRequest = {
  userId: number;
  baseCcy: string;
  currency: string;
  targetRate: number;
  direction: "LTE";
};

export type FxAlertResponse = {
  success: boolean;
  message?: string;
  data?: any;
};

// 환율 알림 등록 API
export async function createFxAlert(alertData: FxAlertRequest) {
  const response = await api.post<FxAlertResponse>("/fx/alerts", alertData);
  return response.data;
}

// 현재 사용자 정보 타입 (실제 API 응답에 맞춤)
export type UserInfo = {
  userId: number;
  email: string;
  message: string;
};

// 현재 사용자 정보 가져오기 API
export async function getCurrentUser(): Promise<UserInfo> {
  const response = await api.get<UserInfo>("/auth/me");
  return response.data; // .data.data가 아니라 .data만 반환
}
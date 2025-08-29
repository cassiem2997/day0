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

// 환율 알림 내역 조회 API
export async function getFxAlerts(userId: number) {
  const response = await api.get<FxAlertsResponse>(`/fx/alerts?userId=${userId}`);
  return response.data;
}

// 환율 알림 삭제 API
export async function deleteFxAlert(alertId: number) {
  const response = await api.delete<FxAlertResponse>(`/fx/alerts/${alertId}`);
  return response.data;
}

// 환율 알림 내역 타입
export type FxAlert = {
  alertId: number;  // id -> alertId로 변경
  userId: number;
  baseCcy: string;
  currency: string;
  targetRate: number;
  direction: string;
  createdAt: string;  // created -> createdAt으로 변경
  active: boolean;  // isActive -> active로 변경 (API 응답과 일치)
};

export type FxAlertsResponse = {
  success: boolean;
  message?: string;
  data: FxAlert[];
};

// 환전신청 관련 타입
export type FxExchangeRequest = {
  userId: number;
  accountNo: string;
  exchangeCurrency: string;
  exchangeAmount: number;
};

export type FxExchangeResponse = {
  success: boolean;
  message?: string;
  data?: any;
};

// 환전신청 API
export async function createFxExchange(exchangeData: FxExchangeRequest) {
  const response = await api.post<FxExchangeResponse>(`/fx/exchange?userId=${exchangeData.userId}`, exchangeData);
  return response.data;
}

// 환전 내역 관련 타입
export type FxTransaction = {
  bankName: string;
  userName: string;
  accountNo: string;
  accountName: string;
  currency: string;
  currencyName: string;
  amount: number;
  exchangeCurrency: string;
  exchangeCurrencyName: string;
  exchangeAmount: number;
  exchangeRate: number;
  created: string;
};

export type FxTransactionsResponse = {
  data: FxTransaction[];
  success: boolean;
  count: number;
};

// 환전 내역 조회 API
export async function getFxTransactions(
  userId: number,
  accountNo: string,
  startDate: string,
  endDate: string
) {
  const response = await api.get<FxTransactionsResponse>("/fx/transactions", {
    params: {
      userId,
      accountNo,
      startDate,
      endDate,
    },
  });
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
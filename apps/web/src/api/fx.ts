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

export type ExchangeRateChartResponse = {
  success: boolean;
  currency: string;
  chartData: RatePoint[];
  count: number;
  message?: string;
};

export type RatePoint = { date: string; value: number };

export async function getExchangeRateChart(
  currency: string, 
  days?: number
): Promise<RatePoint[]> {
  const params = days ? { days } : {};
  
  const response = await api.get<ExchangeRateChartResponse>(
    `/exchange/rates/chart/${currency}`,
    { params }
  );
  
  if (!response.data.success) {
    throw new Error(response.data.message || '차트 데이터 조회 실패');
  }
  
  return response.data.chartData;
}

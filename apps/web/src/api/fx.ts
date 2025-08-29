import api from "./axiosInstance";
import { useEffect, useRef, useState } from "react";

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
  baseCcy: String;
  currency: string;
  targetRate: number;
  direction: "LTE";
};

export type FxAlertResponse = {
  success: boolean;
  message?: string;
  data?: any;
};

export type AlertMsg = {
  type: string;
  baseCcy?: string;
  quoteCcy?: string;
  currency?: string;
  rate?: number;
  ts?: string | number;
  timestamp?: string | number;
};

export function useFxAlerts(userId: string | number) {
  const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  const esRef = useRef<EventSource | null>(null);
  const [messages, setMessages] = useState<AlertMsg[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // StrictMode 중복 방지: 기존 연결 닫기
    esRef.current?.close();

    const url = `${API}/fx/alerts/stream/${userId}`;
    const es = new EventSource(url, { withCredentials: true });
    esRef.current = es;

    // named events
    const onConnected = () => setConnected(true);
    const onHeartbeat = (_e: MessageEvent) => {/* 필요시 갱신 표시 */};
    const onUpdate = (e: MessageEvent) => {
      try {
        const msg: AlertMsg = JSON.parse(e.data);
        setMessages(prev => [msg, ...prev].slice(0, 200));
      } catch {/* 텍스트 이벤트(connected 등)는 무시 */}
    };

    es.addEventListener("connected", onConnected as any);
    es.addEventListener("heartbeat", onHeartbeat as any);
    es.addEventListener("exchange-rate-update", onUpdate as any);

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    return () => {
      es.removeEventListener("connected", onConnected as any);
      es.removeEventListener("heartbeat", onHeartbeat as any);
      es.removeEventListener("exchange-rate-update", onUpdate as any);
      esRef.current?.close();    // ❗️DELETE 호출 금지 (다른 탭까지 끊김 방지)
      esRef.current = null;
    };
  }, [userId]);

  return { messages, connected };
}
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

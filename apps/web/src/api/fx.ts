// src/api/fx.ts
import api from "./axiosInstance";
import { useEffect, useRef, useState } from "react";

export type FxTransaction = {
  id: string;
  at: string; // ISO or "YYYY-MM-DDTHH:mm:ss(+Z)"
  rateKrwPerUsd: number; // 적용 환율 (KRW per USD)
  usdAmount: number; // 환전 USD
  withdrawKrw: number; // 인출 KRW
};

type Wrapped<T> = {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
};

function normalize(item: any, idx: number): FxTransaction {
  const id = String(
    item?.id ??
      item?.txId ??
      item?.transactionId ??
      item?.uuid ??
      `fx_${Date.now()}_${idx}`
  );

  const at =
    item?.at ??
    item?.createdAt ??
    item?.transactedAt ??
    item?.timestamp ??
    item?.dateTime ??
    item?.date ??
    new Date().toISOString();

  const rate =
    Number(
      item?.rateKrwPerUsd ??
        item?.rate ??
        item?.appliedRate ??
        item?.krwPerUsd ??
        item?.fxRate
    ) || 0;

  const usd =
    Number(
      item?.usdAmount ??
        item?.amountUsd ??
        item?.baseAmount ??
        item?.originAmountUsd
    ) || 0;

  const krw =
    Number(
      item?.withdrawKrw ??
        item?.amountKrw ??
        item?.withdrawAmount ??
        item?.payoutKrw
    ) || 0;

  return {
    id,
    at: String(at),
    rateKrwPerUsd: rate,
    usdAmount: usd,
    withdrawKrw: krw,
  };
}

/** 환전 내역 조회: GET /fx/transactions?userId=&accountNo=&startDate=&endDate= */
export async function fetchFxTransactions(params: {
  userId: number;
  accountNo: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}): Promise<FxTransaction[]> {
  const { data } = await api.get<Wrapped<any[]> | any[]>("/fx/transactions", {
    params,
  });

  const list = Array.isArray((data as any)?.data)
    ? (data as Wrapped<any[]>).data
    : Array.isArray(data)
    ? (data as any[])
    : [];

  return list.map(normalize);
}

// === 알림 신청 ===
export type FxAlertDirection = "LTE" | "GTE";

export type FxAlertRequest = {
  userId: number;
  baseCcy: String;
  currency: string;
  targetRate: number;
  direction: "LTE";
};

export interface FxAlert {
  id: string;
  userId: number;
  baseCcy: string;
  currency: string;
  targetRate: number;
  direction: FxAlertDirection;
  createdAt: string;
  enabled?: boolean;
}

export async function createFxAlert(alertData: FxAlertRequest) {
  const response = await api.post<FxAlertResponse>("/fx/alerts", alertData);
  return response.data;
}

export interface FxEstimateRequest {
  fromCurrency: string; // 예: "KRW"
  toCurrency: string; // 예: "USD"
  amount: number; // 받고 싶은 외화 금액
}

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
      esRef.current?.close();  
      esRef.current = null;
    };
  }, [userId]);

  return { messages, connected };
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


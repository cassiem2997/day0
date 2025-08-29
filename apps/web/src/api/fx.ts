// src/api/fx.ts
import api from "./axiosInstance";

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

export interface FxAlertRequest {
  userId: number; // 현재 로그인 사용자
  baseCcy: string; // 예: "USD"
  currency: string; // 기준통화(원화 등) 예: "KRW"
  targetRate: number; // KRW 값
  direction: FxAlertDirection; // "LTE"(이하) | "GTE"(이상)
}

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

/**
 * 환율 알림 신청: POST /fx/alerts
 * - 백엔드 응답이 { success, data } 또는 바로 객체여도 동작하도록 정규화
 * - 필드명이 다른 백엔드(예: baseCurrency/quoteCurrency/targetKrw/threshold)도 대응
 */
export async function createFxAlert(req: FxAlertRequest): Promise<FxAlert> {
  const payload = {
    userId: req.userId,
    baseCcy: req.baseCcy,
    currency: req.currency,
    targetRate: req.targetRate,
    direction: req.direction,

    // 호환 필드(백엔드가 다른 이름을 쓰는 경우를 대비)
    baseCurrency: req.baseCcy,
    quoteCurrency: req.currency,
    targetKrw: req.targetRate,
    threshold: req.targetRate,
  };

  const { data } = await api.post<Wrapped<any> | any>("/fx/alerts", payload);

  const body = data && (data as any).data ? (data as any).data : data;

  return {
    id: String(
      body?.id ?? body?.alertId ?? body?.uuid ?? `fx_alert_${Date.now()}`
    ),
    userId: Number(body?.userId ?? req.userId),
    baseCcy: String(body?.baseCcy ?? body?.baseCurrency ?? req.baseCcy),
    currency: String(body?.currency ?? body?.quoteCurrency ?? req.currency),
    targetRate: Number(
      body?.targetRate ?? body?.targetKrw ?? body?.threshold ?? req.targetRate
    ),
    direction: (body?.direction ?? req.direction) as FxAlertDirection,
    createdAt: String(body?.createdAt ?? new Date().toISOString()),
    enabled: Boolean(body?.enabled ?? true),
  };
}

export interface FxEstimateRequest {
  fromCurrency: string; // 예: "KRW"
  toCurrency: string; // 예: "USD"
  amount: number; // 받고 싶은 외화 금액
}

export interface FxEstimateResponse {
  amount: number; // 필요한 원화(KRW) 금액
  rate?: number; // 선택: 적용 환율
  fee?: number; // 선택: 수수료
}

export async function getFxEstimate(
  req: FxEstimateRequest
): Promise<FxEstimateResponse> {
  const { data } = await api.post<Wrapped<any> | any>("/fx/estimate", req);

  const body = data && (data as any).data ? (data as any).data : data;

  const amount = Number(
    body?.amount ?? body?.krwAmount ?? body?.requiredKrw ?? 0
  );

  const rate = Number(
    body?.rate ?? body?.fxRate ?? body?.appliedRate ?? body?.krwPerUsd
  );

  const fee = Number(body?.fee ?? body?.charge ?? body?.commission ?? 0);

  return {
    amount,
    rate: Number.isFinite(rate) ? rate : undefined,
    fee: Number.isFinite(fee) ? fee : undefined,
  };
}

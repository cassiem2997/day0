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
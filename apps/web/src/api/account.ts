// src/api/account.ts
import api from "./axiosInstance";

export type AccountType = "SAVING" | "DEPOSIT" | "FX";

export type AccountNormalized = {
  id: string;
  type: AccountType;
  title: string;
  accountNo: string;
  balanceAmount: number;
  currency: "KRW" | "USD";
};

export type AccountProduct = {
  id: string;
  name: string;
  type: AccountType;
  currency: "KRW" | "USD";
  description?: string;
};

type Wrapped<T> = {
  success: boolean;
  data: T;
  message?: string;
  errorCode?: string;
};

const s = (v: unknown) => (v == null ? "" : String(v));

function normalizeOne(item: any, idx: number): AccountNormalized {
  const id = s(
    item?.id ?? item?.accountId ?? item?.uuid ?? `acc_${Date.now()}_${idx}`
  );

  const rawType = s(
    item?.type ?? item?.accountType ?? item?.kind ?? ""
  ).toUpperCase();
  let type: AccountType;
  if (rawType.includes("SAV")) {
    type = "SAVING";
  } else if (rawType.includes("DEP") || rawType.includes("CHK")) {
    type = "DEPOSIT";
  } else {
    type = "FX";
  }

  const title = s(
    item?.title ??
      item?.name ??
      item?.accountName ??
      item?.productName ??
      "계좌"
  );

  const accountNo = s(
    item?.accountNo ?? item?.accountNumber ?? item?.number ?? ""
  );

  const currencyRaw = s(
    item?.currency ?? (type === "FX" ? "USD" : "KRW")
  ).toUpperCase();
  const currency: "KRW" | "USD" = currencyRaw.includes("USD") ? "USD" : "KRW";

  const balanceAmount =
    Number(
      item?.balance ??
        item?.availableBalance ??
        item?.currentBalance ??
        item?.amount ??
        0
    ) || 0;

  return { id, type, title, accountNo, balanceAmount, currency };
}

function normalizeProduct(x: any, i: number): AccountProduct {
  const id = s(x?.id ?? x?.productId ?? `prod_${Date.now()}_${i}`);
  const name = s(x?.name ?? x?.productName ?? "상품");

  const t = s(x?.type ?? x?.accountType ?? x?.category ?? "").toUpperCase();
  const type: AccountType = t.includes("SAV")
    ? "SAVING"
    : t.includes("DEP") || t.includes("CHK")
    ? "DEPOSIT"
    : "FX";

  const c = s(x?.currency ?? (type === "FX" ? "USD" : "KRW")).toUpperCase();
  const currency: "KRW" | "USD" = c.includes("USD") ? "USD" : "KRW";

  const description = s(x?.description ?? x?.desc ?? "");
  return { id, name, type, currency, description };
}

/** 원본 형태로 계좌 목록 조회 (정규화 반환) */
export async function fetchAccounts(): Promise<AccountNormalized[]> {
  const { data } = await api.get<Wrapped<any[]> | any[]>("/accounts");
  const list = Array.isArray((data as any)?.data)
    ? (data as Wrapped<any[]>).data
    : Array.isArray(data)
    ? (data as any[])
    : [];
  return list.map(normalizeOne);
}

/** 생성 가능한 계좌 상품 목록 */
export async function fetchAccountProducts(): Promise<AccountProduct[]> {
  const { data } = await api.get<Wrapped<any[]> | any[]>("/accounts/products");
  const list = Array.isArray((data as any)?.data)
    ? (data as Wrapped<any[]>).data
    : Array.isArray(data)
    ? (data as any[])
    : [];
  return list.map(normalizeProduct);
}

/** 계좌 생성 */
export async function createAccount(body: {
  productId: string | number;
  title?: string;
  initialAmount?: number;
}): Promise<AccountNormalized> {
  const { data } = await api.post<Wrapped<any> | any>("/accounts", body);
  const raw = (data as any)?.data ?? data;
  return normalizeOne(raw, 0);
}

/* ===== MyPageExchange가 사용하는 요약 타입/함수 ===== */
export type AccountSummary = {
  id: string;
  number: string; // 계좌번호
  productName: string; // 표기용 이름(상품/계좌명)
  type: AccountType;
  currency: "KRW" | "USD";
  balance?: number;
};

/**
 * GET /accounts → 로그인 사용자의 계좌 목록(요약형)
 * - 쿠키(세션) 인증 사용: axiosInstance가 withCredentials=true면 자동으로 쿠키 전송됨.
 * - 백엔드가 userId 쿼리를 요구하면 args.userId를 전달, 아니면 무시되어도 OK.
 */
export async function fetchMyAccounts(args?: {
  userId?: number;
}): Promise<AccountSummary[]> {
  const { data } = await api.get<Wrapped<any[]> | any[]>("/accounts", {
    params: args?.userId ? { userId: args.userId } : undefined,
  });

  const arr = Array.isArray((data as any)?.data)
    ? (data as Wrapped<any[]>).data
    : Array.isArray(data)
    ? (data as any[])
    : [];

  const normalized = arr.map(normalizeOne);

  return normalized.map((a) => ({
    id: a.id,
    number: a.accountNo,
    productName: a.title,
    type: a.type,
    currency: a.currency,
    balance: Number.isFinite(a.balanceAmount) ? a.balanceAmount : undefined,
  }));
}

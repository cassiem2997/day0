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
  if (rawType.includes("SAV")) type = "SAVING";
  else if (rawType.includes("DEP") || rawType.includes("CHK")) type = "DEPOSIT";
  else type = "FX";

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

export async function fetchAccounts(): Promise<AccountNormalized[]> {
  const { data } = await api.get<Wrapped<any[]> | any[]>("/accounts");
  const list = Array.isArray((data as any)?.data)
    ? (data as Wrapped<any[]>).data
    : Array.isArray(data)
    ? (data as any[])
    : [];
  return list.map(normalizeOne);
}

export async function fetchAccountProducts(): Promise<AccountProduct[]> {
  const { data } = await api.get<Wrapped<any[]> | any[]>("/accounts/products");
  const list = Array.isArray((data as any)?.data)
    ? (data as Wrapped<any[]>).data
    : Array.isArray(data)
    ? (data as any[])
    : [];
  return list.map(normalizeProduct);
}

export async function createAccount(body: {
  productId: string | number;
  title?: string;
  initialAmount?: number;
}): Promise<AccountNormalized> {
  const { data } = await api.post<Wrapped<any> | any>("/accounts", body);
  const raw = (data as any)?.data ?? data;
  return normalizeOne(raw, 0);
}

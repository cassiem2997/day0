import api from "./axiosInstance";

export type TxnStatus =
  | "RECEIVED"
  | "PROCESSING"
  | "POSTED"
  | "FAILED"
  | string;

export type TxnType = "REGULAR" | "MISSION" | string;

export interface SavingsAccount {
  accountId: number;
  origin: string;
  accountType: string;
  bankCode: string;
  bankName: string;
  accountNo: string;
  currency: string;
  accountBalance: number;
  dailyTransferLimit: number;
  oneTimeTransferLimit: number;
  accountCreateDate: string; // "2025-08-28"
  accountExpireDate: string; // "2025-08-28"
  lastTransactionDate: string; // ISO
  active: boolean;
}

export interface SavingsPlanDetail {
  planId: number;
  userId: number;
  withdrawAccountId: number;
  savingAccount: SavingsAccount;
  startDate: string;     // ISO
  endDate: string;       // ISO
  frequency: string;
  amountPerPeriod: number;
  goalAmount: number;
}

export interface SavingsTxn {
  txnId: number;
  planId: number;
  scheduleId: number;
  txnType: TxnType;
  sourceUciId: number;
  requestedAt: string;   // ISO
  processedAt: string;   // ISO
  amount: number;
  status: TxnStatus;
  idempotencyKey: string;
  externalTxId: string;
  failureReason?: string | null;
  postingTxId?: number | null;
}

export interface PageMeta {
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // current page number
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface PageResponse<T> extends PageMeta {
  content: T[];
  sort?: any;
  pageable?: any;
}

// 적금 플랜
export interface SavingsPlanSummary {
  planId: number;
  userId: number;
  withdrawAccountId: number;
  savingAccountId: number;
  startDate: string;
  endDate: string;
  frequency: string;
  amountPerPeriod: number;
  goalAmount: number;
}

export async function listTransactions(params: {
  planId: number;
  page?: number;
  size?: number;
  sort?: string; // e.g. "processedAt,desc"
}): Promise<PageResponse<SavingsTxn>> {
  const { planId, page = 0, size = 20, sort = "processedAt,desc" } = params;
  const { data } = await api.get("/savings/transactions", {
    params: { planId, page, size, sort },
  });
  return data;
}

export async function getSavingsPlan(planId: number): Promise<SavingsPlanDetail> {
    const { data } = await api.get(`/savings/plans/${planId}`);
  return data;
}

export async function getMySavingsPlans(): Promise<SavingsPlanSummary[]> {
  const { data } = await api.get("/savings", {
    params: { me: true, active: true },
  });
  return data;
}

// 적금 플랜 생성
export interface CreateSavingsPlanRequest {
  userId: number;
  departureId: number;
  withdrawAccountId: number;
  endDate: string;
  frequency: "MONTHLY" | "WEEKLY";
  amountPerPeriod: number;
  depositDay?: number;
  depositWeekday?: number;
}

export async function createSavingsPlan(request: CreateSavingsPlanRequest): Promise<SavingsPlanSummary> {
  const { data } = await api.post("/savings/plans", request);
  return data;
}

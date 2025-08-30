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
  startDate: string; // ISO
  endDate: string; // ISO
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
  requestedAt: string; // ISO
  processedAt: string; // ISO
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

export async function getSavingsPlan(
  planId: number
): Promise<SavingsPlanDetail> {
  const { data } = await api.get(`/savings/plans/${planId}`);
  return data;
}

export async function getMySavingsPlans(): Promise<SavingsPlanSummary[]> {
  const { data } = await api.get("/savings", {
    params: { me: true, active: true },
  });
  return data;
}

export interface CreateSavingsPlanPayload {
  userId: number;
  departureId: number;
  withdrawAccountId: number;
  endDate: string; // "YYYY-MM-DD"
  frequency: "DAILY" | "WEEKLY" | "MONTHLY";
  amountPerPeriod: number; // 숫자
  depositDay?: number; // (월별) 1~31
  depositWeekday?: number; // (주별) 1~7 (월=1 가정)
}

export async function createSavingsPlan(payload: CreateSavingsPlanPayload) {
  const { data } = await api.post("/savings/plans", payload);
  return data; // { planId, ... }
}

// 적금 플랜 생성 권한 확인
export async function checkSavingsPlanPermission(): Promise<{ canCreate: boolean; reason?: string }> {
  try {
    const { data } = await api.get("/savings/permissions");
    return { canCreate: true };
  } catch (error: any) {
    if (error?.response?.status === 403) {
      return { 
        canCreate: false, 
        reason: "일반 적금 플랜 생성 권한이 없습니다. 미션 적금을 사용해주세요." 
      };
    }
    return { 
      canCreate: false, 
      reason: "권한 확인 중 오류가 발생했습니다." 
    };
  }
}

// 미션 적금 플랜 생성 (체크리스트 기반)
export async function createMissionSavingsPlan(payload: CreateSavingsPlanPayload & { 
  checklistId: number;
  missionType: string;
}) {
  const { data } = await api.post("/savings/mission-plans", payload);
  return data;
}

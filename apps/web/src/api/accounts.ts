import api from "./axiosInstance";

// 입출금 계좌
export interface DepositAccount {
  bankCode: string;
  bankName: string;
  userName: string;
  accountNo: string;
  accountName: string | null;
  accountTypeCode: string;
  accountTypeName: string;
  accountCreatedDate: string;
  accountExpiryDate: string;
  dailyTransferLimit: number;
  oneTimeTransferLimit: number;
  accountBalance: number;
  lastTransactionDate: string;
  currency: string;
}

export async function getMyAccounts(): Promise<DepositAccount[]> {
  const { data } = await api.get("/accounts");
  return data;
}

// 입출금 계좌 조회 (새로운 API)
export async function getDemandDepositAccounts(): Promise<DepositAccount[]> {
  const { data } = await api.get("/banks/demand-deposit/accounts");
  return data;
}

/** 계좌 조회 */
export async function tryGetAccountById(accountId: number | string): Promise<DepositAccount | null> {
  try {
    const { data } = await api.get<DepositAccount>(`/accounts/${accountId}`);
    return data;
  } catch {
    return null;
  }
}

// 입출금 계좌에서 출금하기
export interface WithdrawRequest {
  amount: number;
  description?: string;
}

export interface WithdrawResponse {
  transactionId: string;
  status: string;
  amount: number;
  timestamp: string;
  accountNo: string;
}

export async function withdrawFromAccount(
  accountNo: string, 
  amount: number, 
  description: string = "체크리스트 항목 완료"
): Promise<WithdrawResponse> {
  const payload: WithdrawRequest = {
    amount,
    description
  };
  
  const { data } = await api.post(
    `/banks/demand-deposit/accounts/${accountNo}/withdraw`,
    payload
  );
  
  return data;
}
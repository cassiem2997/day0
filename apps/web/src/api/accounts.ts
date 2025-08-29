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

/** 계좌 조회 */
export async function tryGetAccountById(accountId: number | string): Promise<DepositAccount | null> {
  try {
    const { data } = await api.get<DepositAccount>(`/accounts/${accountId}`);
    return data;
  } catch {
    return null;
  }
}
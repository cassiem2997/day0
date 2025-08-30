import api from "./axiosInstance";

// 입출금 계좌
export interface DepositAccount {
  accountId: number;
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

// 계좌 거래내역 조회
export async function fetchAccountTransactions(params: {
  accountId: number;
  startDate: string; // 'YYYYMMDD'
  endDate: string;   // 'YYYYMMDD'
  transactionType?: string; // 'A' 전체, '1' 입금, '2' 출금 등
  orderByType?: 'ASC' | 'DESC';
}) {
  const { accountId, startDate, endDate, transactionType = 'A', orderByType = 'DESC' } = params;
  const { data } = await api.get(`/accounts/accounts/${accountId}/transactions`, {
    params: { startDate, endDate, transactionType, orderByType },
  });
  return data as {
    Header: any | null;
    REC: {
      totalCount: string;
      list: Array<{
        transactionUniqueNo: number;
        transactionDate: string; // 'YYYYMMDD'
        transactionTime: string; // 'HHmmss'
        transactionType: string; // '1' 입금, '2' 출금 (가정)
        transactionTypeName: string; // '입금', '출금'
        transactionAccountNo: string | null;
        transactionBalance: number;         // 거래 금액 (가정)
        transactionAfterBalance: number;    // 거래 후 잔액
        transactionSummary: string;
        transactionMemo: string;
      }>;
    };
  };
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

// 계좌 번호로 accountId 조회
export async function getAccountIdByAccountNo(accountNo: string): Promise<number> {
  const path = `/accounts/accounts/${encodeURIComponent(accountNo)}/find`;
  const { data } = await api.get(path);
  return Number(data);
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
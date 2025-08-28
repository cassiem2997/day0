import api from "./axiosInstance";

// 서버 원본 타입 (그대로 유지)
export type FxEstimateRaw = {
  fromCurrency: string;
  fromCurrencyName: string;
  amount: number;              // (케이스에 따라 from 또는 to 금액)
  toCurrency: string;
  toCurrencyName: string;
  estimatedAmount: number;     // (케이스에 따라 from 또는 to 금액)
};

export type GetFxEstimateParams = {
  fromCurrency: string;  // 보낼 통화 (UI 위)
  toCurrency: string;    // 받을 통화 (UI 아래)
  amount: number;        // 사용자가 입력한 금액 (보낼 통화 기준)
};

export type FxEstimateNormalized = {
  fromCurrency: string;  // 보낼 통화
  toCurrency: string;    // 받을 통화
  fromAmount: number;    // 입력값 (항상 from 통화)
  toAmount: number;      // 결과값 (항상 to 통화)
  raw: FxEstimateRaw;    // 디버깅용
};

// 부동소수 비교용
const approxEq = (a: number, b: number, eps = 1e-9) =>
  Math.abs(a - b) <= eps * Math.max(1, Math.max(Math.abs(a), Math.abs(b)));

export async function getFxEstimate(
  params: GetFxEstimateParams
): Promise<FxEstimateNormalized> {
  // 🚫 더 이상 요청을 뒤집지 않습니다. 사용자가 고른 from/to 그대로 보냅니다.
  const { data } = await api.get<{ data: FxEstimateRaw; success: boolean }>(
    "/fx/estimate",
    { params }
  );
  const raw = data.data;

  let fromAmount: number;
  let toAmount: number;

  // 1) 가장 신뢰도 높은 규칙: "내가 보낸 입력값"이 어느 필드와 같냐로 판정
  if (approxEq(raw.amount, params.amount)) {
    // amount가 내가 친 값이면: amount = from, estimated = to
    fromAmount = raw.amount;
    toAmount = raw.estimatedAmount;
  } else if (approxEq(raw.estimatedAmount, params.amount)) {
    // estimatedAmount가 내가 친 값이면: estimated = from, amount = to
    fromAmount = raw.estimatedAmount;
    toAmount = raw.amount;
  } else {
    // 2) 값이 직접 일치하지 않는 특이 케이스: 문서 규칙에 따른 추정 (amount=to, estimated=from)
    //    -> 우리가 원하는 표준(fromAmount=입력, toAmount=결과)로 변환
    fromAmount = raw.estimatedAmount; // from
    toAmount = raw.amount;            // to
  }

  return {
    fromCurrency: params.fromCurrency,
    toCurrency: params.toCurrency,
    fromAmount,
    toAmount,
    raw,
  };
}

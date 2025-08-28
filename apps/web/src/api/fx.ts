import api from "./axiosInstance";

export type FxEstimate = {
  fromCurrency: string;
  fromCurrencyName: string;
  amount: number | string;            // ← 서버가 string으로 줄 수도 있어 방어
  toCurrency: string;
  toCurrencyName: string;
  estimatedAmount: number | string;   // ← 여기만 쓰면 됨
};

export async function getFxEstimate(params: {
    fromCurrency: string;
    toCurrency: string;
    amount: number;
  }) {
    console.log("[fx] request /fx/estimate", params); // 👀 요청 확인
    const { data } = await api.get<{ data: FxEstimate; success: boolean }>(
      "/fx/estimate",
      { params }
    );
    console.log("[fx] response /fx/estimate", data); // 👀 응답 확인
    return data.data;
  }
  

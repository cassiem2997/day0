import api from "./axiosInstance";

export type FxEstimateResponse = {
  data: {
    fromCurrency: string;
    fromCurrencyName: string;
    amount: number;
    toCurrency: string;
    toCurrencyName: string;
    estimatedAmount: number;
  };
  success: boolean;
};

export async function getFxEstimate(params: {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
}) {
  const response = await api.get<FxEstimateResponse>("/fx/estimate", { params });
  return response.data.data;
}

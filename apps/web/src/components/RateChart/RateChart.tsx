import { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { getExchangeRateChart } from "../../api/fx";
import { getPlannedTripCurrency } from "../../api/departure"; // ← API에서 바로 사용
import type { RatePoint } from "../../api/fx";
import { me } from "../../api/user";
import styles from "./RateChart.module.css";

// 간단 날짜 포맷터
function fmtDate(x: string | number | Date) {
  const d = new Date(x);
  if (isNaN(d.getTime())) return String(x);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

// 기본 차트 컴포넌트
function RateChart({ data, currency }: { data: RatePoint[]; currency?: string }) {
  return (
    <div className={styles.chartWrap}>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5f3dc4" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#5f3dc4" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickMargin={8}
            minTickGap={28}
            tickFormatter={fmtDate}
          />
          <YAxis
            width={48}
            tick={{ fontSize: 12 }}
            domain={["dataMin - 10", "dataMax + 10"]}
            allowDecimals
          />
          <Tooltip
            formatter={(v: any) => [`${Number(v).toLocaleString()}원`, currency ? `${currency}/KRW` : "환율"]}
            labelFormatter={(label) => fmtDate(label as any)}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#5f3dc4"
            strokeWidth={2}
            fill="url(#rateGrad)"
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SmartRateChart() {
  const [currency, setCurrency] = useState<string>("USD");
  const [data, setData] = useState<RatePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      let targetCurrency = "USD"; // 기본값

      try {
        const userInfo = await me();
        if (userInfo?.userId) {
          const plannedCurrency = await getPlannedTripCurrency(userInfo.userId);
          if (plannedCurrency && plannedCurrency !== "undefined") {
            targetCurrency = plannedCurrency;
          }
        }
      } catch {
        // 무시하고 USD 유지
      }

      setCurrency(targetCurrency);

      // 1) 데이터 가져오기
      const chartData = await getExchangeRateChart(targetCurrency);

      // 2) 오름차순 정렬 + 결측치/NaN 방어
      const sortedAsc = chartData
        .filter((p) => p && p.date && Number.isFinite(p.value as any))
        .slice()
        .sort(
          (a, b) =>
            new Date(a.date as any).getTime() - new Date(b.date as any).getTime()
        );

      setData(sortedAsc);
    } catch (err) {
      console.error("차트 데이터 로드 실패:", err);
      setError("환율 데이터를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div>환율 데이터 로딩 중...</div>;
  if (error) return <div>오류: {error}</div>;

  return (
    <div>
      <div
        style={{
          marginBottom: "16px",
          textAlign: "center",
          fontSize: "14px",
          color: "#666",
        }}
      >
        {currency}/KRW 환율
      </div>
      <RateChart data={data} currency={currency} />
    </div>
  );
}

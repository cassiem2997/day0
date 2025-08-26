import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import styles from "./RateChart.module.css";

export type RatePoint = { date: string; value: number };

export default function RateChart({ data }: { data: RatePoint[] }) {
  return (
    <div className={styles.chartWrap}>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart
          data={data}
          margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
        >
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
          />
          <YAxis
            width={48}
            tick={{ fontSize: 12 }}
            domain={["dataMin - 10", "dataMax + 10"]}
          />
          <Tooltip
            formatter={(v: any) => [`${Number(v).toLocaleString()}원`, "환율"]}
            labelFormatter={(label) => `${label}`}
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

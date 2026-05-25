"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type CampaignChartPoint = {
  name: string;
  revenue: number;
  replies: number;
  conversions: number;
  optOuts: number;
};

const axisStyle = {
  fontSize: 12,
  fill: "#78716c"
};

export function CampaignRevenueChart({ data }: { data: CampaignChartPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey="revenue" fill="#0f766e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CampaignResponseChart({ data }: { data: CampaignChartPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} />
          <YAxis tick={axisStyle} tickLine={false} axisLine={false} />
          <Tooltip />
          <Line type="monotone" dataKey="replies" stroke="#0f766e" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="conversions" stroke="#7c3aed" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="optOuts" stroke="#ea580c" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

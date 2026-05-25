---
module: recharts
category: ui
description: Recharts data visualization — composable chart components for analytics dashboards, learner progress, and event metrics
install: npm
---

# Module: recharts

Recharts for data visualization. Used across GTLI (learner progress dashboards), arscca-VMS (event attendance metrics), and secondbrain (activity trends). Standard choice for React + Tailwind projects — composable, customizable, no external charting service.

## Packages

```bash
npm install recharts
```

## Scaffold

**components/charts/LineChart.tsx:**
```tsx
"use client";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  label: string;
  value: number;
}

interface Props {
  data: DataPoint[];
  color?: string;
}

export function LineChart({ data, color = "#6366f1" }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="label" className="text-xs text-muted-foreground" />
        <YAxis className="text-xs text-muted-foreground" />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
```

**components/charts/BarChart.tsx:**
```tsx
"use client";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  label: string;
  value: number;
}

export function BarChart({ data, color = "#6366f1" }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="label" className="text-xs text-muted-foreground" />
        <YAxis className="text-xs text-muted-foreground" />
        <Tooltip />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
```

## No env vars required

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const applicationData = [
  { month: "Jan", applications: 4, interviews: 1 },
  { month: "Feb", applications: 8, interviews: 3 },
  { month: "Mar", applications: 12, interviews: 5 },
  { month: "Apr", applications: 10, interviews: 4 },
  { month: "May", applications: 16, interviews: 7 },
  { month: "Jun", applications: 14, interviews: 6 },
]

const skillGrowthData = [
  { week: "W1", score: 62 },
  { week: "W2", score: 65 },
  { week: "W3", score: 70 },
  { week: "W4", score: 68 },
  { week: "W5", score: 74 },
  { week: "W6", score: 78 },
  { week: "W7", score: 82 },
  { week: "W8", score: 85 },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
        <p className="mb-1 text-xs font-medium text-foreground">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs text-muted-foreground">
            {entry.dataKey}: <span className="font-medium text-foreground">{entry.value}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function DashboardCharts() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Applications Chart */}
      <Card className="border-border bg-card py-0">
        <CardHeader className="pb-2 pt-6 px-6">
          <CardTitle className="text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Applications & Interviews
          </CardTitle>
          <p className="text-sm text-muted-foreground">Monthly activity over the past 6 months</p>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={applicationData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#8888a0', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#8888a0', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="applications"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="interviews"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[#3b82f6]" />
              <span className="text-xs text-muted-foreground">Applications</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-[#10b981]" />
              <span className="text-xs text-muted-foreground">Interviews</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Growth Chart */}
      <Card className="border-border bg-card py-0">
        <CardHeader className="pb-2 pt-6 px-6">
          <CardTitle className="text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Skill Growth
          </CardTitle>
          <p className="text-sm text-muted-foreground">Average assessment score trend</p>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={skillGrowthData}>
                <defs>
                  <linearGradient id="skillGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" vertical={false} />
                <XAxis
                  dataKey="week"
                  tick={{ fill: '#8888a0', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[50, 100]}
                  tick={{ fill: '#8888a0', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#skillGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-[#3b82f6]" />
            <span className="text-xs text-muted-foreground">Assessment Score</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

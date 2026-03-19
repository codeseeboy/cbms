"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  FileText,
  Briefcase,
  BarChart3,
  BookOpen,
  Shield,
  UserCheck,
  ArrowUpRight,
  Sparkles,
} from "lucide-react"
import { getAdminData } from "@/lib/actions/admin"
import type { AdminData } from "@/lib/admin-types"
import { AdminPageHeader } from "@/components/dashboard/admin-page-header"
import { useRealtimeQuery } from "@/lib/hooks/use-realtime-query"

export default function AdminOverviewPage() {
  const queryClient = useQueryClient()
  const { data, isFetching, dataUpdatedAt } = useRealtimeQuery<AdminData | null>({
    queryKey: ["admin", "overview"],
    queryFn: () => getAdminData(),
    realtimeMs: 20_000,
    staleMs: 20_000,
  })
  const refreshMutation = useMutation({
    mutationFn: () => getAdminData(),
    onSuccess: (next) => {
      queryClient.setQueryData(["admin", "overview"], next)
      queryClient.invalidateQueries({ queryKey: ["admin"] })
    },
  })
  const lastUpdated = data ? new Date(dataUpdatedAt) : null

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-3 font-medium text-foreground">Loading overview…</p>
          <p className="mt-1 text-sm text-muted-foreground">Fetching live stats from the database.</p>
        </div>
      </div>
    )
  }

  const roleSeries = [
    { label: "Job Seekers", value: data.roleDistribution.jobseekers, color: "bg-blue-400" },
    { label: "Recruiters", value: data.roleDistribution.recruiters, color: "bg-emerald-400" },
    { label: "Career Coaches", value: data.roleDistribution.coaches, color: "bg-amber-400" },
    { label: "Admins", value: data.roleDistribution.admins, color: "bg-pink-400" },
  ]
  const maxRoleValue = Math.max(...roleSeries.map((r) => r.value), 1)

  return (
    <div>
      <AdminPageHeader
        title="Admin Dashboard"
        subtitle="Monitor platform health, manage users, and moderate content."
        onRefresh={() => refreshMutation.mutate()}
        isRefreshing={isFetching || refreshMutation.isPending}
        lastUpdated={lastUpdated}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {[
          { label: "Users", value: data.stats.totalUsers, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Resumes", value: data.stats.totalResumes, icon: FileText, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Jobs", value: data.stats.totalJobs, icon: Briefcase, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "Assessments", value: data.stats.totalAssessments, icon: BarChart3, color: "text-pink-400", bg: "bg-pink-400/10" },
          { label: "Courses", value: data.stats.totalCourses, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
          { label: "Applications", value: data.stats.totalApplications, icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-400/10" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border bg-card py-0">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid gap-4 xl:grid-cols-3">
        <Card className="border-border bg-card py-0 xl:col-span-2">
          <CardHeader className="pb-3 pt-5 px-5 sm:px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                User Role Distribution
              </CardTitle>
              <Badge variant="outline" className="border-primary/30 text-primary">
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-5 sm:px-6 sm:pb-6">
            {roleSeries.map((item) => (
              <div key={item.label}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.value}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary">
                  <div
                    className={`h-2 rounded-full ${item.color}`}
                    style={{ width: `${Math.max((item.value / maxRoleValue) * 100, item.value ? 10 : 0)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border bg-card py-0">
          <CardHeader className="pb-3 pt-5 px-5 sm:px-6">
            <CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-5 pb-5 sm:px-6 sm:pb-6">
            <Button asChild className="w-full justify-between bg-primary text-primary-foreground">
              <Link href="/dashboard/admin/users">
                Manage users
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between border-border">
              <Link href="/dashboard/admin/jobs">
                Manage job content
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
              <div className="mb-1 flex items-center gap-1.5 text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Clean admin workflow
              </div>
              Use left sidebar for navigation. This page is now overview-only.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pb-4 pt-6 px-6">
            <CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Recent users
            </CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 text-primary" asChild>
              <Link href="/dashboard/admin/users">
                View all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex flex-col gap-3">
              {data.recentUsers.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                  <Avatar className="h-9 w-9 border border-border">
                    <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">{u.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{u.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <span className="shrink-0 rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground capitalize">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card py-0">
          <CardHeader className="flex flex-row items-center justify-between pb-4 pt-6 px-6">
            <CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Recently joined
            </CardTitle>
            <Button variant="ghost" size="sm" className="gap-1 text-primary" asChild>
              <Link href="/dashboard/admin/users">
                View all
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex flex-col gap-3">
              {[
                { label: "Total Users", value: data.stats.totalUsers, help: "All active accounts" },
                { label: "Recruiters", value: data.roleDistribution.recruiters, help: "Hiring side accounts" },
                { label: "Coaches", value: data.roleDistribution.coaches, help: "Guidance accounts" },
                { label: "Admins", value: data.roleDistribution.admins, help: "System managers" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between rounded-lg border border-border bg-secondary/25 px-3 py-2.5">
                  <div>
                    <p className="text-sm text-foreground">{s.label}</p>
                    <p className="text-[11px] text-muted-foreground">{s.help}</p>
                  </div>
                  <p className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Briefcase, Clock3, MessageSquare, Users, ArrowUpRight } from "lucide-react"
import { getRecruiterOverview } from "@/lib/actions/recruiter"
import type { RecruiterOverview } from "@/lib/types"
import { useRealtimeQuery } from "@/lib/hooks/use-realtime-query"

export default function RecruiterOverviewPage() {
  const queryClient = useQueryClient()
  const { data, isFetching } = useRealtimeQuery<RecruiterOverview | null>({
    queryKey: ["recruiter", "overview"],
    queryFn: () => getRecruiterOverview(),
    realtimeMs: 10_000,
    staleMs: 10_000,
  })
  const refreshMutation = useMutation({
    mutationFn: () => getRecruiterOverview(),
    onSuccess: (next) => {
      queryClient.setQueryData(["recruiter", "overview"], next)
      queryClient.invalidateQueries({ queryKey: ["recruiter"] })
    },
  })

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Loading recruiter overview...</p>
      </div>
    )
  }

  const { stats, recentRequests } = data

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            Recruiter Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track company job requests, update statuses, and communicate with candidates.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refreshMutation.mutate()} disabled={isFetching || refreshMutation.isPending} className="border-border">
          Refresh
        </Button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Company Jobs", value: stats.companyJobs, icon: Briefcase, color: "text-primary" },
          { label: "Total Requests", value: stats.requests, icon: Users, color: "text-blue-400" },
          { label: "In Review", value: stats.byStatus.reviewing || 0, icon: Clock3, color: "text-amber-400" },
          { label: "Interviews", value: stats.byStatus.interview || 0, icon: MessageSquare, color: "text-emerald-400" },
        ].map((item) => (
          <Card key={item.label} className="border-border bg-card py-0">
            <CardContent className="flex items-center gap-3 p-4">
              <item.icon className={`h-5 w-5 ${item.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-xl font-bold text-foreground">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="border-border bg-card py-0 lg:col-span-3">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Recent Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-2">
              {recentRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/25 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{r.jobTitle || "Job"}</p>
                    <p className="truncate text-xs text-muted-foreground">Applied {new Date(r.appliedAt).toLocaleString()}</p>
                  </div>
                  <Badge variant="outline" className="border-border text-muted-foreground capitalize">{r.status}</Badge>
                </div>
              ))}
              {recentRequests.length === 0 && <p className="text-sm text-muted-foreground">No requests yet.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card py-0 lg:col-span-2">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-2">
            <Button asChild className="w-full justify-between bg-primary text-primary-foreground">
              <Link href="/dashboard/recruiter/requests">Open Job Requests <ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between border-border">
              <Link href="/dashboard/recruiter/candidates">Search Candidates <ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between border-border">
              <Link href="/dashboard/recruiter/messages">Open Messages <ArrowUpRight className="h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


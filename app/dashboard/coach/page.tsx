"use client"

import Link from "next/link"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Flag, LineChart, MessageSquare, Users, ArrowUpRight } from "lucide-react"
import { getCoachOverview } from "@/lib/actions/coach"
import type { CoachOverview } from "@/lib/types"
import { useRealtimeQuery } from "@/lib/hooks/use-realtime-query"

export default function CoachOverviewPage() {
  const queryClient = useQueryClient()
  const { data, isFetching } = useRealtimeQuery<CoachOverview | null>({
    queryKey: ["coach", "overview"],
    queryFn: () => getCoachOverview(),
    realtimeMs: 10_000,
    staleMs: 10_000,
  })

  const refreshMutation = useMutation({
    mutationFn: () => getCoachOverview(),
    onSuccess: (next) => {
      queryClient.setQueryData(["coach", "overview"], next)
      queryClient.invalidateQueries({ queryKey: ["coach"] })
    },
  })

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Loading coach overview...</p>
      </div>
    )
  }

  const { stats, recentGuidance } = data

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            Mentor Overview
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Monitor learners, provide guidance, and publish learning content.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refreshMutation.mutate()} disabled={isFetching || refreshMutation.isPending}>Refresh</Button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {[
          { label: "Learners", value: stats.learnersCount, icon: Users, color: "text-blue-400" },
          { label: "Assessments", value: stats.completedAssessments, icon: LineChart, color: "text-amber-400" },
          { label: "Goal Progress", value: `${stats.avgGoalProgress}%`, icon: Flag, color: "text-primary" },
          { label: "Coach Courses", value: stats.coachCourses, icon: BookOpen, color: "text-emerald-400" },
          { label: "Active Learners", value: stats.activeLearners, icon: Users, color: "text-pink-400" },
          { label: "Guidance Notes", value: stats.guidanceCount, icon: MessageSquare, color: "text-emerald-400" },
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
            <CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Recent Guidance</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-2">
              {recentGuidance.map((note) => (
                <div key={note.id} className="rounded-lg border border-border bg-secondary/25 p-3">
                  <p className="text-sm text-foreground">{note.text}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {note.coachName} - {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
              {recentGuidance.length === 0 && <p className="text-sm text-muted-foreground">No guidance notes yet.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card py-0 lg:col-span-2">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-6 pb-6">
            <Button asChild className="w-full justify-between bg-primary text-primary-foreground"><Link href="/dashboard/coach/learners">Monitor Learners <ArrowUpRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" className="w-full justify-between border-border"><Link href="/dashboard/coach/content">Open Content Studio <ArrowUpRight className="h-4 w-4" /></Link></Button>
            <Badge variant="outline" className="border-primary/30 text-primary">Realtime backend sync enabled</Badge>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

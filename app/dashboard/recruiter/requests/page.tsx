"use client"

import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getRecruiterRequests, updateRecruiterRequestStatus } from "@/lib/actions/recruiter"
import type { RecruiterRequest } from "@/lib/types"
import { useRealtimeQuery } from "@/lib/hooks/use-realtime-query"

const statuses: RecruiterRequest["status"][] = ["applied", "reviewing", "interview", "offered", "rejected"]

export default function RecruiterRequestsPage() {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [note, setNote] = useState("")

  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ["recruiter", "requests", status || "all", search || ""] as const, [status, search])
  const { data, isFetching } = useRealtimeQuery<RecruiterRequest[]>({
    queryKey,
    queryFn: () => getRecruiterRequests({ status: status || undefined, search: search || undefined }),
    realtimeMs: 10_000,
    staleMs: 10_000,
  })
  const requests = data || []

  const refreshMutation = useMutation({
    mutationFn: () => getRecruiterRequests({ status: status || undefined, search: search || undefined }),
    onSuccess: (next) => {
      queryClient.setQueryData(queryKey, next)
      queryClient.invalidateQueries({ queryKey: ["recruiter", "requests"] })
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus, recruiterNote }: { id: string; nextStatus: RecruiterRequest["status"]; recruiterNote: string }) =>
      updateRecruiterRequestStatus(id, nextStatus, recruiterNote),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiter"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const selected = requests.find((r) => r.id === selectedId) || null

  function updateStatus(next: RecruiterRequest["status"]) {
    if (!selected) return
    statusMutation.mutate({ id: selected.id, nextStatus: next, recruiterNote: note })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            Job Requests
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Only requests for your company jobs are shown here.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refreshMutation.mutate()}
          disabled={isFetching || refreshMutation.isPending || statusMutation.isPending}
        >
          Refresh
        </Button>
      </div>

      <Card className="mb-6 border-border bg-card py-0">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate/job/company"
            className="border-border bg-secondary"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"
          >
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button
            onClick={() => refreshMutation.mutate()}
            disabled={isFetching || refreshMutation.isPending || statusMutation.isPending}
            className="bg-primary text-primary-foreground"
          >
            Apply
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="border-border bg-card py-0 lg:col-span-2">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Requests ({requests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-6 pb-6">
            {requests.map((r) => (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className={`w-full rounded-lg border p-3 text-left transition-all ${
                  selectedId === r.id ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/20 hover:border-primary/25"
                }`}
              >
                <p className="truncate text-sm font-medium text-foreground">{r.candidate?.name || "Candidate"}</p>
                <p className="truncate text-xs text-muted-foreground">{r.job?.title} - {r.job?.company}</p>
                <div className="mt-2 flex items-center justify-between">
                  <Badge variant="outline" className="border-border text-muted-foreground capitalize">
                    {r.status}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">{new Date(r.appliedAt).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
            {requests.length === 0 && <p className="text-sm text-muted-foreground">No requests found.</p>}
          </CardContent>
        </Card>

        <Card className="border-border bg-card py-0 lg:col-span-3">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Request Details
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {!selected && <p className="text-sm text-muted-foreground">Select a request to review.</p>}
            {selected && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-11 w-11 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary">{selected.candidate?.avatar || "NA"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-foreground">{selected.candidate?.name || "Candidate"}</p>
                    <p className="text-xs text-muted-foreground">{selected.candidate?.email}</p>
                    <p className="text-xs text-muted-foreground">{selected.job?.title} - {selected.job?.company}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Resume", value: `${selected.profile.resumeCompleteness}%` },
                    { label: "Experience", value: `${selected.profile.experienceYears} yrs` },
                    { label: "Assessment", value: `${selected.profile.avgAssessmentScore}%` },
                  ].map((x) => (
                    <div key={x.label} className="rounded-lg border border-border bg-secondary/25 p-3">
                      <p className="text-[11px] text-muted-foreground">{x.label}</p>
                      <p className="text-lg font-bold text-foreground">{x.value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Recruiter note (sent with status update)</p>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="border-border bg-secondary"
                    placeholder="Add an update for the candidate..."
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {statuses.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={selected.status === s ? "default" : "outline"}
                      onClick={() => updateStatus(s)}
                      disabled={isFetching || refreshMutation.isPending || statusMutation.isPending}
                      className={selected.status === s ? "bg-primary text-primary-foreground" : "border-border"}
                    >
                      {s}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

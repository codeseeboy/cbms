"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Plus, Trash2, MapPin, Building2 } from "lucide-react"
import { getAdminJobs, createAdminJob, deleteAdminJob } from "@/lib/actions/admin"
import { AdminPageHeader } from "@/components/dashboard/admin-page-header"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRealtimeQuery } from "@/lib/hooks/use-realtime-query"

export default function AdminJobsPage() {
  const queryClient = useQueryClient()
  const { data, isFetching, dataUpdatedAt } = useRealtimeQuery<any[]>({
    queryKey: ["admin", "jobs"],
    queryFn: async () => {
      const list = await getAdminJobs()
      return Array.isArray(list) ? list : []
    },
    realtimeMs: 20_000,
    staleMs: 20_000,
  })
  const jobs = data || []
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const list = await getAdminJobs()
      return Array.isArray(list) ? list : []
    },
    onSuccess: (next) => {
      queryClient.setQueryData(["admin", "jobs"], next)
      queryClient.invalidateQueries({ queryKey: ["admin"] })
    },
  })
  const createJobMutation = useMutation({
    mutationFn: (payload: {
      title: string
      company: string
      location?: string
      type?: string
      salary?: string
      tags?: string
      description?: string
    }) => createAdminJob(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  })
  const deleteJobMutation = useMutation({
    mutationFn: (jobId: string) => deleteAdminJob(jobId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  })
  const lastUpdated = jobs ? new Date(dataUpdatedAt) : null

  function handleCreateJob(formData: FormData) {
    createJobMutation.mutate({
      title: String(formData.get("title") || ""),
      company: String(formData.get("company") || ""),
      location: String(formData.get("location") || ""),
      type: String(formData.get("type") || ""),
      salary: String(formData.get("salary") || ""),
      tags: String(formData.get("tags") || ""),
      description: String(formData.get("description") || ""),
    })
  }

  function handleDeleteJob(jobId: string) {
    if (!confirm("Delete this job posting from the database?")) return
    deleteJobMutation.mutate(jobId)
  }

  return (
    <div>
      <AdminPageHeader
        title="Job content"
        subtitle="Job postings live in the jobs collection; list below is the full set from the API."
        onRefresh={() => refreshMutation.mutate()}
        isRefreshing={isFetching || refreshMutation.isPending || createJobMutation.isPending || deleteJobMutation.isPending}
        lastUpdated={lastUpdated}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="border-border bg-card py-0">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground">Total job postings</p>
            <p className="text-xl font-bold text-foreground">{jobs.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card py-0">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground">Distinct companies</p>
            <p className="text-xl font-bold text-foreground">{new Set(jobs.map((j) => j.company)).size}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card py-0">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground">Data source</p>
            <Badge variant="outline" className="mt-1 border-primary/30 text-primary">MongoDB / API</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card className="border-border bg-card py-0">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                Add job posting
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form action={handleCreateJob} className="space-y-3">
                <input
                  name="title"
                  required
                  placeholder="Job title"
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                />
                <input
                  name="company"
                  required
                  placeholder="Company"
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    name="location"
                    placeholder="Location"
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  />
                  <input
                    name="type"
                    placeholder="Type (e.g. Full-time)"
                    className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                  />
                </div>
                <input
                  name="salary"
                  placeholder="Salary range"
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                />
                <input
                  name="tags"
                  placeholder="Tags (comma separated)"
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                />
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Description"
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground"
                />
                <Button type="submit" disabled={createJobMutation.isPending || deleteJobMutation.isPending} className="w-full gap-2 bg-primary text-primary-foreground">
                  <Plus className="h-4 w-4" />
                  Save to database
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="border-border bg-card py-0">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="flex items-center gap-2 text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                <Briefcase className="h-5 w-5 text-primary" />
                All job postings ({jobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="flex max-h-[min(72vh,820px)] flex-col gap-2 overflow-y-auto pr-1">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-secondary/25 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{job.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {job.company}</span>
                        {job.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {job.location}</span>}
                        {job.type && <Badge variant="outline" className="border-border text-muted-foreground">{job.type}</Badge>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteJob(job.id)}
                      disabled={createJobMutation.isPending || deleteJobMutation.isPending}
                      className="h-9 w-9 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {jobs.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">No jobs in the database yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

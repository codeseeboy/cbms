"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LineChart, Search, BookOpen, BarChart3, Flag, MessageSquare } from "lucide-react"
import { addCoachGuidance, getCoachGuidance, getCoachProgress } from "@/lib/actions/coach"
import type { CoachGuidanceNote, CoachLearnerProgress } from "@/lib/types"
import { useRealtimeQuery } from "@/lib/hooks/use-realtime-query"

export default function CoachLearnersPage() {
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newNote, setNewNote] = useState("")

  const queryClient = useQueryClient()
  const { data: learnersData, isFetching } = useRealtimeQuery<CoachLearnerProgress[]>({
    queryKey: ["coach", "learners", search || ""],
    queryFn: () => getCoachProgress(search.trim() || undefined),
    realtimeMs: 10_000,
    staleMs: 10_000,
  })
  const learners = learnersData || []

  useEffect(() => {
    if (!selectedId && learners.length > 0) setSelectedId(learners[0].user.id)
  }, [learners, selectedId])

  const selected = learners.find((l) => l.user.id === selectedId) || null
  const { data: notesData } = useRealtimeQuery<CoachGuidanceNote[]>({
    queryKey: ["coach", "guidance", selectedId || "none"],
    queryFn: () => (selectedId ? getCoachGuidance(selectedId) : Promise.resolve([])),
    realtimeMs: 8_000,
    staleMs: 8_000,
  })
  const notes = notesData || []

  const addNoteMutation = useMutation({
    mutationFn: ({ userId, text }: { userId: string; text: string }) => addCoachGuidance(userId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach"] })
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  function submitNote() {
    if (!selected || !newNote.trim()) return
    addNoteMutation.mutate({ userId: selected.user.id, text: newNote.trim() })
    setNewNote("")
  }

  const avgGoals = learners.length ? Math.round(learners.reduce((sum, l) => sum + l.metrics.goalsProgress, 0) / learners.length) : 0

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            Learner Monitor
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Track progress and provide mentor guidance in realtime.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["coach"] })} disabled={isFetching}>Refresh</Button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card py-0"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Learners</p><p className="text-2xl font-bold text-foreground">{learners.length}</p></CardContent></Card>
        <Card className="border-border bg-card py-0"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Avg Goal Progress</p><p className="text-2xl font-bold text-foreground">{avgGoals}%</p></CardContent></Card>
        <Card className="border-border bg-card py-0"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Assessments</p><p className="text-2xl font-bold text-foreground">{learners.reduce((sum, l) => sum + l.metrics.completedAssessments, 0)}</p></CardContent></Card>
        <Card className="border-border bg-card py-0"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Guidance Notes</p><p className="text-2xl font-bold text-foreground">{learners.reduce((sum, l) => sum + l.metrics.notesCount, 0)}</p></CardContent></Card>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search learners by name, email, title..." className="pl-9 border-border bg-card" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card className="border-border bg-card py-0">
            <CardHeader className="pb-4 pt-6 px-6"><CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Learners</CardTitle></CardHeader>
            <CardContent className="px-6 pb-6"><div className="space-y-3">{learners.map((learner) => <button key={learner.user.id} onClick={() => setSelectedId(learner.user.id)} className={`w-full rounded-xl border p-4 text-left transition-all ${selected?.user.id === learner.user.id ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/20 hover:border-primary/25"}`}><div className="flex items-start gap-3"><Avatar className="h-10 w-10 border border-border"><AvatarFallback className="bg-primary/10 text-primary">{learner.user.avatar}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{learner.user.name}</p><p className="truncate text-xs text-muted-foreground">{learner.user.email}</p><div className="mt-2 h-1.5 rounded-full bg-secondary"><div className="h-1.5 rounded-full bg-primary" style={{ width: `${learner.metrics.goalsProgress}%` }} /></div></div></div></button>)}{learners.length === 0 && <p className="text-sm text-muted-foreground">No learners found.</p>}</div></CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="border-border bg-card py-0">
            <CardHeader className="pb-4 pt-6 px-6"><CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Learner Details</CardTitle></CardHeader>
            <CardContent className="px-6 pb-6">
              {!selected && <p className="text-sm text-muted-foreground">Select a learner to monitor progress.</p>}
              {selected && (
                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary">{selected.user.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-base font-semibold text-foreground">{selected.user.name}</p>
                      <p className="text-sm text-muted-foreground">{selected.user.title || "Job Seeker"}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      {
                        label: "Assessments",
                        value: `${selected.metrics.completedAssessments} (${selected.metrics.avgAssessmentScore}%)`,
                        icon: BarChart3,
                      },
                      {
                        label: "Learning",
                        value: `${selected.metrics.completedCourses} completed / ${selected.metrics.inProgressCourses} in progress`,
                        icon: BookOpen,
                      },
                      {
                        label: "Career Goals",
                        value: `${selected.metrics.goalsProgress}% (${selected.metrics.totalGoals} goals)`,
                        icon: Flag,
                      },
                      { label: "Guidance", value: `${notes.length} notes`, icon: LineChart },
                    ].map((x) => (
                      <div key={x.label} className="rounded-lg border border-border bg-secondary/25 p-3">
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <x.icon className="h-3.5 w-3.5" /> {x.label}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{x.value}</p>
                      </div>
                    ))}
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Add Guidance</p>
                    <div className="flex gap-2">
                      <Textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Share personalized feedback and next action steps..."
                        rows={3}
                        className="border-border bg-secondary"
                      />
                      <Button
                        onClick={submitNote}
                        disabled={addNoteMutation.isPending || !newNote.trim()}
                        className="self-end bg-primary text-primary-foreground"
                      >
                        Save
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Guidance History</p>
                    <div className="space-y-2">
                      {notes.map((note) => (
                        <div key={note.id} className="rounded-lg border border-border bg-secondary/25 p-3">
                          <p className="text-sm text-foreground">{note.text}</p>
                          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MessageSquare className="h-3.5 w-3.5" /> {note.coachName} -{" "}
                            {new Date(note.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                      {notes.length === 0 && (
                        <Badge variant="outline" className="border-border text-muted-foreground">
                          No notes yet
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useMemo, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Briefcase, GraduationCap, MapPin } from "lucide-react"
import { getRecruiterCandidateDetail, getRecruiterCandidates } from "@/lib/actions/recruiter"
import type { RecruiterCandidate, RecruiterCandidateDetail } from "@/lib/types"
import { useRealtimeQuery } from "@/lib/hooks/use-realtime-query"

export default function RecruiterCandidatesPage() {
  const [search, setSearch] = useState("")
  const [skill, setSkill] = useState("")
  const [minExperience, setMinExperience] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const listQueryKey = useMemo(
    () => ["recruiter", "candidates", search || "", skill || "", minExperience] as const,
    [search, skill, minExperience]
  )
  const { data: candidatesData, isFetching } = useRealtimeQuery<RecruiterCandidate[]>({
    queryKey: listQueryKey,
    queryFn: () =>
      getRecruiterCandidates({
        search: search.trim() || undefined,
        skill: skill.trim() || undefined,
        minExperience,
      }),
    realtimeMs: 15_000,
    staleMs: 20_000,
  })
  const candidates = candidatesData || []

  const detailQueryKey = useMemo(() => ["recruiter", "candidate-detail", selectedId || "none"] as const, [selectedId])
  const { data: selected } = useRealtimeQuery<RecruiterCandidateDetail | null>({
    queryKey: detailQueryKey,
    queryFn: () => (selectedId ? getRecruiterCandidateDetail(selectedId) : Promise.resolve(null)),
    realtimeMs: 20_000,
    staleMs: 20_000,
  })

  const refreshMutation = useMutation({
    mutationFn: () =>
      getRecruiterCandidates({
        search: search.trim() || undefined,
        skill: skill.trim() || undefined,
        minExperience,
      }),
    onSuccess: (next) => {
      queryClient.setQueryData(listQueryKey, next)
      queryClient.invalidateQueries({ queryKey: ["recruiter", "candidates"] })
    },
  })

  const topSkills = useMemo(() => {
    const map = new Map<string, number>()
    candidates.forEach((candidate) => candidate.skills.forEach((s) => map.set(s, (map.get(s) || 0) + 1)))
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  }, [candidates])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            Candidate Search
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Find candidates and review detailed profile insights.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refreshMutation.mutate()} disabled={isFetching || refreshMutation.isPending}>Refresh</Button>
      </div>

      <Card className="mb-6 border-border bg-card py-0">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email, title, location..." className="pl-9 border-border bg-secondary" />
          </div>
          <Input value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Skill" className="border-border bg-secondary" />
          <Input type="number" min={0} value={minExperience} onChange={(e) => setMinExperience(Math.max(0, Number(e.target.value || 0)))} placeholder="Min exp years" className="border-border bg-secondary" />
          <Button onClick={() => refreshMutation.mutate()} disabled={isFetching || refreshMutation.isPending} className="bg-primary text-primary-foreground">Apply Filters</Button>
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border bg-card py-0"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Candidates</p><p className="text-xl font-bold text-foreground">{candidates.length}</p></CardContent></Card>
        <Card className="border-border bg-card py-0"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Top Skills</p><div className="mt-2 flex flex-wrap gap-1.5">{topSkills.map(([name, count]) => <Badge key={name} variant="outline" className="border-primary/30 text-primary">{name} ({count})</Badge>)}</div></CardContent></Card>
        <Card className="border-border bg-card py-0"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Source</p><Badge variant="outline" className="mt-2 border-primary/30 text-primary">Cached + realtime sync</Badge></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Card className="border-border bg-card py-0">
            <CardHeader className="pb-4 pt-6 px-6"><CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Candidates ({candidates.length})</CardTitle></CardHeader>
            <CardContent className="px-6 pb-6"><div className="flex flex-col gap-3">{candidates.map((candidate) => <button key={candidate.id} onClick={() => setSelectedId(candidate.id)} className={`rounded-xl border p-4 text-left transition-all ${selectedId === candidate.id ? "border-primary/40 bg-primary/5" : "border-border bg-secondary/20 hover:border-primary/25"}`}><div className="flex items-start gap-3"><Avatar className="h-10 w-10 border border-border"><AvatarFallback className="bg-primary/10 text-primary">{candidate.avatar}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-foreground">{candidate.name}</p><p className="truncate text-xs text-muted-foreground">{candidate.title || "Job Seeker"}</p><div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground"><span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {candidate.stats.experienceYears} exp</span><span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {candidate.stats.avgScore}%</span></div></div></div></button>)}{candidates.length === 0 && <p className="text-sm text-muted-foreground">No candidates found.</p>}</div></CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="border-border bg-card py-0">
            <CardHeader className="pb-4 pt-6 px-6"><CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Candidate Profile</CardTitle></CardHeader>
            <CardContent className="px-6 pb-6">{!selected && <p className="text-sm text-muted-foreground">Select a candidate to view details.</p>}{selected && <div className="space-y-5"><div className="flex items-start gap-3"><Avatar className="h-12 w-12 border border-border"><AvatarFallback className="bg-primary/10 text-primary">{selected.candidate.avatar}</AvatarFallback></Avatar><div><p className="text-base font-semibold text-foreground">{selected.candidate.name}</p><p className="text-sm text-muted-foreground">{selected.candidate.title || "Job Seeker"}</p><p className="mt-1 text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {selected.candidate.location || "Location not set"}</p></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[{ label: "Assessments", value: selected.insights.completedAssessments },{ label: "Avg Score", value: `${selected.insights.avgAssessmentScore}%` },{ label: "Courses", value: selected.insights.completedCourses },{ label: "Active Goals", value: selected.insights.activeGoals }].map((item) => <div key={item.label} className="rounded-lg border border-border bg-secondary/25 p-3"><p className="text-[11px] text-muted-foreground">{item.label}</p><p className="text-lg font-bold text-foreground">{item.value}</p></div>)}</div><div><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resume Highlights</p><div className="space-y-2">{selected.resumes.slice(0, 2).map((resume) => <div key={resume.id} className="rounded-lg border border-border bg-secondary/25 p-3"><div className="flex items-center justify-between"><p className="text-sm font-medium text-foreground">{resume.title}</p><Badge variant="outline" className="border-emerald-400/30 text-emerald-400">{resume.completeness}% complete</Badge></div><p className="mt-1 text-xs text-muted-foreground line-clamp-2">{resume.summary || "No summary provided."}</p></div>)}{selected.resumes.length === 0 && <p className="text-sm text-muted-foreground">No resumes available.</p>}</div></div></div>}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

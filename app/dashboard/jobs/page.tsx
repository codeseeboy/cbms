"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Search, MapPin, Clock, ExternalLink, Briefcase, CheckCircle2,
  Upload, Loader2, Link2, FileText, Gauge, AlertTriangle, Info,
  ChevronDown, ChevronUp, Trash2, TrendingUp, Sparkles, Target,
  ArrowRight, Star, X, ChevronRight, RefreshCw, Globe, Zap,
} from "lucide-react"
import { getResumes } from "@/lib/actions/resume"
import { getAppliedJobs, getJobs, saveAppliedJob, updateAppliedJobStatus, deleteAppliedJob } from "@/lib/actions/jobs"
import type { Resume, AppliedJob, Job } from "@/lib/types"
import { getClientApiBaseUrl } from "@/lib/get-api-base-url"

type Tab = "match" | "applied" | "suggested"

interface MatchResult {
  score: number
  grade: string
  breakdown: Record<string, { score: number; max: number; label: string; matched?: string[]; missing?: string[] }>
  tips: { severity: string; section: string; tip: string }[]
  matchedSkills: string[]
  missingSkills: string[]
}

interface SuggestedJob {
  id: string
  title: string
  company: string
  match: number
  type: string
  salary: string
  matchedSkills: string[]
}

interface JobDetail {
  title: string
  company: string
  description: string
  location: string
  url: string
}

export default function JobsPage() {
  const API = getClientApiBaseUrl()
  const [tab, setTab] = useState<Tab>("match")
  const [resumes, setResumes] = useState<Resume[]>([])
  const [appliedJobs, setAppliedJobs] = useState<AppliedJob[]>([])
  const [systemJobs, setSystemJobs] = useState<Job[]>([])
  const [selectedResumeId, setSelectedResumeId] = useState<string>("")
  const [jobUrl, setJobUrl] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [jobDetail, setJobDetail] = useState<JobDetail | null>(null)
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestedJob[]>([])
  const [scraping, setScraping] = useState(false)
  const [matching, setMatching] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [online, setOnline] = useState(false)
  const [saving, setSaving] = useState(false)
  const [expandedTip, setExpandedTip] = useState(true)
  const [, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadedResume, setUploadedResume] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [selectedJobDetail, setSelectedJobDetail] = useState<Job | SuggestedJob | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
    checkServer()
  }, [])

  async function checkServer() {
    if (!API) {
      setOnline(false)
      setServerError(
        "Backend URL is not configured. Set NEXT_PUBLIC_API_URL to your Render API URL and redeploy."
      )
      return
    }
    try {
      const r = await fetch(`${API}/api/health`, { signal: AbortSignal.timeout(5000) })
      if (r.ok) { setOnline(true); setServerError(null) }
      else { setOnline(false); setServerError("Server returned an error. Some features may be limited.") }
    } catch {
      setOnline(false)
      setServerError("Cannot connect to matching server. Job scraping and matching are unavailable. You can still track applied jobs manually.")
    }
  }

  async function loadData() {
    const [resumesData, appliedData, jobsData] = await Promise.all([getResumes(), getAppliedJobs(), getJobs()])
    setResumes(resumesData)
    setAppliedJobs(appliedData)
    setSystemJobs(jobsData)
    if (resumesData.length > 0 && !selectedResumeId) setSelectedResumeId(resumesData[0].id)
  }

  const userHasSkills = resumes.some(r => r.skills && r.skills.length > 0) || (uploadedResume?.skills?.length > 0)

  function getSelectedResume(): any {
    if (uploadedResume) return uploadedResume
    const r = resumes.find((r) => r.id === selectedResumeId)
    if (!r) return null
    return {
      personalInfo: r.personalInfo,
      summary: r.summary,
      experience: r.experience,
      education: r.education,
      skills: r.skills,
      projects: (r as any).projects || [],
      certifications: (r as any).certifications || [],
      languages: (r as any).languages || [],
      volunteering: (r as any).volunteering || [],
      awards: (r as any).awards || [],
      publications: (r as any).publications || [],
      achievements: (r as any).achievements || [],
      hobbies: (r as any).hobbies || [],
    }
  }

  async function handleScrapeUrl() {
    if (!jobUrl.trim()) return
    if (!online) {
      setServerError("Cannot scrape job URL — server is offline. Please paste the job description manually.")
      return
    }
    setScraping(true)
    setJobDetail(null)
    try {
      const r = await fetch(`${API}/api/job/scrape-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: jobUrl }),
        signal: AbortSignal.timeout(15000),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err.error || "Failed to scrape")
      }
      const { data } = await r.json()
      setJobDetail(data)
      setJobDescription(data.description || "")
    } catch (err: any) {
      const msg = err.name === "TimeoutError"
        ? "Request timed out. The job portal may be slow or blocking requests."
        : err.message || "Unknown error"
      setServerError(`Could not fetch job from URL: ${msg}. Try pasting the job description manually instead.`)
    }
    setScraping(false)
  }

  async function handleMatch() {
    const resume = getSelectedResume()
    if (!resume || !jobDescription.trim()) {
      setServerError("Please select a resume and provide a job description to start matching.")
      return
    }
    if (!online) {
      setServerError(
        process.env.NODE_ENV === "production"
          ? "Cannot match — API unreachable. Check NEXT_PUBLIC_API_URL and your Render deployment."
          : "Cannot match — server is offline. Start the server (cd server && npm run dev)."
      )
      return
    }
    setMatching(true)
    setMatchResult(null)
    try {
      const r = await fetch(`${API}/api/job/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData: resume, jobDescription }),
        signal: AbortSignal.timeout(15000),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err.error || "Server error")
      }
      const result = await r.json()
      setMatchResult(result)
    } catch (err: any) {
      const msg = err.name === "TimeoutError" ? "Request timed out." : (err.message || "Unknown error")
      setServerError(`Matching failed: ${msg}. Ensure the backend server is running.`)
    }
    setMatching(false)
  }

  async function handleLoadSuggestions() {
    const resume = getSelectedResume()
    if (!resume) return
    setLoadingSuggestions(true)
    try {
      const r = await fetch(`${API}/api/job/suggestions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData: resume }),
      })
      if (r.ok) setSuggestions(await r.json())
    } catch {}
    setLoadingSuggestions(false)
  }

  async function handleApply() {
    if (!jobUrl.trim() || !matchResult) return
    window.open(jobUrl, "_blank")

    setSaving(true)
    await saveAppliedJob({
      title: jobDetail?.title || "Unknown Position",
      company: jobDetail?.company || "Unknown",
      url: jobUrl,
      location: jobDetail?.location || "",
      matchScore: matchResult.score,
      status: "applied",
    })
    await loadData()
    setSaving(false)
  }

  async function handleSaveForLater() {
    if (!matchResult) return
    setSaving(true)
    await saveAppliedJob({
      title: jobDetail?.title || "Unknown Position",
      company: jobDetail?.company || "Unknown",
      url: jobUrl,
      location: jobDetail?.location || "",
      matchScore: matchResult.score,
      status: "saved",
    })
    await loadData()
    setSaving(false)
  }

  async function handleStatusChange(id: string, status: AppliedJob["status"]) {
    startTransition(async () => {
      await updateAppliedJobStatus(id, status)
      await loadData()
    })
  }

  async function handleDeleteApplied(id: string) {
    if (!confirm("Remove this job from your tracker?")) return
    startTransition(async () => {
      await deleteAppliedJob(id)
      await loadData()
    })
  }

  async function handleUploadResume(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !online) return
    setUploading(true)
    try {
      const fd = new globalThis.FormData()
      fd.append("file", file)
      const r = await fetch(`${API}/api/resume/upload`, { method: "POST", body: fd })
      if (!r.ok) throw new Error()
      const { data } = await r.json()
      setUploadedResume(data)
      setSelectedResumeId("")
    } catch {
      alert("Failed to parse resume PDF.")
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  const scoreColor = (s: number) => s >= 70 ? "text-emerald-400" : s >= 50 ? "text-amber-400" : "text-red-400"
  const scoreBg = (s: number) => s >= 70 ? "bg-emerald-400" : s >= 50 ? "bg-amber-400" : "bg-red-400"
  const scoreBorder = (s: number) => s >= 70 ? "border-emerald-400" : s >= 50 ? "border-amber-400" : "border-red-400"

  const appliedCount = appliedJobs.filter((j) => j.status === "applied").length
  const interviewCount = appliedJobs.filter((j) => j.status === "interview").length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              Job Matching
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Match your resume against any job description and track applications.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400" : "bg-destructive"}`} />
              <span className="text-[10px] text-muted-foreground hidden sm:inline">{online ? "Server connected" : "Server offline"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-card rounded-xl border border-border p-1">
        {([
          { id: "match" as Tab, label: "Match Job", icon: <Target className="h-3.5 w-3.5" /> },
          { id: "applied" as Tab, label: `Applied (${appliedJobs.length})`, icon: <Briefcase className="h-3.5 w-3.5" /> },
          { id: "suggested" as Tab, label: "Suggested", icon: <Sparkles className="h-3.5 w-3.5" /> },
        ]).map((t) => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === "suggested" && !suggestions.length) handleLoadSuggestions() }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-medium transition-all ${tab === t.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ===== MATCH TAB ===== */}
      {tab === "match" && (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left: Form */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Resume Selection */}
            <Card className="border-border py-0">
              <CardContent className="p-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Select Resume
                </label>

                {uploadedResume && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5">
                    <Upload className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium flex-1">Uploaded: {uploadedResume.personalInfo?.name || "Resume"}</span>
                    <button onClick={() => { setUploadedResume(null); if (resumes.length) setSelectedResumeId(resumes[0].id) }}
                      className="text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
                  </div>
                )}

                {!uploadedResume && (
                  <div className="flex flex-col gap-2 mb-2">
                    {resumes.length > 0 ? (
                      <select value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)}
                        className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-xs text-foreground">
                        {resumes.map((r) => (
                          <option key={r.id} value={r.id}>{r.title} - {r.personalInfo.name}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs text-muted-foreground">No resumes found. Upload one or create in Resume Builder.</p>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input ref={fileRef} type="file" accept=".pdf" onChange={handleUploadResume} className="hidden" />
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="gap-1.5 h-8 text-xs border-border flex-1">
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploading ? "Parsing..." : "Upload PDF"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Job URL */}
            <Card className="border-border py-0">
              <CardContent className="p-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5" /> Job URL
                </label>
                <div className="flex gap-2">
                  <Input value={jobUrl} onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://linkedin.com/jobs/view/..."
                    onKeyDown={(e) => { if (e.key === "Enter") handleScrapeUrl() }}
                    className="h-9 border-border bg-secondary text-xs flex-1" />
                  <Button variant="outline" size="sm" onClick={handleScrapeUrl} disabled={scraping || !online || !jobUrl.trim()}
                    className="gap-1 h-9 text-xs border-border shrink-0">
                    {scraping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
                    {scraping ? "Fetching..." : "Fetch"}
                  </Button>
                </div>
                {jobDetail?.title && (
                  <div className="mt-2 rounded-lg border border-border bg-secondary/50 p-2.5">
                    <p className="text-xs font-semibold">{jobDetail.title}</p>
                    {jobDetail.company && <p className="text-[10px] text-muted-foreground">{jobDetail.company}{jobDetail.location ? ` · ${jobDetail.location}` : ""}</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Job Description */}
            <Card className="border-border py-0">
              <CardContent className="p-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Job Description
                </label>
                <Textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} rows={8}
                  placeholder="Paste the full job description here, or fetch it from a URL above..."
                  className="border-border bg-secondary text-xs resize-y" />
                <p className="mt-1.5 text-[10px] text-muted-foreground">{jobDescription.length} characters</p>
              </CardContent>
            </Card>

            {/* Match Button */}
            <Button onClick={handleMatch} disabled={matching || !online || (!selectedResumeId && !uploadedResume) || !jobDescription.trim()}
              className="w-full gap-2 h-11 text-sm font-semibold bg-primary text-primary-foreground">
              {matching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              {matching ? "Analyzing Match..." : "Match Resume to Job"}
            </Button>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {matchResult ? (
              <>
                {/* Score Card */}
                <Card className="border-border py-0 overflow-hidden">
                  <div className={`h-1.5 ${scoreBg(matchResult.score)}`} />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full border-4 ${scoreBorder(matchResult.score)}`}>
                            <span className={`text-xl font-bold ${scoreColor(matchResult.score)}`}>{matchResult.score}</span>
                          </div>
                          <div>
                            <h2 className="text-lg font-bold">{matchResult.grade}</h2>
                            <p className="text-xs text-muted-foreground">Resume vs Job Compatibility</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {jobUrl && (
                          <Button size="sm" onClick={handleApply} disabled={saving}
                            className="gap-1.5 bg-primary text-primary-foreground text-xs h-9">
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
                            Apply Now
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={handleSaveForLater} disabled={saving}
                          className="gap-1 text-xs h-9 border-border">
                          <Star className="h-3.5 w-3.5" /> Save
                        </Button>
                      </div>
                    </div>

                    {/* Breakdown Bars */}
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Score Breakdown</h3>
                      <div className="flex flex-col gap-2">
                        {Object.entries(matchResult.breakdown).map(([key, item]) => (
                          <div key={key} className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground w-28 shrink-0">{item.label}</span>
                            <div className="flex-1 h-2.5 rounded-full bg-secondary overflow-hidden">
                              <div className={`h-2.5 rounded-full transition-all ${item.score >= item.max * 0.7 ? "bg-emerald-400" : item.score >= item.max * 0.4 ? "bg-amber-400" : "bg-red-400"}`}
                                style={{ width: `${(item.score / item.max) * 100}%` }} />
                            </div>
                            <span className="text-[11px] font-medium text-muted-foreground w-12 text-right">{item.score}/{item.max}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Skills Tags */}
                    {(matchResult.matchedSkills.length > 0 || matchResult.missingSkills.length > 0) && (
                      <div className="mb-4">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Skills Analysis</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {matchResult.matchedSkills.map((s) => (
                            <Badge key={s} variant="outline" className="text-[10px] border-emerald-400/30 bg-emerald-400/10 text-emerald-400 gap-1">
                              <CheckCircle2 className="h-2.5 w-2.5" /> {s}
                            </Badge>
                          ))}
                          {matchResult.missingSkills.map((s) => (
                            <Badge key={s} variant="outline" className="text-[10px] border-red-400/30 bg-red-400/10 text-red-400 gap-1">
                              <X className="h-2.5 w-2.5" /> {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tips */}
                    {matchResult.tips.length > 0 && (
                      <div>
                        <button onClick={() => setExpandedTip(!expandedTip)}
                          className="w-full flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                          <span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Improvement Tips ({matchResult.tips.length})</span>
                          {expandedTip ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                        {expandedTip && (
                          <div className="flex flex-col gap-1.5">
                            {matchResult.tips.map((tip, i) => (
                              <div key={i} className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${tip.severity === "high" ? "border-red-400/30 bg-red-400/5" : tip.severity === "medium" ? "border-amber-400/30 bg-amber-400/5" : "border-border bg-card"}`}>
                                {tip.severity === "high" ? <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                                  : tip.severity === "medium" ? <Info className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                                  : <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />}
                                <div>
                                  <span className="text-[10px] font-medium text-muted-foreground">{tip.section}</span>
                                  <p className="text-xs">{tip.tip}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-10 w-10 text-primary/40" />
                </div>
                <h3 className="text-base font-semibold text-muted-foreground mb-1">Ready to Match</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Select your resume, paste a job description or URL, and hit "Match" to see how well you fit.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== APPLIED TAB ===== */}
      {tab === "applied" && (
        <div>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total", value: appliedJobs.length, color: "text-primary" },
              { label: "Applied", value: appliedCount, color: "text-blue-400" },
              { label: "Interview", value: interviewCount, color: "text-emerald-400" },
              { label: "Saved", value: appliedJobs.filter((j) => j.status === "saved").length, color: "text-amber-400" },
            ].map((s) => (
              <Card key={s.label} className="border-border py-0">
                <CardContent className="p-3 text-center">
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {appliedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground/20 mb-3" />
              <h3 className="text-sm font-semibold text-muted-foreground">No applied jobs yet</h3>
              <p className="text-xs text-muted-foreground mt-1">Match a job and apply to start tracking.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {appliedJobs.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()).map((job) => (
                <Card key={job.id} className="border-border py-0">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold truncate">{job.title}</h3>
                          <Badge variant="outline" className={`text-[10px] shrink-0 ${
                            job.matchScore >= 70 ? "border-emerald-400/30 text-emerald-400" :
                            job.matchScore >= 50 ? "border-amber-400/30 text-amber-400" :
                            "border-red-400/30 text-red-400"
                          }`}>
                            {job.matchScore}% match
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{job.company}{job.location ? ` · ${job.location}` : ""}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Applied {new Date(job.appliedAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select value={job.status} onChange={(e) => handleStatusChange(job.id, e.target.value as AppliedJob["status"])}
                          className={`rounded-md border px-2 py-1 text-[10px] font-medium ${
                            job.status === "interview" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400" :
                            job.status === "offered" ? "border-blue-400/30 bg-blue-400/10 text-blue-400" :
                            job.status === "rejected" ? "border-red-400/30 bg-red-400/10 text-red-400" :
                            job.status === "saved" ? "border-amber-400/30 bg-amber-400/10 text-amber-400" :
                            "border-border bg-secondary text-muted-foreground"
                          }`}>
                          <option value="saved">Saved</option>
                          <option value="applied">Applied</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="interview">Interview</option>
                          <option value="offered">Offered</option>
                          <option value="rejected">Rejected</option>
                        </select>
                        {job.url && (
                          <Button variant="outline" size="sm" onClick={() => window.open(job.url, "_blank")}
                            className="gap-1 h-7 text-[10px] border-border">
                            <ExternalLink className="h-3 w-3" /> Open
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteApplied(job.id)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== SUGGESTED TAB ===== */}
      {tab === "suggested" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground">
              Jobs suggested based on your resume skills and experience.
            </p>
            <Button variant="outline" size="sm" onClick={handleLoadSuggestions} disabled={loadingSuggestions}
              className="gap-1 h-8 text-xs border-border">
              {loadingSuggestions ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh
            </Button>
          </div>

          {!userHasSkills && !getSelectedResume() ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-400/10 flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-amber-400" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">Complete Your Profile</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Add skills to your profile to get job recommendations. Create a resume in the Resume Builder or upload one to see personalized suggestions.
              </p>
              <Button variant="outline" size="sm" className="mt-4 gap-1.5 text-xs border-border"
                onClick={() => window.location.href = "/dashboard/resume"}>
                <FileText className="h-3.5 w-3.5" /> Go to Resume Builder
              </Button>
            </div>
          ) : !getSelectedResume() && !uploadedResume ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/20 mb-3" />
              <h3 className="text-sm font-semibold text-muted-foreground">No resume selected</h3>
              <p className="text-xs text-muted-foreground mt-1">Create a resume in the Resume Builder first, or upload one in the Match tab.</p>
            </div>
          ) : loadingSuggestions ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-xs text-muted-foreground">Analyzing your resume for best matches...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground/20 mb-3" />
              <h3 className="text-sm font-semibold text-muted-foreground">No suggestions yet</h3>
              <p className="text-xs text-muted-foreground mt-1">Add more skills to your resume to get job suggestions.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {suggestions.map((job) => (
                <Card key={job.id} className="border-border py-0 transition-all hover:border-primary/30 hover:shadow-lg cursor-pointer group"
                  onClick={() => setSelectedJobDetail(job)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">{job.title}</h3>
                        <p className="text-xs text-muted-foreground">{job.company}</p>
                      </div>
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full border-2 ${scoreBorder(job.match)}`}>
                        <span className={`text-xs font-bold ${scoreColor(job.match)}`}>{job.match}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-3">
                      <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {job.type}</span>
                      <span>{job.salary}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {job.matchedSkills.slice(0, 5).map((s) => (
                        <Badge key={s} variant="outline" className="text-[9px] border-emerald-400/20 bg-emerald-400/5 text-emerald-400">
                          {s}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>View Details</span> <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Server Error Banner */}
      {serverError && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:w-96 z-50 rounded-xl border border-amber-400/30 bg-card p-4 shadow-xl">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">Connection Issue</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{serverError}</p>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => { setServerError(null); checkServer() }}
                  className="h-7 text-[10px] border-border gap-1">
                  <RefreshCw className="h-3 w-3" /> Retry
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setServerError(null)}
                  className="h-7 text-[10px]">
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== JOB DETAIL MODAL ===== */}
      {selectedJobDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedJobDetail(null)} />
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur px-6 py-4">
              <div>
                <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                  {"title" in selectedJobDetail ? selectedJobDetail.title : ""}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {"company" in selectedJobDetail ? selectedJobDetail.company : ""}
                </p>
              </div>
              <button onClick={() => setSelectedJobDetail(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6">
              {/* Match Score */}
              {"match" in selectedJobDetail && (
                <div className="flex items-center gap-4 mb-6">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full border-3 ${scoreBorder(selectedJobDetail.match)}`}>
                    <span className={`text-lg font-bold ${scoreColor(selectedJobDetail.match)}`}>{selectedJobDetail.match}%</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Match Score</p>
                    <p className="text-xs text-muted-foreground">Based on your resume skills and experience</p>
                  </div>
                </div>
              )}
              {"matchPercentage" in selectedJobDetail && (selectedJobDetail as any).matchPercentage && (
                <div className="flex items-center gap-4 mb-6">
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full border-3 ${scoreBorder((selectedJobDetail as any).matchPercentage)}`}>
                    <span className={`text-lg font-bold ${scoreColor((selectedJobDetail as any).matchPercentage)}`}>{(selectedJobDetail as any).matchPercentage}%</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Match Score</p>
                    <p className="text-xs text-muted-foreground">Based on your resume skills and experience</p>
                  </div>
                </div>
              )}

              {/* Job Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {"type" in selectedJobDetail && selectedJobDetail.type && (
                  <div className="rounded-lg border border-border bg-secondary/30 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Type</p>
                    <p className="text-xs font-medium">{selectedJobDetail.type}</p>
                  </div>
                )}
                {"salary" in selectedJobDetail && selectedJobDetail.salary && (
                  <div className="rounded-lg border border-border bg-secondary/30 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Salary</p>
                    <p className="text-xs font-medium">{selectedJobDetail.salary}</p>
                  </div>
                )}
                {"location" in selectedJobDetail && (selectedJobDetail as any).location && (
                  <div className="rounded-lg border border-border bg-secondary/30 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Location</p>
                    <p className="text-xs font-medium flex items-center gap-1"><MapPin className="h-3 w-3" /> {(selectedJobDetail as any).location}</p>
                  </div>
                )}
                {"postedAt" in selectedJobDetail && (selectedJobDetail as any).postedAt && (
                  <div className="rounded-lg border border-border bg-secondary/30 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Posted</p>
                    <p className="text-xs font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date((selectedJobDetail as any).postedAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {"description" in selectedJobDetail && (selectedJobDetail as any).description && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Description</h3>
                  <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap rounded-lg border border-border bg-secondary/20 p-4">
                    {(selectedJobDetail as any).description}
                  </div>
                </div>
              )}

              {/* Required Skills */}
              {"matchedSkills" in selectedJobDetail && selectedJobDetail.matchedSkills && selectedJobDetail.matchedSkills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJobDetail.matchedSkills.map((s) => (
                      <Badge key={s} variant="outline" className="text-[10px] border-emerald-400/30 bg-emerald-400/10 text-emerald-400 gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" /> {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {"tags" in selectedJobDetail && (selectedJobDetail as any).tags && (selectedJobDetail as any).tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedJobDetail as any).tags.map((s: string) => (
                      <Badge key={s} variant="outline" className="text-[10px] border-primary/30 bg-primary/10 text-primary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button className="flex-1 gap-2 bg-primary text-primary-foreground h-10 text-sm"
                  onClick={() => {
                    const jd = selectedJobDetail
                    setSelectedJobDetail(null)
                    setTab("match")
                    const skills = "matchedSkills" in jd ? jd.matchedSkills.join(", ") : ("tags" in jd ? (jd as any).tags.join(", ") : "")
                    setJobDescription(`${"title" in jd ? jd.title : ""} at ${"company" in jd ? jd.company : ""}\n\nRequired Skills: ${skills}\n\nType: ${"type" in jd ? jd.type : "Full-time"}\nSalary: ${"salary" in jd ? jd.salary : "Competitive"}`)
                  }}>
                  <Target className="h-4 w-4" /> Match with Resume
                </Button>
                {"url" in selectedJobDetail && (selectedJobDetail as any).url && (
                  <Button variant="outline" className="gap-2 h-10 text-sm border-border"
                    onClick={() => window.open((selectedJobDetail as any).url, "_blank")}>
                    <ExternalLink className="h-4 w-4" /> Apply Now
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

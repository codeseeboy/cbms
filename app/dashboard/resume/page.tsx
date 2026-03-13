"use client"

import { useState, useEffect, useRef, useTransition, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Plus, Download, FileText, Trash2, X, Save, ArrowLeft, Upload,
  Eye, Loader2, GripVertical, Palette, ChevronDown, ChevronUp,
  Globe, Linkedin, Award, FolderOpen, Languages, Trophy, Heart,
  Smartphone, Gauge, AlertTriangle, CheckCircle, Info, TrendingUp,
  ChevronRight, Users, BookOpen, Star, GripHorizontal,
} from "lucide-react"
import { getResumes, createResume, updateResume, deleteResume } from "@/lib/actions/resume"
import type { Resume } from "@/lib/types"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002"

const TEMPLATES: { id: Resume["template"]; name: string; gradient: string; desc: string }[] = [
  { id: "modern", name: "Modern", gradient: "from-blue-500 to-blue-700", desc: "Two-column with blue header" },
  { id: "classic", name: "Classic", gradient: "from-gray-600 to-gray-800", desc: "Traditional formal layout" },
  { id: "minimal", name: "Minimal", gradient: "from-gray-300 to-gray-500", desc: "Ultra-clean whitespace" },
  { id: "creative", name: "Creative", gradient: "from-purple-500 to-blue-600", desc: "Bold sidebar design" },
]

interface ResumeForm {
  title: string
  template: Resume["template"]
  personalInfo: { name: string; email: string; phone: string; location: string; linkedin: string; website: string }
  summary: string
  experience: { id: string; title: string; company: string; period: string; description: string }[]
  education: { id: string; degree: string; school: string; year: string; gpa: string }[]
  skills: string[]
  projects: { id: string; name: string; tech: string; description: string; link: string }[]
  certifications: { id: string; name: string; issuer: string; year: string }[]
  languages: { id: string; language: string; proficiency: string }[]
  volunteering: { id: string; role: string; organization: string; period: string; description: string }[]
  awards: { id: string; title: string; issuer: string; year: string }[]
  publications: { id: string; title: string; publisher: string; year: string; link: string }[]
  achievements: string[]
  hobbies: string[]
}

interface ATSResult {
  score: number
  grade: string
  breakdown: Record<string, { score: number; max: number; label: string }>
  tips: { section: string; severity: string; tip: string }[]
}

function emptyForm(): ResumeForm {
  return {
    title: "Untitled Resume", template: "modern",
    personalInfo: { name: "", email: "", phone: "", location: "", linkedin: "", website: "" },
    summary: "", experience: [], education: [], skills: [], projects: [],
    certifications: [], languages: [], volunteering: [], awards: [], publications: [],
    achievements: [], hobbies: [],
  }
}

export default function ResumePage() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ResumeForm>(emptyForm())
  const [newSkill, setNewSkill] = useState("")
  const [newAchievement, setNewAchievement] = useState("")
  const [newHobby, setNewHobby] = useState("")
  const [previewHtml, setPreviewHtml] = useState("")
  const [downloading, setDownloading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [online, setOnline] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showATS, setShowATS] = useState(false)
  const [atsResult, setAtsResult] = useState<ATSResult | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [previewWidth, setPreviewWidth] = useState(55)
  const [, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const previewTimer = useRef<NodeJS.Timeout>()
  const atsTimer = useRef<NodeJS.Timeout>()
  const dragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const onDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((ev.clientX - rect.left) / rect.width) * 100
      setPreviewWidth(Math.max(30, Math.min(75, 100 - pct)))
    }
    const onUp = () => { dragging.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }, [])

  useEffect(() => { loadResumes(); checkServer() }, [])

  useEffect(() => {
    if (!editorOpen) return
    if (previewTimer.current) clearTimeout(previewTimer.current)
    previewTimer.current = setTimeout(() => refreshPreview(), 400)
    if (atsTimer.current) clearTimeout(atsTimer.current)
    atsTimer.current = setTimeout(() => refreshATS(), 600)
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current)
      if (atsTimer.current) clearTimeout(atsTimer.current)
    }
  }, [form, editorOpen])

  async function checkServer() {
    try { const r = await fetch(`${API}/api/health`); if (r.ok) setOnline(true) } catch { setOnline(false) }
  }
  async function loadResumes() { setResumes(await getResumes()) }

  function openEditor(r?: Resume) {
    if (r) {
      setEditingId(r.id)
      setForm({
        title: r.title, template: r.template,
        personalInfo: { name: r.personalInfo.name, email: r.personalInfo.email, phone: r.personalInfo.phone, location: r.personalInfo.location, linkedin: (r.personalInfo as any).linkedin || "", website: (r.personalInfo as any).website || "" },
        summary: r.summary,
        experience: r.experience.map((e) => ({ ...e })),
        education: r.education.map((e) => ({ ...e, gpa: (e as any).gpa || "" })),
        skills: [...r.skills],
        projects: ((r as any).projects || []).map((p: any) => ({ ...p })),
        certifications: ((r as any).certifications || []).map((c: any) => ({ ...c })),
        languages: ((r as any).languages || []).map((l: any) => ({ ...l })),
        volunteering: ((r as any).volunteering || []).map((v: any) => ({ ...v })),
        awards: ((r as any).awards || []).map((a: any) => ({ ...a })),
        publications: ((r as any).publications || []).map((p: any) => ({ ...p })),
        achievements: [...((r as any).achievements || [])],
        hobbies: [...((r as any).hobbies || [])],
      })
    } else {
      setEditingId(null); setForm(emptyForm())
    }
    setEditorOpen(true); setShowPreview(false); setShowATS(false)
  }

  function closeEditor() { setEditorOpen(false); setEditingId(null); setPreviewHtml(""); setAtsResult(null) }

  async function refreshPreview() {
    if (!online) return
    try {
      const r = await fetch(`${API}/api/resume/preview`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData: form, template: form.template }),
      })
      if (r.ok) setPreviewHtml(await r.text())
    } catch {}
  }

  async function refreshATS() {
    if (!online) return
    try {
      const r = await fetch(`${API}/api/resume/ats-score`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData: form }),
      })
      if (r.ok) setAtsResult(await r.json())
    } catch {}
  }

  async function handleSave() {
    setSaving(true)
    const fd = new globalThis.FormData()
    fd.set("title", form.title); fd.set("template", form.template)
    fd.set("personalName", form.personalInfo.name); fd.set("personalEmail", form.personalInfo.email)
    fd.set("personalPhone", form.personalInfo.phone); fd.set("personalLocation", form.personalInfo.location)
    fd.set("personalLinkedin", form.personalInfo.linkedin); fd.set("personalWebsite", form.personalInfo.website)
    fd.set("summary", form.summary); fd.set("skills", form.skills.join(","))
    fd.set("experience", JSON.stringify(form.experience)); fd.set("education", JSON.stringify(form.education))
    fd.set("projects", JSON.stringify(form.projects)); fd.set("certifications", JSON.stringify(form.certifications))
    fd.set("languages", JSON.stringify(form.languages)); fd.set("volunteering", JSON.stringify(form.volunteering))
    fd.set("awards", JSON.stringify(form.awards)); fd.set("publications", JSON.stringify(form.publications))
    fd.set("achievements", JSON.stringify(form.achievements)); fd.set("hobbies", JSON.stringify(form.hobbies))

    if (editingId) {
      await updateResume(editingId, fd)
    } else {
      const res = await createResume(fd)
      if (res.success && res.id) { setEditingId(res.id); await updateResume(res.id, fd) }
    }
    await loadResumes(); setSaving(false)
  }

  async function handleDownload() {
    if (!online) { alert("Start the resume server: cd server && npm start"); return }
    setDownloading(true)
    try {
      const r = await fetch(`${API}/api/resume/download`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData: form, template: form.template }),
      })
      if (!r.ok) throw new Error("Download failed")
      const blob = await r.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `${form.personalInfo.name || "Resume"}_Resume.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    } catch { alert("PDF generation failed. Is the resume server running on port 4002?") }
    setDownloading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !online) { if (!online) alert("Start the resume server first."); return }
    setUploading(true)
    try {
      const fd = new globalThis.FormData(); fd.append("file", file)
      const r = await fetch(`${API}/api/resume/upload`, { method: "POST", body: fd })
      if (!r.ok) throw new Error()
      const { data, atsScore } = await r.json()

      setForm((prev) => ({
        ...prev,
        title: data.title || data.personalInfo?.name ? `${data.personalInfo.name}'s Resume` : prev.title,
        personalInfo: {
          name: data.personalInfo?.name || prev.personalInfo.name,
          email: data.personalInfo?.email || prev.personalInfo.email,
          phone: data.personalInfo?.phone || prev.personalInfo.phone,
          location: data.personalInfo?.location || prev.personalInfo.location,
          linkedin: data.personalInfo?.linkedin || prev.personalInfo.linkedin,
          website: data.personalInfo?.website || prev.personalInfo.website,
        },
        summary: data.summary || prev.summary,
        experience: data.experience?.length ? data.experience : prev.experience,
        education: data.education?.length ? data.education : prev.education,
        skills: data.skills?.length ? data.skills : prev.skills,
        projects: data.projects?.length ? data.projects : prev.projects,
        certifications: data.certifications?.length ? data.certifications : prev.certifications,
        languages: data.languages?.length ? data.languages : prev.languages,
        volunteering: data.volunteering?.length ? data.volunteering : prev.volunteering,
        awards: data.awards?.length ? data.awards : prev.awards,
        publications: data.publications?.length ? data.publications : prev.publications,
        achievements: data.achievements?.length ? data.achievements : prev.achievements,
        hobbies: data.hobbies?.length ? data.hobbies : prev.hobbies,
      }))

      if (atsScore) setAtsResult(atsScore)
    } catch { alert("Failed to parse resume PDF.") }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ""
  }

  function handleDeleteResume(id: string) {
    if (!confirm("Delete this resume?")) return
    startTransition(async () => { await deleteResume(id); await loadResumes() })
  }

  function set<K extends keyof ResumeForm>(key: K, val: ResumeForm[K]) { setForm((p) => ({ ...p, [key]: val })) }
  function setPersonal(f: string, v: string) { setForm((p) => ({ ...p, personalInfo: { ...p.personalInfo, [f]: v } })) }
  function toggle(section: string) { setCollapsed((p) => ({ ...p, [section]: !p[section] })) }

  function addExperience() { set("experience", [...form.experience, { id: crypto.randomUUID(), title: "", company: "", period: "", description: "" }]) }
  function updateExp(id: string, f: string, v: string) { set("experience", form.experience.map((e) => e.id === id ? { ...e, [f]: v } : e)) }
  function removeExp(id: string) { set("experience", form.experience.filter((e) => e.id !== id)) }
  function addEducation() { set("education", [...form.education, { id: crypto.randomUUID(), degree: "", school: "", year: "", gpa: "" }]) }
  function updateEdu(id: string, f: string, v: string) { set("education", form.education.map((e) => e.id === id ? { ...e, [f]: v } : e)) }
  function removeEdu(id: string) { set("education", form.education.filter((e) => e.id !== id)) }
  function addProject() { set("projects", [...form.projects, { id: crypto.randomUUID(), name: "", tech: "", description: "", link: "" }]) }
  function updateProj(id: string, f: string, v: string) { set("projects", form.projects.map((p) => p.id === id ? { ...p, [f]: v } : p)) }
  function removeProj(id: string) { set("projects", form.projects.filter((p) => p.id !== id)) }
  function addCert() { set("certifications", [...form.certifications, { id: crypto.randomUUID(), name: "", issuer: "", year: "" }]) }
  function updateCert(id: string, f: string, v: string) { set("certifications", form.certifications.map((c) => c.id === id ? { ...c, [f]: v } : c)) }
  function removeCert(id: string) { set("certifications", form.certifications.filter((c) => c.id !== id)) }
  function addLang() { set("languages", [...form.languages, { id: crypto.randomUUID(), language: "", proficiency: "" }]) }
  function updateLang(id: string, f: string, v: string) { set("languages", form.languages.map((l) => l.id === id ? { ...l, [f]: v } : l)) }
  function removeLang(id: string) { set("languages", form.languages.filter((l) => l.id !== id)) }
  function addVol() { set("volunteering", [...form.volunteering, { id: crypto.randomUUID(), role: "", organization: "", period: "", description: "" }]) }
  function updateVol(id: string, f: string, v: string) { set("volunteering", form.volunteering.map((e) => e.id === id ? { ...e, [f]: v } : e)) }
  function removeVol(id: string) { set("volunteering", form.volunteering.filter((e) => e.id !== id)) }
  function addAward() { set("awards", [...form.awards, { id: crypto.randomUUID(), title: "", issuer: "", year: "" }]) }
  function updateAward(id: string, f: string, v: string) { set("awards", form.awards.map((a) => a.id === id ? { ...a, [f]: v } : a)) }
  function removeAward(id: string) { set("awards", form.awards.filter((a) => a.id !== id)) }
  function addPub() { set("publications", [...form.publications, { id: crypto.randomUUID(), title: "", publisher: "", year: "", link: "" }]) }
  function updatePub(id: string, f: string, v: string) { set("publications", form.publications.map((p) => p.id === id ? { ...p, [f]: v } : p)) }
  function removePub(id: string) { set("publications", form.publications.filter((p) => p.id !== id)) }
  function addSkill() { if (newSkill.trim() && !form.skills.includes(newSkill.trim())) { set("skills", [...form.skills, newSkill.trim()]); setNewSkill("") } }
  function addAchievement() { if (newAchievement.trim()) { set("achievements", [...form.achievements, newAchievement.trim()]); setNewAchievement("") } }
  function addHobby() { if (newHobby.trim()) { set("hobbies", [...form.hobbies, newHobby.trim()]); setNewHobby("") } }

  // ===== FULL SCREEN EDITOR =====
  if (editorOpen) {
    const scoreColor = atsResult ? (atsResult.score >= 75 ? "text-emerald-400" : atsResult.score >= 55 ? "text-amber-400" : "text-red-400") : "text-muted-foreground"
    const scoreBg = atsResult ? (atsResult.score >= 75 ? "bg-emerald-400" : atsResult.score >= 55 ? "bg-amber-400" : "bg-red-400") : "bg-muted"

    return (
      <div className="flex h-screen flex-col bg-background">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={closeEditor} className="gap-1 text-muted-foreground h-8 px-2">
              <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span>
            </Button>
            <div className="hidden sm:block h-5 w-px bg-border" />
            <Input value={form.title} onChange={(e) => set("title", e.target.value)}
              className="h-8 w-36 sm:w-48 border-transparent bg-transparent text-sm font-semibold hover:border-border focus:border-border" />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* ATS Score Badge */}
            {atsResult && (
              <button onClick={() => setShowATS(!showATS)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${showATS ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}>
                <Gauge className={`h-3.5 w-3.5 ${scoreColor}`} />
                <span className={scoreColor}>{atsResult.score}</span>
                <span className="hidden sm:inline text-muted-foreground">/100</span>
              </button>
            )}
            <StatusDot online={online} />
            <input ref={fileRef} type="file" accept=".pdf" onChange={handleUpload} className="hidden" />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="gap-1 h-8 px-2 sm:px-3 text-xs border-border">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{uploading ? "Parsing..." : "Upload"}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setShowPreview(!showPreview); setShowATS(false) }}
              className="gap-1 h-8 px-2 sm:px-3 text-xs border-border lg:hidden">
              {showPreview ? <Eye className="h-3.5 w-3.5" /> : <Smartphone className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}
              className="gap-1 h-8 px-2 sm:px-3 text-xs border-border">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{saving ? "Saving..." : "Save"}</span>
            </Button>
            <Button size="sm" onClick={handleDownload} disabled={downloading || !online}
              className="gap-1 h-8 px-2 sm:px-3 text-xs bg-primary text-primary-foreground">
              {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{downloading ? "Generating..." : "Download PDF"}</span>
            </Button>
          </div>
        </div>

        {/* Body */}
        <div ref={containerRef} className="flex flex-1 overflow-hidden">
          {/* Form Panel */}
          <div className={`${showPreview || showATS ? "hidden" : "flex"} lg:flex flex-col overflow-y-auto border-r border-border bg-background p-4 sm:p-5`}
            style={{ width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${100 - previewWidth}%` : undefined }}>

            {/* ATS Score + Suggestions (always visible) */}
            {atsResult && (
              <div className="mb-4 rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Gauge className={`h-4 w-4 ${scoreColor}`} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ATS Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${atsResult.score >= 75 ? "bg-emerald-400/15 text-emerald-400 border-emerald-400/30" : atsResult.score >= 55 ? "bg-amber-400/15 text-amber-400 border-amber-400/30" : "bg-red-400/15 text-red-400 border-red-400/30"}`}>
                      {atsResult.grade}
                    </Badge>
                    <button onClick={() => { setShowATS(true); setShowPreview(false) }} className="text-xs text-primary hover:underline flex items-center gap-0.5 lg:hidden">
                      Details <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className={`text-3xl font-bold ${scoreColor}`}>{atsResult.score}</span>
                  <span className="text-sm text-muted-foreground mb-1">/ 100</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden mb-3">
                  <div className={`h-2 rounded-full ${scoreBg} transition-all duration-500`} style={{ width: `${atsResult.score}%` }} />
                </div>

                {/* Section breakdown mini bars */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
                  {Object.entries(atsResult.breakdown).map(([key, item]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground w-20 truncate">{item.label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className={`h-1.5 rounded-full transition-all ${item.score >= item.max * 0.7 ? "bg-emerald-400" : item.score >= item.max * 0.4 ? "bg-amber-400" : "bg-red-400"}`}
                          style={{ width: `${(item.score / item.max) * 100}%` }} />
                      </div>
                      <span className="text-[9px] text-muted-foreground w-7 text-right">{item.score}/{item.max}</span>
                    </div>
                  ))}
                </div>

                {/* Suggestions always visible */}
                {atsResult.tips.length > 0 && (
                  <div className="border-t border-border pt-2.5">
                    <div className="flex items-center gap-1.5 mb-2">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Suggestions to improve</span>
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                      {atsResult.tips.slice(0, 8).map((tip, i) => (
                        <div key={i} className={`flex items-start gap-2 rounded-md px-2.5 py-1.5 text-[11px] ${tip.severity === "high" ? "bg-red-400/8 text-red-300" : tip.severity === "medium" ? "bg-amber-400/8 text-amber-300" : "bg-secondary text-muted-foreground"}`}>
                          {tip.severity === "high" ? <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                            : tip.severity === "medium" ? <Info className="h-3 w-3 shrink-0 mt-0.5" />
                            : <CheckCircle className="h-3 w-3 shrink-0 mt-0.5" />}
                          <span><strong className="text-[10px]">{tip.section}:</strong> {tip.tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <Section title="Template" icon={<Palette className="h-3.5 w-3.5" />}>
              <div className="grid grid-cols-4 gap-1.5">
                {TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => set("template", t.id)}
                    className={`rounded-lg border p-2 text-center transition-all ${form.template === t.id ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/30"}`}>
                    <div className={`mx-auto mb-1 h-6 w-full rounded bg-gradient-to-br ${t.gradient}`} />
                    <span className="text-[9px] font-medium">{t.name}</span>
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Personal Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Field label="Full Name" value={form.personalInfo.name} onChange={(v) => setPersonal("name", v)} placeholder="John Doe" />
                <Field label="Email" value={form.personalInfo.email} onChange={(v) => setPersonal("email", v)} placeholder="john@example.com" />
                <Field label="Phone" value={form.personalInfo.phone} onChange={(v) => setPersonal("phone", v)} placeholder="+91 98765 43210" />
                <Field label="Location" value={form.personalInfo.location} onChange={(v) => setPersonal("location", v)} placeholder="Mumbai, India" />
                <Field label="LinkedIn" value={form.personalInfo.linkedin} onChange={(v) => setPersonal("linkedin", v)} placeholder="linkedin.com/in/johndoe" icon={<Linkedin className="h-3 w-3" />} />
                <Field label="Website / Portfolio" value={form.personalInfo.website} onChange={(v) => setPersonal("website", v)} placeholder="johndoe.com" icon={<Globe className="h-3 w-3" />} />
              </div>
            </Section>

            <Section title="Professional Summary">
              <Textarea value={form.summary} onChange={(e) => set("summary", e.target.value)} rows={3}
                placeholder="2-3 sentence overview of your career, key strengths, and what you bring..." className="border-border bg-secondary text-sm resize-none" />
            </Section>

            <CollapsibleSection title="Work Experience" count={form.experience.length} collapsed={collapsed.exp} toggle={() => toggle("exp")} onAdd={addExperience}>
              {form.experience.map((exp) => (
                <ItemCard key={exp.id} onRemove={() => removeExp(exp.id)}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Field label="Job Title" value={exp.title} onChange={(v) => updateExp(exp.id, "title", v)} placeholder="Software Engineer" />
                    <Field label="Company" value={exp.company} onChange={(v) => updateExp(exp.id, "company", v)} placeholder="Google" />
                    <div className="sm:col-span-2"><Field label="Period" value={exp.period} onChange={(v) => updateExp(exp.id, "period", v)} placeholder="Jan 2023 - Present" /></div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px] text-muted-foreground">Description</label>
                      <Textarea value={exp.description} onChange={(e) => updateExp(exp.id, "description", e.target.value)} rows={2}
                        placeholder="Key responsibilities, achievements, impact..." className="border-border bg-secondary text-xs resize-none" />
                    </div>
                  </div>
                </ItemCard>
              ))}
              {!form.experience.length && <EmptyAdd onClick={addExperience} text="Add work experience" />}
            </CollapsibleSection>

            <CollapsibleSection title="Education" count={form.education.length} collapsed={collapsed.edu} toggle={() => toggle("edu")} onAdd={addEducation}>
              {form.education.map((edu) => (
                <ItemCard key={edu.id} onRemove={() => removeEdu(edu.id)}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Field label="Degree" value={edu.degree} onChange={(v) => updateEdu(edu.id, "degree", v)} placeholder="B.Tech in Computer Science" />
                    <Field label="School / University" value={edu.school} onChange={(v) => updateEdu(edu.id, "school", v)} placeholder="IIT Mumbai" />
                    <Field label="Year" value={edu.year} onChange={(v) => updateEdu(edu.id, "year", v)} placeholder="2018 - 2022" />
                    <Field label="GPA (optional)" value={edu.gpa} onChange={(v) => updateEdu(edu.id, "gpa", v)} placeholder="8.5/10" />
                  </div>
                </ItemCard>
              ))}
              {!form.education.length && <EmptyAdd onClick={addEducation} text="Add education" />}
            </CollapsibleSection>

            <Section title="Skills" icon={<Badge variant="outline" className="text-[9px] h-4 border-primary/30 text-primary">{form.skills.length}</Badge>}>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {form.skills.map((s) => (
                  <Badge key={s} variant="outline" className="gap-1 border-border bg-secondary text-xs">{s}
                    <button onClick={() => set("skills", form.skills.filter((x) => x !== s))} className="hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add a skill..." value={newSkill} onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill() } }} className="h-8 border-border bg-secondary text-xs flex-1" />
                <Button variant="outline" size="sm" onClick={addSkill} className="h-8 border-border text-xs shrink-0">Add</Button>
              </div>
            </Section>

            <CollapsibleSection title="Projects" count={form.projects.length} collapsed={collapsed.proj} toggle={() => toggle("proj")} onAdd={addProject} icon={<FolderOpen className="h-3.5 w-3.5" />}>
              {form.projects.map((proj) => (
                <ItemCard key={proj.id} onRemove={() => removeProj(proj.id)}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Field label="Project Name" value={proj.name} onChange={(v) => updateProj(proj.id, "name", v)} placeholder="E-Commerce Platform" />
                    <Field label="Technologies" value={proj.tech} onChange={(v) => updateProj(proj.id, "tech", v)} placeholder="React, Node.js, MongoDB" />
                    <div className="sm:col-span-2"><Field label="Link (optional)" value={proj.link} onChange={(v) => updateProj(proj.id, "link", v)} placeholder="github.com/user/project" /></div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px] text-muted-foreground">Description</label>
                      <Textarea value={proj.description} onChange={(e) => updateProj(proj.id, "description", e.target.value)} rows={2}
                        placeholder="What the project does, your role, key outcomes..." className="border-border bg-secondary text-xs resize-none" />
                    </div>
                  </div>
                </ItemCard>
              ))}
              {!form.projects.length && <EmptyAdd onClick={addProject} text="Add a project" />}
            </CollapsibleSection>

            <CollapsibleSection title="Certifications" count={form.certifications.length} collapsed={collapsed.cert} toggle={() => toggle("cert")} onAdd={addCert} icon={<Award className="h-3.5 w-3.5" />}>
              {form.certifications.map((c) => (
                <ItemCard key={c.id} onRemove={() => removeCert(c.id)}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2"><Field label="Certification Name" value={c.name} onChange={(v) => updateCert(c.id, "name", v)} placeholder="AWS Solutions Architect" /></div>
                    <Field label="Issuer" value={c.issuer} onChange={(v) => updateCert(c.id, "issuer", v)} placeholder="Amazon" />
                    <Field label="Year" value={c.year} onChange={(v) => updateCert(c.id, "year", v)} placeholder="2024" />
                  </div>
                </ItemCard>
              ))}
              {!form.certifications.length && <EmptyAdd onClick={addCert} text="Add a certification" />}
            </CollapsibleSection>

            <CollapsibleSection title="Languages" count={form.languages.length} collapsed={collapsed.lang} toggle={() => toggle("lang")} onAdd={addLang} icon={<Languages className="h-3.5 w-3.5" />}>
              {form.languages.map((l) => (
                <ItemCard key={l.id} onRemove={() => removeLang(l.id)}>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Language" value={l.language} onChange={(v) => updateLang(l.id, "language", v)} placeholder="English" />
                    <Field label="Proficiency" value={l.proficiency} onChange={(v) => updateLang(l.id, "proficiency", v)} placeholder="Native / Fluent" />
                  </div>
                </ItemCard>
              ))}
              {!form.languages.length && <EmptyAdd onClick={addLang} text="Add a language" />}
            </CollapsibleSection>

            <CollapsibleSection title="Volunteering & Leadership" count={form.volunteering.length} collapsed={collapsed.vol} toggle={() => toggle("vol")} onAdd={addVol} icon={<Users className="h-3.5 w-3.5" />}>
              {form.volunteering.map((v) => (
                <ItemCard key={v.id} onRemove={() => removeVol(v.id)}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Field label="Role / Position" value={v.role} onChange={(val) => updateVol(v.id, "role", val)} placeholder="GDSC Tech Team Leader" />
                    <Field label="Organization" value={v.organization} onChange={(val) => updateVol(v.id, "organization", val)} placeholder="Google Developer Student Club" />
                    <Field label="Period" value={v.period} onChange={(val) => updateVol(v.id, "period", val)} placeholder="Sep 2023 - Mar 2024" />
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px] text-muted-foreground">Description (optional)</label>
                      <Textarea value={v.description} onChange={(e) => updateVol(v.id, "description", e.target.value)} rows={2}
                        placeholder="What you did, impact, leadership..." className="border-border bg-secondary text-xs resize-none" />
                    </div>
                  </div>
                </ItemCard>
              ))}
              {!form.volunteering.length && <EmptyAdd onClick={addVol} text="Add volunteering / leadership" />}
            </CollapsibleSection>

            <CollapsibleSection title="Awards & Scholarships" count={form.awards.length} collapsed={collapsed.award} toggle={() => toggle("award")} onAdd={addAward} icon={<Star className="h-3.5 w-3.5" />}>
              {form.awards.map((a) => (
                <ItemCard key={a.id} onRemove={() => removeAward(a.id)}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2"><Field label="Award / Scholarship Title" value={a.title} onChange={(v) => updateAward(a.id, "title", v)} placeholder="Top 10 at Hackanova 4.0" /></div>
                    <Field label="Issuer / Event" value={a.issuer} onChange={(v) => updateAward(a.id, "issuer", v)} placeholder="Thakur College" />
                    <Field label="Year" value={a.year} onChange={(v) => updateAward(a.id, "year", v)} placeholder="2025" />
                  </div>
                </ItemCard>
              ))}
              {!form.awards.length && <EmptyAdd onClick={addAward} text="Add an award / scholarship" />}
            </CollapsibleSection>

            <CollapsibleSection title="Publications" count={form.publications.length} collapsed={collapsed.pub} toggle={() => toggle("pub")} onAdd={addPub} icon={<BookOpen className="h-3.5 w-3.5" />}>
              {form.publications.map((p) => (
                <ItemCard key={p.id} onRemove={() => removePub(p.id)}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="sm:col-span-2"><Field label="Title" value={p.title} onChange={(v) => updatePub(p.id, "title", v)} placeholder="Machine Learning for Web Applications" /></div>
                    <Field label="Publisher / Journal" value={p.publisher} onChange={(v) => updatePub(p.id, "publisher", v)} placeholder="IEEE" />
                    <Field label="Year" value={p.year} onChange={(v) => updatePub(p.id, "year", v)} placeholder="2024" />
                    <div className="sm:col-span-2"><Field label="Link (optional)" value={p.link} onChange={(v) => updatePub(p.id, "link", v)} placeholder="doi.org/10.1234/example" /></div>
                  </div>
                </ItemCard>
              ))}
              {!form.publications.length && <EmptyAdd onClick={addPub} text="Add a publication" />}
            </CollapsibleSection>

            <Section title="Achievements" icon={<Trophy className="h-3.5 w-3.5" />}>
              <div className="mb-2 flex flex-col gap-1.5">
                {form.achievements.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 rounded border border-border bg-secondary px-3 py-1.5">
                    <span className="flex-1 text-xs">{a}</span>
                    <button onClick={() => set("achievements", form.achievements.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="e.g. Won national hackathon 2024" value={newAchievement} onChange={(e) => setNewAchievement(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAchievement() } }} className="h-8 border-border bg-secondary text-xs flex-1" />
                <Button variant="outline" size="sm" onClick={addAchievement} className="h-8 border-border text-xs shrink-0">Add</Button>
              </div>
            </Section>

            <Section title="Hobbies & Interests" icon={<Heart className="h-3.5 w-3.5" />}>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {form.hobbies.map((h, i) => (
                  <Badge key={i} variant="outline" className="gap-1 border-border bg-secondary text-xs">{h}
                    <button onClick={() => set("hobbies", form.hobbies.filter((_, j) => j !== i))} className="hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="e.g. Photography, Chess" value={newHobby} onChange={(e) => setNewHobby(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHobby() } }} className="h-8 border-border bg-secondary text-xs flex-1" />
                <Button variant="outline" size="sm" onClick={addHobby} className="h-8 border-border text-xs shrink-0">Add</Button>
              </div>
            </Section>

            <div className="h-8" />
          </div>

          {/* Drag handle (desktop only) */}
          <div className="hidden lg:flex w-1.5 cursor-col-resize items-center justify-center bg-border/40 hover:bg-primary/20 transition-colors select-none shrink-0"
            onMouseDown={onDragStart}>
            <GripHorizontal className="h-4 w-4 text-muted-foreground/50 rotate-90" />
          </div>

          {/* Right panel: Preview + ATS Details */}
          <div className={`${showPreview || showATS ? "flex" : "hidden"} lg:flex flex-col overflow-hidden`}
            style={{ width: typeof window !== "undefined" && window.innerWidth >= 1024 ? `${previewWidth}%` : undefined }}>
            {/* Desktop tab bar */}
            <div className="hidden lg:flex border-b border-border bg-card">
              <button onClick={() => { setShowATS(false); setShowPreview(true) }}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all border-b-2 ${!showATS ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <Eye className="h-3.5 w-3.5" /> Preview
              </button>
              <button onClick={() => setShowATS(true)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all border-b-2 ${showATS ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                <Gauge className="h-3.5 w-3.5" /> ATS Details
                {atsResult && <span className={`ml-1 text-[10px] font-bold ${scoreColor}`}>{atsResult.score}</span>}
              </button>
            </div>

            {showATS && atsResult ? (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
                <div className="max-w-lg mx-auto">
                  <button onClick={() => setShowATS(false)} className="lg:hidden mb-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-3 w-3" /> Back to form
                  </button>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 mb-3" style={{ borderColor: atsResult.score >= 75 ? "#34d399" : atsResult.score >= 55 ? "#fbbf24" : "#f87171" }}>
                      <span className={`text-2xl font-bold ${scoreColor}`}>{atsResult.score}</span>
                    </div>
                    <h2 className="text-lg font-bold">{atsResult.grade}</h2>
                    <p className="text-xs text-muted-foreground mt-1">ATS Compatibility Score</p>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Score Breakdown</h3>
                    <div className="flex flex-col gap-2">
                      {Object.entries(atsResult.breakdown).map(([key, item]) => (
                        <div key={key} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-24 shrink-0">{item.label}</span>
                          <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                            <div className={`h-2 rounded-full transition-all ${item.score >= item.max * 0.7 ? "bg-emerald-400" : item.score >= item.max * 0.4 ? "bg-amber-400" : "bg-red-400"}`}
                              style={{ width: `${(item.score / item.max) * 100}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-10 text-right">{item.score}/{item.max}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {atsResult.tips.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5" /> Improvement Tips
                      </h3>
                      <div className="flex flex-col gap-2">
                        {atsResult.tips.map((tip, i) => (
                          <div key={i} className={`flex items-start gap-2.5 rounded-lg border p-3 ${tip.severity === "high" ? "border-red-400/30 bg-red-400/5" : tip.severity === "medium" ? "border-amber-400/30 bg-amber-400/5" : "border-border bg-card"}`}>
                            {tip.severity === "high" ? <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                              : tip.severity === "medium" ? <Info className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                              : <CheckCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />}
                            <div>
                              <span className="text-[10px] font-medium text-muted-foreground">{tip.section}</span>
                              <p className="text-xs">{tip.tip}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-auto bg-[#1e1e2e] p-4 sm:p-8">
                <div className="mx-auto w-full" style={{ maxWidth: "850px" }}>
                  {previewHtml ? (
                    <div className="rounded-lg bg-white shadow-2xl overflow-hidden">
                      <iframe srcDoc={previewHtml} className="w-full border-0" style={{ height: "1120px" }} title="Resume Preview" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                      <Palette className="mb-4 h-16 w-16 text-white/10" />
                      <p className="text-base font-medium text-white/50">{online ? "Start typing to see your resume" : "Resume server is offline"}</p>
                      <p className="mt-2 text-sm text-white/30">{online ? "Changes appear here in real-time" : "Run: cd server && npm start"}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ===== RESUME LIST =====
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>Resume Builder</h1>
            <p className="mt-1 text-sm text-muted-foreground">Create professional, ATS-optimized resumes.</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot online={online} />
            <Button onClick={() => openEditor()} className="bg-primary text-primary-foreground gap-2 h-9"><Plus className="h-4 w-4" /> New Resume</Button>
          </div>
        </div>
      </div>

      <h2 className="mb-3 text-base sm:text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>Choose a Template</h2>
      <div className="mb-6 sm:mb-8 grid gap-3 grid-cols-2 lg:grid-cols-4">
        {TEMPLATES.map((t) => (
          <Card key={t.id} onClick={() => { const f = emptyForm(); f.template = t.id; setForm(f); setEditingId(null); setEditorOpen(true) }}
            className="border-border cursor-pointer transition-all hover:border-primary/30 hover:shadow-lg py-0 group">
            <CardContent className="p-3 sm:p-5">
              <div className={`mb-3 h-20 sm:h-36 rounded-xl bg-gradient-to-br ${t.gradient} flex items-center justify-center relative overflow-hidden`}>
                <div className="relative z-10 flex flex-col items-start gap-1 w-12 sm:w-20">
                  <div className="h-1 sm:h-1.5 w-full rounded bg-white/40" />
                  <div className="h-0.5 sm:h-1 w-3/4 rounded bg-white/25" />
                  <div className="h-0.5 sm:h-1 w-5/6 rounded bg-white/25" />
                  <div className="mt-1 h-0.5 sm:h-1 w-full rounded bg-white/15" />
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-white text-xs font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">Use Template</span>
                </div>
              </div>
              <h3 className="text-xs sm:text-sm font-semibold">{t.name}</h3>
              <p className="mt-0.5 text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{t.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 text-base sm:text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>My Resumes ({resumes.length})</h2>
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {resumes.map((resume) => (
          <Card key={resume.id} className="border-border py-0">
            <CardContent className="p-4 sm:p-5">
              <div className="mb-2 flex items-center justify-between">
                <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">{resume.template}</Badge>
                <span className="text-[10px] text-muted-foreground">{resume.completeness}%</span>
              </div>
              <div className={`mb-3 h-20 sm:h-28 rounded-lg bg-gradient-to-br ${TEMPLATES.find((t) => t.id === resume.template)?.gradient || "from-blue-500 to-blue-700"} flex items-center justify-center`}>
                <FileText className="h-8 w-8 text-white/30" />
              </div>
              <h3 className="text-sm font-semibold truncate">{resume.title}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{resume.personalInfo.name || "No name"}</p>
              <div className="mt-2 h-1.5 rounded-full bg-secondary">
                <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${resume.completeness}%` }} />
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditor(resume)} className="flex-1 gap-1 text-xs h-8"><Eye className="h-3.5 w-3.5" /> Edit</Button>
                <Button variant="outline" size="sm" onClick={() => handleDeleteResume(resume.id)} className="text-destructive hover:bg-destructive/10 text-xs h-8"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!resumes.length && (
          <Card onClick={() => openEditor()} className="flex min-h-[200px] cursor-pointer items-center justify-center border-2 border-dashed border-border py-0 col-span-full sm:col-span-1">
            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Plus className="h-5 w-5 text-primary" /></div>
              <p className="text-sm font-medium">Create Your First Resume</p>
              <p className="text-xs text-muted-foreground">Choose a template and start building</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function StatusDot({ online }: { online: boolean }) {
  return (
    <div className="flex items-center gap-1.5 mr-1 sm:mr-2">
      <div className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400" : "bg-destructive"}`} />
      <span className="text-[10px] text-muted-foreground hidden sm:inline">{online ? "Server connected" : "Server offline"}</span>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</label>
        {icon}
      </div>
      {children}
    </div>
  )
}

function CollapsibleSection({ title, count, collapsed, toggle, onAdd, icon, children }: {
  title: string; count: number; collapsed?: boolean; toggle: () => void; onAdd: () => void; icon?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <button onClick={toggle} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          {icon} {title}
          <Badge variant="outline" className="text-[9px] h-4 border-primary/30 text-primary">{count}</Badge>
          {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
        </button>
        <Button variant="ghost" size="sm" onClick={onAdd} className="h-6 gap-1 text-xs text-primary"><Plus className="h-3 w-3" />Add</Button>
      </div>
      {!collapsed && <div className="flex flex-col gap-2.5">{children}</div>}
    </div>
  )
}

function ItemCard({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between">
        <GripVertical className="h-4 w-4 text-muted-foreground/30" />
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
      {children}
    </div>
  )
}

function EmptyAdd({ onClick, text }: { onClick: () => void; text: string }) {
  return (
    <button onClick={onClick} className="rounded-lg border-2 border-dashed border-border p-3 text-center text-xs text-muted-foreground hover:border-primary/30 transition-all">
      <Plus className="mx-auto mb-1 h-4 w-4" />{text}
    </button>
  )
}

function Field({ label, value, onChange, placeholder, icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] text-muted-foreground">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</div>}
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className={`h-8 border-border bg-secondary text-xs ${icon ? "pl-7" : ""}`} />
      </div>
    </div>
  )
}

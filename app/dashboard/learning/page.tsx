"use client"

import { useState, useEffect, useTransition, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search, BookOpen, Clock, PlayCircle, CheckCircle2, ChevronDown,
  ChevronUp, ArrowLeft, Download, Award, Loader2, Play, Lock,
  ChevronRight, Trophy, GraduationCap, BarChart3, X,
} from "lucide-react"
import {
  getCourses, getUserCourses, enrollCourse, markVideoWatched,
  setCurrentVideo, getCertificates,
} from "@/lib/actions/learning"
import type { Course, UserCourse, Certificate, CourseModule, CourseVideo } from "@/lib/types"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002"
const categories = ["All", "Development", "DevOps", "Design"]

export default function LearningPage() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [courses, setCourses] = useState<Course[]>([])
  const [userCourses, setUserCourses] = useState<UserCourse[]>([])
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [activeCourse, setActiveCourse] = useState<Course | null>(null)
  const [activeVideo, setActiveVideo] = useState<CourseVideo | null>(null)
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()
  const [online, setOnline] = useState(false)
  const [downloadingCert, setDownloadingCert] = useState(false)
  const [showCerts, setShowCerts] = useState(false)

  useEffect(() => { loadData(); checkServer() }, [])

  async function checkServer() {
    try { const r = await fetch(`${API}/api/health`); if (r.ok) setOnline(true) } catch { setOnline(false) }
  }

  async function loadData() {
    const [c, uc, certs] = await Promise.all([getCourses(), getUserCourses(), getCertificates()])
    setCourses(c)
    setUserCourses(uc)
    setCertificates(certs)
  }

  function getUserCourse(courseId: string): UserCourse | undefined {
    return userCourses.find((u) => u.courseId === courseId)
  }

  function isVideoWatched(courseId: string, videoId: string): boolean {
    const uc = getUserCourse(courseId)
    return uc?.watchedVideos?.includes(videoId) || false
  }

  function hasCertificate(courseId: string): boolean {
    return certificates.some((c) => c.courseId === courseId)
  }

  function openCourse(course: Course) {
    setActiveCourse(course)
    const uc = getUserCourse(course.id)
    const expanded: Record<string, boolean> = {}
    course.modules.forEach((m, i) => { expanded[m.id] = i === 0 })
    setExpandedModules(expanded)

    if (uc?.currentVideoId) {
      for (const mod of course.modules) {
        const vid = mod.videos.find((v) => v.id === uc.currentVideoId)
        if (vid) { setActiveVideo(vid); expanded[mod.id] = true; break }
      }
    } else {
      setActiveVideo(course.modules[0]?.videos[0] || null)
    }
  }

  function closeCourse() {
    setActiveCourse(null)
    setActiveVideo(null)
  }

  function handleEnroll(courseId: string) {
    startTransition(async () => {
      await enrollCourse(courseId)
      await loadData()
      const course = courses.find((c) => c.id === courseId)
      if (course) openCourse(course)
    })
  }

  function selectVideo(video: CourseVideo, moduleId: string) {
    setActiveVideo(video)
    if (activeCourse) {
      const uc = getUserCourse(activeCourse.id)
      if (uc) {
        startTransition(async () => {
          await setCurrentVideo(activeCourse.id, video.id)
        })
      }
    }
  }

  function handleMarkWatched() {
    if (!activeCourse || !activeVideo) return
    startTransition(async () => {
      const result = await markVideoWatched(activeCourse.id, activeVideo.id)
      await loadData()
      if (result.completed) return

      const allVideos = activeCourse.modules.flatMap((m) => m.videos)
      const currentIdx = allVideos.findIndex((v) => v.id === activeVideo.id)
      if (currentIdx < allVideos.length - 1) {
        const next = allVideos[currentIdx + 1]
        setActiveVideo(next)
        const nextMod = activeCourse.modules.find((m) => m.videos.some((v) => v.id === next.id))
        if (nextMod) setExpandedModules((p) => ({ ...p, [nextMod.id]: true }))
      }
    })
  }

  async function handleDownloadCertificate(cert: Certificate) {
    if (!online) { alert("Server offline"); return }
    setDownloadingCert(true)
    try {
      const r = await fetch(`${API}/api/certificate/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: cert.userName,
          courseTitle: cert.courseTitle,
          issuedAt: cert.issuedAt,
          certificateId: cert.id,
        }),
      })
      if (!r.ok) throw new Error()
      const blob = await r.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `${cert.userName}_${cert.courseTitle}_Certificate.pdf`
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
    } catch { alert("Certificate download failed.") }
    setDownloadingCert(false)
  }

  const filtered = courses.filter((course) => {
    const matchesCategory = activeCategory === "All" || course.category === activeCategory
    const matchesSearch = !searchQuery ||
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const inProgress = userCourses.filter((c) => c.status === "in-progress")
  const completed = userCourses.filter((c) => c.status === "completed")

  // ===== COURSE PLAYER =====
  if (activeCourse) {
    const uc = getUserCourse(activeCourse.id)
    const enrolled = !!uc
    const progress = uc?.progress || 0
    const cert = certificates.find((c) => c.courseId === activeCourse.id)
    const allVideos = activeCourse.modules.flatMap((m) => m.videos)
    const watchedCount = uc?.watchedVideos?.length || 0

    return (
      <div className="flex h-screen flex-col bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border bg-card px-3 py-2 sm:px-4 sm:py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="sm" onClick={closeCourse} className="gap-1 h-8 px-2 text-muted-foreground shrink-0">
              <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span>
            </Button>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <h2 className="text-sm font-semibold truncate">{activeCourse.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {enrolled && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="hidden sm:inline">{watchedCount}/{allVideos.length} videos</span>
                <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
                <span className="font-semibold text-foreground">{progress}%</span>
              </div>
            )}
            {cert && (
              <Button variant="outline" size="sm" onClick={() => handleDownloadCertificate(cert)} disabled={downloadingCert}
                className="gap-1 h-8 text-xs border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10">
                {downloadingCert ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Award className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Certificate</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Video Area */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* YouTube Embed */}
            <div className="w-full bg-black aspect-video max-h-[65vh]">
              {activeVideo ? (
                <iframe
                  key={activeVideo.youtubeId}
                  src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?rel=0&modestbranding=1`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={activeVideo.title}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/30">
                  <PlayCircle className="h-16 w-16" />
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="p-4 sm:p-5 border-b border-border">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold">{activeVideo?.title || "Select a video"}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeCourse.instructor} · {activeVideo?.duration}
                  </p>
                </div>
                <div className="flex gap-2">
                  {enrolled && activeVideo && !isVideoWatched(activeCourse.id, activeVideo.id) && (
                    <Button size="sm" onClick={handleMarkWatched} disabled={isPending}
                      className="gap-1.5 h-9 text-xs bg-primary text-primary-foreground">
                      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      Mark as Complete
                    </Button>
                  )}
                  {enrolled && activeVideo && isVideoWatched(activeCourse.id, activeVideo.id) && (
                    <Badge className="gap-1 bg-emerald-400/15 text-emerald-400 border-emerald-400/30 h-9 px-3">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                    </Badge>
                  )}
                  {!enrolled && (
                    <Button size="sm" onClick={() => handleEnroll(activeCourse.id)} disabled={isPending}
                      className="gap-1.5 h-9 text-xs bg-primary text-primary-foreground">
                      <BookOpen className="h-3.5 w-3.5" /> Enroll & Track Progress
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Course description on mobile */}
            <div className="p-4 sm:p-5 lg:hidden">
              <p className="text-xs text-muted-foreground leading-relaxed">{activeCourse.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {activeCourse.tags.map((t) => (
                  <Badge key={t} variant="outline" className="text-[10px] border-border">{t}</Badge>
                ))}
              </div>
            </div>

            {/* Completion celebration */}
            {progress >= 100 && cert && (
              <div className="mx-4 my-4 sm:mx-5 rounded-xl border border-emerald-400/30 bg-emerald-400/5 p-4 text-center">
                <Trophy className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-emerald-400 mb-1">Course Completed!</h3>
                <p className="text-xs text-muted-foreground mb-3">Congratulations! You&apos;ve completed all videos.</p>
                <Button size="sm" onClick={() => handleDownloadCertificate(cert)} disabled={downloadingCert}
                  className="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white">
                  {downloadingCert ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                  Download Certificate
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar: Modules & Videos */}
          <div className="hidden lg:flex w-80 shrink-0 flex-col border-l border-border bg-card overflow-y-auto">
            <div className="p-4 border-b border-border">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course Content</h3>
              <p className="text-[10px] text-muted-foreground mt-1">{allVideos.length} videos · {activeCourse.duration}</p>
            </div>

            {activeCourse.modules.map((mod) => (
              <div key={mod.id}>
                <button onClick={() => setExpandedModules((p) => ({ ...p, [mod.id]: !p[mod.id] }))}
                  className="w-full flex items-center justify-between px-4 py-3 text-left border-b border-border/50 hover:bg-secondary/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{mod.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {mod.videos.filter((v) => isVideoWatched(activeCourse.id, v.id)).length}/{mod.videos.length} completed
                    </p>
                  </div>
                  {expandedModules[mod.id] ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                </button>

                {expandedModules[mod.id] && (
                  <div className="bg-secondary/30">
                    {mod.videos.map((video) => {
                      const watched = isVideoWatched(activeCourse.id, video.id)
                      const isCurrent = activeVideo?.id === video.id
                      return (
                        <button key={video.id} onClick={() => selectVideo(video, mod.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${isCurrent ? "bg-primary/10 border-l-2 border-primary" : "hover:bg-secondary/80 border-l-2 border-transparent"}`}>
                          <div className="shrink-0">
                            {watched ? <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                              : isCurrent ? <Play className="h-4 w-4 text-primary" />
                              : <PlayCircle className="h-4 w-4 text-muted-foreground/40" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[11px] truncate ${isCurrent ? "font-semibold text-foreground" : watched ? "text-muted-foreground" : "text-foreground"}`}>
                              {video.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{video.duration}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: Module list */}
        <div className="lg:hidden border-t border-border bg-card overflow-y-auto max-h-48">
          {activeCourse.modules.map((mod) => (
            <div key={mod.id}>
              <button onClick={() => setExpandedModules((p) => ({ ...p, [mod.id]: !p[mod.id] }))}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left border-b border-border/50 hover:bg-secondary/50">
                <p className="text-xs font-semibold truncate flex-1">{mod.title}</p>
                <span className="text-[10px] text-muted-foreground mx-2">{mod.videos.filter((v) => isVideoWatched(activeCourse.id, v.id)).length}/{mod.videos.length}</span>
                {expandedModules[mod.id] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
              {expandedModules[mod.id] && mod.videos.map((video) => {
                const watched = isVideoWatched(activeCourse.id, video.id)
                const isCurrent = activeVideo?.id === video.id
                return (
                  <button key={video.id} onClick={() => selectVideo(video, mod.id)}
                    className={`w-full flex items-center gap-2 px-6 py-2 text-left ${isCurrent ? "bg-primary/10" : "hover:bg-secondary/50"}`}>
                    {watched ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> : <PlayCircle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
                    <span className="text-[11px] truncate flex-1">{video.title}</span>
                    <span className="text-[9px] text-muted-foreground">{video.duration}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ===== COURSE CATALOG =====
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              Learning Hub
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Real courses with YouTube videos. Track progress and earn certificates.
            </p>
          </div>
          {certificates.length > 0 && (
            <Button variant="outline" onClick={() => setShowCerts(!showCerts)}
              className="gap-1.5 border-border text-xs h-9">
              <Award className="h-3.5 w-3.5" /> My Certificates ({certificates.length})
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "In Progress", value: inProgress.length, icon: <PlayCircle className="h-5 w-5 text-blue-400" />, bg: "bg-blue-400/10" },
          { label: "Completed", value: completed.length, icon: <CheckCircle2 className="h-5 w-5 text-emerald-400" />, bg: "bg-emerald-400/10" },
          { label: "Certificates", value: certificates.length, icon: <Award className="h-5 w-5 text-amber-400" />, bg: "bg-amber-400/10" },
          { label: "Total Courses", value: courses.length, icon: <BookOpen className="h-5 w-5 text-purple-400" />, bg: "bg-purple-400/10" },
        ].map((s) => (
          <Card key={s.label} className="border-border py-0">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>{s.icon}</div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Certificates Panel */}
      {showCerts && certificates.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-amber-400" /> Your Certificates
            </h3>
            <button onClick={() => setShowCerts(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert) => (
              <div key={cert.id} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/50 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-400/10">
                  <GraduationCap className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{cert.courseTitle}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(cert.issuedAt).toLocaleDateString()}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDownloadCertificate(cert)} disabled={downloadingCert}
                  className="gap-1 h-7 text-[10px] border-border shrink-0">
                  <Download className="h-3 w-3" /> PDF
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continue Learning */}
      {inProgress.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-primary" /> Continue Learning
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((uc) => {
              const course = courses.find((c) => c.id === uc.courseId)
              if (!course) return null
              return (
                <Card key={uc.id} onClick={() => openCourse(course)}
                  className="border-border py-0 cursor-pointer transition-all hover:border-primary/30 hover:shadow-lg group">
                  <CardContent className="p-0">
                    <div className="relative">
                      <img src={course.thumbnail} alt={course.title}
                        className="w-full h-32 sm:h-36 object-cover rounded-t-xl" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-t-xl">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <Badge className="absolute top-2 right-2 bg-black/60 text-white text-[9px] border-0">
                        {uc.watchedVideos?.length || 0}/{course.totalVideos} videos
                      </Badge>
                    </div>
                    <div className="p-3.5">
                      <h3 className="text-xs font-semibold leading-snug truncate">{course.title}</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{course.instructor}</p>
                      <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-muted-foreground">Progress</span>
                          <span className="text-[10px] font-semibold text-primary">{uc.progress}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${uc.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Search + Filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search courses or topics..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="border-border bg-card pl-10 text-foreground placeholder:text-muted-foreground" />
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((course) => {
          const uc = getUserCourse(course.id)
          const status = uc?.status
          const progress = uc?.progress || 0
          const cert = hasCertificate(course.id)

          return (
            <Card key={course.id}
              className="border-border py-0 transition-all hover:border-primary/30 hover:shadow-lg cursor-pointer group"
              onClick={() => status === "in-progress" || status === "completed" ? openCourse(course) : undefined}>
              <CardContent className="p-0">
                <div className="relative">
                  <img src={course.thumbnail} alt={course.title}
                    className="w-full h-36 object-cover rounded-t-xl" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-t-xl">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                      <Play className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <Badge className={`absolute top-2 left-2 text-[9px] ${course.level === "Beginner" ? "bg-emerald-500/90 text-white border-0" : course.level === "Intermediate" ? "bg-blue-500/90 text-white border-0" : "bg-amber-500/90 text-white border-0"}`}>
                    {course.level}
                  </Badge>
                  {cert && (
                    <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1">
                      <Award className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-sm font-semibold leading-snug line-clamp-2">{course.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{course.instructor}</p>

                  <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration}</span>
                    <span className="flex items-center gap-1"><PlayCircle className="h-3 w-3" /> {course.totalVideos} videos</span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {course.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded bg-secondary px-1.5 py-0.5 text-[9px] text-muted-foreground">{tag}</span>
                    ))}
                  </div>

                  {status === "in-progress" && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-muted-foreground">{progress}% complete</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="mt-3">
                    {status === "completed" ? (
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openCourse(course) }}
                        className="w-full border-emerald-400/30 text-emerald-400 text-xs gap-1 h-8">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Completed · Review
                      </Button>
                    ) : status === "in-progress" ? (
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); openCourse(course) }}
                        className="w-full bg-primary text-primary-foreground text-xs gap-1 h-8">
                        <PlayCircle className="h-3.5 w-3.5" /> Continue
                      </Button>
                    ) : (
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); handleEnroll(course.id) }} disabled={isPending}
                        className="w-full bg-primary text-primary-foreground text-xs gap-1 h-8">
                        <BookOpen className="h-3.5 w-3.5" /> Start Course
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

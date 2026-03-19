"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, Plus, PlayCircle } from "lucide-react"
import { addCoachCourseModule, addCoachCourseVideo, createCoachCourse, getCoachCourses } from "@/lib/actions/coach"
import type { CoachContentCourse } from "@/lib/types"
import { useRealtimeQuery } from "@/lib/hooks/use-realtime-query"

export default function CoachContentPage() {
  const queryClient = useQueryClient()
  const { data, isFetching } = useRealtimeQuery<CoachContentCourse[]>({
    queryKey: ["coach", "courses"],
    queryFn: () => getCoachCourses(),
    realtimeMs: 12_000,
    staleMs: 12_000,
  })
  const courses = data || []

  const [courseForm, setCourseForm] = useState({
    title: "",
    category: "Development",
    level: "Beginner" as "Beginner" | "Intermediate" | "Advanced",
    description: "",
    tags: "",
    moduleTitle: "Module 1",
    videoTitle: "Intro",
    videoYoutubeId: "",
    videoDuration: "10 min",
  })

  const [moduleCourseId, setModuleCourseId] = useState("")
  const [moduleTitle, setModuleTitle] = useState("")
  const [videoCourseId, setVideoCourseId] = useState("")
  const [videoModuleId, setVideoModuleId] = useState("")
  const [videoTitle, setVideoTitle] = useState("")
  const [videoYoutubeId, setVideoYoutubeId] = useState("")
  const [videoDuration, setVideoDuration] = useState("10 min")

  const createMutation = useMutation({
    mutationFn: () =>
      createCoachCourse({
        title: courseForm.title,
        category: courseForm.category,
        level: courseForm.level,
        description: courseForm.description,
        tags: courseForm.tags,
        moduleTitle: courseForm.moduleTitle,
        videos: courseForm.videoYoutubeId
          ? [{ title: courseForm.videoTitle || "Intro", youtubeId: courseForm.videoYoutubeId, duration: courseForm.videoDuration }]
          : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["learning"] })
      setCourseForm({
        title: "",
        category: "Development",
        level: "Beginner",
        description: "",
        tags: "",
        moduleTitle: "Module 1",
        videoTitle: "Intro",
        videoYoutubeId: "",
        videoDuration: "10 min",
      })
    },
  })

  const moduleMutation = useMutation({
    mutationFn: () => addCoachCourseModule(moduleCourseId, moduleTitle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "courses"] })
      setModuleTitle("")
    },
  })

  const videoMutation = useMutation({
    mutationFn: () => addCoachCourseVideo(videoCourseId, videoModuleId, { title: videoTitle, youtubeId: videoYoutubeId, duration: videoDuration }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coach", "courses"] })
      queryClient.invalidateQueries({ queryKey: ["learning"] })
      setVideoTitle("")
      setVideoYoutubeId("")
      setVideoDuration("10 min")
    },
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            Content Studio
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Publish mentor courses/videos that appear in learner dashboards.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => queryClient.invalidateQueries({ queryKey: ["coach", "courses"] })} disabled={isFetching}>Refresh</Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="border-border bg-card py-0 xl:col-span-2">
          <CardHeader className="pb-4 pt-6 px-6"><CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Create Course</CardTitle></CardHeader>
          <CardContent className="space-y-3 px-6 pb-6">
            <Input value={courseForm.title} onChange={(e) => setCourseForm((p) => ({ ...p, title: e.target.value }))} placeholder="Course title" className="border-border bg-secondary" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={courseForm.category} onChange={(e) => setCourseForm((p) => ({ ...p, category: e.target.value }))} placeholder="Category" className="border-border bg-secondary" />
              <select value={courseForm.level} onChange={(e) => setCourseForm((p) => ({ ...p, level: e.target.value as any }))} className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
            </div>
            <Input value={courseForm.tags} onChange={(e) => setCourseForm((p) => ({ ...p, tags: e.target.value }))} placeholder="Tags (comma separated)" className="border-border bg-secondary" />
            <Textarea value={courseForm.description} onChange={(e) => setCourseForm((p) => ({ ...p, description: e.target.value }))} rows={3} placeholder="Course description" className="border-border bg-secondary" />
            <Input value={courseForm.moduleTitle} onChange={(e) => setCourseForm((p) => ({ ...p, moduleTitle: e.target.value }))} placeholder="First module title" className="border-border bg-secondary" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={courseForm.videoTitle} onChange={(e) => setCourseForm((p) => ({ ...p, videoTitle: e.target.value }))} placeholder="First video title" className="border-border bg-secondary" />
              <Input value={courseForm.videoDuration} onChange={(e) => setCourseForm((p) => ({ ...p, videoDuration: e.target.value }))} placeholder="Duration" className="border-border bg-secondary" />
            </div>
            <Input value={courseForm.videoYoutubeId} onChange={(e) => setCourseForm((p) => ({ ...p, videoYoutubeId: e.target.value }))} placeholder="YouTube video id (optional on create)" className="border-border bg-secondary" />
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending || !courseForm.title.trim()} className="w-full gap-2 bg-primary text-primary-foreground"><Plus className="h-4 w-4" /> Publish Course</Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card py-0 xl:col-span-3">
          <CardHeader className="pb-4 pt-6 px-6"><CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>My Courses ({courses.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3 px-6 pb-6">
            {courses.map((course) => (
              <div key={course.id} className="rounded-lg border border-border bg-secondary/25 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{course.title}</p>
                  <Badge variant="outline" className="border-primary/30 text-primary">{course.level}</Badge>
                  <Badge variant="outline" className="border-border text-muted-foreground">{course.category}</Badge>
                  <Badge variant="outline" className="border-emerald-400/30 text-emerald-400">{course.totalVideos} videos</Badge>
                </div>
                <div className="space-y-1">
                  {course.modules.map((m) => (
                    <p key={m.id} className="text-xs text-muted-foreground">- {m.title} ({m.videos.length} videos)</p>
                  ))}
                </div>
              </div>
            ))}
            {courses.length === 0 && <p className="text-sm text-muted-foreground">No coach courses yet.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card className="border-border bg-card py-0">
          <CardHeader className="pb-4 pt-6 px-6"><CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Add Module</CardTitle></CardHeader>
          <CardContent className="space-y-3 px-6 pb-6">
            <select value={moduleCourseId} onChange={(e) => setModuleCourseId(e.target.value)} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground">
              <option value="">Select course</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <Input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} placeholder="Module title" className="border-border bg-secondary" />
            <Button onClick={() => moduleMutation.mutate()} disabled={moduleMutation.isPending || !moduleCourseId || !moduleTitle.trim()} className="w-full bg-primary text-primary-foreground">Add Module</Button>
          </CardContent>
        </Card>

        <Card className="border-border bg-card py-0">
          <CardHeader className="pb-4 pt-6 px-6"><CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>Add Video</CardTitle></CardHeader>
          <CardContent className="space-y-3 px-6 pb-6">
            <select value={videoCourseId} onChange={(e) => { setVideoCourseId(e.target.value); setVideoModuleId("") }} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground">
              <option value="">Select course</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            <select value={videoModuleId} onChange={(e) => setVideoModuleId(e.target.value)} className="w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground" disabled={!videoCourseId}>
              <option value="">Select module</option>
              {(courses.find((c) => c.id === videoCourseId)?.modules || []).map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
            <Input value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} placeholder="Video title" className="border-border bg-secondary" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={videoYoutubeId} onChange={(e) => setVideoYoutubeId(e.target.value)} placeholder="YouTube id" className="border-border bg-secondary" />
              <Input value={videoDuration} onChange={(e) => setVideoDuration(e.target.value)} placeholder="Duration" className="border-border bg-secondary" />
            </div>
            <Button onClick={() => videoMutation.mutate()} disabled={videoMutation.isPending || !videoCourseId || !videoModuleId || !videoTitle.trim() || !videoYoutubeId.trim()} className="w-full gap-2 bg-primary text-primary-foreground"><PlayCircle className="h-4 w-4" /> Add Video</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

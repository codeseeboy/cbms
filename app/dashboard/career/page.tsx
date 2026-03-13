"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Map,
  Target,
  Flag,
  CheckCircle2,
  Circle,
  Plus,
  Calendar,
  TrendingUp,
  Award,
  Sparkles,
  Trash2,
} from "lucide-react"
import { getCareerGoals, createCareerGoal, toggleMilestone, deleteCareerGoal } from "@/lib/actions/career"
import type { CareerGoal } from "@/lib/types"

const roadmapStages = [
  {
    stage: "Current",
    role: "Frontend Developer",
    skills: ["React", "TypeScript", "Tailwind CSS", "Next.js"],
    timeframe: "Now",
    active: true,
  },
  {
    stage: "Next",
    role: "Senior Frontend Developer",
    skills: ["System Design", "Team Leadership", "Performance Optimization"],
    timeframe: "6-12 months",
    active: false,
  },
  {
    stage: "Target",
    role: "Frontend Architect / Tech Lead",
    skills: ["Architecture Decisions", "Cross-team Collaboration", "Technical Strategy"],
    timeframe: "1-2 years",
    active: false,
  },
  {
    stage: "Aspiration",
    role: "Engineering Manager / CTO",
    skills: ["People Management", "Business Acumen", "Product Strategy"],
    timeframe: "3-5 years",
    active: false,
  },
]

export default function CareerPage() {
  const [showNewGoal, setShowNewGoal] = useState(false)
  const [goals, setGoals] = useState<CareerGoal[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    loadGoals()
  }, [])

  async function loadGoals() {
    const data = await getCareerGoals()
    setGoals(data)
  }

  async function handleCreateGoal(formData: FormData) {
    startTransition(async () => {
      const result = await createCareerGoal(formData)
      if (result.success) {
        setShowNewGoal(false)
        await loadGoals()
      }
    })
  }

  function handleToggleMilestone(goalId: string, milestoneId: string) {
    startTransition(async () => {
      await toggleMilestone(goalId, milestoneId)
      await loadGoals()
    })
  }

  function handleDeleteGoal(goalId: string) {
    if (!confirm("Are you sure you want to delete this goal?")) return
    startTransition(async () => {
      await deleteCareerGoal(goalId)
      await loadGoals()
    })
  }

  const achievements = [
    { title: "First Resume Created", date: "Jan 2026", icon: Award },
    { title: "5 Skills Assessed", date: "Jan 2026", icon: Target },
    { title: "10 Jobs Applied", date: "Feb 2026", icon: Flag },
    { title: "First Course Completed", date: "Feb 2026", icon: CheckCircle2 },
    { title: "7-Day Activity Streak", date: "Feb 2026", icon: TrendingUp },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="text-xl sm:text-2xl font-bold text-foreground lg:text-3xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Career Planning
            </h1>
            <p className="mt-1 text-muted-foreground">
              Set goals, track milestones, and plan your career roadmap.
            </p>
          </div>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            onClick={() => setShowNewGoal(!showNewGoal)}
          >
            <Plus className="h-4 w-4" />
            New Goal
          </Button>
        </div>
      </div>

      {showNewGoal && (
        <Card className="mb-8 border-primary/30 bg-card py-0">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardTitle
              className="text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Create New Career Goal
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form action={handleCreateGoal}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-muted-foreground">
                    Goal Title
                  </label>
                  <Input
                    name="title"
                    placeholder="e.g., Become a Tech Lead"
                    required
                    className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-muted-foreground">
                    Target Date
                  </label>
                  <Input
                    name="deadline"
                    type="date"
                    className="border-border bg-secondary text-foreground"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-sm text-muted-foreground">
                  Description
                </label>
                <Textarea
                  name="description"
                  placeholder="Describe your career goal..."
                  rows={2}
                  className="border-border bg-secondary text-foreground placeholder:text-muted-foreground resize-none"
                />
              </div>
              <div className="mt-4">
                <label className="mb-1.5 block text-sm text-muted-foreground">
                  Milestones (one per line)
                </label>
                <Textarea
                  name="milestones"
                  placeholder={"Learn System Design\nBuild a portfolio project\nGet a certification"}
                  rows={3}
                  className="border-border bg-secondary text-foreground placeholder:text-muted-foreground resize-none"
                />
              </div>
              <div className="mt-4 flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewGoal(false)}
                  className="border-border text-foreground"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary text-primary-foreground gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {isPending ? "Creating..." : "Create Goal"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8 border-border bg-card py-0">
        <CardHeader className="pb-4 pt-6 px-6">
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            <CardTitle
              className="text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Career Roadmap
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="relative">
            <div className="absolute top-8 left-0 right-0 hidden h-0.5 bg-border lg:block" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {roadmapStages.map((stage, idx) => (
                <div key={stage.stage} className="relative">
                  <div
                    className={`rounded-xl border p-5 transition-all ${
                      stage.active
                        ? "border-primary bg-primary/5"
                        : "border-border bg-secondary/30"
                    }`}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          stage.active
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        <span className="text-xs font-bold">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          stage.active
                            ? "border-primary/30 text-primary"
                            : "border-border text-muted-foreground"
                        }`}
                      >
                        {stage.stage}
                      </Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">
                      {stage.role}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stage.timeframe}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {stage.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2
            className="text-lg font-bold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Active Goals ({goals.length})
          </h2>
          {goals.map((goal) => (
            <Card key={goal.id} className="border-border bg-card py-0">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {goal.title}
                    </h3>
                    {goal.deadline && (
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        Target: {new Date(goal.deadline).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </div>
                    )}
                    {goal.description && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {goal.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-primary/30 text-primary text-xs shrink-0"
                    >
                      {goal.progress}%
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 h-2 rounded-full bg-secondary">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                {goal.milestones.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2">
                    {goal.milestones.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleToggleMilestone(goal.id, m.id)}
                        className="flex items-center gap-2.5 text-left"
                        disabled={isPending}
                      >
                        {m.done ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        ) : (
                          <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                        )}
                        <span
                          className={`text-sm ${
                            m.done
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }`}
                        >
                          {m.text}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {goals.length === 0 && (
            <Card className="border-border bg-card py-0">
              <CardContent className="p-8 text-center">
                <Target className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-3 font-medium text-foreground">No goals yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create your first career goal to start tracking progress.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          <h2
            className="mb-4 text-lg font-bold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Achievements
          </h2>
          <Card className="border-border bg-card py-0">
            <CardContent className="p-5">
              <div className="flex flex-col gap-3">
                {achievements.map((a, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-400/10">
                      <a.icon className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {a.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{a.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

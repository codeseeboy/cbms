"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  Clock,
  CheckCircle2,
  PlayCircle,
  Lock,
  TrendingUp,
  Award,
  Target,
} from "lucide-react"
import {
  getAssessments,
  getUserAssessments,
  getAssessmentHistory,
  startAssessment,
  submitAnswer,
  completeAssessment,
} from "@/lib/actions/skills"
import type { Assessment, UserAssessment } from "@/lib/types"

type SkillTab = "assessments" | "history"

const categories = [
  { name: "All", count: 0 },
  { name: "Frontend", count: 0 },
  { name: "Backend", count: 0 },
  { name: "Soft Skills", count: 0 },
  { name: "Design", count: 0 },
]

export default function SkillsPage() {
  const [activeTab, setActiveTab] = useState<SkillTab>("assessments")
  const [activeCategory, setActiveCategory] = useState("All")
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [userAssessments, setUserAssessments] = useState<UserAssessment[]>([])
  const [history, setHistory] = useState<UserAssessment[]>([])
  const [takingQuiz, setTakingQuiz] = useState<{
    assessment: Assessment
    userAssessment: UserAssessment
    currentQ: number
  } | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [quizResult, setQuizResult] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [a, ua, hist] = await Promise.all([getAssessments(), getUserAssessments(), getAssessmentHistory()])
    setAssessments(a)
    setUserAssessments(ua)
    setHistory(hist)
  }

  function getStatus(assessmentId: string) {
    const ua = userAssessments.find((u) => u.assessmentId === assessmentId)
    if (!ua) return "available"
    return ua.status
  }

  function getScore(assessmentId: string) {
    const ua = userAssessments.find((u) => u.assessmentId === assessmentId)
    return ua?.score ?? null
  }

  function getProgress(assessmentId: string) {
    const ua = userAssessments.find((u) => u.assessmentId === assessmentId)
    if (!ua || ua.status !== "in-progress") return null
    const assessment = assessments.find((a) => a.id === assessmentId)
    if (!assessment) return null
    return Math.round((ua.currentQuestion / assessment.questions.length) * 100)
  }

  async function handleStart(assessmentId: string) {
    startTransition(async () => {
      const result = await startAssessment(assessmentId)
      if (result.success) {
        await loadData()
        const assessment = assessments.find((a) => a.id === assessmentId)
        const uaList = await getUserAssessments()
        const ua = uaList.find((u) => u.assessmentId === assessmentId)
        if (assessment && ua) {
          setTakingQuiz({
            assessment,
            userAssessment: ua,
            currentQ: ua.currentQuestion,
          })
          setSelectedAnswer(null)
          setQuizResult(null)
        }
      }
    })
  }

  async function handleAnswer() {
    if (!takingQuiz || selectedAnswer === null) return
    startTransition(async () => {
      await submitAnswer(takingQuiz.assessment.id, takingQuiz.currentQ, selectedAnswer!)
      const nextQ = takingQuiz.currentQ + 1
      if (nextQ >= takingQuiz.assessment.questions.length) {
        const result = await completeAssessment(takingQuiz.assessment.id)
        if (result.success) {
          setQuizResult(result.score!)
          await loadData()
        }
      } else {
        setTakingQuiz({ ...takingQuiz, currentQ: nextQ })
        setSelectedAnswer(null)
      }
    })
  }

  const completed = userAssessments.filter((ua) => ua.status === "completed")
  const inProgress = userAssessments.filter((ua) => ua.status === "in-progress")
  const avgScore =
    completed.length > 0
      ? Math.round(completed.reduce((s, ua) => s + (ua.score || 0), 0) / completed.length)
      : 0

  const filtered =
    activeCategory === "All"
      ? assessments
      : assessments.filter((a) => a.category === activeCategory)

  const catCounts = categories.map((c) => ({
    ...c,
    count:
      c.name === "All"
        ? assessments.length
        : assessments.filter((a) => a.category === c.name).length,
  }))

  const skillSummary = completed.map((ua) => {
    const assessment = assessments.find((a) => a.id === ua.assessmentId)
    return {
      skill: assessment?.title || "Unknown",
      score: ua.score || 0,
    }
  })

  if (takingQuiz && quizResult === null) {
    const q = takingQuiz.assessment.questions[takingQuiz.currentQ]
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {takingQuiz.assessment.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Question {takingQuiz.currentQ + 1} of{" "}
                {takingQuiz.assessment.questions.length}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setTakingQuiz(null)
                loadData()
              }}
              className="border-border text-foreground"
            >
              Exit
            </Button>
          </div>

          <div className="mb-6 h-2 rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{
                width: `${((takingQuiz.currentQ + 1) / takingQuiz.assessment.questions.length) * 100}%`,
              }}
            />
          </div>

          <Card className="border-border bg-card py-0">
            <CardContent className="p-8">
              <h2 className="mb-6 text-lg font-semibold text-foreground">{q.question}</h2>
              <div className="flex flex-col gap-3">
                {q.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedAnswer(idx)}
                    className={`rounded-xl border p-4 text-left text-sm transition-all ${
                      selectedAnswer === idx
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    }`}
                  >
                    <span className="mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-current text-xs">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
              <div className="mt-8 flex justify-end">
                <Button
                  onClick={handleAnswer}
                  disabled={selectedAnswer === null || isPending}
                  className="bg-primary text-primary-foreground gap-2"
                >
                  {takingQuiz.currentQ + 1 === takingQuiz.assessment.questions.length
                    ? "Finish"
                    : "Next Question"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (quizResult !== null && takingQuiz) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-md text-center">
          <Card className="border-border bg-card py-0">
            <CardContent className="p-8">
              <div className="mb-4 flex justify-center">
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full ${
                    quizResult >= 80
                      ? "bg-emerald-400/10"
                      : quizResult >= 60
                      ? "bg-amber-400/10"
                      : "bg-destructive/10"
                  }`}
                >
                  <Award
                    className={`h-10 w-10 ${
                      quizResult >= 80
                        ? "text-emerald-400"
                        : quizResult >= 60
                        ? "text-amber-400"
                        : "text-destructive"
                    }`}
                  />
                </div>
              </div>
              <h2
                className="text-xl sm:text-2xl font-bold text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Assessment Complete!
              </h2>
              <p className="mt-2 text-muted-foreground">
                {takingQuiz.assessment.title}
              </p>
              <div className="my-6">
                <span
                  className="text-5xl font-bold text-foreground"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {quizResult}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {quizResult >= 80
                  ? "Excellent work! You demonstrated strong knowledge."
                  : quizResult >= 60
                  ? "Good job! There's room for improvement."
                  : "Keep learning! Review the material and try again."}
              </p>
              <div className="mt-6 flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTakingQuiz(null)
                    setQuizResult(null)
                  }}
                  className="border-border text-foreground"
                >
                  Back to Assessments
                </Button>
                <Button
                  onClick={() => {
                    setQuizResult(null)
                    handleStart(takingQuiz.assessment.id)
                  }}
                  className="bg-primary text-primary-foreground"
                >
                  Retake
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1
          className="text-xl sm:text-2xl font-bold text-foreground lg:text-3xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Skill Assessment
        </h1>
        <p className="mt-1 text-muted-foreground">
          Evaluate your skills and track your improvement over time.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Completed", value: String(completed.length), icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "In Progress", value: String(inProgress.length), icon: PlayCircle, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Avg. Score", value: `${avgScore}%`, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "Certifications", value: String(completed.filter((c) => (c.score || 0) >= 80).length), icon: Award, color: "text-pink-400", bg: "bg-pink-400/10" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border bg-card py-0">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-6 bg-card rounded-xl border border-border p-1">
        {([
          { id: "assessments" as SkillTab, label: "Assessments", icon: <Target className="h-3.5 w-3.5" /> },
          { id: "history" as SkillTab, label: `History (${history.length})`, icon: <Clock className="h-3.5 w-3.5" /> },
        ]).map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-medium transition-all ${activeTab === t.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ===== HISTORY TAB ===== */}
      {activeTab === "history" && (
        <div>
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/20 mb-3" />
              <h3 className="text-sm font-semibold text-muted-foreground">No assessment history yet</h3>
              <p className="text-xs text-muted-foreground mt-1">Complete assessments to see your history and track improvement over time.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map((ua) => {
                const assessment = assessments.find((a) => a.id === ua.assessmentId)
                const score = ua.score || 0
                return (
                  <Card key={`${ua.id}-${ua.completedAt}`} className="border-border bg-card py-0">
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                            score >= 80 ? "bg-emerald-400/10" : score >= 60 ? "bg-amber-400/10" : "bg-destructive/10"
                          }`}>
                            <span className={`text-lg font-bold ${
                              score >= 80 ? "text-emerald-400" : score >= 60 ? "text-amber-400" : "text-destructive"
                            }`} style={{ fontFamily: "var(--font-heading)" }}>{score}%</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-foreground">{assessment?.title || "Unknown Assessment"}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {ua.completedAt ? new Date(ua.completedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}
                              </span>
                              <Badge variant="outline" className={`text-[10px] ${
                                assessment?.difficulty === "Beginner" ? "border-emerald-400/30 text-emerald-400" :
                                assessment?.difficulty === "Intermediate" ? "border-blue-400/30 text-blue-400" :
                                "border-amber-400/30 text-amber-400"
                              }`}>
                                {assessment?.difficulty}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">{assessment?.category}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-[10px] ${
                            score >= 80 ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400" :
                            score >= 60 ? "border-amber-400/30 bg-amber-400/10 text-amber-400" :
                            "border-destructive/30 bg-destructive/10 text-destructive"
                          }`}>
                            {score >= 80 ? "Passed" : score >= 60 ? "Good" : "Needs Improvement"}
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => handleStart(ua.assessmentId)} disabled={isPending}
                            className="h-8 text-xs border-border gap-1">
                            <PlayCircle className="h-3.5 w-3.5" /> Retake
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 h-1.5 rounded-full bg-secondary">
                        <div className={`h-1.5 rounded-full transition-all ${
                          score >= 80 ? "bg-emerald-400" : score >= 60 ? "bg-amber-400" : "bg-destructive"
                        }`} style={{ width: `${score}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "assessments" && skillSummary.length > 0 && (
        <Card className="mb-8 border-border bg-card py-0">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
              Skill Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {skillSummary.map((s) => (
                <div key={s.skill} className="rounded-xl border border-border bg-secondary/30 p-4">
                  <span className="text-sm font-medium text-foreground">{s.skill}</span>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                      {s.score}
                    </span>
                    <span className="mb-1 text-sm text-muted-foreground">/100</span>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-secondary">
                    <div
                      className="h-1.5 rounded-full bg-primary transition-all"
                      style={{ width: `${s.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "assessments" && (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {catCounts.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeCategory === cat.name
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat.name}
                <span className="ml-1.5 text-xs opacity-70">({cat.count})</span>
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((assessment) => {
              const status = getStatus(assessment.id)
              const score = getScore(assessment.id)
              const progress = getProgress(assessment.id)

              return (
                <Card
                  key={assessment.id}
                  className="border-border bg-card transition-all hover:border-primary/30 py-0"
                >
                  <CardContent className="p-6">
                    <div className="mb-3 flex items-start justify-between">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          assessment.difficulty === "Beginner"
                            ? "border-emerald-400/30 text-emerald-400"
                            : assessment.difficulty === "Intermediate"
                            ? "border-blue-400/30 text-blue-400"
                            : "border-amber-400/30 text-amber-400"
                        }`}
                      >
                        {assessment.difficulty}
                      </Badge>
                      {status === "completed" && score !== null && (
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span className="text-xs font-semibold text-emerald-400">
                            {score}%
                          </span>
                        </div>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-foreground">
                      {assessment.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {assessment.category}
                    </p>

                    <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {assessment.duration}
                      </span>
                      <span className="flex items-center gap-1">
                        <BarChart3 className="h-3.5 w-3.5" />
                        {assessment.questions.length} questions
                      </span>
                    </div>

                    {status === "in-progress" && progress !== null && (
                      <div className="mt-4">
                        <div className="mb-1 flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Progress</span>
                          <span className="text-xs font-medium text-foreground">
                            {progress}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary">
                          <div
                            className="h-1.5 rounded-full bg-blue-400 transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      {status === "completed" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStart(assessment.id)}
                          disabled={isPending}
                          className="w-full border-border text-foreground text-xs"
                        >
                          Retake Assessment
                        </Button>
                      ) : status === "in-progress" ? (
                        <Button
                          size="sm"
                          onClick={() => handleStart(assessment.id)}
                          disabled={isPending}
                          className="w-full bg-primary text-primary-foreground text-xs gap-1.5"
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          Continue
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleStart(assessment.id)}
                          disabled={isPending}
                          className="w-full bg-primary text-primary-foreground text-xs gap-1.5"
                        >
                          <Target className="h-3.5 w-3.5" />
                          Start Assessment
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

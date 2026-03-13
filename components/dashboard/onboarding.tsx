"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  FileText, Briefcase, BarChart3, BookOpen, Map, Rocket,
  ChevronRight, ChevronLeft, X,
} from "lucide-react"

const steps = [
  {
    icon: Rocket,
    title: "Welcome to CareerBuilder!",
    description: "Your all-in-one career management platform. Let us walk you through the key features to get you started.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: FileText,
    title: "Resume Builder",
    description: "Create ATS-optimized resumes with real-time templates. Upload existing resumes for auto-population, get ATS scores, and download professional PDFs.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Briefcase,
    title: "Job Matching",
    description: "Paste any job description or URL to get an instant compatibility score. Track your applications and discover suggested jobs based on your skills.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    icon: BarChart3,
    title: "Skill Assessment",
    description: "Take assessments to evaluate your technical and soft skills. Track your progress over time and identify areas for improvement.",
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
  {
    icon: BookOpen,
    title: "Learning Hub",
    description: "Access curated courses with video lessons. Track your progress, complete courses, and earn certificates to showcase your growth.",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
  },
  {
    icon: Map,
    title: "Career Planning",
    description: "Set career goals, define milestones, and track your professional development journey. Stay on course with actionable plans.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
]

export function OnboardingWalkthrough() {
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const seen = localStorage.getItem("cbms_onboarding_seen")
    if (!seen) setShow(true)
  }, [])

  function dismiss() {
    setShow(false)
    localStorage.setItem("cbms_onboarding_seen", "true")
  }

  if (!show) return null

  const current = steps[step]
  const Icon = current.icon
  const isLast = step === steps.length - 1
  const isFirst = step === 0

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-secondary">
          <div className="h-1.5 bg-primary transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
        </div>

        <button onClick={dismiss}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors z-10">
          <X className="h-4 w-4" />
        </button>

        <div className="p-8 text-center">
          <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl ${current.bg}`}>
            <Icon className={`h-10 w-10 ${current.color}`} />
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            {current.title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            {current.description}
          </p>

          <div className="flex items-center justify-center gap-1.5 mt-6 mb-6">
            {steps.map((_, i) => (
              <button key={i} onClick={() => setStep(i)}
                className={`h-2 rounded-full transition-all ${i === step ? "w-6 bg-primary" : "w-2 bg-secondary hover:bg-muted-foreground/30"}`} />
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            {isFirst ? (
              <Button variant="ghost" size="sm" onClick={dismiss} className="text-xs text-muted-foreground">
                Skip Tour
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}
                className="gap-1 text-xs border-border">
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={dismiss} className="gap-1.5 bg-primary text-primary-foreground text-xs px-6">
                <Rocket className="h-3.5 w-3.5" /> Get Started
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep(step + 1)} className="gap-1 bg-primary text-primary-foreground text-xs">
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

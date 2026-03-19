import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CircleHelp, FileText, Briefcase, BarChart3, BookOpen, Map } from "lucide-react"

const faq = [
  {
    q: "How do I create my first resume?",
    a: "Go to Resume Builder, click create resume, complete sections, then preview or download as PDF.",
  },
  {
    q: "How does job matching work?",
    a: "Open Job Matching, select or upload resume, paste job description or URL, then run match to see score and suggestions.",
  },
  {
    q: "How do assessments help me?",
    a: "Skill Assessment tracks your scores by category and highlights strengths and gaps for improvement.",
  },
  {
    q: "Where can I track learning progress?",
    a: "Learning page shows your enrolled courses, completed videos, and certificates.",
  },
  {
    q: "How do I track career goals?",
    a: "Career Planning lets you create goals, milestones, and track progress percentage over time.",
  },
]

export default function HelpPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground lg:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>
          Help & FAQ
        </h1>
        <p className="mt-1 text-muted-foreground">
          Quick guide to use core modules of Career Builder.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Resume Builder", icon: FileText },
          { label: "Job Matching", icon: Briefcase },
          { label: "Skill Assessment", icon: BarChart3 },
          { label: "Learning", icon: BookOpen },
          { label: "Career Planning", icon: Map },
        ].map((item) => (
          <Card key={item.label} className="border-border bg-card py-0">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border bg-card py-0">
        <CardHeader className="pb-4 pt-6 px-6">
          <CardTitle className="text-foreground flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
            <CircleHelp className="h-5 w-5 text-primary" />
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-3">
            {faq.map((item) => (
              <div key={item.q} className="rounded-xl border border-border bg-secondary/20 p-4">
                <Badge variant="outline" className="mb-2 border-primary/30 text-primary">Q</Badge>
                <p className="text-sm font-semibold text-foreground">{item.q}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

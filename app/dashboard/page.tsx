import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  FileText,
  Briefcase,
  BarChart3,
  BookOpen,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
  Target,
  Flame,
} from "lucide-react"
import Link from "next/link"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { getDashboardData } from "@/lib/actions/dashboard"
import { redirect } from "next/navigation"

const activityIcons: Record<string, any> = {
  assessment: CheckCircle2,
  resume: FileText,
  job: Briefcase,
  course: BookOpen,
  career: Target,
  system: TrendingUp,
}

const activityColors: Record<string, string> = {
  assessment: "text-emerald-400",
  resume: "text-blue-400",
  job: "text-amber-400",
  course: "text-pink-400",
  career: "text-primary",
  system: "text-muted-foreground",
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return "Just now"
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  if (!data) redirect("/login")

  const { user, stats, recentActivity, topJobs, skillProgress } = data

  if (user.role === "admin") redirect("/dashboard/admin")
  if (user.role === "recruiter") redirect("/dashboard/recruiter")
  if (user.role === "coach") redirect("/dashboard/coach")

  const statCards = [
    {
      title: "Resumes",
      value: String(stats.resumes),
      change: `${stats.resumes} total`,
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      href: "/dashboard/resume",
    },
    {
      title: "Jobs Matched",
      value: String(stats.jobsMatched),
      change: `${stats.applications} applied`,
      icon: Briefcase,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      href: "/dashboard/jobs",
    },
    {
      title: "Assessments",
      value: String(stats.assessments),
      change: `${stats.avgScore}% avg score`,
      icon: BarChart3,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      href: "/dashboard/skills",
    },
    {
      title: "Courses Active",
      value: String(stats.activeCourses),
      change: "In progress",
      icon: BookOpen,
      color: "text-pink-400",
      bg: "bg-pink-400/10",
      href: "/dashboard/learning",
    },
  ]

  const skillColors = [
    "bg-blue-400",
    "bg-emerald-400",
    "bg-amber-400",
    "bg-pink-400",
    "bg-primary",
    "bg-emerald-400",
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="text-xl sm:text-2xl font-bold text-foreground lg:text-3xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Welcome back, {user.name.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here is your career progress overview.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <Flame className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium text-foreground">7 day streak</span>
            </div>
            <Link href="/dashboard/resume">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <FileText className="h-4 w-4" />
                New Resume
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="border-border bg-card transition-all hover:border-primary/30 hover:bg-secondary/50 cursor-pointer py-0">
              <CardContent className="flex items-center gap-4 p-5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}
                >
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p
                    className="text-2xl font-bold text-foreground"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <DashboardCharts />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card py-0">
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex items-center justify-between">
              <CardTitle
                className="text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Recent Activity
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex flex-col gap-4">
              {recentActivity.map((activity) => {
                const Icon = activityIcons[activity.type] || TrendingUp
                const color = activityColors[activity.type] || "text-muted-foreground"
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <Icon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {activity.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
              {recentActivity.length === 0 && (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card py-0">
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex items-center justify-between">
              <CardTitle
                className="text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Top Job Matches
              </CardTitle>
              <Link href="/dashboard/jobs">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80 gap-1"
                >
                  View All
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex flex-col gap-4">
              {topJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-xl border border-border bg-secondary/30 p-4 transition-all hover:border-primary/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="mt-0.5 h-10 w-10 border border-border">
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {job.logo}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {job.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {job.company} &middot; {job.location}
                        </p>
                        <p className="mt-1 text-xs font-medium text-accent">
                          {job.salary}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                    >
                      {job.match}% match
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card className="border-border bg-card py-0">
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex items-center justify-between">
              <CardTitle
                className="text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Skill Progress
              </CardTitle>
              <Link href="/dashboard/skills">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80 gap-1"
                >
                  All Skills
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {skillProgress.map((s, idx) => (
                <div key={s.skill}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {s.skill}
                    </span>
                    <span className="text-sm text-muted-foreground">{s.level}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary">
                    <div
                      className={`h-2 rounded-full ${skillColors[idx % skillColors.length]} transition-all`}
                      style={{ width: `${s.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

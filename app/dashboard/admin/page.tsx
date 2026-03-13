"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Users,
  FileText,
  Briefcase,
  BarChart3,
  BookOpen,
  Shield,
  Trash2,
  UserCheck,
} from "lucide-react"
import { getAdminData, updateUserRole, deleteUser } from "@/lib/actions/admin"

interface AdminData {
  stats: {
    totalUsers: number
    totalResumes: number
    totalJobs: number
    totalAssessments: number
    totalCourses: number
    totalApplications: number
  }
  users: any[]
  recentUsers: any[]
  roleDistribution: {
    jobseekers: number
    recruiters: number
    coaches: number
    admins: number
  }
}

export default function AdminPage() {
  const [data, setData] = useState<AdminData | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const d = await getAdminData()
    setData(d)
  }

  function handleRoleChange(userId: string, newRole: string) {
    startTransition(async () => {
      await updateUserRole(userId, newRole)
      await loadData()
    })
  }

  function handleDeleteUser(userId: string) {
    if (!confirm("Are you sure you want to delete this user?")) return
    startTransition(async () => {
      await deleteUser(userId)
      await loadData()
    })
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-3 text-foreground font-medium">
            Loading admin panel...
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    )
  }

  const roleColors: Record<string, string> = {
    jobseeker: "border-blue-400/30 text-blue-400",
    recruiter: "border-emerald-400/30 text-emerald-400",
    coach: "border-amber-400/30 text-amber-400",
    admin: "border-pink-400/30 text-pink-400",
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1
              className="text-xl sm:text-2xl font-bold text-foreground lg:text-3xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Admin Panel
            </h1>
            <p className="mt-1 text-muted-foreground">
              Manage users, monitor analytics, and moderate content.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Users", value: data.stats.totalUsers, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Resumes", value: data.stats.totalResumes, icon: FileText, color: "text-emerald-400", bg: "bg-emerald-400/10" },
          { label: "Jobs", value: data.stats.totalJobs, icon: Briefcase, color: "text-amber-400", bg: "bg-amber-400/10" },
          { label: "Assessments", value: data.stats.totalAssessments, icon: BarChart3, color: "text-pink-400", bg: "bg-pink-400/10" },
          { label: "Courses", value: data.stats.totalCourses, icon: BookOpen, color: "text-primary", bg: "bg-primary/10" },
          { label: "Applications", value: data.stats.totalApplications, icon: UserCheck, color: "text-emerald-400", bg: "bg-emerald-400/10" },
        ].map((stat) => (
          <Card key={stat.label} className="border-border bg-card py-0">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="border-border bg-card py-0">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                User Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="flex flex-col gap-3">
                {[
                  { role: "Job Seekers", count: data.roleDistribution.jobseekers, color: "bg-blue-400" },
                  { role: "Recruiters", count: data.roleDistribution.recruiters, color: "bg-emerald-400" },
                  { role: "Career Coaches", count: data.roleDistribution.coaches, color: "bg-amber-400" },
                  { role: "Admins", count: data.roleDistribution.admins, color: "bg-pink-400" },
                ].map((item) => (
                  <div key={item.role} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${item.color}`} />
                      <span className="text-sm text-foreground">{item.role}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{item.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-border bg-card py-0">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
                All Users ({data.users.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="flex flex-col gap-3">
                {data.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                          {user.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        disabled={isPending}
                        className="rounded-lg border border-border bg-secondary px-2 py-1 text-xs text-foreground"
                      >
                        <option value="jobseeker">Job Seeker</option>
                        <option value="recruiter">Recruiter</option>
                        <option value="coach">Coach</option>
                        <option value="admin">Admin</option>
                      </select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={isPending}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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

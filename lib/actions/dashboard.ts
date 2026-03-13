"use server"

import { findMany } from "../db"
import { getCurrentUser } from "../auth"
import type {
  Resume,
  Job,
  UserAssessment,
  UserCourse,
  ActivityLog,
  Notification,
  JobApplication,
} from "../types"

export async function getDashboardData() {
  const user = await getCurrentUser()
  if (!user) return null

  const resumes = findMany<Resume>("resumes", (r) => r.userId === user.id)
  const jobs = findMany<Job>("jobs")
  const userAssessments = findMany<UserAssessment>(
    "user_assessments",
    (ua) => ua.userId === user.id
  )
  const userCourses = findMany<UserCourse>(
    "user_courses",
    (uc) => uc.userId === user.id
  )
  const activities = findMany<ActivityLog>(
    "activity_log",
    (a) => a.userId === user.id
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const notifications = findMany<Notification>(
    "notifications",
    (n) => n.userId === user.id && !n.read
  )
  const applications = findMany<JobApplication>(
    "job_applications",
    (a) => a.userId === user.id
  )

  const completedAssessments = userAssessments.filter((ua) => ua.status === "completed")
  const avgScore =
    completedAssessments.length > 0
      ? Math.round(
          completedAssessments.reduce((sum, ua) => sum + (ua.score || 0), 0) /
            completedAssessments.length
        )
      : 0

  const activeCourses = userCourses.filter((uc) => uc.status === "in-progress")

  const topJobs = [...jobs].sort((a, b) => b.match - a.match).slice(0, 3)

  return {
    user,
    stats: {
      resumes: resumes.length,
      jobsMatched: jobs.length,
      assessments: completedAssessments.length,
      avgScore,
      activeCourses: activeCourses.length,
      applications: applications.length,
    },
    recentActivity: activities.slice(0, 5),
    topJobs,
    unreadNotifications: notifications.length,
    skillProgress: user.skills.map((skill) => {
      const related = completedAssessments.find((ua) => {
        const assessment = findMany<any>("assessments").find(
          (a: any) => a.id === ua.assessmentId
        )
        return assessment?.title?.toLowerCase().includes(skill.toLowerCase())
      })
      return {
        skill,
        level: related?.score || Math.floor(Math.random() * 40) + 50,
      }
    }),
  }
}

"use server"

import { revalidatePath } from "next/cache"
import { findMany, updateOne, deleteOne } from "../db"
import { getCurrentUser } from "../auth"
import type {
  User,
  Resume,
  Job,
  UserAssessment,
  UserCourse,
  Notification,
  JobApplication,
} from "../types"

export async function getAdminData() {
  const user = await getCurrentUser()
  if (!user || user.role !== "admin") return null

  const users = findMany<User>("users")
  const resumes = findMany<Resume>("resumes")
  const jobs = findMany<Job>("jobs")
  const assessments = findMany<UserAssessment>("user_assessments")
  const courses = findMany<UserCourse>("user_courses")
  const applications = findMany<JobApplication>("job_applications")
  const notifications = findMany<Notification>("notifications")

  const safeUsers = users.map(({ password: _, ...u }) => u)

  return {
    stats: {
      totalUsers: users.length,
      totalResumes: resumes.length,
      totalJobs: jobs.length,
      totalAssessments: assessments.length,
      totalCourses: courses.length,
      totalApplications: applications.length,
    },
    users: safeUsers,
    recentUsers: safeUsers
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10),
    roleDistribution: {
      jobseekers: users.filter((u) => u.role === "jobseeker").length,
      recruiters: users.filter((u) => u.role === "recruiter").length,
      coaches: users.filter((u) => u.role === "coach").length,
      admins: users.filter((u) => u.role === "admin").length,
    },
  }
}

export async function updateUserRole(userId: string, role: string) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== "admin") return { error: "Not authorized" }

  updateOne<User>("users", userId, {
    role: role as User["role"],
    updatedAt: new Date().toISOString(),
  })
  revalidatePath("/dashboard/admin")
  return { success: true }
}

export async function deleteUser(userId: string) {
  const admin = await getCurrentUser()
  if (!admin || admin.role !== "admin") return { error: "Not authorized" }
  if (userId === admin.id) return { error: "Cannot delete your own account" }

  deleteOne("users", userId)
  revalidatePath("/dashboard/admin")
  return { success: true }
}

"use server"

import { v4 as uuid } from "uuid"
import { revalidatePath } from "next/cache"
import { findMany, findOne, insertOne, updateOne } from "../db"
import { getCurrentUser } from "../auth"
import type { Course, UserCourse, Certificate } from "../types"

export async function getCourses(search?: string, category?: string) {
  let courses = await findMany<Course>("courses")
  if (search) {
    const q = search.toLowerCase()
    courses = courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    )
  }
  if (category && category !== "All") {
    courses = courses.filter((c) => c.category === category)
  }
  return courses
}

export async function getCourse(id: string) {
  return (await findOne<Course>("courses", (c) => c.id === id)) || null
}

export async function getUserCourses() {
  const user = await getCurrentUser()
  if (!user) return []
  return await findMany<UserCourse>("user_courses", (uc) => uc.userId === user.id)
}

export async function getUserCourse(courseId: string) {
  const user = await getCurrentUser()
  if (!user) return null
  return (
    (await findOne<UserCourse>(
      "user_courses",
      (uc) => uc.userId === user.id && uc.courseId === courseId
    )) || null
  )
}

export async function enrollCourse(courseId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const existing = await findOne<UserCourse>(
    "user_courses",
    (uc) => uc.userId === user.id && uc.courseId === courseId
  )
  if (existing) return { error: "Already enrolled", id: existing.id }

  const course = await findOne<Course>("courses", (c) => c.id === courseId)
  const firstVideoId = course?.modules?.[0]?.videos?.[0]?.id || ""

  const uc: UserCourse = {
    id: uuid(),
    userId: user.id,
    courseId,
    progress: 0,
    watchedVideos: [],
    currentVideoId: firstVideoId,
    status: "in-progress",
    startedAt: new Date().toISOString(),
    completedAt: null,
  }

  await insertOne("user_courses", uc)
  revalidatePath("/dashboard/learning")
  return { success: true, id: uc.id }
}

export async function markVideoWatched(courseId: string, videoId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const uc = await findOne<UserCourse>(
    "user_courses",
    (u) => u.userId === user.id && u.courseId === courseId
  )
  if (!uc) return { error: "Not enrolled" }

  const course = await findOne<Course>("courses", (c) => c.id === courseId)
  if (!course) return { error: "Course not found" }

  const watched = new Set(uc.watchedVideos || [])
  watched.add(videoId)
  const watchedArr = Array.from(watched)
  const progress = Math.round((watchedArr.length / course.totalVideos) * 100)

  const updates: Partial<UserCourse> = {
    watchedVideos: watchedArr,
    currentVideoId: videoId,
    progress: Math.min(progress, 100),
  }

  if (progress >= 100) {
    updates.status = "completed"
    updates.completedAt = new Date().toISOString()
    updates.progress = 100

    const existingCert = await findOne<Certificate>(
      "certificates",
      (c) => c.userId === user.id && c.courseId === courseId
    )
    if (!existingCert) {
      await insertOne("certificates", {
        id: uuid(),
        userId: user.id,
        courseId,
        courseTitle: course.title,
        userName: user.name,
        issuedAt: new Date().toISOString(),
      })
    }
  }

  await updateOne("user_courses", uc.id, updates)
  revalidatePath("/dashboard/learning")
  return { success: true, progress: updates.progress, completed: progress >= 100 }
}

export async function setCurrentVideo(courseId: string, videoId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const uc = await findOne<UserCourse>(
    "user_courses",
    (u) => u.userId === user.id && u.courseId === courseId
  )
  if (!uc) return { error: "Not enrolled" }

  await updateOne("user_courses", uc.id, { currentVideoId: videoId })
  return { success: true }
}

export async function getCertificates() {
  const user = await getCurrentUser()
  if (!user) return []
  return await findMany<Certificate>("certificates", (c) => c.userId === user.id)
}

export async function getCertificate(courseId: string) {
  const user = await getCurrentUser()
  if (!user) return null
  return (
    (await findOne<Certificate>(
      "certificates",
      (c) => c.userId === user.id && c.courseId === courseId
    )) || null
  )
}

export async function updateCourseProgress(courseId: string, progress: number) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const uc = await findOne<UserCourse>(
    "user_courses",
    (u) => u.userId === user.id && u.courseId === courseId
  )
  if (!uc) return { error: "Not enrolled" }

  const updates: Partial<UserCourse> = { progress: Math.min(progress, 100) }
  if (progress >= 100) {
    updates.status = "completed"
    updates.completedAt = new Date().toISOString()
    updates.progress = 100
  }

  await updateOne("user_courses", uc.id, updates)
  revalidatePath("/dashboard/learning")
  return { success: true }
}

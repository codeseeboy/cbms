"use server"

import { revalidatePath } from "next/cache"
import { apiGet, apiPost } from "../api"
import type { CoachContentCourse, CoachGuidanceNote, CoachLearnerProgress, CoachOverview } from "../types"

export async function getCoachProgress(search?: string): Promise<CoachLearnerProgress[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : ""
  const data = await apiGet<{ learners: CoachLearnerProgress[] }>(`/api/coach/progress${query}`)
  return data?.learners || []
}

export async function getCoachGuidance(userId: string): Promise<CoachGuidanceNote[]> {
  const data = await apiGet<{ notes: CoachGuidanceNote[] }>(`/api/coach/guidance/${userId}`)
  return data?.notes || []
}

export async function addCoachGuidance(userId: string, text: string) {
  const result = await apiPost<{ success?: boolean; error?: string }>(`/api/coach/guidance/${userId}`, { text })
  revalidatePath("/dashboard/coach")
  revalidatePath("/dashboard/coach/learners")
  return result
}

export async function getCoachOverview(): Promise<CoachOverview | null> {
  return apiGet<CoachOverview>("/api/coach/overview")
}

export async function getCoachCourses(): Promise<CoachContentCourse[]> {
  const data = await apiGet<{ courses: CoachContentCourse[] }>("/api/coach/content/courses")
  return data?.courses || []
}

export async function createCoachCourse(payload: {
  title: string
  category?: string
  level?: "Beginner" | "Intermediate" | "Advanced"
  description?: string
  tags?: string
  moduleTitle?: string
  videos?: { title: string; youtubeId: string; duration?: string }[]
}) {
  const result = await apiPost("/api/coach/content/courses", payload)
  revalidatePath("/dashboard/coach")
  revalidatePath("/dashboard/coach/content")
  revalidatePath("/dashboard/learning")
  return result
}

export async function addCoachCourseModule(courseId: string, title: string) {
  const result = await apiPost(`/api/coach/content/courses/${courseId}/modules`, { title })
  revalidatePath("/dashboard/coach/content")
  revalidatePath("/dashboard/learning")
  return result
}

export async function addCoachCourseVideo(courseId: string, moduleId: string, payload: { title: string; youtubeId: string; duration?: string }) {
  const result = await apiPost(`/api/coach/content/courses/${courseId}/modules/${moduleId}/videos`, payload)
  revalidatePath("/dashboard/coach/content")
  revalidatePath("/dashboard/learning")
  return result
}

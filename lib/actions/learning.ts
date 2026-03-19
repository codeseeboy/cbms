"use server"

import { revalidatePath } from "next/cache"
import { apiGet, apiPost, apiPut } from "../api"
import type { Course, UserCourse, Certificate } from "../types"

export async function getCourses(search?: string, category?: string) {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  if (category) params.set("category", category)
  const qs = params.toString() ? `?${params}` : ""
  return (await apiGet<Course[]>(`/api/courses${qs}`)) || []
}

export async function getCourse(id: string) {
  return apiGet<Course>(`/api/courses/${id}`)
}

export async function getUserCourses() {
  return (await apiGet<UserCourse[]>("/api/user-courses")) || []
}

export async function getUserCourse(courseId: string) {
  return apiGet<UserCourse>(`/api/user-courses/${courseId}`)
}

export async function enrollCourse(courseId: string) {
  const result = await apiPost(`/api/courses/${courseId}/enroll`)
  revalidatePath("/dashboard/learning")
  return result
}

export async function markVideoWatched(courseId: string, videoId: string) {
  const result = await apiPost(`/api/courses/${courseId}/watch-video`, { videoId })
  revalidatePath("/dashboard/learning")
  return result
}

export async function setCurrentVideo(courseId: string, videoId: string) {
  return apiPost(`/api/courses/${courseId}/set-current-video`, { videoId })
}

export async function getCertificates() {
  return (await apiGet<Certificate[]>("/api/certificates")) || []
}

export async function getCertificate(courseId: string) {
  return apiGet<Certificate>(`/api/certificates/${courseId}`)
}

export async function updateCourseProgress(courseId: string, progress: number) {
  const result = await apiPut(`/api/courses/${courseId}/progress`, { progress })
  revalidatePath("/dashboard/learning")
  return result
}

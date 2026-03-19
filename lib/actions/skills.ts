"use server"

import { revalidatePath } from "next/cache"
import { apiGet, apiPost } from "../api"
import type { Assessment, UserAssessment } from "../types"

export async function getAssessments() {
  return (await apiGet<Assessment[]>("/api/assessments")) || []
}

export async function getAssessment(id: string) {
  return apiGet<Assessment>(`/api/assessments/${id}`)
}

export async function getUserAssessments() {
  return (await apiGet<UserAssessment[]>("/api/user-assessments")) || []
}

export async function getUserAssessment(assessmentId: string) {
  return apiGet<UserAssessment>(`/api/user-assessments/${assessmentId}`)
}

export async function startAssessment(assessmentId: string) {
  const result = await apiPost(`/api/assessments/${assessmentId}/start`)
  revalidatePath("/dashboard/skills")
  return result
}

export async function submitAnswer(assessmentId: string, questionIndex: number, answer: number) {
  return apiPost(`/api/assessments/${assessmentId}/answer`, { questionIndex, answer })
}

export async function completeAssessment(assessmentId: string) {
  const result = await apiPost(`/api/assessments/${assessmentId}/complete`)
  revalidatePath("/dashboard/skills")
  return result
}

export async function getAssessmentHistory() {
  return (await apiGet<UserAssessment[]>("/api/assessment-history")) || []
}

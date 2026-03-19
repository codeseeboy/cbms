"use server"

import { revalidatePath } from "next/cache"
import { apiGet, apiPost, apiDelete } from "../api"
import type { CareerGoal } from "../types"

export async function getCareerGoals() {
  return (await apiGet<CareerGoal[]>("/api/career-goals")) || []
}

export async function createCareerGoal(formData: FormData) {
  const result = await apiPost("/api/career-goals", {
    title: formData.get("title") as string,
    description: formData.get("description") as string,
    deadline: formData.get("deadline") as string,
    milestones: formData.get("milestones") as string,
  })
  revalidatePath("/dashboard/career")
  return result
}

export async function toggleMilestone(goalId: string, milestoneId: string) {
  const result = await apiPost(`/api/career-goals/${goalId}/toggle-milestone`, { milestoneId })
  revalidatePath("/dashboard/career")
  return result
}

export async function deleteCareerGoal(goalId: string) {
  const result = await apiDelete(`/api/career-goals/${goalId}`)
  revalidatePath("/dashboard/career")
  return result
}

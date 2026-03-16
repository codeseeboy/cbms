"use server"

import { v4 as uuid } from "uuid"
import { revalidatePath } from "next/cache"
import { findMany, findOne, insertOne, updateOne, deleteOne } from "../db"
import { getCurrentUser } from "../auth"
import type { CareerGoal } from "../types"

export async function getCareerGoals() {
  const user = await getCurrentUser()
  if (!user) return []
  return await findMany<CareerGoal>("career_goals", (g) => g.userId === user.id)
}

export async function createCareerGoal(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const deadline = formData.get("deadline") as string
  const milestonesStr = formData.get("milestones") as string

  if (!title) return { error: "Goal title is required" }

  let milestones: CareerGoal["milestones"] = []
  if (milestonesStr) {
    milestones = milestonesStr
      .split("\n")
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text) => ({ id: uuid(), text, done: false }))
  }

  const goal: CareerGoal = {
    id: uuid(),
    userId: user.id,
    title,
    description: description || "",
    deadline: deadline || "",
    progress: 0,
    status: "in-progress",
    milestones,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  await insertOne("career_goals", goal)
  revalidatePath("/dashboard/career")
  return { success: true }
}

export async function toggleMilestone(goalId: string, milestoneId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const goal = await findOne<CareerGoal>(
    "career_goals",
    (g) => g.id === goalId && g.userId === user.id
  )
  if (!goal) return { error: "Goal not found" }

  const milestones = goal.milestones.map((m) =>
    m.id === milestoneId ? { ...m, done: !m.done } : m
  )
  const doneCount = milestones.filter((m) => m.done).length
  const progress = milestones.length > 0 ? Math.round((doneCount / milestones.length) * 100) : 0

  await updateOne<CareerGoal>("career_goals", goalId, {
    milestones,
    progress,
    status: progress >= 100 ? "completed" : "in-progress",
    updatedAt: new Date().toISOString(),
  })

  revalidatePath("/dashboard/career")
  return { success: true }
}

export async function deleteCareerGoal(goalId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const goal = await findOne<CareerGoal>(
    "career_goals",
    (g) => g.id === goalId && g.userId === user.id
  )
  if (!goal) return { error: "Goal not found" }

  await deleteOne("career_goals", goalId)
  revalidatePath("/dashboard/career")
  return { success: true }
}

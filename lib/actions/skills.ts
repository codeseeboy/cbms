"use server"

import { v4 as uuid } from "uuid"
import { revalidatePath } from "next/cache"
import { findMany, findOne, insertOne, updateOne } from "../db"
import { getCurrentUser } from "../auth"
import type { Assessment, UserAssessment } from "../types"

export async function getAssessments() {
  return findMany<Assessment>("assessments")
}

export async function getAssessment(id: string) {
  return findOne<Assessment>("assessments", (a) => a.id === id) || null
}

export async function getUserAssessments() {
  const user = await getCurrentUser()
  if (!user) return []
  return findMany<UserAssessment>("user_assessments", (ua) => ua.userId === user.id)
}

export async function getUserAssessment(assessmentId: string) {
  const user = await getCurrentUser()
  if (!user) return null
  return (
    findOne<UserAssessment>(
      "user_assessments",
      (ua) => ua.userId === user.id && ua.assessmentId === assessmentId
    ) || null
  )
}

export async function startAssessment(assessmentId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const assessment = findOne<Assessment>("assessments", (a) => a.id === assessmentId)
  if (!assessment) return { error: "Assessment not found" }

  const existing = findOne<UserAssessment>(
    "user_assessments",
    (ua) => ua.userId === user.id && ua.assessmentId === assessmentId
  )

  if (existing && existing.status === "completed") {
    updateOne<UserAssessment>("user_assessments", existing.id, {
      score: null,
      answers: assessment.questions.map(() => null),
      currentQuestion: 0,
      status: "in-progress",
      startedAt: new Date().toISOString(),
      completedAt: null,
    })
    revalidatePath("/dashboard/skills")
    return { success: true, id: existing.id }
  }

  if (existing && existing.status === "in-progress") {
    return { success: true, id: existing.id }
  }

  const ua: UserAssessment = {
    id: uuid(),
    userId: user.id,
    assessmentId,
    score: null,
    answers: assessment.questions.map(() => null),
    currentQuestion: 0,
    status: "in-progress",
    startedAt: new Date().toISOString(),
    completedAt: null,
  }

  insertOne("user_assessments", ua)
  revalidatePath("/dashboard/skills")
  return { success: true, id: ua.id }
}

export async function submitAnswer(assessmentId: string, questionIndex: number, answer: number) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const ua = findOne<UserAssessment>(
    "user_assessments",
    (u) => u.userId === user.id && u.assessmentId === assessmentId
  )
  if (!ua || ua.status !== "in-progress") return { error: "No active assessment" }

  const newAnswers = [...ua.answers]
  newAnswers[questionIndex] = answer

  updateOne<UserAssessment>("user_assessments", ua.id, {
    answers: newAnswers,
    currentQuestion: questionIndex + 1,
  })

  return { success: true }
}

export async function getAssessmentHistory() {
  const user = await getCurrentUser()
  if (!user) return []
  const all = findMany<UserAssessment>("user_assessments", (ua) => ua.userId === user.id)
  return all
    .filter((ua) => ua.status === "completed" && ua.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
}

export async function completeAssessment(assessmentId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const assessment = findOne<Assessment>("assessments", (a) => a.id === assessmentId)
  if (!assessment) return { error: "Assessment not found" }

  const ua = findOne<UserAssessment>(
    "user_assessments",
    (u) => u.userId === user.id && u.assessmentId === assessmentId
  )
  if (!ua) return { error: "No active assessment" }

  let correct = 0
  ua.answers.forEach((answer, idx) => {
    if (answer === assessment.questions[idx]?.correctAnswer) correct++
  })
  const score = Math.round((correct / assessment.questions.length) * 100)

  updateOne<UserAssessment>("user_assessments", ua.id, {
    score,
    status: "completed",
    completedAt: new Date().toISOString(),
    currentQuestion: assessment.questions.length,
  })

  revalidatePath("/dashboard/skills")
  return { success: true, score }
}

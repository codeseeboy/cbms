"use server"

import { v4 as uuid } from "uuid"
import { revalidatePath } from "next/cache"
import { findMany, insertOne, deleteOne, findOne, updateOne } from "../db"
import { getCurrentUser } from "../auth"
import type { Job, JobBookmark, JobApplication, AppliedJob } from "../types"

export async function getJobs(search?: string) {
  const jobs = findMany<Job>("jobs")
  if (!search) return jobs
  const q = search.toLowerCase()
  return jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.tags.some((t) => t.toLowerCase().includes(q))
  )
}

export async function getJob(id: string) {
  return findOne<Job>("jobs", (j) => j.id === id) || null
}

export async function getBookmarks() {
  const user = await getCurrentUser()
  if (!user) return []
  return findMany<JobBookmark>("job_bookmarks", (b) => b.userId === user.id)
}

export async function toggleBookmark(jobId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const existing = findOne<JobBookmark>(
    "job_bookmarks",
    (b) => b.userId === user.id && b.jobId === jobId
  )

  if (existing) {
    deleteOne("job_bookmarks", existing.id)
  } else {
    insertOne("job_bookmarks", {
      id: uuid(),
      userId: user.id,
      jobId,
      createdAt: new Date().toISOString(),
    })
  }

  revalidatePath("/dashboard/jobs")
  return { success: true, bookmarked: !existing }
}

export async function applyToJob(jobId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const existing = findOne<JobApplication>(
    "job_applications",
    (a) => a.userId === user.id && a.jobId === jobId
  )
  if (existing) return { error: "Already applied to this job" }

  insertOne("job_applications", {
    id: uuid(),
    userId: user.id,
    jobId,
    status: "applied",
    appliedAt: new Date().toISOString(),
  })

  revalidatePath("/dashboard/jobs")
  return { success: true }
}

export async function getApplications() {
  const user = await getCurrentUser()
  if (!user) return []
  return findMany<JobApplication>("job_applications", (a) => a.userId === user.id)
}

export async function getAppliedJobs() {
  const user = await getCurrentUser()
  if (!user) return []
  return findMany<AppliedJob>("applied_jobs", (a) => a.userId === user.id)
}

export async function saveAppliedJob(data: {
  title: string; company: string; url: string; location: string; matchScore: number; status: AppliedJob["status"]; notes?: string
}) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const job: AppliedJob = {
    id: uuid(),
    userId: user.id,
    title: data.title,
    company: data.company,
    url: data.url,
    location: data.location,
    matchScore: data.matchScore,
    status: data.status,
    notes: data.notes || "",
    appliedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  insertOne("applied_jobs", job)
  revalidatePath("/dashboard/jobs")
  return { success: true, id: job.id }
}

export async function updateAppliedJobStatus(id: string, status: AppliedJob["status"]) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const existing = findOne<AppliedJob>("applied_jobs", (a) => a.id === id && a.userId === user.id)
  if (!existing) return { error: "Job not found" }

  updateOne("applied_jobs", id, { status, updatedAt: new Date().toISOString() })
  revalidatePath("/dashboard/jobs")
  return { success: true }
}

export async function deleteAppliedJob(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const existing = findOne<AppliedJob>("applied_jobs", (a) => a.id === id && a.userId === user.id)
  if (!existing) return { error: "Job not found" }

  deleteOne("applied_jobs", id)
  revalidatePath("/dashboard/jobs")
  return { success: true }
}

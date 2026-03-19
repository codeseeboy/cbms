"use server"

import { revalidatePath } from "next/cache"
import { apiGet, apiPost, apiPut, apiDelete } from "../api"
import type { Job, JobBookmark, JobApplication, AppliedJob } from "../types"

export async function getJobs(search?: string) {
  const qs = search ? `?search=${encodeURIComponent(search)}` : ""
  return (await apiGet<Job[]>(`/api/jobs${qs}`)) || []
}

export async function getJob(id: string) {
  return apiGet<Job>(`/api/jobs/${id}`)
}

export async function getBookmarks() {
  return (await apiGet<JobBookmark[]>("/api/bookmarks")) || []
}

export async function toggleBookmark(jobId: string) {
  const result = await apiPost(`/api/bookmarks/${jobId}`)
  revalidatePath("/dashboard/jobs")
  return result
}

export async function applyToJob(jobId: string) {
  const result = await apiPost(`/api/jobs/${jobId}/apply`)
  revalidatePath("/dashboard/jobs")
  return result
}

export async function getApplications() {
  return (await apiGet<JobApplication[]>("/api/applications")) || []
}

export async function getAppliedJobs() {
  return (await apiGet<AppliedJob[]>("/api/applied-jobs")) || []
}

export async function saveAppliedJob(data: {
  title: string; company: string; url: string; location: string; matchScore: number; status: AppliedJob["status"]; notes?: string
}) {
  const result = await apiPost("/api/applied-jobs", data)
  revalidatePath("/dashboard/jobs")
  return result
}

export async function updateAppliedJobStatus(id: string, status: AppliedJob["status"]) {
  const result = await apiPut(`/api/applied-jobs/${id}/status`, { status })
  revalidatePath("/dashboard/jobs")
  return result
}

export async function deleteAppliedJob(id: string) {
  const result = await apiDelete(`/api/applied-jobs/${id}`)
  revalidatePath("/dashboard/jobs")
  return result
}

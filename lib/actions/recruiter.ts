"use server"

import { revalidatePath } from "next/cache"
import { apiGet } from "../api"
import { apiPost, apiPut } from "../api"
import type { RecruiterCandidate, RecruiterCandidateDetail, RecruiterChatMessage, RecruiterOverview, RecruiterRequest } from "../types"

export async function getRecruiterCandidates(params?: {
  search?: string
  skill?: string
  minExperience?: number
}): Promise<RecruiterCandidate[]> {
  const query = new URLSearchParams()
  if (params?.search) query.set("search", params.search)
  if (params?.skill) query.set("skill", params.skill)
  if (params?.minExperience !== undefined) query.set("minExperience", String(params.minExperience))

  const data = await apiGet<{ candidates: RecruiterCandidate[] }>(`/api/recruiter/candidates${query.size ? `?${query}` : ""}`)
  return data?.candidates || []
}

export async function getRecruiterCandidateDetail(id: string): Promise<RecruiterCandidateDetail | null> {
  return apiGet<RecruiterCandidateDetail>(`/api/recruiter/candidates/${id}`)
}

export async function getRecruiterOverview(): Promise<RecruiterOverview | null> {
  return apiGet<RecruiterOverview>("/api/recruiter/overview")
}

export async function getRecruiterRequests(params?: { status?: string; search?: string }): Promise<RecruiterRequest[]> {
  const query = new URLSearchParams()
  if (params?.status) query.set("status", params.status)
  if (params?.search) query.set("search", params.search)
  const data = await apiGet<{ requests: RecruiterRequest[] }>(`/api/recruiter/requests${query.size ? `?${query}` : ""}`)
  return data?.requests || []
}

export async function updateRecruiterRequestStatus(id: string, status: RecruiterRequest["status"], note = "") {
  const result = await apiPut(`/api/recruiter/requests/${id}/status`, { status, note })
  revalidatePath("/dashboard/recruiter")
  revalidatePath("/dashboard/recruiter/requests")
  return result
}

export async function getRecruiterChat(applicationId: string): Promise<RecruiterChatMessage[]> {
  const data = await apiGet<{ messages: RecruiterChatMessage[] }>(`/api/recruiter/requests/${applicationId}/chat`)
  return data?.messages || []
}

export async function sendRecruiterChat(applicationId: string, text: string) {
  const result = await apiPost(`/api/recruiter/requests/${applicationId}/chat`, { text })
  revalidatePath("/dashboard/recruiter/messages")
  return result
}

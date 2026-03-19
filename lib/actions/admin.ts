"use server"

import { revalidatePath } from "next/cache"
import { apiGet, apiPut, apiDelete, apiPost } from "../api"

function revalidateAdmin() {
  revalidatePath("/dashboard/admin")
  revalidatePath("/dashboard/admin/users")
  revalidatePath("/dashboard/admin/jobs")
}

export async function getAdminData() {
  return apiGet("/api/admin/data")
}

export async function updateUserRole(userId: string, role: string) {
  const result = await apiPut(`/api/admin/users/${userId}/role`, { role })
  revalidateAdmin()
  return result
}

export async function deleteUser(userId: string) {
  const result = await apiDelete(`/api/admin/users/${userId}`)
  revalidateAdmin()
  return result
}

export async function getAdminJobs() {
  return apiGet("/api/admin/jobs")
}

export async function createAdminJob(data: {
  title: string
  company: string
  location?: string
  type?: string
  salary?: string
  tags?: string
  description?: string
}) {
  const result = await apiPost("/api/admin/jobs", data)
  revalidateAdmin()
  return result
}

export async function deleteAdminJob(jobId: string) {
  const result = await apiDelete(`/api/admin/jobs/${jobId}`)
  revalidateAdmin()
  return result
}

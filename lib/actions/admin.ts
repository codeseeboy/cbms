"use server"

import { revalidatePath } from "next/cache"
import { apiGet, apiPut, apiDelete } from "../api"

export async function getAdminData() {
  return apiGet("/api/admin/data")
}

export async function updateUserRole(userId: string, role: string) {
  const result = await apiPut(`/api/admin/users/${userId}/role`, { role })
  revalidatePath("/dashboard/admin")
  return result
}

export async function deleteUser(userId: string) {
  const result = await apiDelete(`/api/admin/users/${userId}`)
  revalidatePath("/dashboard/admin")
  return result
}

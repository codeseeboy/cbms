"use server"

import { revalidatePath } from "next/cache"
import { apiGet, apiPut, apiDelete } from "../api"
import type { Notification } from "../types"

export async function getNotifications() {
  return (await apiGet<Notification[]>("/api/notifications")) || []
}

export async function getUnreadCount() {
  const result = await apiGet<{ count: number }>("/api/notifications/unread-count")
  return result?.count || 0
}

export async function markAsRead(id: string) {
  const result = await apiPut(`/api/notifications/${id}/read`)
  revalidatePath("/dashboard/notifications")
  return result
}

export async function markAllAsRead() {
  const result = await apiPut("/api/notifications/read-all")
  revalidatePath("/dashboard/notifications")
  return result
}

export async function deleteNotification(id: string) {
  const result = await apiDelete(`/api/notifications/${id}`)
  revalidatePath("/dashboard/notifications")
  return result
}

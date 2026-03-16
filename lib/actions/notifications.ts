"use server"

import { revalidatePath } from "next/cache"
import { findMany, updateOne, deleteOne, readCollection, writeCollection } from "../db"
import { getCurrentUser } from "../auth"
import type { Notification } from "../types"

export async function getNotifications() {
  const user = await getCurrentUser()
  if (!user) return []
  return (await findMany<Notification>("notifications", (n) => n.userId === user.id)).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export async function getUnreadCount() {
  const user = await getCurrentUser()
  if (!user) return 0
  const notifs = await findMany<Notification>(
    "notifications",
    (n) => n.userId === user.id && !n.read
  )
  return notifs.length
}

export async function markAsRead(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  await updateOne<Notification>("notifications", id, { read: true })
  revalidatePath("/dashboard/notifications")
  return { success: true }
}

export async function markAllAsRead() {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const all = await readCollection<Notification>("notifications")
  const updated = all.map((n) =>
    n.userId === user.id ? { ...n, read: true } : n
  )
  await writeCollection("notifications", updated)
  revalidatePath("/dashboard/notifications")
  return { success: true }
}

export async function deleteNotification(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  await deleteOne("notifications", id)
  revalidatePath("/dashboard/notifications")
  return { success: true }
}

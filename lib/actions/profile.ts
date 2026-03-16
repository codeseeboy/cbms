"use server"

import { getCurrentUser } from "../auth"
import { updateOne } from "../db"
import type { SafeUser, User } from "../types"

export async function getProfile(): Promise<SafeUser | null> {
  return getCurrentUser()
}

export async function updateProfile(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const updates: Partial<User> = {
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    location: formData.get("location") as string,
    title: formData.get("title") as string,
    bio: formData.get("bio") as string,
    updatedAt: new Date().toISOString(),
  }

  const skillsStr = formData.get("skills") as string
  if (skillsStr) {
    updates.skills = skillsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  }

  await updateOne("users", user.id, updates)
  return { success: true }
}

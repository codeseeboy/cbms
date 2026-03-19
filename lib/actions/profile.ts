"use server"

import { apiGet, apiPut } from "../api"
import type { SafeUser } from "../types"

export async function getProfile(): Promise<SafeUser | null> {
  return apiGet<SafeUser>("/api/profile")
}

export async function updateProfile(formData: FormData) {
  const body: Record<string, any> = {}
  for (const key of ["name", "phone", "location", "title", "bio"]) {
    body[key] = formData.get(key) as string
  }
  const skillsStr = formData.get("skills") as string
  if (skillsStr) {
    body.skills = skillsStr.split(",").map((s) => s.trim()).filter(Boolean)
  }
  return apiPut("/api/profile", body)
}

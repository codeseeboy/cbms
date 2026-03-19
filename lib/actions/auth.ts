"use server"

import { redirect } from "next/navigation"
import { clearSessionCookie, getCurrentUser } from "../auth"
import { apiPut } from "../api"

export async function logoutAction() {
  await clearSessionCookie()
  redirect("/login")
}

export async function updateProfileAction(formData: FormData) {
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

export async function changePasswordAction(formData: FormData) {
  return apiPut("/api/profile/password", {
    currentPassword: formData.get("currentPassword") as string,
    newPassword: formData.get("newPassword") as string,
  })
}

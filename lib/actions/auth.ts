"use server"

import { hashSync, compareSync } from "bcryptjs"
import { v4 as uuid } from "uuid"
import { redirect } from "next/navigation"
import { findOne, insertOne, readCollection, updateOne } from "../db"
import { setSessionCookie, clearSessionCookie, getCurrentUser } from "../auth"
import { seedDatabase } from "../seed"
import type { User } from "../types"

let seeded = false

async function ensureSeeded() {
  if (seeded) return
  const users = await readCollection<User>("users")
  if (users.length === 0) {
    await seedDatabase()
  }
  seeded = true
}

export async function loginAction(formData: FormData) {
  try {
    // Prevent stale sessions from making failed logins appear successful.
    await clearSessionCookie()
    await ensureSeeded()
    const email = ((formData.get("email") as string) || "").trim().toLowerCase()
    const password = formData.get("password") as string

    if (!email || !password) {
      return { error: "Email and password are required" }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: "Invalid email format" }
    }

    const user = await findOne<User>("users", (u) => u.email === email)
    if (!user) {
      await clearSessionCookie()
      return { error: "Invalid email or password" }
    }

    if (!compareSync(password, user.password)) {
      await clearSessionCookie()
      return { error: "Invalid email or password" }
    }

    await setSessionCookie(user.id)
    return { success: true }
  } catch (error) {
    const message = String(error)
    if (
      message.includes("MONGODB_URI") ||
      message.includes("Mongo") ||
      message.includes("ECONN") ||
      message.includes("authentication failed")
    ) {
      return {
        error:
          "Database connection failed. Set a valid MONGODB_URI in your .env and restart the dev server.",
      }
    }
    return { error: "Unable to login right now. Please try again." }
  }
}

export async function signupAction(formData: FormData) {
  try {
    await ensureSeeded()
    const name = formData.get("name") as string
    const email = ((formData.get("email") as string) || "").trim().toLowerCase()
    const password = formData.get("password") as string
    const role = (formData.get("role") as string) || "jobseeker"

    if (!name || !email || !password) {
      return { error: "All fields are required" }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: "Invalid email format" }
    }

    if (password.length < 6) {
      return { error: "Password must be at least 6 characters" }
    }

    const existing = await findOne<User>("users", (u) => u.email === email)
    if (existing) {
      return { error: "An account with this email already exists" }
    }

    const user: User = {
      id: uuid(),
      name,
      email,
      password: hashSync(password, 10),
      role: role as User["role"],
      phone: "",
      location: "",
      title: "",
      bio: "",
      skills: [],
      avatar: name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await insertOne("users", user)
    await setSessionCookie(user.id)
    return { success: true }
  } catch (error) {
    const message = String(error)
    if (
      message.includes("MONGODB_URI") ||
      message.includes("Mongo") ||
      message.includes("ECONN") ||
      message.includes("authentication failed")
    ) {
      return {
        error:
          "Database connection failed. Set a valid MONGODB_URI in your .env and restart the dev server.",
      }
    }
    return { error: "Unable to create account right now. Please try again." }
  }
}

export async function logoutAction() {
  await clearSessionCookie()
  redirect("/login")
}

export async function updateProfileAction(formData: FormData) {
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

export async function changePasswordAction(formData: FormData) {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { error: "Not authenticated" }

  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string

  const user = await findOne<User>("users", (u) => u.id === currentUser.id)
  if (!user) return { error: "User not found" }

  if (!compareSync(currentPassword, user.password)) {
    return { error: "Current password is incorrect" }
  }

  if (newPassword.length < 6) {
    return { error: "New password must be at least 6 characters" }
  }

  await updateOne<User>("users", user.id, {
    password: hashSync(newPassword, 10),
    updatedAt: new Date().toISOString(),
  })

  return { success: true }
}

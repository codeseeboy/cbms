import { cookies } from "next/headers"
import { apiGet } from "./api"
import type { SafeUser } from "./types"

const COOKIE_NAME = "cb_token"

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  return apiGet<SafeUser>("/api/profile")
}

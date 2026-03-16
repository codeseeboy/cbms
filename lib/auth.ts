import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { findOne } from "./db"
import type { User, SafeUser } from "./types"

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "careerbuilder-secret-key-change-in-production-2026"
)

const COOKIE_NAME = "cb_session"

export async function createToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(SECRET)
}

export async function verifyToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return { userId: payload.userId as string }
  } catch {
    return null
  }
}

export async function setSessionCookie(userId: string) {
  const token = await createToken(userId)
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

export async function getSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const session = await getSession()
  if (!session) return null
  const user = await findOne<User>("users", (u) => u.id === session.userId)
  if (!user) return null
  const { password: _, ...safeUser } = user
  return safeUser
}

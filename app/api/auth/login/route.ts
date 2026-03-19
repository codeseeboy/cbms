import { NextResponse } from "next/server"
import { compareSync } from "bcryptjs"
import { findOne, readCollection } from "@/lib/db"
import { setSessionCookie } from "@/lib/auth"
import { seedDatabase } from "@/lib/seed"
import type { User } from "@/lib/types"

let seeded = false

async function ensureSeeded() {
  if (seeded) return
  const users = await readCollection<User>("users")
  if (users.length === 0) await seedDatabase()
  seeded = true
}

export async function POST(req: Request) {
  await ensureSeeded()

  try {
    const body = (await req.json()) as { email?: string; password?: string }
    const email = String(body?.email || "").trim().toLowerCase()
    const password = String(body?.password || "")

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 422 }
      )
    }

    const user = await findOne<User>("users", (u) => u.email === email)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      )
    }

    if (!compareSync(password, String(user.password || ""))) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      )
    }

    await setSessionCookie(user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to login", details: err?.message },
      { status: 500 }
    )
  }
}


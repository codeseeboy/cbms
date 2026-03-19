import { NextResponse } from "next/server"
import { hashSync } from "bcryptjs"
import { v4 as uuid } from "uuid"
import { findOne, insertOne, readCollection } from "@/lib/db"
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
    const body = (await req.json()) as {
      name?: string
      email?: string
      password?: string
      role?: string
    }

    const name = String(body?.name || "").trim()
    const email = String(body?.email || "").trim().toLowerCase()
    const password = String(body?.password || "")
    const role = String(body?.role || "jobseeker")

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
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

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    const existing = await findOne<User>("users", (u) => u.email === email)
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      )
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

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      },
      { status: 201 }
    )
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to sign up", details: err?.message },
      { status: 500 }
    )
  }
}


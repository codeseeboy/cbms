import { NextResponse } from "next/server"
import { setSessionCookie, clearSessionCookie } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { token?: string }
    const token = String(body?.token || "")
    if (!token) {
      return NextResponse.json({ success: false, error: "token is required" }, { status: 400 })
    }

    await setSessionCookie(token)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create session" }, { status: 500 })
  }
}

export async function DELETE() {
  await clearSessionCookie()
  return NextResponse.json({ success: true })
}

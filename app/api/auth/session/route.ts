import { NextResponse } from "next/server"
import { setSessionCookie, clearSessionCookie } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { userId?: string }
    const userId = String(body?.userId || "")
    if (!userId) {
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 })
    }

    await setSessionCookie(userId)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: "Failed to create session" }, { status: 500 })
  }
}

export async function DELETE() {
  await clearSessionCookie()
  return NextResponse.json({ success: true })
}

import { NextResponse } from "next/server"
import { seedDatabase } from "@/lib/seed"

export async function GET() {
  try {
    seedDatabase()
    return NextResponse.json({ success: true, message: "Database seeded successfully" })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to seed database", error: String(error) },
      { status: 500 }
    )
  }
}

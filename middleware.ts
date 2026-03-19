import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const publicPaths = ["/", "/login", "/signup"]

const JWT_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "careerbuilder-secret-key-change-in-production-2026"
)

/** Paths that are only for job seekers (SRS: career tools), not Admin / Recruiter / Coach */
const jobSeekerOnlyPrefixes = [
  "/dashboard/resume",
  "/dashboard/jobs",
  "/dashboard/skills",
  "/dashboard/learning",
  "/dashboard/career",
]

function isJobSeekerContentPath(pathname: string) {
  return jobSeekerOnlyPrefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function homeForRole(role: string | undefined) {
  if (role === "admin") return "/dashboard/admin"
  if (role === "recruiter") return "/dashboard/recruiter"
  if (role === "coach") return "/dashboard/coach"
  return "/dashboard"
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    publicPaths.some((p) => pathname === p) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    const token = request.cookies.get("cb_token")?.value
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    let role: string | undefined
    try {
      const { payload } = await jwtVerify(token, JWT_KEY)
      role = typeof payload.role === "string" ? payload.role : undefined
    } catch {
      return NextResponse.next()
    }

    if (!role) {
      return NextResponse.next()
    }

    if (pathname === "/dashboard") {
      const target = homeForRole(role)
      if (target !== "/dashboard") {
        return NextResponse.redirect(new URL(target, request.url))
      }
    }

    if (role !== "jobseeker" && isJobSeekerContentPath(pathname)) {
      return NextResponse.redirect(new URL(homeForRole(role), request.url))
    }

    if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
      return NextResponse.redirect(new URL(homeForRole(role), request.url))
    }
    if (pathname.startsWith("/dashboard/recruiter") && role !== "recruiter") {
      return NextResponse.redirect(new URL(homeForRole(role), request.url))
    }
    if (pathname.startsWith("/dashboard/coach") && role !== "coach") {
      return NextResponse.redirect(new URL(homeForRole(role), request.url))
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

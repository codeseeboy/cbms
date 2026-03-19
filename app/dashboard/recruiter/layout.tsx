import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

/** SRS: Recruiter — search candidates, view profiles (not job-seeker tooling) */
export default async function RecruiterSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.role !== "recruiter") redirect("/dashboard")
  return <>{children}</>
}

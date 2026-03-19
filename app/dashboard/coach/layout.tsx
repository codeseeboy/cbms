import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

/** SRS: Career Coach — monitor learner progress, provide guidance */
export default async function CoachSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.role !== "coach") redirect("/dashboard")
  return <>{children}</>
}

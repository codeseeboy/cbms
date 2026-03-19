import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

/** SRS: Administrator — system configuration, monitoring, user/content management only */
export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  if (user.role !== "admin") redirect("/dashboard")
  return <div className="px-4 pb-8 pt-4 sm:px-6 lg:px-8">{children}</div>
}

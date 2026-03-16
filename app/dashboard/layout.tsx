import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { OnboardingWalkthrough } from "@/components/dashboard/onboarding"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar user={{ name: user.name, role: user.role, avatar: user.avatar }} />
      <main className="flex-1 overflow-auto pt-12 lg:pt-0">{children}</main>
      <OnboardingWalkthrough />
    </div>
  )
}

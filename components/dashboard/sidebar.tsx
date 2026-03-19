"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard, FileText, Briefcase, BarChart3, BookOpen, Map, Bell,
  Settings, LogOut, Rocket, ChevronLeft, ChevronRight, Search, User,
  Menu, X, Users, LineChart, CircleHelp,
} from "lucide-react"
import { logoutAction } from "@/lib/actions/auth"

/** Job Seeker — SRS: resume, job recs, assessments, learning, career planning */
const sidebarLinks = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Resume Builder", href: "/dashboard/resume", icon: FileText },
  { label: "Job Matching", href: "/dashboard/jobs", icon: Briefcase },
  { label: "Skill Assessment", href: "/dashboard/skills", icon: BarChart3 },
  { label: "Learning", href: "/dashboard/learning", icon: BookOpen },
  { label: "Career Planning", href: "/dashboard/career", icon: Map },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Help & FAQ", href: "/dashboard/help", icon: CircleHelp },
]

/** Administrator — SRS: manage users, manage content, monitor analytics (no job-seeker tools) */
const adminLinks = [
  { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
  { label: "Users", href: "/dashboard/admin/users", icon: Users },
  { label: "Job content", href: "/dashboard/admin/jobs", icon: Briefcase },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Help & FAQ", href: "/dashboard/help", icon: CircleHelp },
]

/** Recruiter — SRS: search candidates, view profiles */
const recruiterLinks = [
  { label: "Overview", href: "/dashboard/recruiter", icon: LayoutDashboard },
  { label: "Job Requests", href: "/dashboard/recruiter/requests", icon: Briefcase },
  { label: "Candidates", href: "/dashboard/recruiter/candidates", icon: Users },
  { label: "Messages", href: "/dashboard/recruiter/messages", icon: Search },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Help & FAQ", href: "/dashboard/help", icon: CircleHelp },
]

/** Career Coach — SRS: monitor user progress, provide guidance */
const coachLinks = [
  { label: "Overview", href: "/dashboard/coach", icon: LayoutDashboard },
  { label: "Learners", href: "/dashboard/coach/learners", icon: Users },
  { label: "Content Studio", href: "/dashboard/coach/content", icon: BookOpen },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Help & FAQ", href: "/dashboard/help", icon: CircleHelp },
]

function navLinkActive(pathname: string, href: string) {
  if (href === "/dashboard/admin") {
    return pathname === "/dashboard/admin" || pathname === "/dashboard/admin/"
  }
  if (href === "/dashboard/admin/users") return pathname.startsWith("/dashboard/admin/users")
  if (href === "/dashboard/admin/jobs") return pathname.startsWith("/dashboard/admin/jobs")
  if (href === "/dashboard/recruiter") return pathname === "/dashboard/recruiter" || pathname === "/dashboard/recruiter/"
  if (href === "/dashboard/recruiter/requests") return pathname.startsWith("/dashboard/recruiter/requests")
  if (href === "/dashboard/recruiter/candidates") return pathname.startsWith("/dashboard/recruiter/candidates")
  if (href === "/dashboard/recruiter/messages") return pathname.startsWith("/dashboard/recruiter/messages")
  if (href === "/dashboard/coach") return pathname === "/dashboard/coach" || pathname === "/dashboard/coach/"
  if (href === "/dashboard/coach/learners") return pathname.startsWith("/dashboard/coach/learners")
  if (href === "/dashboard/coach/content") return pathname.startsWith("/dashboard/coach/content")
  return pathname === href
}

const bottomLinks = [
  { label: "Profile", href: "/dashboard/profile", icon: User },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

interface SidebarProps {
  user: { name: string; role: string; avatar: string }
}

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const allLinks =
    user.role === "admin"
      ? adminLinks
      : user.role === "recruiter"
        ? recruiterLinks
        : user.role === "coach"
          ? coachLinks
          : sidebarLinks

  const roleLabel = user.role === "jobseeker" ? "Job Seeker" : user.role === "recruiter" ? "Recruiter" : user.role === "coach" ? "Career Coach" : "Admin"

  const sidebarContent = (
    <>
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Rocket className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-base font-bold tracking-tight text-sidebar-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            CareerBuilder
          </span>
        )}
        <button onClick={() => setMobileOpen(false)} className="ml-auto lg:hidden text-muted-foreground hover:text-foreground">
          <X className="h-5 w-5" />
        </button>
      </div>

      {!collapsed && user.role === "jobseeker" && (
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Search...</span>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-3 py-2">
        <nav className="flex flex-col gap-0.5">
          {allLinks.map((link) => {
            const isActive = navLinkActive(pathname, link.href)
            return (
              <Link key={link.href} href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  isActive ? "bg-sidebar-primary/10 text-sidebar-primary" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? link.label : undefined}>
                <link.icon className="h-4.5 w-4.5 shrink-0" />
                {!collapsed && link.label}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border px-3 py-2">
        {bottomLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link key={link.href} href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                isActive ? "bg-sidebar-primary/10 text-sidebar-primary" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? link.label : undefined}>
              <link.icon className="h-4.5 w-4.5 shrink-0" />
              {!collapsed && link.label}
            </Link>
          )
        })}

        <div className={cn("mt-1 flex items-center gap-3 rounded-lg px-3 py-2", collapsed && "justify-center px-0")}>
          <Avatar className="h-7 w-7 shrink-0 border border-sidebar-border">
            <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">{user.avatar}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{roleLabel}</p>
            </div>
          )}
          {!collapsed && (
            <form action={logoutAction}>
              <button type="submit" title="Log out">
                <LogOut className="h-4 w-4 text-muted-foreground transition-colors hover:text-foreground" />
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-12 items-center gap-3 border-b border-border bg-card px-3">
        <button onClick={() => setMobileOpen(true)} className="text-foreground">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
          <Rocket className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <span className="text-sm font-bold" style={{ fontFamily: "var(--font-heading)" }}>CareerBuilder</span>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col bg-sidebar shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={cn(
        "relative hidden lg:flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-[68px]" : "w-60"
      )}>
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-muted-foreground transition-colors hover:text-foreground"
          aria-label={collapsed ? "Expand" : "Collapse"}>
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </aside>
    </>
  )
}

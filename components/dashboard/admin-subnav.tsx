"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const sections = [
  { href: "/dashboard/admin", label: "Overview" },
  { href: "/dashboard/admin/users", label: "User management" },
  { href: "/dashboard/admin/jobs", label: "Job content" },
] as const

function sectionActive(pathname: string, href: string) {
  if (href === "/dashboard/admin") {
    return pathname === "/dashboard/admin" || pathname === "/dashboard/admin/"
  }
  return pathname.startsWith(href)
}

export function AdminSubnav() {
  const pathname = usePathname()

  return (
    <div className="sticky top-12 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:top-0">
      <div className="px-4 py-3 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap gap-1" aria-label="Admin sections">
          {sections.map((item) => {
            const active = sectionActive(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
      <p className="px-4 pb-2 text-[11px] text-muted-foreground sm:px-6 lg:px-8">
        Numbers and lists load from MongoDB through the backend API (seed data lives in the database until you change it).
      </p>
    </div>
  )
}

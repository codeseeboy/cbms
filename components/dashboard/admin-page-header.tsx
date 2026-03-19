"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

export function AdminPageHeader({
  title,
  subtitle,
  onRefresh,
  isRefreshing,
  lastUpdated,
}: {
  title: string
  subtitle?: string
  onRefresh: () => void
  isRefreshing?: boolean
  lastUpdated: Date | null
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1
          className="text-xl font-bold text-foreground sm:text-2xl lg:text-3xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        {lastUpdated && (
          <p className="mt-1 text-[11px] text-muted-foreground">
            Last loaded: {lastUpdated.toLocaleString()}
          </p>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 shrink-0 gap-2 border-border"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
        Refresh from API
      </Button>
    </div>
  )
}

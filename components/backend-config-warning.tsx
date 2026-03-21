"use client"

import { AlertTriangle } from "lucide-react"
import { isClientApiConfigured } from "@/lib/get-api-base-url"

/**
 * Shows when the production build has no NEXT_PUBLIC_API_URL — all direct
 * backend calls (resume PDF, job match, certificates) would otherwise target localhost.
 */
export function BackendConfigWarning() {
  if (process.env.NODE_ENV !== "production") return null
  if (isClientApiConfigured()) return null

  return (
    <div className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
      <div className="mx-auto flex max-w-4xl items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
        <div>
          <p className="font-semibold text-amber-50">Backend URL is not configured</p>
          <p className="mt-1 text-xs text-amber-100/90">
            Set <code className="rounded bg-black/20 px-1 py-0.5">NEXT_PUBLIC_API_URL</code> to your deployed API
            (e.g. <code className="rounded bg-black/20 px-1">https://your-app.onrender.com</code>) in your hosting
            dashboard, then redeploy. Without it, the app tries to call{" "}
            <code className="rounded bg-black/20 px-1">localhost</code>, which fails in production.
          </p>
        </div>
      </div>
    </div>
  )
}

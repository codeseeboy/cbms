/**
 * Backend base URL for API calls.
 *
 * - **Browser / client:** Only `NEXT_PUBLIC_API_URL` is available (inlined at build time).
 * - **Server (Server Actions, Route Handlers):** Can also use `API_URL` (secret, not exposed to client).
 *
 * Production (Vercel, etc.): Set `NEXT_PUBLIC_API_URL=https://your-service.onrender.com`
 * and redeploy. Do not rely on localhost in production.
 */
const DEV_DEFAULT = "http://localhost:4002"

function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, "")
}

/** Use in Server Components, Server Actions, and `lib/api.ts` */
export function getServerApiBaseUrl(): string {
  const fromSecret = process.env.API_URL?.trim()
  const fromPublic = process.env.NEXT_PUBLIC_API_URL?.trim()
  const resolved = fromSecret || fromPublic
  if (resolved) return stripTrailingSlash(resolved)
  if (process.env.NODE_ENV !== "production") return DEV_DEFAULT
  return ""
}

/**
 * Use in client components (`"use client"`). Only `NEXT_PUBLIC_*` exists in the bundle.
 */
export function getClientApiBaseUrl(): string {
  const fromPublic = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (fromPublic) return stripTrailingSlash(fromPublic)
  if (process.env.NODE_ENV !== "production") return DEV_DEFAULT
  return ""
}

export function isClientApiConfigured(): boolean {
  return getClientApiBaseUrl().length > 0
}

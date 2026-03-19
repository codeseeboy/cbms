import { cookies } from "next/headers"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002"
const COOKIE_NAME = "cb_token"

/** Read the JWT token from the session cookie (server-side only) */
export async function getToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(COOKIE_NAME)?.value || null
}

/** Make an authenticated GET request to the backend */
export async function apiGet<T = any>(path: string): Promise<T | null> {
  const token = await getToken()
  try {
    const res = await fetch(`${API}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/** Make an authenticated POST request to the backend */
export async function apiPost<T = any>(path: string, body?: any): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return await res.json()
}

/** Make an authenticated PUT request to the backend */
export async function apiPut<T = any>(path: string, body?: any): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  return await res.json()
}

/** Make an authenticated DELETE request to the backend */
export async function apiDelete<T = any>(path: string): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API}${path}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  return await res.json()
}

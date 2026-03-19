"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Rocket, Eye, EyeOff, ArrowRight } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4002"

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")
    try {
      const formData = new FormData(event.currentTarget)
      const payload = {
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || ""),
      }

      // Step 1: Authenticate via the Express backend (Render)
      const authResponse = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const authData = await authResponse.json()
      if (!authResponse.ok || !authData?.success || !authData?.user?.id) {
        setError(authData?.error || "Login failed")
      } else {
        // Step 2: Set the session cookie on the frontend domain
        await fetch("/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: authData.token }),
        })
        router.push("/dashboard")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/" className="mb-6 flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Rocket className="h-6 w-6 text-primary-foreground" />
            </div>
            <span
              className="text-2xl font-bold tracking-tight text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              CareerBuilder
            </span>
          </Link>
          <h1
            className="text-2xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Welcome back
          </h1>
          <p className="mt-1 text-muted-foreground">
            Sign in to continue to your dashboard
          </p>
        </div>

        <Card className="border-border bg-card py-0">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  name="email"
                  type="email"
                  placeholder="shashikant@careerbuilder.com"
                  required
                  className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    required
                    className="border-border bg-secondary text-foreground placeholder:text-muted-foreground pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              >
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-6 border-t border-border pt-4">
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-xs font-medium text-foreground mb-1">Demo Credentials</p>
                <p className="text-xs text-muted-foreground">
                  <strong>Job Seeker:</strong> shashikant@careerbuilder.com / password123
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Admin:</strong> admin@careerbuilder.com / admin123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary hover:text-primary/80"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

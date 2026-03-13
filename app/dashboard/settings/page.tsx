"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  Bell,
  Eye,
  Moon,
  Globe,
  Lock,
  Save,
  CheckCircle2,
} from "lucide-react"
import { changePasswordAction, logoutAction } from "@/lib/actions/auth"

export default function SettingsPage() {
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const [notifSettings, setNotifSettings] = useState({
    jobAlerts: true,
    assessmentResults: true,
    courseRecommendations: true,
    resumeTips: false,
    weeklyDigest: true,
  })

  async function handleChangePassword(formData: FormData) {
    setMessage("")
    setError("")
    startTransition(async () => {
      const result = await changePasswordAction(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setMessage("Password changed successfully!")
        setTimeout(() => setMessage(""), 3000)
      }
    })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1
          className="text-xl sm:text-2xl font-bold text-foreground lg:text-3xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Settings
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage your account preferences and security.
        </p>
      </div>

      <div className="flex flex-col gap-6 max-w-2xl">
        {message && (
          <div className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {message}
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card className="border-border bg-card py-0">
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle
                className="text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Change Password
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form action={handleChangePassword} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">
                  Current Password
                </label>
                <Input
                  name="currentPassword"
                  type="password"
                  required
                  className="border-border bg-secondary text-foreground"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-muted-foreground">
                  New Password
                </label>
                <Input
                  name="newPassword"
                  type="password"
                  required
                  minLength={6}
                  className="border-border bg-secondary text-foreground"
                />
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary text-primary-foreground gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isPending ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border bg-card py-0">
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle
                className="text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Notification Preferences
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex flex-col gap-4">
              {[
                { key: "jobAlerts" as const, label: "Job Match Alerts", desc: "Get notified when new jobs match your profile" },
                { key: "assessmentResults" as const, label: "Assessment Results", desc: "Notifications when assessment scores are ready" },
                { key: "courseRecommendations" as const, label: "Course Recommendations", desc: "Receive personalized learning suggestions" },
                { key: "resumeTips" as const, label: "Resume Tips", desc: "Optimization tips for your resumes" },
                { key: "weeklyDigest" as const, label: "Weekly Digest", desc: "Weekly summary of your career progress" },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifSettings[item.key]}
                    onCheckedChange={(checked) =>
                      setNotifSettings({ ...notifSettings, [item.key]: checked })
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card py-0">
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle
                className="text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Account
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Privacy</p>
                  <p className="text-xs text-muted-foreground">
                    Control who can see your profile
                  </p>
                </div>
                <Badge variant="outline" className="border-primary/30 text-primary">
                  Public
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Two-Factor Authentication
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Add extra security to your account
                  </p>
                </div>
                <Badge variant="outline" className="border-amber-400/30 text-amber-400">
                  Not Enabled
                </Badge>
              </div>
              <div className="border-t border-border pt-4">
                <form action={logoutAction}>
                  <Button
                    type="submit"
                    variant="outline"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                  >
                    Sign Out
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

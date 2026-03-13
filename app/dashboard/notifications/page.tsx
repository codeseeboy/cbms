"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Bell,
  Briefcase,
  FileText,
  BarChart3,
  BookOpen,
  CheckCheck,
  Trash2,
  Settings,
} from "lucide-react"
import {
  getNotifications,
  markAllAsRead,
  deleteNotification,
  markAsRead,
} from "@/lib/actions/notifications"
import type { Notification } from "@/lib/types"

const iconMap: Record<string, any> = {
  job: Briefcase,
  assessment: BarChart3,
  resume: FileText,
  learning: BookOpen,
  system: Settings,
}

const colorMap: Record<string, { color: string; bg: string }> = {
  job: { color: "text-emerald-400", bg: "bg-emerald-400/10" },
  assessment: { color: "text-amber-400", bg: "bg-amber-400/10" },
  resume: { color: "text-blue-400", bg: "bg-blue-400/10" },
  learning: { color: "text-pink-400", bg: "bg-pink-400/10" },
  system: { color: "text-muted-foreground", bg: "bg-secondary" },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return "Just now"
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    loadNotifications()
  }, [])

  async function loadNotifications() {
    const data = await getNotifications()
    setNotifications(data)
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllAsRead()
      await loadNotifications()
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteNotification(id)
      await loadNotifications()
    })
  }

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markAsRead(id)
      await loadNotifications()
    })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="text-xl sm:text-2xl font-bold text-foreground lg:text-3xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              Notifications
            </h1>
            <p className="mt-1 text-muted-foreground">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}.`
                : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              className="border-border text-foreground gap-2"
              onClick={handleMarkAllRead}
              disabled={isPending}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {notifications.map((notif) => {
          const Icon = iconMap[notif.type] || Bell
          const colors = colorMap[notif.type] || colorMap.system

          return (
            <Card
              key={notif.id}
              className={`border-border bg-card transition-all py-0 ${
                !notif.read ? "border-l-2 border-l-primary" : ""
              }`}
            >
              <CardContent className="flex items-start gap-4 p-5">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.bg}`}
                >
                  <Icon className={`h-5 w-5 ${colors.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() => !notif.read && handleMarkRead(notif.id)}
                      className="text-left"
                    >
                      <p
                        className={`text-sm font-medium ${
                          notif.read ? "text-muted-foreground" : "text-foreground"
                        }`}
                      >
                        {notif.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {notif.description}
                      </p>
                    </button>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {timeAgo(notif.createdAt)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(notif.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
                {!notif.read && (
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </CardContent>
            </Card>
          )
        })}

        {notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-foreground font-medium">No notifications</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You are all caught up.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

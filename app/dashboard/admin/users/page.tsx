"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trash2, Users } from "lucide-react"
import { getAdminData, updateUserRole, deleteUser } from "@/lib/actions/admin"
import type { AdminData } from "@/lib/admin-types"
import { AdminPageHeader } from "@/components/dashboard/admin-page-header"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRealtimeQuery } from "@/lib/hooks/use-realtime-query"

export default function AdminUsersPage() {
  const [search, setSearch] = useState("")
  const queryClient = useQueryClient()
  const { data, isFetching, dataUpdatedAt } = useRealtimeQuery<AdminData | null>({
    queryKey: ["admin", "users"],
    queryFn: () => getAdminData(),
    realtimeMs: 20_000,
    staleMs: 20_000,
  })
  const refreshMutation = useMutation({
    mutationFn: () => getAdminData(),
    onSuccess: (next) => {
      queryClient.setQueryData(["admin", "users"], next)
      queryClient.invalidateQueries({ queryKey: ["admin"] })
    },
  })
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) => updateUserRole(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  })
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  })
  const lastUpdated = data ? new Date(dataUpdatedAt) : null

  const filtered = useMemo(() => {
    if (!data?.users) return []
    const q = search.trim().toLowerCase()
    if (!q) return data.users
    return data.users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    )
  }, [data?.users, search])

  function handleRoleChange(userId: string, newRole: string) {
    updateRoleMutation.mutate({ userId, role: newRole })
  }

  function handleDeleteUser(userId: string) {
    if (!confirm("Are you sure you want to delete this user?")) return
    deleteUserMutation.mutate(userId)
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Users className="h-12 w-12 text-muted-foreground/30" />
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader
        title="User management"
        subtitle="All accounts stored in MongoDB. Changes apply immediately via API."
        onRefresh={() => refreshMutation.mutate()}
        isRefreshing={isFetching || refreshMutation.isPending || updateRoleMutation.isPending || deleteUserMutation.isPending}
        lastUpdated={lastUpdated}
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="border-border bg-card py-0">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground">Total users</p>
            <p className="text-xl font-bold text-foreground">{data.users.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card py-0">
          <CardContent className="p-3.5">
            <p className="text-[11px] text-muted-foreground">Visible after filter</p>
            <p className="text-xl font-bold text-foreground">{filtered.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card py-0">
          <CardContent className="p-3.5">
            <p className="mb-1 text-[11px] text-muted-foreground">Role mix</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="border-blue-400/30 text-blue-400">JS {data.roleDistribution.jobseekers}</Badge>
              <Badge variant="outline" className="border-emerald-400/30 text-emerald-400">R {data.roleDistribution.recruiters}</Badge>
              <Badge variant="outline" className="border-amber-400/30 text-amber-400">C {data.roleDistribution.coaches}</Badge>
              <Badge variant="outline" className="border-pink-400/30 text-pink-400">A {data.roleDistribution.admins}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Use search + role selector to manage users quickly.
        </p>
        <div className="relative max-w-md flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or role…"
            className="border-border bg-secondary"
          />
        </div>
      </div>

      <Card className="border-border bg-card py-0">
        <CardHeader className="pb-4 pt-6 px-6">
          <CardTitle className="text-foreground" style={{ fontFamily: "var(--font-heading)" }}>
            All users
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex max-h-[min(72vh,760px)] flex-col gap-3 overflow-y-auto pr-1">
            {filtered.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-10 w-10 shrink-0 border border-border">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{user.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={updateRoleMutation.isPending || deleteUserMutation.isPending}
                    className="rounded-lg border border-border bg-secondary px-2 py-1.5 text-xs text-foreground capitalize"
                  >
                    <option value="jobseeker">Job Seeker</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="coach">Coach</option>
                    <option value="admin">Admin</option>
                  </select>
                  <Badge variant="outline" className="hidden border-border text-muted-foreground sm:inline-flex capitalize">
                    {user.role}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={updateRoleMutation.isPending || deleteUserMutation.isPending}
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No users match your search.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Save,
  X,
  Plus,
} from "lucide-react"
import { getProfile, updateProfile } from "@/lib/actions/profile"
import type { SafeUser } from "@/lib/types"

export default function ProfilePage() {
  const [user, setUser] = useState<SafeUser | null>(null)
  const [skills, setSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadUser()
  }, [])

  async function loadUser() {
    const u = await getProfile()
    if (u) {
      setUser(u)
      setSkills(u.skills)
    }
  }

  async function handleSubmit(formData: FormData) {
    formData.set("skills", skills.join(","))
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result.success) {
        setMessage("Profile updated successfully!")
        await loadUser()
        setTimeout(() => setMessage(""), 3000)
      }
    })
  }

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()])
      setNewSkill("")
    }
  }

  if (!user) return null

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1
          className="text-xl sm:text-2xl font-bold text-foreground lg:text-3xl"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Profile
        </h1>
        <p className="mt-1 text-muted-foreground">
          Manage your personal and professional information.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-400">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="border-border bg-card py-0">
            <CardContent className="flex flex-col items-center p-6">
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                  {user.avatar}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-lg font-bold text-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.title || "No title set"}</p>
              <Badge variant="outline" className="mt-2 border-primary/30 text-primary">
                {user.role === "jobseeker"
                  ? "Job Seeker"
                  : user.role === "recruiter"
                  ? "Recruiter"
                  : user.role === "coach"
                  ? "Career Coach"
                  : "Admin"}
              </Badge>
              <div className="mt-4 w-full space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {user.phone}
                  </div>
                )}
                {user.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {user.location}
                  </div>
                )}
              </div>
              <div className="mt-4 w-full">
                <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                  Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-border bg-card py-0">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle
                className="text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Edit Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <form action={handleSubmit} className="flex flex-col gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm text-muted-foreground">
                      Full Name
                    </label>
                    <Input
                      name="name"
                      defaultValue={user.name}
                      className="border-border bg-secondary text-foreground"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-muted-foreground">
                      Job Title
                    </label>
                    <Input
                      name="title"
                      defaultValue={user.title}
                      placeholder="e.g., Senior Frontend Developer"
                      className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-muted-foreground">
                      Phone
                    </label>
                    <Input
                      name="phone"
                      defaultValue={user.phone}
                      placeholder="+91 98765 43210"
                      className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm text-muted-foreground">
                      Location
                    </label>
                    <Input
                      name="location"
                      defaultValue={user.location}
                      placeholder="Mumbai, India"
                      className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-muted-foreground">
                    Bio
                  </label>
                  <Textarea
                    name="bio"
                    defaultValue={user.bio}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className="border-border bg-secondary text-foreground placeholder:text-muted-foreground resize-none"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm text-muted-foreground">
                    Skills
                  </label>
                  <div className="mb-3 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="gap-1.5 border-border bg-secondary text-foreground"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() =>
                            setSkills(skills.filter((s) => s !== skill))
                          }
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a skill..."
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addSkill()
                        }
                      }}
                      className="border-border bg-secondary text-foreground"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addSkill}
                      className="border-border text-foreground shrink-0 gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="bg-primary text-primary-foreground gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

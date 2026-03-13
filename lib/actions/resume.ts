"use server"

import { v4 as uuid } from "uuid"
import { revalidatePath } from "next/cache"
import { findMany, insertOne, updateOne, deleteOne, findOne } from "../db"
import { getCurrentUser } from "../auth"
import type { Resume } from "../types"

export async function getResumes() {
  const user = await getCurrentUser()
  if (!user) return []
  return findMany<Resume>("resumes", (r) => r.userId === user.id)
}

export async function getResume(id: string) {
  const user = await getCurrentUser()
  if (!user) return null
  return findOne<Resume>("resumes", (r) => r.id === id && r.userId === user.id) || null
}

export async function createResume(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const title = formData.get("title") as string
  const template = (formData.get("template") as Resume["template"]) || "modern"

  const resume: Resume = {
    id: uuid(),
    userId: user.id,
    title: title || "Untitled Resume",
    template,
    personalInfo: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      location: user.location,
      linkedin: "",
      website: "",
    },
    summary: user.bio || "",
    experience: [],
    education: [],
    skills: user.skills || [],
    projects: [],
    certifications: [],
    languages: [],
    volunteering: [],
    awards: [],
    publications: [],
    achievements: [],
    hobbies: [],
    completeness: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  insertOne("resumes", resume)
  revalidatePath("/dashboard/resume")
  return { success: true, id: resume.id }
}

function calculateCompleteness(resume: Resume): number {
  let score = 0
  if (resume.personalInfo.name) score += 10
  if (resume.personalInfo.email) score += 5
  if (resume.personalInfo.phone) score += 5
  if (resume.personalInfo.location) score += 5
  if (resume.summary && resume.summary.length > 20) score += 15
  if (resume.experience.length > 0) score += 20
  if (resume.education.length > 0) score += 10
  if (resume.skills.length >= 3) score += 10
  if (resume.projects.length > 0) score += 8
  if (resume.certifications.length > 0) score += 4
  if (resume.languages.length > 0) score += 3
  if ((resume.volunteering || []).length > 0) score += 3
  if ((resume.awards || []).length > 0) score += 2
  if (resume.achievements.length > 0) score += 2
  return Math.min(score, 100)
}

export async function updateResume(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const existing = findOne<Resume>("resumes", (r) => r.id === id && r.userId === user.id)
  if (!existing) return { error: "Resume not found" }

  const updates: Partial<Resume> = {
    title: (formData.get("title") as string) || existing.title,
    template: (formData.get("template") as Resume["template"]) || existing.template,
    personalInfo: {
      name: (formData.get("personalName") as string) || existing.personalInfo.name,
      email: (formData.get("personalEmail") as string) || existing.personalInfo.email,
      phone: (formData.get("personalPhone") as string) || existing.personalInfo.phone,
      location: (formData.get("personalLocation") as string) || existing.personalInfo.location,
      linkedin: (formData.get("personalLinkedin") as string) ?? existing.personalInfo?.linkedin ?? "",
      website: (formData.get("personalWebsite") as string) ?? existing.personalInfo?.website ?? "",
    },
    summary: (formData.get("summary") as string) ?? existing.summary,
    updatedAt: new Date().toISOString(),
  }

  const skillsStr = formData.get("skills") as string
  if (skillsStr !== null) {
    updates.skills = skillsStr.split(",").map((s) => s.trim()).filter(Boolean)
  }

  const jsonFields = ["experience", "education", "projects", "certifications", "languages", "volunteering", "awards", "publications", "achievements", "hobbies"] as const
  for (const field of jsonFields) {
    const val = formData.get(field) as string
    if (val) {
      try {
        ;(updates as Record<string, unknown>)[field] = JSON.parse(val)
      } catch {}
    }
  }

  const merged = { ...existing, ...updates }
  updates.completeness = calculateCompleteness(merged as Resume)

  updateOne("resumes", id, updates)
  revalidatePath("/dashboard/resume")
  return { success: true }
}

export async function deleteResume(id: string) {
  const user = await getCurrentUser()
  if (!user) return { error: "Not authenticated" }

  const existing = findOne<Resume>("resumes", (r) => r.id === id && r.userId === user.id)
  if (!existing) return { error: "Resume not found" }

  deleteOne("resumes", id)
  revalidatePath("/dashboard/resume")
  return { success: true }
}

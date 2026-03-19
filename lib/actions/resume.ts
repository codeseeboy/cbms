"use server"

import { revalidatePath } from "next/cache"
import { apiGet, apiPost, apiPut, apiDelete } from "../api"
import type { Resume } from "../types"

export async function getResumes() {
  return (await apiGet<Resume[]>("/api/resumes")) || []
}

export async function getResume(id: string) {
  return apiGet<Resume>(`/api/resumes/${id}`)
}

export async function createResume(formData: FormData) {
  const result = await apiPost("/api/resumes", {
    title: formData.get("title") as string,
    template: formData.get("template") as string,
  })
  revalidatePath("/dashboard/resume")
  return result
}

export async function updateResume(id: string, formData: FormData) {
  const body: Record<string, any> = {
    title: formData.get("title") as string,
    template: formData.get("template") as string,
    personalInfo: {
      name: formData.get("personalName") as string,
      email: formData.get("personalEmail") as string,
      phone: formData.get("personalPhone") as string,
      location: formData.get("personalLocation") as string,
      linkedin: formData.get("personalLinkedin") as string,
      website: formData.get("personalWebsite") as string,
    },
    summary: formData.get("summary") as string,
  }

  const skillsStr = formData.get("skills") as string
  if (skillsStr !== null) {
    body.skills = skillsStr.split(",").map((s) => s.trim()).filter(Boolean)
  }

  for (const field of ["experience", "education", "projects", "certifications", "languages", "volunteering", "awards", "publications", "achievements", "hobbies"]) {
    const val = formData.get(field) as string
    if (val) {
      try { body[field] = JSON.parse(val) } catch {}
    }
  }

  const result = await apiPut(`/api/resumes/${id}`, body)
  revalidatePath("/dashboard/resume")
  return result
}

export async function deleteResume(id: string) {
  const result = await apiDelete(`/api/resumes/${id}`)
  revalidatePath("/dashboard/resume")
  return result
}

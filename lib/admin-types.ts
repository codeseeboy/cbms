/** Admin API response shape — always sourced from backend / MongoDB */
export interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  avatar: string
  createdAt?: string
}

export interface AdminData {
  stats: {
    totalUsers: number
    totalResumes: number
    totalJobs: number
    totalAssessments: number
    totalCourses: number
    totalApplications: number
  }
  users: AdminUser[]
  recentUsers: AdminUser[]
  roleDistribution: {
    jobseekers: number
    recruiters: number
    coaches: number
    admins: number
  }
}

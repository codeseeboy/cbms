export interface User {
  id: string
  name: string
  email: string
  password: string
  role: "jobseeker" | "recruiter" | "coach" | "admin"
  phone: string
  location: string
  title: string
  bio: string
  skills: string[]
  avatar: string
  createdAt: string
  updatedAt: string
}

export interface Resume {
  id: string
  userId: string
  title: string
  template: "modern" | "classic" | "minimal" | "creative"
  personalInfo: {
    name: string
    email: string
    phone: string
    location: string
    linkedin: string
    website: string
  }
  summary: string
  experience: {
    id: string
    title: string
    company: string
    period: string
    description: string
  }[]
  education: {
    id: string
    degree: string
    school: string
    year: string
    gpa: string
  }[]
  skills: string[]
  projects: {
    id: string
    name: string
    tech: string
    description: string
    link: string
  }[]
  certifications: {
    id: string
    name: string
    issuer: string
    year: string
  }[]
  languages: {
    id: string
    language: string
    proficiency: string
  }[]
  volunteering: {
    id: string
    role: string
    organization: string
    period: string
    description: string
  }[]
  awards: {
    id: string
    title: string
    issuer: string
    year: string
  }[]
  publications: {
    id: string
    title: string
    publisher: string
    year: string
    link: string
  }[]
  achievements: string[]
  hobbies: string[]
  completeness: number
  createdAt: string
  updatedAt: string
}

export interface Job {
  id: string
  title: string
  company: string
  logo: string
  location: string
  type: string
  salary: string
  match: number
  posted: string
  tags: string[]
  description: string
  requirements: string[]
  benefits: string[]
}

export interface JobBookmark {
  id: string
  userId: string
  jobId: string
  createdAt: string
}

export interface JobApplication {
  id: string
  userId: string
  jobId: string
  status: "applied" | "reviewing" | "interview" | "offered" | "rejected"
  appliedAt: string
}

export interface AppliedJob {
  id: string
  userId: string
  title: string
  company: string
  url: string
  location: string
  matchScore: number
  status: "applied" | "reviewing" | "interview" | "offered" | "rejected" | "saved"
  notes: string
  appliedAt: string
  updatedAt: string
}

export interface Assessment {
  id: string
  title: string
  category: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  duration: string
  questions: {
    id: string
    question: string
    options: string[]
    correctAnswer: number
  }[]
}

export interface UserAssessment {
  id: string
  userId: string
  assessmentId: string
  score: number | null
  answers: (number | null)[]
  currentQuestion: number
  status: "in-progress" | "completed"
  startedAt: string
  completedAt: string | null
}

export interface CourseVideo {
  id: string
  title: string
  youtubeId: string
  duration: string
  order: number
}

export interface CourseModule {
  id: string
  title: string
  videos: CourseVideo[]
}

export interface Course {
  id: string
  title: string
  instructor: string
  thumbnail: string
  category: string
  duration: string
  level: "Beginner" | "Intermediate" | "Advanced"
  tags: string[]
  description: string
  modules: CourseModule[]
  totalVideos: number
  playlistId: string
}

export interface UserCourse {
  id: string
  userId: string
  courseId: string
  progress: number
  watchedVideos: string[]
  currentVideoId: string
  status: "in-progress" | "completed" | "not-started"
  startedAt: string
  completedAt: string | null
}

export interface Certificate {
  id: string
  userId: string
  courseId: string
  courseTitle: string
  userName: string
  issuedAt: string
}

export interface CareerGoal {
  id: string
  userId: string
  title: string
  description: string
  deadline: string
  progress: number
  status: "in-progress" | "completed" | "paused"
  milestones: {
    id: string
    text: string
    done: boolean
  }[]
  createdAt: string
  updatedAt: string
}

export interface Notification {
  id: string
  userId: string
  type: "job" | "assessment" | "resume" | "learning" | "system"
  title: string
  description: string
  read: boolean
  createdAt: string
}

export interface ActivityLog {
  id: string
  userId: string
  action: string
  type: "resume" | "job" | "assessment" | "course" | "career" | "system"
  createdAt: string
}

export type SafeUser = Omit<User, "password">

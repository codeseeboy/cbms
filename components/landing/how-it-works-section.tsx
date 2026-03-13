import { UserPlus, FileSearch, Rocket as RocketIcon, TrendingUp } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create Your Profile",
    description:
      "Sign up and build your professional profile with your skills, experience, and career goals.",
  },
  {
    number: "02",
    icon: FileSearch,
    title: "Build & Optimize",
    description:
      "Create ATS-friendly resumes, take skill assessments, and identify areas for growth.",
  },
  {
    number: "03",
    icon: RocketIcon,
    title: "Discover Opportunities",
    description:
      "Get matched with jobs that align with your profile. Explore learning paths to level up.",
  },
  {
    number: "04",
    icon: TrendingUp,
    title: "Grow Your Career",
    description:
      "Track your progress, achieve career milestones, and continuously develop your expertise.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-accent">
            How It Works
          </span>
          <h2
            className="mt-4 text-balance text-3xl font-bold text-foreground md:text-5xl"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Four steps to career success
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Our streamlined process makes it easy to get started and see results quickly.
          </p>
        </div>

        <div className="relative mt-16">
          {/* Connector line (desktop) */}
          <div className="absolute top-16 left-0 right-0 hidden h-px bg-border lg:block" />

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <span
                  className="mb-2 text-sm font-bold text-primary"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Step {step.number}
                </span>
                <h3
                  className="mb-2 text-lg font-semibold text-foreground"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {step.title}
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

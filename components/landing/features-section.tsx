import {
  FileText,
  Target,
  BarChart3,
  BookOpen,
  Map,
  Bell,
} from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "Resume Builder",
    description:
      "Create stunning, ATS-optimized resumes with professional templates and AI-powered suggestions.",
  },
  {
    icon: Target,
    title: "Smart Job Matching",
    description:
      "Get intelligent job recommendations based on your skills, experience, and career preferences.",
  },
  {
    icon: BarChart3,
    title: "Skill Assessment",
    description:
      "Evaluate your competencies with industry-standard assessments and track your growth over time.",
  },
  {
    icon: BookOpen,
    title: "Learning Resources",
    description:
      "Access curated courses and materials tailored to bridge skill gaps and boost your expertise.",
  },
  {
    icon: Map,
    title: "Career Planning",
    description:
      "Set goals, create career roadmaps, and track milestones on your path to professional success.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Stay updated with real-time alerts on new jobs, skill trends, and personalized recommendations.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Features
          </span>
          <h2
            className="mt-4 text-balance text-3xl font-bold text-foreground md:text-5xl"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Everything you need to advance your career
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            A comprehensive suite of tools designed to support every stage of
            your career journey.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/30 hover:bg-secondary/50"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3
                className="mb-3 text-lg font-semibold text-foreground"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {feature.title}
              </h3>
              <p className="leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

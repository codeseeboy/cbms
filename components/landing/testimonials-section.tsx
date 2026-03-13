import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Software Engineer",
    initials: "PS",
    content:
      "CareerBuilder helped me create a resume that actually got callbacks. The job matching feature connected me with my dream role at a top tech company.",
    rating: 5,
  },
  {
    name: "Rajesh Kumar",
    role: "Marketing Manager",
    initials: "RK",
    content:
      "The skill assessment gave me a clear picture of my strengths and gaps. The learning resources were perfectly curated to help me grow.",
    rating: 5,
  },
  {
    name: "Ananya Patel",
    role: "Data Analyst",
    initials: "AP",
    content:
      "I love the career planning tools. Setting milestones and tracking progress has completely transformed how I approach my professional growth.",
    rating: 5,
  },
]

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Testimonials
          </span>
          <h2
            className="mt-4 text-balance text-3xl font-bold text-foreground md:text-5xl"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Trusted by thousands of professionals
          </h2>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-border bg-card p-8"
            >
              <div className="mb-4 flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="mb-6 leading-relaxed text-muted-foreground">
                {`"${t.content}"`}
              </p>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                    {t.initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

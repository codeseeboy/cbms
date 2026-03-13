import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, ArrowRight } from "lucide-react"

const plans = [
  {
    name: "Free",
    price: "0",
    description: "Perfect for getting started with your career journey.",
    features: [
      "1 Resume template",
      "Basic job matching",
      "Skill self-assessment",
      "Limited learning resources",
      "Basic profile",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "29",
    description: "For serious professionals who want to accelerate growth.",
    features: [
      "Unlimited resume templates",
      "AI-powered job matching",
      "Full skill assessments",
      "All learning resources",
      "Career planning tools",
      "Priority notifications",
      "Analytics dashboard",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For recruiters and organizations managing talent at scale.",
    features: [
      "Everything in Pro",
      "Candidate search",
      "Team management",
      "Custom integrations",
      "Dedicated support",
      "Analytics & reports",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Pricing
          </span>
          <h2
            className="mt-4 text-balance text-3xl font-bold text-foreground md:text-5xl"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Plans for every career stage
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Start free and upgrade as your career grows.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 ${
                plan.highlighted
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1">
                  <span className="text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </span>
                </div>
              )}

              <h3
                className="text-xl font-bold text-foreground"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {plan.name}
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                {plan.price !== "Custom" ? (
                  <>
                    <span
                      className="text-4xl font-bold text-foreground"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {'$'}{plan.price}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </>
                ) : (
                  <span
                    className="text-4xl font-bold text-foreground"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Custom
                  </span>
                )}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {plan.description}
              </p>

              <ul className="mt-6 flex flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/dashboard" className="mt-8 block">
                <Button
                  className={`w-full gap-2 ${
                    plan.highlighted
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

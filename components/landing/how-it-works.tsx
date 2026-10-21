// Three-step visual guide explaining how users book rides, rentals, and parcel deliveries on HitsNaGo
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Navigation01Icon,
  Calendar01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"

import { Badge } from "@/components/ui/badge"

const steps = [
  {
    step: "01",
    title: "Choose a Service",
    description:
      "Select whether you need a fast motorbike or car ride, a rental vehicle or utility gear, or an express door-to-door courier dispatch.",
    icon: Navigation01Icon,
    detail: "Ride • Rent • Delivery",
  },
  {
    step: "02",
    title: "Book What You Need",
    description:
      "Enter your destination, select your rental dates, or specify package details. Review transparent upfront fares before confirming.",
    icon: Calendar01Icon,
    detail: "Clear pricing & terms",
  },
  {
    step: "03",
    title: "Go, Rent, or Deliver",
    description:
      "A verified local rider or provider fulfills your request. Track live milestones, complete the service, and exchange mutual ratings.",
    icon: CheckmarkCircle01Icon,
    detail: "Reliable completion",
  },
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-16 sm:py-24 bg-muted/40 border-y border-border/60"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <Badge variant="outline" className="mb-3 text-xs tracking-wider uppercase">
            Simple Workflow
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How HitsNaGo Works in <span className="text-primary">3 Easy Steps</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            No endless paperwork or confusing menus. Experience frictionless
            local bookings designed to get you moving within minutes.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 relative">
          {steps.map((item, index) => {
            const Icon = item.icon

            return (
              <div
                key={item.step}
                className="relative flex flex-col items-center text-center rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs transition-transform duration-200 hover:-translate-y-1"
              >
                {/* Step Number Tag */}
                <div className="flex items-center justify-between w-full mb-6">
                  <span className="font-heading text-3xl font-extrabold text-primary/30">
                    {item.step}
                  </span>
                  <Badge variant="secondary" className="text-[11px] font-medium">
                    {item.detail}
                  </Badge>
                </div>

                {/* Icon Container */}
                <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6 shadow-xs">
                  <HugeiconsIcon icon={Icon} size={30} />
                </div>

                {/* Title & Description */}
                <h3 className="font-heading text-xl font-bold text-foreground mb-3">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>

                {/* Progress Dot */}
                <div className="mt-6 flex items-center gap-1.5 text-xs font-semibold text-primary">
                  <span>Step {index + 1} of 3</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

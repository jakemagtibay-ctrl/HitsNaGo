// Section highlighting platform strengths: safety verifications, local community focus, and transparent fares
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ShieldCheckIcon,
  SmartPhone01Icon,

  Location01Icon,
  Wallet01Icon,
  Navigation01Icon,
  CustomerService01Icon,
} from "@hugeicons/core-free-icons"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const features = [
  {
    title: "Verified Users",
    description:
      "All customers, riders, and service providers undergo document verification to promote safety, honesty, and mutual accountability.",
    icon: ShieldCheckIcon,
    tag: "Safety Standard",
  },
  {
    title: "Easy Booking",
    description:
      "A streamlined, mobile-first interface designed for speed. Book what you need in under a minute without convoluted steps.",
    icon: SmartPhone01Icon,
    tag: "Mobile-First",
  },
  {
    title: "Local Services",
    description:
      "Rooted in your local community. Designed to support neighborhood drivers, local rental businesses, and homegrown couriers.",
    icon: Location01Icon,
    tag: "Community-Driven",
  },
  {
    title: "Convenient Payments",
    description:
      "Pay with familiar local options including cash on delivery, GCash, Maya, and bank transfers with upfront price certainty.",
    icon: Wallet01Icon,
    tag: "Multiple Options",
  },
  {
    title: "Booking Tracking",
    description:
      "Follow every phase of your service. From dispatch confirmation to pickup and completion, know exactly what's happening.",
    icon: Navigation01Icon,
    tag: "Real-Time Updates",
  },
  {
    title: "Reliable Communication",
    description:
      "Direct coordination between customers and providers keeps everyone in sync regarding locations, special instructions, and timings.",
    icon: CustomerService01Icon,
    tag: "Responsive Support",
  },
]

export function WhyHitsNaGo() {
  return (
    <section id="why-hitsnago" className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <Badge variant="outline" className="mb-3 text-xs tracking-wider uppercase">
            Platform Benefits
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Why Choose <span className="text-primary">HitsNaGo</span>?
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Built from the ground up to solve daily local logistics, reliable
            transport, and trusted rentals with clarity and speed.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon

            return (
              <Card
                key={feature.title}
                className="group border-border bg-card/60 transition-all duration-200 hover:border-primary/40 hover:bg-card hover:shadow-md"
              >
                <CardHeader className="gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                      <HugeiconsIcon icon={Icon} size={22} />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {feature.tag}
                    </span>
                  </div>
                  <CardTitle className="text-lg text-foreground">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

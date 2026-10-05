import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Motorbike01Icon,
  Car01Icon,
  PackageIcon,
  ArrowRight01Icon,
  Clock01Icon,
  Calendar01Icon,
  DeliverySecure01Icon,
} from "@hugeicons/core-free-icons"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const services = [
  {
    id: "ride",
    title: "On-Demand Ride",
    subtitle: "Fast Local Commutes",
    badge: "Available Now",
    badgeVariant: "success" as const,
    description:
      "Urgently need to reach your destination? Request a ride in seconds. Choose from motorbikes, tricycles, or cars driven by verified local riders.",
    features: [
      "Motorcycle, tricycle, and car options",
      "Upfront price estimates with no surprises",
      "Direct driver-to-passenger routing",
    ],
    icon: Motorbike01Icon,
    subIcon: Clock01Icon,
    actionText: "Book a Ride",
    href: "#services",
    highlight: "Fast pickup in minutes",
  },
  {
    id: "rent",
    title: "Vehicle & Gear Rental",
    subtitle: "Trips, Vacations & Events",
    badge: "Flexible Terms",
    badgeVariant: "secondary" as const,
    description:
      "Explore vehicles, utility machinery, and specialized services available for daily or hourly rent from verified neighborhood providers.",
    features: [
      "Cars, vans, scooters, and utility equipment",
      "Transparent security deposits and inspection",
      "Flexible hourly, daily, or weekly rates",
    ],
    icon: Car01Icon,
    subIcon: Calendar01Icon,
    actionText: "Browse Rentals",
    href: "#services",
    highlight: "Self-drive or with driver",
  },
  {
    id: "delivery",
    title: "Express Delivery",
    subtitle: "Door-to-Door Courier",
    badge: "Same Day",
    badgeVariant: "outline" as const,
    description:
      "Send documents, groceries, food, or important packages safely. Hand your items to a verified courier and track until safe delivery.",
    features: [
      "Parcels, documents, groceries, and food",
      "Recipient phone & handling instructions",
      "Proof of pickup and delivery confirmation",
    ],
    icon: PackageIcon,
    subIcon: DeliverySecure01Icon,
    actionText: "Send Package",
    href: "#services",
    highlight: "Safe handling guaranteed",
  },
]

export function ServiceCards() {
  return (
    <section
      id="services"
      className="py-16 sm:py-24 bg-muted/30 border-y border-border/60"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <Badge variant="outline" className="mb-3 text-xs tracking-wider uppercase">
            Core Solutions
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything You Need, <span className="text-primary">One Local App</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            HitsNaGo brings transportation, rentals, and courier dispatch into a
            single, unified platform crafted for the rhythms of local communities.
          </p>
        </div>

        {/* Three Cards Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon

            return (
              <Card
                key={service.id}
                className="group relative flex flex-col justify-between overflow-hidden border-border bg-card transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1"
              >
                <div>
                  <CardHeader className="gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                        <HugeiconsIcon icon={Icon} size={28} />
                      </div>
                      <Badge variant={service.badgeVariant}>
                        {service.badge}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {service.subtitle}
                      </span>
                      <CardTitle className="text-2xl mt-1 text-foreground">
                        {service.title}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-sm">
                      {service.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-2">
                    <ul className="flex flex-col gap-2.5 text-xs text-muted-foreground">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </div>

                <CardFooter className="flex flex-col gap-3 pt-4 border-t border-border/60 bg-muted/10">
                  <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                    <span>{service.highlight}</span>
                    <span className="font-semibold text-foreground">Verified Only</span>
                  </div>
                  <Link
                    href={service.href}
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full justify-center h-10 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors flex items-center gap-2"
                    )}
                  >
                    <span>{service.actionText}</span>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}

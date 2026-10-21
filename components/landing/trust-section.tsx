// Section detailing identity checks and safety assurances for customers, drivers, and rental fleet owners
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ShieldCheckIcon,
  UserCheck01Icon,

  Motorbike01Icon,
  Car01Icon,
  CheckmarkBadge01Icon,
} from "@hugeicons/core-free-icons"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const verificationPillars = [
  {
    role: "Verified Customers",
    badge: "Account Safety",
    description:
      "Every customer undergoes mobile verification and identity confirmation. This fosters mutual respect, curbs fraudulent requests, and ensures a safe booking experience for providers.",
    icon: UserCheck01Icon,
    items: [
      "Mobile number verification",
      "Account history and profile checks",
      "Two-way rating & review accountability",
    ],
  },
  {
    role: "Verified Riders",
    badge: "Trip Security",
    description:
      "Riders must submit active government driver's licenses, legitimate vehicle registration documents, and personal identification before taking their first booking on the road.",
    icon: Motorbike01Icon,
    items: [
      "Professional driver's license check",
      "Vehicle registration (OR/CR) validation",
      "Direct trip status & route tracking",
    ],
  },
  {
    role: "Verified Providers",
    badge: "Asset Integrity",
    description:
      "Vehicle and equipment owners submit ownership proof and condition details. Clear security deposit policies and condition agreements protect both renter and owner.",
    icon: Car01Icon,
    items: [
      "Proof of vehicle/asset ownership",
      "Documented handover checklist",
      "Transparent deposit release guidelines",
    ],
  },
]

export function TrustSection() {
  return (
    <section id="trust" className="py-16 sm:py-24 bg-background">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <Badge variant="outline" className="mb-3 text-xs tracking-wider uppercase">
            Trust & Safety
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Real People. Real Verifications. <br />
            <span className="text-primary">Safer Local Communities.</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            HitsNaGo prioritizes safety and transparency without inflated claims.
            Every participant in our ecosystem goes through document and
            identity verification before transacting.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {verificationPillars.map((pillar) => {
            const Icon = pillar.icon

            return (
              <Card
                key={pillar.role}
                className="flex flex-col justify-between border-border bg-card/60 transition-all hover:border-primary/40 hover:bg-card"
              >
                <CardHeader className="gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <HugeiconsIcon icon={Icon} size={24} />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {pillar.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-foreground">
                    {pillar.role}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {pillar.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-2">
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                      Verification Standard:
                    </span>
                    <ul className="flex flex-col gap-2 text-xs text-foreground">
                      {pillar.items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <HugeiconsIcon
                            icon={CheckmarkBadge01Icon}
                            size={14}
                            className="text-primary shrink-0"
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Commitment Banner */}
        <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <HugeiconsIcon icon={ShieldCheckIcon} size={24} />
            </div>
            <div className="flex flex-col">
              <h3 className="font-heading text-lg font-semibold text-foreground">
                Our Verification Principle
              </h3>
              <p className="text-sm text-muted-foreground max-w-xl">
                We review driver credentials, vehicle papers, and account
                validity. While no system can predict every event, we build
                strict accountability into every ride, rental, and delivery.
              </p>
            </div>
          </div>
          <Badge variant="success" className="px-3.5 py-1 text-xs shrink-0">
            Accountability First
          </Badge>
        </div>
      </div>
    </section>
  )
}

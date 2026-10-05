import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Motorbike01Icon,
  Car01Icon,
  CheckmarkBadge01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PartnerSection() {
  return (
    <section className="py-16 sm:py-24 bg-muted/20 border-t border-border">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <Badge variant="outline" className="mb-3 text-xs tracking-wider uppercase">
            Earn With Us
          </Badge>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Partner with <span className="text-primary">HitsNaGo</span>
          </h2>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            Turn your vehicle or rental inventory into dependable income.
            Enjoy full schedule flexibility with transparent local demand.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Become a Rider */}
          <div id="become-rider" className="scroll-mt-24">
            <Card className="h-full flex flex-col justify-between border-border bg-card hover:border-primary/50 transition-all">
              <div>
                <CardHeader className="gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <HugeiconsIcon icon={Motorbike01Icon} size={26} />
                    </div>
                    <Badge variant="success">Flexible Hours</Badge>
                  </div>
                  <CardTitle className="text-2xl text-foreground">
                    Become a Verified Rider
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Drive passengers or deliver parcels within your local area.
                    Keep control over your availability and earn with every trip.
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-2">
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                      Rider Requirements:
                    </span>
                    <ul className="flex flex-col gap-2 text-xs text-foreground">
                      <li className="flex items-center gap-2">
                        <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} className="text-primary shrink-0" />
                        <span>Valid Driver&apos;s License</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} className="text-primary shrink-0" />
                        <span>Registered Vehicle (Motorcycle, Tricycle, Car)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} className="text-primary shrink-0" />
                        <span>Clear Background & Clean Record</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-4 border-t border-border">
                <Link
                  href="#become-rider"
                  className={cn(
                    buttonVariants(),
                    "w-full justify-center flex items-center gap-2"
                  )}
                >
                  <span>Apply as a Rider</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </Link>
              </CardFooter>
            </Card>
          </div>

          {/* Become a Provider */}
          <div id="become-provider" className="scroll-mt-24">
            <Card className="h-full flex flex-col justify-between border-border bg-card hover:border-primary/50 transition-all">
              <div>
                <CardHeader className="gap-3">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-chart-1/15 text-chart-1">
                    <HugeiconsIcon icon={Car01Icon} size={26} />
                  </div>
                  <CardTitle className="text-2xl text-foreground">
                    Become a Service Provider
                  </CardTitle>
                  <CardDescription className="text-sm">
                    List vehicles, utility equipment, or services for rent. Reach
                    verified local customers looking for trustworthy rentals.
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-2">
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                      Provider Requirements:
                    </span>
                    <ul className="flex flex-col gap-2 text-xs text-foreground">
                      <li className="flex items-center gap-2">
                        <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} className="text-primary shrink-0" />
                        <span>Proof of Ownership / Vehicle Registration</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} className="text-primary shrink-0" />
                        <span>Valid Government-issued ID</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} className="text-primary shrink-0" />
                        <span>Well-maintained & Roadworthy Assets</span>
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-4 border-t border-border">
                <Link
                  href="#become-provider"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full justify-center flex items-center gap-2"
                  )}
                >
                  <span>List Your Rental Service</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Motorbike01Icon,
  Car01Icon,
  CheckmarkCircle01Icon,
  ArrowRight01Icon,
  ShieldCheckIcon,
  Navigation01Icon,
  Calendar03Icon,
  Coins01Icon,
  Store01Icon,
  DocumentValidationIcon,
  Message01Icon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function JoinPathwayCards() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto w-full">
      {/* Option 1: BECOME A RIDER */}
      <div className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 sm:p-8 lg:p-10 shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-md">
        {/* Subtle decorative glow */}
        <div
          className="pointer-events-none absolute -top-10 -left-10 -z-0 h-40 w-40 rounded-full bg-primary/10 blur-2xl opacity-60 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Card Header: Icon & Pathway Tag */}
          <div className="flex items-center justify-between">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm">
              <HugeiconsIcon icon={Motorbike01Icon} size={28} />
            </div>
            <Badge
              variant="outline"
              className="gap-1.5 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary"
            >
              <HugeiconsIcon icon={Navigation01Icon} size={12} />
              <span>Rider Pathway</span>
            </Badge>
          </div>

          {/* Heading & Short Description */}
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Become a Rider
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Provide on-demand passenger rides and delivery services in your area. Turn your motorcycle, tricycle, or vehicle into steady daily earnings.
            </p>
          </div>

          {/* Key Benefits List */}
          <div className="flex flex-col gap-3.5 pt-2 border-t border-border/70">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What you will do:
            </p>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-3 text-sm">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                  <HugeiconsIcon icon={Navigation01Icon} size={14} />
                </div>
                <div>
                  <span className="font-semibold text-foreground">Provide ride services through HitsNaGo</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fulfill passenger rides and courier delivery requests in your local community.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 text-sm">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                  <HugeiconsIcon icon={ShieldCheckIcon} size={14} />
                </div>
                <div>
                  <span className="font-semibold text-foreground">Become a verified rider</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Build customer trust and get priority dispatch with verified profile credentials.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 text-sm">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                  <HugeiconsIcon icon={Calendar03Icon} size={14} />
                </div>
                <div>
                  <span className="font-semibold text-foreground">Accept ride requests</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Work on your own terms. Log in when convenient and accept trips that fit your schedule.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 text-sm">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                  <HugeiconsIcon icon={Coins01Icon} size={14} />
                </div>
                <div>
                  <span className="font-semibold text-foreground">Earn from completed rides</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Transparent, upfront fare calculation with fast payouts for every completed booking.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Requirements Snippet */}
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground border border-border/60">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-primary shrink-0" />
            <span>Driver&apos;s License • Vehicle OR/CR • Valid ID</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="relative z-10 pt-6 mt-4 border-t border-border/70">
          <Link
            href="/dashboard/customer/apply/rider"
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full justify-center gap-2 text-base font-semibold shadow-sm h-12 rounded-xl"
            )}
          >
            <span>Become a Rider</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
          </Link>
          <p className="text-center text-[11px] text-muted-foreground mt-2">
            Links directly to the Rider Verification Application
          </p>
        </div>
      </div>

      {/* Option 2: BECOME A RENTAL PROVIDER */}
      <div className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 sm:p-8 lg:p-10 shadow-sm transition-all duration-200 hover:border-chart-1/50 hover:shadow-md">
        {/* Subtle decorative glow */}
        <div
          className="pointer-events-none absolute -top-10 -right-10 -z-0 h-40 w-40 rounded-full bg-chart-1/10 blur-2xl opacity-60 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col gap-6">
          {/* Card Header: Icon & Pathway Tag */}
          <div className="flex items-center justify-between">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-chart-1/10 text-chart-1 border border-chart-1/20 shadow-sm">
              <HugeiconsIcon icon={Car01Icon} size={28} />
            </div>
            <Badge
              variant="outline"
              className="gap-1.5 rounded-full border-chart-1/30 bg-chart-1/5 px-3 py-1 text-xs font-semibold text-chart-1"
            >
              <HugeiconsIcon icon={Store01Icon} size={12} />
              <span>Rental Provider Pathway</span>
            </Badge>
          </div>

          {/* Heading & Short Description */}
          <div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Become a Rental Provider
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-muted-foreground leading-relaxed">
              List your cars, vans, motorcycles, or rental equipment for local customers. Expand your rental business with verified customer bookings.
            </p>
          </div>

          {/* Key Benefits List */}
          <div className="flex flex-col gap-3.5 pt-2 border-t border-border/70">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What you will do:
            </p>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-3 text-sm">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-chart-1/10 text-chart-1 mt-0.5">
                  <HugeiconsIcon icon={Car01Icon} size={14} />
                </div>
                <div>
                  <span className="font-semibold text-foreground">List vehicles or rental services</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Showcase rental fleet, set daily or hourly rates, and customize rental terms.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 text-sm">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-chart-1/10 text-chart-1 mt-0.5">
                  <HugeiconsIcon icon={ShieldCheckIcon} size={14} />
                </div>
                <div>
                  <span className="font-semibold text-foreground">Become a verified provider</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Receive verified business or host credentials to boost customer reservation confidence.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 text-sm">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-chart-1/10 text-chart-1 mt-0.5">
                  <HugeiconsIcon icon={DocumentValidationIcon} size={14} />
                </div>
                <div>
                  <span className="font-semibold text-foreground">Receive rental requests</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Review incoming booking reservations, inspect schedules, and confirm availability seamlessly.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3 text-sm">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-chart-1/10 text-chart-1 mt-0.5">
                  <HugeiconsIcon icon={Message01Icon} size={14} />
                </div>
                <div>
                  <span className="font-semibold text-foreground">Connect with customers</span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Communicate with verified local renters, arrange vehicle handovers, and grow your clientele.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* Requirements Snippet */}
          <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground border border-border/60">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-chart-1 shrink-0" />
            <span>Business Permit or Valid ID • Vehicle Registration • Proof of Ownership</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="relative z-10 pt-6 mt-4 border-t border-border/70">
          <Link
            href="/dashboard/customer/apply/provider"
            className={cn(
              buttonVariants({ size: "lg" }),
              "w-full justify-center gap-2 text-base font-semibold shadow-sm h-12 rounded-xl bg-chart-1 hover:bg-chart-1/90 text-white"
            )}
          >
            <span>Become a Rental Provider</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
          </Link>
          <p className="text-center text-[11px] text-muted-foreground mt-2">
            Links directly to the Provider Verification Application
          </p>
        </div>
      </div>
    </div>
  )
}

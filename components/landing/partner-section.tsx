import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Motorbike01Icon,
  Car01Icon,
  ArrowRight01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * PartnerSection — A concise homepage CTA banner/card for HitsNaGo onboarding.
 * Replaces the two separate large sections with a single, clear gateway to
 * the dedicated choice page (/join).
 */
export function PartnerSection() {
  return (
    <section id="earn" className="py-14 sm:py-20 bg-background border-t border-border">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/40 p-8 sm:p-12 lg:p-14 shadow-sm">
          {/* Subtle background glow */}
          <div
            className="pointer-events-none absolute -right-20 -top-20 -z-0 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-20 -bottom-20 -z-0 h-64 w-64 rounded-full bg-chart-1/10 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto gap-5">
            {/* Pathway Tag */}
            <Badge
              variant="outline"
              className="gap-1.5 rounded-full border-primary/30 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary"
            >
              <HugeiconsIcon icon={SparklesIcon} size={13} />
              <span>Partner Opportunities</span>
            </Badge>

            {/* Main Headline */}
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Earn with <span className="text-primary">HitsNaGo</span>
            </h2>

            {/* Description */}
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Whether you want to provide rides or offer rental services, join HitsNaGo and connect with customers.
            </p>

            {/* Two Visual Pathway Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl my-2">
              <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 p-3.5 text-left transition-colors">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <HugeiconsIcon icon={Motorbike01Icon} size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pathway 1</p>
                  <p className="text-sm font-bold text-foreground">Rider Services</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/60 p-3.5 text-left transition-colors">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-chart-1/10 text-chart-1">
                  <HugeiconsIcon icon={Car01Icon} size={20} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pathway 2</p>
                  <p className="text-sm font-bold text-foreground">Rental Services</p>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <Link
                href="/join"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 px-8 text-base font-semibold shadow-md group flex items-center justify-center gap-2 rounded-xl"
                )}
              >
                <span>Become a Rider or Rental Provider</span>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>

            {/* Supporting Micro-copy */}
            <p className="text-xs text-muted-foreground">
              Verified accounts • Direct bookings • Flexible schedule
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  Motorbike01Icon,
  ShieldCheckIcon,
} from "@hugeicons/core-free-icons"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function CtaSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-24 bg-card border-t border-border">
      {/* Background Radial Glow */}
      <div
        className="pointer-events-none absolute -bottom-24 left-1/2 -z-10 h-72 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-background p-8 sm:p-12 lg:p-16 text-center shadow-lg">
          <div className="max-w-2xl mx-auto flex flex-col items-center gap-6">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              <HugeiconsIcon icon={ShieldCheckIcon} size={14} />
              <span>Fast Local Community Network</span>
            </div>

            {/* Headline */}
            <h2 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              Ready to Ride, Rent, or Deliver?
            </h2>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Experience the ease of booking local rides, finding reliable
              rental vehicles, and sending courier packages in one trusted
              space.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto pt-2">
              <Link
                href="#services"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full sm:w-auto px-8 text-base font-semibold shadow-md group flex items-center justify-center gap-2"
                )}
              >
                <span>Start Booking Now</span>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                href="#become-rider"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full sm:w-auto px-6 text-base font-medium flex items-center justify-center gap-2"
                )}
              >
                <HugeiconsIcon icon={Motorbike01Icon} size={18} />
                <span>Become a Rider / Provider</span>
              </Link>
            </div>

            {/* Sub-note */}
            <p className="text-xs text-muted-foreground pt-2">
              Simple verification process • Transparent rates • Local support
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

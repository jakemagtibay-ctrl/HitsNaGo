// Public site footer with service categories, helpful links, trust badges, and copyright notices
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Navigation01Icon, ShieldCheckIcon } from "@hugeicons/core-free-icons"


export function Footer() {
  const currentYear = 2026

  return (
    <footer className="border-t border-border bg-card/60 text-card-foreground">
      <div className="container mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand & Mission */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg w-fit"
            >
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <HugeiconsIcon icon={Navigation01Icon} size={20} />
              </div>
              <span className="font-heading text-xl font-bold tracking-tight text-foreground">
                HitsNaGo<span className="text-primary">.</span>
              </span>
            </Link>
            <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
              Fast, reliable local services when you need them. Connecting
              passengers, renters, and senders with verified local riders and
              trusted service providers.
            </p>
            <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/50 px-3 py-1.5 text-xs text-muted-foreground w-fit">
              <HugeiconsIcon
                icon={ShieldCheckIcon}
                size={16}
                className="text-primary shrink-0"
              />
              <span>100% Focused on Safety &amp; Verified Accounts</span>
            </div>
          </div>

          {/* Services Column */}
          <div className="flex flex-col gap-3">
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
              Services
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/#services"
                  className="hover:text-foreground transition-colors"
                >
                  On-Demand Ride
                </Link>
              </li>
              <li>
                <Link
                  href="/#services"
                  className="hover:text-foreground transition-colors"
                >
                  Vehicle &amp; Gear Rental
                </Link>
              </li>
              <li>
                <Link
                  href="/#services"
                  className="hover:text-foreground transition-colors"
                >
                  Express Delivery
                </Link>
              </li>
              <li>
                <Link
                  href="/#how-it-works"
                  className="hover:text-foreground transition-colors"
                >
                  How Booking Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Partners Column */}
          <div className="flex flex-col gap-3">
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
              Partners
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/join"
                  className="hover:text-foreground transition-colors"
                >
                  Become a Rider or Provider
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/customer/apply/rider"
                  className="hover:text-foreground transition-colors"
                >
                  Rider Application
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/customer/apply/provider"
                  className="hover:text-foreground transition-colors"
                >
                  Provider Application
                </Link>
              </li>
              <li>
                <Link
                  href="/join"
                  className="hover:text-foreground transition-colors"
                >
                  Pathway Overview
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Legal Column */}
          <div className="flex flex-col gap-3">
            <h4 className="font-heading text-sm font-semibold uppercase tracking-wider text-foreground">
              Support &amp; Legal
            </h4>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/#why-hitsnago"
                  className="hover:text-foreground transition-colors"
                >
                  Safety Standards
                </Link>
              </li>
              <li>
                <Link
                  href="/#trust"
                  className="hover:text-foreground transition-colors"
                >
                  Verification Guide
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row">
          <p>© {currentYear} HitsNaGo. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Ride. Rent. Deliver.</span>
            <span>•</span>
            <span>Your Local Booking Platform</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

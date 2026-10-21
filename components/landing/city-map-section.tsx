// Landing page section presenting the interactive MapCN map covering Butuan City hubs and landmarks
import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  Location01Icon,
  Motorbike01Icon,
  Car01Icon,
  PackageIcon,
  ArrowRight01Icon,
  ShieldCheckIcon,
} from "@hugeicons/core-free-icons"
import { ButuanCityMap } from "@/components/maps/butuan-city-map"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function CityMapSection() {
  return (
    <section id="explore-butuan" className="relative py-16 sm:py-24 bg-muted/20 border-y border-border/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center gap-3 max-w-3xl mx-auto">
          <Badge
            variant="outline"
            className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary border-primary/30 bg-primary/5 gap-1.5"
          >
            <HugeiconsIcon icon={Location01Icon} size={14} />
            <span>Interactive City Coverage</span>
          </Badge>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Explore Butuan City
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            HitsNaGo connects customers with verified local riders, rental providers, and courier dispatches across all 86 barangays of Butuan City, Agusan del Norte. Explore key hubs, commercial centers, and transit routes below.
          </p>
        </div>

        {/* The Map Component */}
        <div className="w-full">
          <ButuanCityMap
            title="Butuan City Service & Transit Hubs"
            description="Agusan del Norte • Zoom and drag to inspect key landmarks, transport terminals, and commercial districts."
            height="480px"
            showLandmarks={true}
            showControls={true}
            enableLocationSelect={true}
            roleContext="public"
            footerContent={
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <span className="size-2.5 rounded-full bg-emerald-500" />
                    Pickup & Delivery Hubs
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <span className="size-2.5 rounded-full bg-primary" />
                    Commercial Centers
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <span className="size-2.5 rounded-full bg-sky-600" />
                    Airport & Terminals
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <HugeiconsIcon icon={ShieldCheckIcon} size={14} className="text-primary" />
                    100% Verified Local Operators
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard/customer/book/ride"
                    className={cn(buttonVariants({ size: "sm" }), "font-semibold shadow-xs gap-1.5 text-xs")}
                  >
                    <span>Book Service in Butuan</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                  </Link>
                </div>
              </div>
            }
          />
        </div>

        {/* Quick Action Cards Below Map */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="flex items-start gap-4 p-5 rounded-2xl border border-border/80 bg-card shadow-xs">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HugeiconsIcon icon={Motorbike01Icon} size={22} />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="font-heading text-sm font-bold text-foreground">Fast Local Commutes</h4>
              <p className="text-xs text-muted-foreground">
                Motorcycles, tricycles, and private cars available across Downtown, Doongan, Bancasi, and Ampayon.
              </p>
              <Link href="/dashboard/customer/book/ride" className="text-xs font-semibold text-primary hover:underline mt-1 flex items-center gap-1">
                Book a Ride <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
              </Link>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl border border-border/80 bg-card shadow-xs">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600">
              <HugeiconsIcon icon={Car01Icon} size={22} />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="font-heading text-sm font-bold text-foreground">Vehicle & Equipment Rentals</h4>
              <p className="text-xs text-muted-foreground">
                Self-drive SUVs, utility vans, and event equipment from verified hosts in Villa Kananga & Libertad.
              </p>
              <Link href="/dashboard/customer/book/rental" className="text-xs font-semibold text-violet-600 hover:underline mt-1 flex items-center gap-1">
                Browse Fleet <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
              </Link>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 rounded-2xl border border-border/80 bg-card shadow-xs">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <HugeiconsIcon icon={PackageIcon} size={22} />
            </div>
            <div className="flex flex-col gap-1">
              <h4 className="font-heading text-sm font-bold text-foreground">Door-to-Door Courier</h4>
              <p className="text-xs text-muted-foreground">
                Same-day point-to-point package, food, and document delivery across the entire Butuan metro area.
              </p>
              <Link href="/dashboard/customer/book/delivery" className="text-xs font-semibold text-amber-600 hover:underline mt-1 flex items-center gap-1">
                Send a Parcel <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import { HugeiconsIcon } from "@hugeicons/react"
import {
  ShieldCheckIcon,
  Motorbike01Icon,
  Car01Icon,
  PackageIcon,
  StarIcon,
  CheckmarkBadge01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { HeroCta } from "@/components/landing/hero-cta"

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative overflow-hidden pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32"
    >
      {/* Background Accent Gradients */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-96 w-[40rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute top-1/2 -right-40 -z-10 h-72 w-72 rounded-full bg-chart-1/10 blur-2xl"
        aria-hidden="true"
      />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Headline, Copy & CTAs */}
          <div className="flex flex-col gap-6 text-center lg:col-span-7 lg:text-left">
            {/* Pill Banner */}
            <div className="flex justify-center lg:justify-start">
              <Badge
                variant="outline"
                className="gap-2 rounded-full border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm"
              >
                <HugeiconsIcon
                  icon={ShieldCheckIcon}
                  size={14}
                  className="text-primary shrink-0"
                />
                <span>Connecting You with Verified Local Providers</span>
              </Badge>
            </div>

            {/* Main Headline */}
            <h1 className="font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl leading-[1.12]">
              Your Ride. <br className="hidden sm:inline" />
              Your Service. <br className="hidden sm:inline" />
              <span className="text-primary">Your Way.</span>
            </h1>

            {/* Supporting Text */}
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg leading-relaxed mx-auto lg:mx-0">
              HitsNaGo is your all-in-one local online booking platform.
              Urgently need transportation? Need to rent a vehicle or equipment
              for the weekend? Or sending a package across town? Book verified
              local riders and trusted providers with speed, convenience, and
              peace of mind.
            </p>

            {/* Primary & Secondary CTAs */}
            <HeroCta />

            {/* Community Proof Indicator */}
            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon
                  icon={CheckmarkBadge01Icon}
                  size={16}
                  className="text-primary"
                />
                <span>ID & Vehicle Verified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon
                  icon={Clock01Icon}
                  size={16}
                  className="text-primary"
                />
                <span>Upfront Price Estimates</span>
              </div>
              <div className="flex items-center gap-1.5">
                <HugeiconsIcon
                  icon={StarIcon}
                  size={16}
                  className="text-amber-500 fill-amber-500"
                />
                <span>Community Reviewed</span>
              </div>
            </div>
          </div>

          {/* Right Column: Composed UI Transportation & Service Visual */}
          <div className="relative mx-auto w-full max-w-lg lg:col-span-5 lg:max-w-none">
            {/* Visual Container Frame */}
            <div className="relative rounded-3xl border border-border/80 bg-gradient-to-b from-card to-card/70 p-6 shadow-xl backdrop-blur-sm">
              {/* Top Service Pills */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <span className="size-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Live Booking System
                  </span>
                </div>
                <Badge variant="success" className="text-[11px] gap-1">
                  <HugeiconsIcon icon={CheckmarkBadge01Icon} size={12} />
                  <span>Verified Platform</span>
                </Badge>
              </div>

              {/* Service Tab Selectors */}
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/60 p-1 text-center text-xs font-semibold">
                <div className="flex items-center justify-center gap-1.5 rounded-lg bg-background py-2 text-foreground shadow-xs">
                  <HugeiconsIcon icon={Motorbike01Icon} size={15} className="text-primary" />
                  <span>Ride</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-muted-foreground">
                  <HugeiconsIcon icon={Car01Icon} size={15} />
                  <span>Rent</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-muted-foreground">
                  <HugeiconsIcon icon={PackageIcon} size={15} />
                  <span>Delivery</span>
                </div>
              </div>

              {/* Active Ride Simulation Card */}
              <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-border bg-background p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <HugeiconsIcon icon={Motorbike01Icon} size={22} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">
                        Express Motorcycle Ride
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Honda Click 125i • Plate 842-NXY
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs font-semibold border-primary/30 text-primary">
                    ₱65.00
                  </Badge>
                </div>

                {/* Route Points */}
                <div className="relative pl-6 flex flex-col gap-3 text-xs before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
                    <span className="text-muted-foreground">Pickup:</span>
                    <span className="font-medium text-foreground truncate">
                      San Jose Public Market, Gate 2
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-primary ring-2 ring-primary/20" />
                    <span className="text-muted-foreground">Dropoff:</span>
                    <span className="font-medium text-foreground truncate">
                      Barangay Hall, Poblacion
                    </span>
                  </div>
                </div>

                {/* Rider Info & Status */}
                <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary text-[11px]">
                      MR
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">Marc R.</span>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <HugeiconsIcon icon={StarIcon} size={11} className="text-amber-500 fill-amber-500" />
                        <span>4.9 (184 rides)</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Rider Arriving
                    </span>
                    <p className="text-[10px] text-muted-foreground">Estimated: 3 mins</p>
                  </div>
                </div>
              </div>

              {/* Floating Auxiliary Badges */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 rounded-xl border border-border bg-background/80 p-2.5 backdrop-blur-xs">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-chart-1/15 text-chart-1">
                    <HugeiconsIcon icon={PackageIcon} size={16} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate">
                      Door-to-Door
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      Same-day courier
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl border border-border bg-background/80 p-2.5 backdrop-blur-xs">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-chart-2/15 text-chart-2">
                    <HugeiconsIcon icon={Car01Icon} size={16} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate">
                      Vehicle & Gear
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      Daily & hourly rentals
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

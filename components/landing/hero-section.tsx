import Link from "next/link"
import Image from "next/image"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Location01Icon,
  CheckmarkBadge01Icon,
  Clock01Icon,
  StarIcon,
  Motorbike01Icon,
  Key01Icon,
  PackageIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"

export function HeroSection() {
  return (
    <section
      id="home"
      className="relative isolate overflow-hidden border-b border-border/40 py-16 sm:py-24 lg:py-28 min-h-[640px] flex items-center"
      style={{
        backgroundImage: "url('/images/hitsnago-riverside-hero.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Background Image: High-resolution Butuan City riverside and arched bridge */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      >
        <Image
          src="/images/hitsnago-riverside-hero.webp"
          alt="HitsNaGo Butuan City riverside panorama with Magsaysay arched bridge and mountains"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center select-none"
        />

        {/* Light & Dark tuned subtle overlay (10-20%) ensuring text readability while keeping landscape vibrantly visible */}
        <div className="absolute inset-0 bg-white/10 dark:bg-slate-950/30" />

        {/* Soft bottom edge transition into following section */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center gap-6 sm:gap-7">
          {/* Location badge: Pale teal background with location icon */}
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200/80 dark:border-teal-800/80 bg-teal-50/95 dark:bg-teal-950/85 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-teal-800 dark:text-teal-200 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
            </span>
            <HugeiconsIcon icon={Location01Icon} size={14} className="text-teal-600 dark:text-teal-400 shrink-0" />
            <span>Serving Butuan City</span>
            <span className="text-teal-400 dark:text-teal-600">·</span>
            <span className="font-medium text-teal-900/80 dark:text-teal-200/90">Agusan del Norte</span>
          </div>

          {/* Headline: Deep navy/black first line, vibrant teal second line */}
          <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] dark:drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
            <span className="text-slate-900 dark:text-white block">
              Ride. Rent. Deliver.
            </span>
            <span className="text-teal-600 dark:text-teal-400 block mt-1">
              Local booking made simple.
            </span>
          </h1>

          {/* Description */}
          <p className="max-w-2xl text-sm sm:text-base md:text-lg font-medium leading-relaxed text-slate-800 dark:text-slate-200 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]">
            HitsNaGo connects you with verified local riders, trusted rental providers, and parcel couriers across Butuan City.
            Enjoy upfront fares, precise GPS road routing, and fast service dispatch.
          </p>

          {/* Three Service Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-2xl pt-2">
            <Link
              href="/dashboard/customer/book/ride"
              className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-white/70 dark:border-border/80 bg-white/90 dark:bg-card/90 backdrop-blur-md hover:border-teal-500/60 hover:bg-white dark:hover:bg-card transition-all text-left shadow-sm hover:shadow-md group"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0 group-hover:scale-105 transition-transform border border-teal-500/20">
                <HugeiconsIcon icon={Motorbike01Icon} size={22} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Book a Ride</span>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">Motorcycle &amp; Tricycle</span>
              </div>
            </Link>

            <Link
              href="/dashboard/customer/book/rental"
              className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-white/70 dark:border-border/80 bg-white/90 dark:bg-card/90 backdrop-blur-md hover:border-teal-500/60 hover:bg-white dark:hover:bg-card transition-all text-left shadow-sm hover:shadow-md group"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0 group-hover:scale-105 transition-transform border border-teal-500/20">
                <HugeiconsIcon icon={Key01Icon} size={22} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Rent a Vehicle</span>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">Cars, Vans &amp; Motors</span>
              </div>
            </Link>

            <Link
              href="/dashboard/customer/book/delivery"
              className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-white/70 dark:border-border/80 bg-white/90 dark:bg-card/90 backdrop-blur-md hover:border-teal-500/60 hover:bg-white dark:hover:bg-card transition-all text-left shadow-sm hover:shadow-md group"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0 group-hover:scale-105 transition-transform border border-teal-500/20">
                <HugeiconsIcon icon={PackageIcon} size={22} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Send Delivery</span>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">Same-day local courier</span>
              </div>
            </Link>
          </div>

          {/* Primary & Secondary CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-md sm:max-w-none">
            <Link
              href="/dashboard"
              className={cn(
                "inline-flex items-center justify-center w-full sm:w-auto h-11 px-7 rounded-xl text-sm font-semibold shadow-md gap-2 bg-teal-600 hover:bg-teal-700 text-white transition-all hover:shadow-lg"
              )}
            >
              <span>Go to Dashboard</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Link>

            <Link
              href="#services"
              className={cn(
                "inline-flex items-center justify-center w-full sm:w-auto h-11 px-6 rounded-xl text-sm font-semibold border-2 border-teal-600 bg-white hover:bg-teal-50/50 text-teal-700 transition-all shadow-sm"
              )}
            >
              Explore Services
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 pt-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-1.5 rounded-full border border-white/70 dark:border-border/70 bg-white/80 dark:bg-card/80 backdrop-blur-sm px-3.5 py-1.5 shadow-xs">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={15} className="text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="font-semibold">Verified Local Operators</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-white/70 dark:border-border/70 bg-white/80 dark:bg-card/80 backdrop-blur-sm px-3.5 py-1.5 shadow-xs">
              <HugeiconsIcon icon={Clock01Icon} size={15} className="text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="font-semibold">Upfront Authoritative Fares</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-white/70 dark:border-border/70 bg-white/80 dark:bg-card/80 backdrop-blur-sm px-3.5 py-1.5 shadow-xs">
              <HugeiconsIcon icon={StarIcon} size={15} className="text-amber-500 fill-amber-500 shrink-0" />
              <span className="font-semibold">Community Reviewed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

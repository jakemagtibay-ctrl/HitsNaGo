import { HugeiconsIcon } from "@hugeicons/react"
import {
  Location01Icon,
  CheckmarkBadge01Icon,
  Clock01Icon,
  StarIcon,
} from "@hugeicons/core-free-icons"
import { HeroCta } from "@/components/landing/hero-cta"

export function HeroSection() {
  return (
    <section
      id="home"
      style={{ position: "relative", minHeight: "calc(100vh - 4rem)" }}
      className="flex items-center justify-center py-16 sm:py-24 lg:py-28"
    >
      {/* ── LAYER 1: Butuan City background image ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/images/butuan-hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          zIndex: 0,
        }}
      />

      {/* ── LAYER 2: Translucent cinematic overlay (NOT opaque) ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.22) 50%, rgba(0,0,0,0.50) 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* ── LAYER 3: Bottom fade into next section ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "5rem",
          background: "linear-gradient(to top, var(--background) 0%, transparent 100%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* ── LAYER 4: Hero content ── */}
      <div
        className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8"
        style={{ position: "relative", zIndex: 10 }}
      >
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center gap-6 sm:gap-7">

          {/* Location badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/40 bg-black/60 px-4 py-1.5 text-xs sm:text-sm font-medium text-teal-200 shadow-lg backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
            </span>
            <HugeiconsIcon icon={Location01Icon} size={15} className="text-teal-400 shrink-0" />
            <span className="text-white font-semibold">Serving Butuan City</span>
            <span className="text-teal-400/50">•</span>
            <span className="text-slate-200">Agusan del Norte</span>
          </div>

          {/* Main Headline */}
          <h1
            className="font-heading font-extrabold tracking-tight text-white"
            style={{
              fontSize: "clamp(2.25rem, 7vw, 4.5rem)",
              lineHeight: 1.1,
              textShadow: "0 3px 14px rgba(0,0,0,0.85)",
            }}
          >
            Your Ride. <br />
            Your Service. <br />
            <span
              style={{
                background: "linear-gradient(90deg, #5eead4, #2dd4bf, #34d399)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Your Way.
            </span>
          </h1>

          {/* Supporting Text */}
          <p
            className="max-w-2xl text-base sm:text-lg md:text-xl font-normal leading-relaxed text-slate-100"
            style={{ textShadow: "0 2px 8px rgba(0,0,0,0.85)" }}
          >
            HitsNaGo is your all-in-one local online booking platform. Urgently
            need transportation? Need to rent a vehicle or equipment for the
            weekend? Or sending a package across town? Book verified local riders
            and trusted providers with speed, convenience, and peace of mind.
          </p>

          {/* CTA Buttons */}
          <HeroCta />

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 pt-2 text-xs sm:text-sm text-slate-100">
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3.5 py-1.5 shadow-md backdrop-blur-md">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={16} className="text-teal-400 shrink-0" />
              <span className="font-medium tracking-wide">ID &amp; Vehicle Verified</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3.5 py-1.5 shadow-md backdrop-blur-md">
              <HugeiconsIcon icon={Clock01Icon} size={16} className="text-teal-400 shrink-0" />
              <span className="font-medium tracking-wide">Upfront Price Estimates</span>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3.5 py-1.5 shadow-md backdrop-blur-md">
              <HugeiconsIcon icon={StarIcon} size={16} className="text-amber-400 fill-amber-400 shrink-0" />
              <span className="font-medium tracking-wide">Community Reviewed</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


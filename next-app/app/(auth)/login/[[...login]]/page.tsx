import { SignIn } from "@clerk/nextjs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ShieldCheckIcon,
  Navigation01Icon,
  CheckmarkBadge01Icon,
  Motorbike01Icon,
  PackageIcon,
  Key01Icon,
} from "@hugeicons/core-free-icons"
import { clerkAppearance } from "@/lib/clerk-theme"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Log In - HitsNaGo",
  description: "Sign in to your HitsNaGo account to book rides, rent vehicles or equipment, and send deliveries.",
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
      {/* Left Column: HitsNaGo Brand & Trust Showcase (Hidden on smaller screens, prominent on lg+) */}
      <div className="hidden lg:flex lg:col-span-5 flex-col gap-6 pr-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary w-fit">
          <HugeiconsIcon icon={ShieldCheckIcon} size={14} />
          <span>Trusted Local Booking Platform</span>
        </div>

        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Welcome back to <span className="text-primary">HitsNaGo.</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Sign in to access your active bookings, schedule transportation, rent local services, and dispatch packages with verified partners.
          </p>
        </div>

        {/* 3 Service badges */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/70 bg-card/60 text-center">
            <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <HugeiconsIcon icon={Motorbike01Icon} size={18} />
            </div>
            <span className="text-xs font-semibold text-foreground">Ride</span>
            <span className="text-[10px] text-muted-foreground">Fast transit</span>
          </div>

          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/70 bg-card/60 text-center">
            <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <HugeiconsIcon icon={Key01Icon} size={18} />
            </div>
            <span className="text-xs font-semibold text-foreground">Rent</span>
            <span className="text-[10px] text-muted-foreground">Vehicles & gear</span>
          </div>

          <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/70 bg-card/60 text-center">
            <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
              <HugeiconsIcon icon={PackageIcon} size={18} />
            </div>
            <span className="text-xs font-semibold text-foreground">Deliver</span>
            <span className="text-[10px] text-muted-foreground">Courier dispatch</span>
          </div>
        </div>

        {/* Trust bullet points */}
        <div className="flex flex-col gap-3 pt-3 border-t border-border/60">
          <div className="flex items-start gap-3 text-xs text-muted-foreground">
            <div className="mt-0.5 rounded-full bg-primary/15 p-1 text-primary shrink-0">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={13} />
            </div>
            <span>
              <strong className="text-foreground">Verified Accounts Only:</strong> Both riders and service providers are vetted for safety.
            </span>
          </div>

          <div className="flex items-start gap-3 text-xs text-muted-foreground">
            <div className="mt-0.5 rounded-full bg-primary/15 p-1 text-primary shrink-0">
              <HugeiconsIcon icon={Navigation01Icon} size={13} />
            </div>
            <span>
              <strong className="text-foreground">Upfront Transparency:</strong> Live status tracking, no surprise charges, transparent pricing.
            </span>
          </div>
        </div>
      </div>

      {/* Right Column: Clerk Sign In Form */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center">
        {/* Mobile Header (visible only on < lg) */}
        <div className="lg:hidden text-center mb-6 max-w-sm">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            <HugeiconsIcon icon={ShieldCheckIcon} size={14} />
            <span>Verified Local Network</span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Welcome back to HitsNaGo
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Book rides, rent services, and send deliveries with confidence.
          </p>
        </div>

        <div className="w-full flex justify-center">
          <SignIn
            path="/login"
            routing="path"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
            appearance={clerkAppearance}
          />
        </div>
      </div>
    </div>
  )
}

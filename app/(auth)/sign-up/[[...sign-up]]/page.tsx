import { SignUp } from "@clerk/nextjs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ShieldCheckIcon,
  UserCheck01Icon,
  CheckmarkBadge01Icon,
} from "@hugeicons/core-free-icons"

import { clerkAppearance } from "@/lib/clerk-theme"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign Up - HitsNaGo",
  description: "Create your HitsNaGo account to book rides, rentals, and delivery services with confidence.",
}

export default function SignUpPage() {
  return (
    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
      {/* Left Column: Sign-Up Value Proposition (Hidden on smaller screens, prominent on lg+) */}
      <div className="hidden lg:flex lg:col-span-5 flex-col gap-6 pr-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary w-fit">
          <HugeiconsIcon icon={ShieldCheckIcon} size={14} />
          <span>Simple, Safe & Community First</span>
        </div>

        <div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Create your <span className="text-primary">HitsNaGo</span> account.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Join thousands of local customers, verified riders, and trusted equipment renters. Book on-demand or schedule ahead with complete peace of mind.
          </p>
        </div>

        {/* 3 Step Onboarding Highlights */}
        <div className="flex flex-col gap-3.5 pt-2">
          <div className="flex items-start gap-3.5 rounded-xl border border-border/70 bg-card/60 p-3.5">
            <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
              1
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Sign Up in Seconds</span>
              <span className="text-[11px] text-muted-foreground">
                Get started with your email or social account. No complex forms.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-xl border border-border/70 bg-card/60 p-3.5">
            <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
              2
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Choose Your Service</span>
              <span className="text-[11px] text-muted-foreground">
                Book immediate rides, rent cars & gear, or dispatch packages anytime.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-xl border border-border/70 bg-card/60 p-3.5">
            <div className="size-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
              3
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">Optional Partner Upgrade</span>
              <span className="text-[11px] text-muted-foreground">
                Want to earn? Easily apply to become a Verified Rider or Service Provider later.
              </span>
            </div>
          </div>
        </div>

        {/* Security Assurance */}
        <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
          <HugeiconsIcon icon={CheckmarkBadge01Icon} size={15} className="text-primary shrink-0" />
          <span>SSL encrypted &bull; Verified partners &bull; Zero spam policy</span>
        </div>
      </div>

      {/* Right Column: Clerk Sign Up Form */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center">
        {/* Mobile Header (visible only on < lg) */}
        <div className="lg:hidden text-center mb-6 max-w-sm">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
            <HugeiconsIcon icon={UserCheck01Icon} size={14} />
            <span>Join HitsNaGo Community</span>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Join HitsNaGo and book rides, rentals, and delivery services with confidence.
          </p>
        </div>

        <div className="w-full flex justify-center">
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/login"
            fallbackRedirectUrl="/dashboard"
            appearance={clerkAppearance}
          />
        </div>
      </div>
    </div>
  )
}

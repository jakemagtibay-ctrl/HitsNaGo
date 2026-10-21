// Partner onboarding gateway page allowing users to choose between applying as a Rider or a Rental Provider
import type { Metadata } from "next"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ShieldCheckIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { JoinPathwayCards } from "@/components/join/join-pathway-cards"
import { Badge } from "@/components/ui/badge"

// SEO metadata for partner registration
export const metadata: Metadata = {
  title: "Become a Rider or Rental Provider - HitsNaGo",
  description:
    "Choose your pathway to earn with HitsNaGo. Apply as a verified rider for ride services and deliveries, or register as a rental provider to list vehicles and equipment.",
}

// Renders the partner application selection portal
export default function JoinPage() {

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="flex-1 py-12 sm:py-16 lg:py-20 bg-muted/15">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Page Header */}
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-12 sm:mb-16 gap-3 sm:gap-4">
            <Badge
              variant="outline"
              className="gap-1.5 rounded-full border-primary/30 bg-primary/5 px-3.5 py-1 text-xs font-semibold text-primary uppercase tracking-wider"
            >
              <HugeiconsIcon icon={SparklesIcon} size={13} />
              <span>Partner Onboarding</span>
            </Badge>

            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
              Become a Rider or Rental Provider
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Choose your pathway below to start your application and join the HitsNaGo verified partner community.
            </p>
          </div>

          {/* The Choice Pathway Cards: Balanced side-by-side on desktop, stacked on mobile */}
          <JoinPathwayCards />

          {/* Safety & Verification Reassurance */}
          <div className="mt-14 max-w-3xl mx-auto rounded-2xl border border-border/80 bg-card/60 p-5 sm:p-6 text-center shadow-xs">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HugeiconsIcon icon={ShieldCheckIcon} size={20} />
              </div>
              <div className="text-left text-xs sm:text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">
                  Verified Local Community Safety
                </p>
                <p className="mt-0.5 leading-relaxed">
                  Both rider and rental provider accounts undergo verification review by the HitsNaGo admin team before receiving customer booking requests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

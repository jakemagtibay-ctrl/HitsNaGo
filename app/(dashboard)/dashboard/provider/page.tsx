import * as React from "react"
import { currentUser } from "@clerk/nextjs/server"
import { requireRole } from "@/lib/auth/roles"
import { getProviderRecord, getProviderRentalBookings, getUserApplicationStatus } from "@/lib/actions/bookings"
import { getProviderInventory } from "@/lib/actions/rentals"
import { ProviderPortalView } from "@/components/provider/provider-portal-view"
import { HugeiconsIcon } from "@hugeicons/react"
import { Key01Icon } from "@hugeicons/core-free-icons"
import type { Metadata } from "next"
import { DashboardVerificationBanner } from "@/components/dashboard/dashboard-verification-banner"
import { VerifiedBadge } from "@/components/common/verified-badge"
import type { VerificationStatus } from "@/types/verification"

export const metadata: Metadata = {
  title: "Rental Provider Hub - HitsNaGo",
  description: "Vehicle and equipment inventory management and rental requests in Butuan City.",
}

export default async function ProviderDashboardPage() {
  await requireRole("provider")
  const clerkUser = await currentUser()
  const [provider, appStatus, bookings, inventory] = await Promise.all([
    getProviderRecord(),
    getUserApplicationStatus(),
    getProviderRentalBookings(),
    getProviderInventory(),
  ])

  if (!provider) {
    const fallbackStatus: VerificationStatus = appStatus.providerApplication?.status || (appStatus.isProviderPending ? "pending" : "unverified")
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-6 max-w-xl mx-auto">
        <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
          <HugeiconsIcon icon={Key01Icon} size={32} />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-xl font-bold text-foreground">Rental Provider Portal</h2>
          <p className="text-sm text-muted-foreground">
            Your account ({clerkUser?.emailAddresses[0]?.emailAddress}) is not yet activated as an active rental provider. Submit or check your verification application below.
          </p>
        </div>
        <div className="w-full text-left">
          <DashboardVerificationBanner
            role="provider"
            status={fallbackStatus}
            rejectionReason={appStatus.providerApplication?.rejectionReason}
          />
        </div>
      </div>
    )
  }

  // Resolve persisted verification status
  let providerStatus: VerificationStatus = "unverified"
  if (provider.is_verified || provider.verification_status === "verified") {
    providerStatus = "verified"
  } else if (provider.verification_status === "resubmission_required" || appStatus.isProviderResubmission) {
    providerStatus = "resubmission_required"
  } else if (provider.verification_status === "rejected" || appStatus.isProviderRejected) {
    providerStatus = "rejected"
  } else if (provider.verification_status === "pending" || appStatus.isProviderPending) {
    providerStatus = "pending"
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      <div className="flex flex-col gap-1 border-b border-border/60 pb-5">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            {provider.business_name || provider.name}
          </h1>
          <VerifiedBadge
            role="provider"
            isVerified={provider.is_verified}
            verificationStatus={provider.verification_status}
            size="md"
            showText
          />
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
          <span>Rental Provider Hub • Butuan City, Agusan del Norte</span>
          <VerifiedBadge
            role="provider"
            isVerified={provider.is_verified}
            verificationStatus={provider.verification_status}
            size="sm"
          />
        </p>
      </div>

      {/* Verification Status Banner */}
      <DashboardVerificationBanner
        role="provider"
        status={providerStatus}
        rejectionReason={provider.rejection_reason || appStatus.providerApplication?.rejectionReason}
        submittedAt={provider.submitted_at || provider.created_at}
      />

      <ProviderPortalView
        provider={provider}
        initialBookings={bookings}
        initialInventory={inventory}
      />
    </div>
  )
}


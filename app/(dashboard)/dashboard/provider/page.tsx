import * as React from "react"
import { currentUser } from "@clerk/nextjs/server"
import { requireRole } from "@/lib/auth/roles"
import { getProviderRecord, getProviderRentalBookings } from "@/lib/actions/bookings"
import { getProviderInventory } from "@/lib/actions/rentals"
import { ProviderPortalView } from "@/components/provider/provider-portal-view"
import { HugeiconsIcon } from "@hugeicons/react"
import { Key01Icon } from "@hugeicons/core-free-icons"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Rental Provider Hub - HitsNaGo",
  description: "Vehicle and equipment inventory management and rental requests in Butuan City.",
}

export default async function ProviderDashboardPage() {
  await requireRole("provider")
  const clerkUser = await currentUser()
  const provider = await getProviderRecord()
  const [bookings, inventory] = await Promise.all([
    getProviderRentalBookings(),
    getProviderInventory(),
  ])

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="size-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
          <HugeiconsIcon icon={Key01Icon} size={28} />
        </div>
        <h2 className="font-heading text-xl font-bold text-foreground">Provider Account Not Found</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Your logged-in email ({clerkUser?.emailAddresses[0]?.emailAddress}) is not registered in the system as an approved rental provider.
          Please contact an administrator to register your email in the rental providers list.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      <div className="flex flex-col gap-1 border-b border-border/60 pb-5">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {provider.business_name || provider.name}
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Rental Provider Hub • Butuan City, Agusan del Norte
        </p>
      </div>

      <ProviderPortalView
        provider={provider}
        initialBookings={bookings}
        initialInventory={inventory}
      />
    </div>
  )
}

import * as React from "react"
import { ProviderApplicationForm } from "@/components/apply/provider-application-form"
import { getUserApplicationStatus } from "@/lib/actions/bookings"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Become a Rental Provider — HitsNaGo",
  description: "Apply to become a verified rental provider in Butuan City.",
}

export default async function BecomeProviderPage() {
  const status = await getUserApplicationStatus()

  return (
    <ProviderApplicationForm
      initialStatus={{
        isPending: status.isProviderPending,
        isVerified: status.isProviderVerified,
      }}
      initialData={status.providerApplication}
    />
  )
}

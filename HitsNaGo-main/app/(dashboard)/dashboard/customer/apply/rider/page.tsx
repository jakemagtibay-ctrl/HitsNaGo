import * as React from "react"
import { RiderApplicationForm } from "@/components/apply/rider-application-form"
import { getUserApplicationStatus } from "@/lib/actions/bookings"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Become a Rider — HitsNaGo",
  description: "Apply to become a verified rider in Butuan City.",
}

export default async function BecomeRiderPage() {
  const status = await getUserApplicationStatus()

  return (
    <RiderApplicationForm
      initialStatus={{
        isPending: status.isRiderPending,
        isVerified: status.isRiderVerified,
      }}
    />
  )
}

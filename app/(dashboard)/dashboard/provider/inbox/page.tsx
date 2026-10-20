import * as React from "react"
import { UnifiedInboxView } from "@/components/inbox/unified-inbox-view"

interface PageProps {
  searchParams: Promise<{ bookingId?: string }>
}

export default async function ProviderInboxPage({ searchParams }: PageProps) {
  const { bookingId } = await searchParams

  return <UnifiedInboxView role="provider" initialBookingId={bookingId} />
}

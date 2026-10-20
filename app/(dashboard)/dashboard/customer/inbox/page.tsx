import * as React from "react"
import { UnifiedInboxView } from "@/components/inbox/unified-inbox-view"

interface PageProps {
  searchParams: Promise<{ bookingId?: string }>
}

export default async function CustomerInboxPage({ searchParams }: PageProps) {
  const { bookingId } = await searchParams

  return <UnifiedInboxView role="customer" initialBookingId={bookingId} />
}

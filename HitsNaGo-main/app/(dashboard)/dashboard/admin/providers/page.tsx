import * as React from "react"
import { requireRole } from "@/lib/auth/roles"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminProvidersTable } from "@/components/admin/admin-providers-table"
import { getAllRentalProviders } from "@/lib/actions/admin"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Rental Providers Management - HitsNaGo Admin",
  description: "Manage registered vehicle and equipment rental hosts in Butuan City.",
}

export default async function AdminProvidersPage() {
  await requireRole("admin")

  const providers = await getAllRentalProviders()

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Rental Providers"
        description="All registered vehicle rental businesses and fleet hosts in Butuan City."
      />

      <AdminProvidersTable initialProviders={providers} />
    </div>
  )
}

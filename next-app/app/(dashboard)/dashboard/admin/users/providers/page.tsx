import * as React from "react"
import { requireRole } from "@/lib/auth/roles"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminUsersView } from "@/components/admin/admin-users-view"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Rental Providers - HitsNaGo Admin",
  description: "Manage verified rental hosts and equipment suppliers in Butuan City, Agusan del Norte.",
}

export default async function AdminProvidersPage() {
  await requireRole("admin")

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Rental Provider Directory"
        badgeText="Rental Hosts"
        description="Inspect registered vehicle fleets, equipment hosts, business permits, and rental transactions in Butuan City."
      />

      <AdminUsersView
        initialRoleFilter="provider"
        pageTitle="Rental Providers"
        pageDescription="Verified rental businesses operating in Butuan City."
      />
    </div>
  )
}

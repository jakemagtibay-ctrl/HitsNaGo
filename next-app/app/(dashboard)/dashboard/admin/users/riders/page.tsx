import * as React from "react"
import { requireRole } from "@/lib/auth/roles"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminUsersView } from "@/components/admin/admin-users-view"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Rider Management - HitsNaGo Admin",
  description: "Manage verified riders and active transport partners in Butuan City, Agusan del Norte.",
}

export default async function AdminRidersPage() {
  await requireRole("admin")

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Rider Directory"
        badgeText="Transport Partners"
        description="Monitor rider credentials, vehicle registrations, ratings, and active statuses across Butuan City."
      />

      <AdminUsersView
        initialRoleFilter="rider"
        pageTitle="Active Riders"
        pageDescription="Verified motorcycle and vehicle riders in Butuan City."
      />
    </div>
  )
}

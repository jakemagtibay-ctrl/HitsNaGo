import * as React from "react"
import { requireRole } from "@/lib/auth/roles"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminUsersView } from "@/components/admin/admin-users-view"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Customer Management - HitsNaGo Admin",
  description: "Manage registered customers across Butuan City, Agusan del Norte.",
}

export default async function AdminCustomersPage() {
  await requireRole("admin")

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Customer Directory"
        badgeText="Customers"
        description="View registered customers, booking history, and account activity in Butuan City."
      />

      <AdminUsersView
        initialRoleFilter="customer"
        pageTitle="Customers"
        pageDescription="All verified and registered customers in Butuan City."
      />
    </div>
  )
}

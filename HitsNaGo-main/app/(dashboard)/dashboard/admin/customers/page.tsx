import * as React from "react"
import { requireRole } from "@/lib/auth/roles"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminCustomersTable } from "@/components/admin/admin-customers-table"
import { getAllCustomers } from "@/lib/actions/admin"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Customers Directory - HitsNaGo Admin",
  description: "Browse registered customers and booking activity across Butuan City.",
}

export default async function AdminCustomersPage() {
  await requireRole("admin")

  const customers = await getAllCustomers()

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Customers"
        description="All registered platform customers and passenger clients in Butuan City."
      />

      <AdminCustomersTable initialCustomers={customers} />
    </div>
  )
}

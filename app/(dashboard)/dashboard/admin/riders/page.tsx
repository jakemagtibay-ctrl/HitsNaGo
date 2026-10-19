import * as React from "react"
import { requireRole } from "@/lib/auth/roles"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminRidersTable } from "@/components/admin/admin-riders-table"
import { getAllRidersWithStatus } from "@/lib/actions/admin"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Riders Management - HitsNaGo Admin",
  description: "Manage registered riders and motorcycle drivers across Butuan City.",
}

export default async function AdminRidersPage() {
  await requireRole("admin")

  const ridersResult = await getAllRidersWithStatus()

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Riders"
        description="All registered motorcycle taxi and delivery riders operating in Butuan City."
      />

      <AdminRidersTable
        initialRiders={ridersResult.riders}
        dbNotice={ridersResult.error ? ridersResult.error.message : null}
      />
    </div>
  )
}

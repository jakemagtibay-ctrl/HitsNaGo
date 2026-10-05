import * as React from "react"
import { requireRole } from "@/lib/auth/roles"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminUsersView } from "@/components/admin/admin-users-view"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "User Management - HitsNaGo Admin",
  description: "Browse, filter, verify, and manage all users across Butuan City, Agusan del Norte.",
}

export default async function AdminUsersPage() {
  await requireRole("admin")

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="User Management"
        badgeText="User Directory"
        description="Search, inspect, and manage accounts for customers, riders, and rental providers in Butuan City."
      />

      <AdminUsersView
        initialRoleFilter="all"
        pageTitle="All Registered Users"
        pageDescription="Complete registry of Butuan City platform participants."
      />
    </div>
  )
}

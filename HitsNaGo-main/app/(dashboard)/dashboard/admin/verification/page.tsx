import * as React from "react"
import { requireRole } from "@/lib/auth/roles"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminApplicationsView } from "@/components/admin/admin-applications-view"
import { getPendingApplications } from "@/lib/actions/bookings"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Verification & Applications - HitsNaGo Admin",
  description: "Review and approve rider and rental provider onboarding applications in Butuan City.",
}

export default async function AdminVerificationPage() {
  await requireRole("admin")

  const pendingApps = await getPendingApplications()

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Role Verification & Onboarding"
        description="Review pending rider and rental provider applications submitted by registered users."
      />

      <AdminApplicationsView initialApplications={pendingApps} />
    </div>
  )
}

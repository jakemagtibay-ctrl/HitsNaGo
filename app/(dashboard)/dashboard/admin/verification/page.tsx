import * as React from "react"
import { requireRole } from "@/lib/auth/roles"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminVerificationView } from "@/components/admin/admin-verification-view"
import { AdminApplicationsView } from "@/components/admin/admin-applications-view"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Verification & Applications - HitsNaGo Admin",
  description:
    "Review rider and rental provider applications, verify documents, and approve or reject role requests in Butuan City.",
}

export default async function AdminVerificationPage() {
  await requireRole("admin")

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Verification & Role Applications"
        badgeText="Trust & Safety"
        description="Review rider applications, rental provider applications, and document verifications across Butuan City."
      />

      {/* Role Applications — Rider + Provider */}
      <AdminApplicationsView />

      {/* Document Verification Queue (existing) */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="font-heading text-sm font-bold text-foreground">
            Document Verification Queue
          </h3>
          <p className="text-xs text-muted-foreground">
            Review KYC documents — driver licenses, IDs, and business permits submitted by users in Butuan City.
          </p>
        </div>
        <AdminVerificationView />
      </div>
    </div>
  )
}

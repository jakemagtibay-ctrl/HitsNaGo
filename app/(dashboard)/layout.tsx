import * as React from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getCurrentUserRole } from "@/lib/auth/roles"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) {
    redirect("/login")
  }

  const role = await getCurrentUserRole()

  return <DashboardShell role={role}>{children}</DashboardShell>
}

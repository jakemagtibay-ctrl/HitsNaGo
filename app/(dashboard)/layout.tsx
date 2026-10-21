// Authenticates users and wraps protected dashboard views inside DashboardShell
import * as React from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getCurrentUserRole } from "@/lib/auth/roles"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

// Ensures only authenticated users can access /dashboard and resolves their role
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) {
    redirect("/login")
  }

  // Determine if user is customer, rider, provider, or administrator
  const role = await getCurrentUserRole()

  return <DashboardShell role={role}>{children}</DashboardShell>
}


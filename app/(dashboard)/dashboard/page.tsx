// Automatically redirects the user to their designated dashboard (/customer, /rider, /provider, or /admin)
import { redirect } from "next/navigation"
import { getCurrentUserRole } from "@/lib/auth/roles"

// Resolves user role and performs instantaneous server-side redirect
export default async function DashboardRootPage() {
  const role = await getCurrentUserRole()
  redirect(`/dashboard/${role}`)
}


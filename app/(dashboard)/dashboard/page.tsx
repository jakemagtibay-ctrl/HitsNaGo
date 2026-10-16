import { redirect } from "next/navigation"
import { getCurrentUserRole } from "@/lib/auth/roles"

export default async function DashboardRootPage() {
  const role = await getCurrentUserRole()
  redirect(`/dashboard/${role}`)
}

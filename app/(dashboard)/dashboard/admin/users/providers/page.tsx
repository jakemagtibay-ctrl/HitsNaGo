import { redirect } from "next/navigation"

export default function AdminUsersProvidersRedirect() {
  redirect("/dashboard/admin/providers")
}

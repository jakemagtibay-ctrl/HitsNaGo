import { redirect } from "next/navigation"

export default function AdminUsersCustomersRedirect() {
  redirect("/dashboard/admin/customers")
}

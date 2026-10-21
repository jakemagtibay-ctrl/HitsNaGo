"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { isValidRole, type UserRole } from "./roles"

// Switches the active user role during testing or demonstration by setting an HTTP cookie
export async function switchDemoRole(newRole: UserRole) {
  if (!isValidRole(newRole)) {
    throw new Error("Invalid role specified.")
  }

  const cookieStore = await cookies()
  cookieStore.set("hitsnago_demo_role", newRole, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  revalidatePath("/dashboard", "layout")
  redirect(`/dashboard/${newRole}`)
}


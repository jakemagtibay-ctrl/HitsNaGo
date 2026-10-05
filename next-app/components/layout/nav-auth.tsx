"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth, UserButton } from "@clerk/nextjs"
import { HugeiconsIcon } from "@hugeicons/react"
import { DashboardSquare01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

export function NavAuth() {
  const { isSignedIn, isLoaded } = useAuth()

  if (isLoaded && isSignedIn) {
    return (
      <div className="hidden sm:flex items-center gap-3">
        <Link href="/dashboard">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs font-semibold shadow-xs"
          >
            <HugeiconsIcon icon={DashboardSquare01Icon} size={15} />
            <span>Dashboard</span>
          </Button>
        </Link>
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox: "size-8 border border-border ring-offset-background",
              userButtonPopoverCard: "border border-border bg-card shadow-xl rounded-2xl",
            },
          }}
        />
      </div>
    )
  }

  return (
    <div className="hidden sm:flex items-center gap-2">
      <Link href="/login">
        <Button
          variant="ghost"
          size="sm"
          className="text-sm font-medium text-foreground hover:bg-muted"
        >
          Log In
        </Button>
      </Link>
      <Link href="/sign-up">
        <Button
          size="sm"
          className="text-sm font-medium shadow-sm hover:opacity-95"
        >
          Sign Up
        </Button>
      </Link>
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  DashboardSquare01Icon,
} from "@hugeicons/core-free-icons"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function BottomCtaButtons() {
  const { isSignedIn, isLoaded } = useAuth()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto pt-2 flex-wrap">
      {isLoaded && isSignedIn ? (
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full sm:w-auto px-8 text-base font-semibold shadow-md group flex items-center justify-center gap-2 h-11"
          )}
        >
          <HugeiconsIcon icon={DashboardSquare01Icon} size={18} />
          <span>Go to Dashboard</span>
        </Link>
      ) : (
        <Link
          href="/sign-up"
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full sm:w-auto px-8 text-base font-semibold shadow-md group flex items-center justify-center gap-2 h-11"
          )}
        >
          <span>Start Booking Now</span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={18}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      )}
    </div>
  )
}

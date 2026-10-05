"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, DashboardSquare01Icon } from "@hugeicons/core-free-icons"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function HeroCta() {
  const { isSignedIn, isLoaded } = useAuth()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
      {isLoaded && isSignedIn ? (
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full sm:w-auto px-7 text-base font-semibold shadow-md group gap-2"
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
            "w-full sm:w-auto px-7 text-base font-semibold shadow-md group gap-2"
          )}
        >
          <span>Book Now</span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={18}
            className="transition-transform group-hover:translate-x-1"
          />
        </Link>
      )}

      <Link
        href="#services"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "w-full sm:w-auto px-6 text-base font-medium"
        )}
      >
        Explore Services
      </Link>
    </div>
  )
}

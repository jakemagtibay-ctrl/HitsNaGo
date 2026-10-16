"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon, DashboardSquare01Icon } from "@hugeicons/core-free-icons"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function HeroCta() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2 w-full max-w-md sm:max-w-none">
      <Link
        href="/dashboard"
        className={cn(
          buttonVariants({ size: "lg" }),
          "w-full sm:w-auto h-12 px-8 text-base font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 group gap-2.5 bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/40 backdrop-blur-sm transition-all duration-200"
        )}
      >
        <HugeiconsIcon icon={DashboardSquare01Icon} size={19} />
        <span>Go to Dashboard</span>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={18}
          className="transition-transform group-hover:translate-x-1 opacity-80"
        />
      </Link>

      <Link
        href="#services"
        className={cn(
          buttonVariants({ variant: "outline", size: "lg" }),
          "w-full sm:w-auto h-12 px-7 text-base font-semibold border-white/20 bg-slate-900/60 hover:bg-slate-900/80 text-white hover:text-white backdrop-blur-md shadow-md transition-all duration-200"
        )}
      >
        Explore Services
      </Link>
    </div>
  )
}


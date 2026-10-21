// Displays a blue verified badge icon next to approved riders and rental providers
import React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkBadge01Icon } from "@hugeicons/core-free-icons"
import { cn } from "@/lib/utils"


export interface VerifiedBadgeProps {
  role?: "rider" | "provider"
  isVerified?: boolean | null
  verificationStatus?: string | null
  className?: string
  size?: "sm" | "md" | "lg"
  showText?: boolean
}

/**
 * Checks if the entity is verified based on either persisted verification_status
 * or legacy is_verified flag.
 */
export function isUserVerified(
  isVerified?: boolean | null,
  verificationStatus?: string | null
): boolean {
  if (verificationStatus) {
    return verificationStatus === "verified"
  }
  return Boolean(isVerified)
}

/**
 * Reusable Verified Checkmark Badge for Riders and Rental Providers.
 * Displays a distinct blue checkmark badge next to names with accessible labeling.
 */
export function VerifiedBadge({
  role = "rider",
  isVerified,
  verificationStatus,
  className,
  size = "md",
  showText = false,
}: VerifiedBadgeProps) {
  const verified = isUserVerified(isVerified, verificationStatus)
  if (!verified) return null

  const roleLabel = role === "provider" ? "Verified Rental Provider" : "Verified Rider"
  const iconSize = size === "sm" ? 13 : size === "lg" ? 18 : 15

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-sans select-none align-middle text-sky-600 dark:text-sky-400 shrink-0",
        className
      )}
      title={roleLabel}
      aria-label={roleLabel}
    >
      <HugeiconsIcon
        icon={CheckmarkBadge01Icon}
        size={iconSize}
        className="fill-sky-500/15 stroke-[2] drop-shadow-xs"
      />
      {showText && (
        <span className="text-[11px] font-semibold tracking-tight text-sky-700 dark:text-sky-300">
          {roleLabel}
        </span>
      )}
      <span className="sr-only">({roleLabel})</span>
    </span>
  )
}

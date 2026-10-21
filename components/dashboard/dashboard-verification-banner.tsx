import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ShieldCheckIcon,
  Clock01Icon,
  AlertCircleIcon,
  Cancel01Icon,
  CheckmarkBadge01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { VerificationStatus } from "@/types/verification"
import { VerifiedBadge } from "@/components/common/verified-badge"

export interface DashboardVerificationBannerProps {
  role: "rider" | "provider"
  status: VerificationStatus
  rejectionReason?: string | null
  submittedAt?: string | null
  className?: string
}

export function DashboardVerificationBanner({
  role,
  status,
  rejectionReason,
  submittedAt,
  className,
}: DashboardVerificationBannerProps) {
  const applyHref =
    role === "rider"
      ? "/dashboard/customer/apply/rider"
      : "/dashboard/customer/apply/provider"

  const roleTitle = role === "rider" ? "Rider" : "Rental Provider"

  // 1. VERIFIED STATE
  if (status === "verified") {
    return (
      <Card
        className={cn(
          "border-sky-500/30 bg-gradient-to-r from-sky-500/10 via-sky-500/5 to-card shadow-xs",
          className
        )}
      >
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-heading text-sm font-bold text-foreground">
                  Official Government ID Verified
                </h4>
                <VerifiedBadge role={role} isVerified={true} size="sm" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your government-issued identity has been authenticated. Your profile displays the official blue verification badge across HitsNaGo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30 gap-1.5 py-1 px-3 text-xs font-semibold">
              <HugeiconsIcon icon={CheckmarkBadge01Icon} size={14} />
              <span>Verified {roleTitle}</span>
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 2. PENDING REVIEW STATE
  if (status === "pending") {
    return (
      <Card
        className={cn(
          "border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-card shadow-xs",
          className
        )}
      >
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <HugeiconsIcon icon={Clock01Icon} size={22} className="animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-heading text-sm font-bold text-foreground">
                  Verification Application Under Review
                </h4>
                <Badge
                  variant="outline"
                  className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[11px] font-semibold"
                >
                  Pending Admin Review
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your government ID document has been submitted and is currently being verified by platform administrators. Duplicate submissions are disabled while under review.
                {submittedAt && (
                  <span className="block text-[11px] text-muted-foreground/80 mt-0.5">
                    Submitted: {new Date(submittedAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            <Button
              disabled
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-300 bg-amber-500/10 cursor-not-allowed"
            >
              <HugeiconsIcon icon={Clock01Icon} size={14} />
              <span>Application Under Review</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 3. RESUBMISSION REQUIRED STATE
  if (status === "resubmission_required") {
    return (
      <Card
        className={cn(
          "border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-card shadow-xs",
          className
        )}
      >
        <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400">
                <HugeiconsIcon icon={AlertCircleIcon} size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-heading text-sm font-bold text-foreground">
                    Action Required: Resubmit Verification
                  </h4>
                  <Badge
                    variant="outline"
                    className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30 text-[11px] font-semibold"
                  >
                    Corrections Needed
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  The administrator requested updated or clearer ID documents to proceed with your {roleTitle} verification.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={applyHref}
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "text-xs font-semibold gap-1.5 bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
                )}
              >
                <span>Resubmit Verification</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </Link>
            </div>
          </div>

          {rejectionReason && (
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 text-xs text-orange-950 dark:text-orange-200">
              <strong className="block font-semibold mb-0.5">Reviewer Feedback / Instructions:</strong>
              <span>{rejectionReason}</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // 4. REJECTED STATE
  if (status === "rejected") {
    return (
      <Card
        className={cn(
          "border-destructive/30 bg-gradient-to-r from-destructive/10 via-destructive/5 to-card shadow-xs",
          className
        )}
      >
        <CardContent className="p-4 sm:p-5 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-destructive/20 text-destructive">
                <HugeiconsIcon icon={Cancel01Icon} size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-heading text-sm font-bold text-foreground">
                    Verification Application Declined
                  </h4>
                  <Badge
                    variant="destructive"
                    className="bg-destructive/15 text-destructive border-destructive/30 text-[11px] font-semibold"
                  >
                    Declined
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your verification application could not be approved. You can review the reason below and submit a new application when ready.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={applyHref}
                className={cn(
                  buttonVariants({ size: "sm", variant: "default" }),
                  "text-xs font-semibold gap-1.5"
                )}
              >
                <span>Apply Again</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </Link>
            </div>
          </div>

          {rejectionReason && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive-foreground dark:text-red-200">
              <strong className="block font-semibold mb-0.5">Administrator Rejection Reason:</strong>
              <span>{rejectionReason}</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // 5. NOT APPLIED / UNVERIFIED STATE
  return (
    <Card
      className={cn(
        "border-primary/20 bg-gradient-to-r from-primary/10 via-card to-background shadow-xs",
        className
      )}
    >
      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <HugeiconsIcon icon={ShieldCheckIcon} size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-heading text-sm font-bold text-foreground">
                Government ID Verification
              </h4>
              <Badge variant="outline" className="border-border text-muted-foreground text-[10px]">
                Not Verified
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submit your government-issued ID to receive an official verified checkmark badge and build trust with customers across Butuan City.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={applyHref}
            className={cn(buttonVariants({ size: "sm" }), "text-xs font-semibold gap-1.5 shadow-xs")}
          >
            <HugeiconsIcon icon={ShieldCheckIcon} size={14} />
            <span>Apply for Verification</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

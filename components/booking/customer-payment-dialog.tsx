"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Coins01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Cancel01Icon,
  ShieldCheckIcon,
  Clock01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Booking } from "@/lib/actions/bookings"
import { getBookingTransactions } from "@/lib/actions/payments"
import type { PaymentTransaction } from "@/types/payment"

interface CustomerPaymentDialogProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function CustomerPaymentDialog({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: CustomerPaymentDialogProps) {
  const router = useRouter()
  const [isCheckingStatus, setIsCheckingStatus] = React.useState<boolean>(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [infoMessage, setInfoMessage] = React.useState<string | null>(null)
  const [transactions, setTransactions] = React.useState<PaymentTransaction[]>([])

  const isPaid =
    Boolean((booking as any)?.payment_status === "paid") ||
    transactions.some((t) => t.status === "paid")

  React.useEffect(() => {
    if (booking && isOpen) {
      setErrorMessage(null)
      setInfoMessage(null)
      getBookingTransactions(booking.id)
        .then((txs) => {
          setTransactions(txs)
        })
        .catch(() => {})
    }
  }, [booking, isOpen])

  if (!isOpen || !booking) return null

  const handleRefreshStatus = async () => {
    setIsCheckingStatus(true)
    setErrorMessage(null)
    setInfoMessage(null)
    try {
      const txs = await getBookingTransactions(booking.id)
      setTransactions(txs)
      router.refresh()
      if (txs.some((t) => t.status === "paid") || (booking as any)?.payment_status === "paid") {
        setInfoMessage("Cash payment confirmed! Your booking is marked as paid.")
        if (onSuccess) onSuccess()
      } else {
        setInfoMessage("Status updated. Cash payment is currently pending collection upon completion.")
      }
    } catch {
      setErrorMessage("Could not refresh payment status.")
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const primaryTransaction = transactions.find((t) => t.status === "paid") || transactions[0]
  const paidDateString = (booking as any)?.paid_at
    ? new Date((booking as any).paid_at).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Manila",
      })
    : primaryTransaction?.paidAt
    ? new Date(primaryTransaction.paidAt).toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Manila",
      })
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in-0 duration-150">
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col gap-4"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <h3 className="font-heading text-base font-bold text-foreground">
                {isPaid ? "Cash Payment Receipt" : "Payment & Fare Details"}
              </h3>
              {isPaid ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
                  Paid in Cash
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-[10px]">
                  Pending Cash
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Booking {booking.reference} • {booking.service_type.toUpperCase()}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>

        {/* Fare Summary Card */}
        <div className="rounded-xl border border-border/80 bg-muted/30 p-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">
              {isPaid ? "Total Paid Amount" : "Estimated Fare"}
            </span>
            <span className="font-heading text-xl font-bold text-foreground">
              ₱{Number(booking.estimated_fare).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-right flex flex-col items-end">
            <span className="text-[11px] text-muted-foreground">Payment Method</span>
            <span className="text-xs font-semibold capitalize text-foreground flex items-center gap-1">
              <HugeiconsIcon icon={Coins01Icon} size={13} className="text-primary" />
              Cash
            </span>
          </div>
        </div>

        {/* Alerts / Info */}
        {errorMessage && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive flex items-start gap-2">
            <HugeiconsIcon icon={AlertCircleIcon} size={15} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-xs text-primary flex items-start gap-2">
            <HugeiconsIcon icon={ShieldCheckIcon} size={15} className="shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* Payment Status Content */}
        {isPaid ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col gap-2.5 text-xs">
            <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} />
              <span>Cash Payment Collected & Verified</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Cash payment has been officially received and recorded by your authorized service personnel.
            </p>

            <div className="mt-1 pt-2 border-t border-border/40 font-mono text-[10px] text-muted-foreground flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Receipt Reference:</span>
                <span className="font-semibold text-foreground">
                  {primaryTransaction?.reference || `RCPT-${booking.reference}`}
                </span>
              </div>
              {paidDateString && (
                <div className="flex justify-between">
                  <span>Paid On:</span>
                  <span className="text-foreground">{paidDateString}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase">PAID (CASH)</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Cash on Service Notice */}
            <div className="rounded-xl border border-border/80 bg-card p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <HugeiconsIcon icon={Coins01Icon} size={15} className="text-primary" />
                  Cash on Handover / Dropoff
                </span>
                <Badge variant="outline" className="text-[10px] text-primary bg-primary/5">
                  Primary Method
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Please prepare exact cash of{" "}
                <strong className="text-foreground">
                  ₱{Number(booking.estimated_fare).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </strong>{" "}
                to hand directly to your driver or vehicle rental provider upon service completion.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 mt-1">
                <HugeiconsIcon icon={Clock01Icon} size={13} className="shrink-0 text-amber-500" />
                <span>Status: Awaiting cash collection by authorized personnel</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isCheckingStatus}
            onClick={handleRefreshStatus}
            className="text-xs text-muted-foreground h-8 gap-1.5"
          >
            <HugeiconsIcon icon={RefreshIcon} size={13} className={isCheckingStatus ? "animate-spin" : ""} />
            <span>{isCheckingStatus ? "Refreshing..." : "Refresh Status"}</span>
          </Button>

          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs h-8">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

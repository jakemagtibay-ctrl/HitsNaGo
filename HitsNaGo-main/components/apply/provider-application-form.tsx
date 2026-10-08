"use client"

import * as React from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Key01Icon,
  Clock01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button"
import { applyToBecomeProvider } from "@/lib/actions/bookings"
import { cn } from "@/lib/utils"

interface ProviderApplicationFormProps {
  initialStatus?: {
    isPending: boolean
    isVerified: boolean
  }
}

export function ProviderApplicationForm({ initialStatus }: ProviderApplicationFormProps) {
  const [isPending, setIsPending] = React.useState(initialStatus?.isPending ?? false)
  const [isVerified] = React.useState(initialStatus?.isVerified ?? false)
  const [name, setName] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [businessName, setBusinessName] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState("")

  if (isVerified) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={28} />
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground">You are an Approved Provider</h1>
        <p className="text-xs text-muted-foreground">
          Your rental provider account is active and verified. You can access your Provider Hub now.
        </p>
        <Link
          href="/dashboard/provider"
          className={cn(buttonVariants({ size: "default" }), "text-xs font-semibold mt-2")}
        >
          Go to Provider Hub
        </Link>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto gap-4">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <HugeiconsIcon icon={Clock01Icon} size={28} />
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground">Application Pending</h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your application to become a rental provider is currently under review by our administrators.
          Once approved, you will be able to access the Rental Provider Hub and manage rental inventory.
        </p>
        <Link
          href="/dashboard/customer"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs font-semibold mt-2")}
        >
          Back to Customer Portal
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !phone || !businessName) {
      setErrorMessage("Please fill in all fields.")
      return
    }

    setIsSubmitting(true)
    setErrorMessage("")

    const { error } = await applyToBecomeProvider({
      name,
      phone,
      businessName,
    })

    if (error) {
      setErrorMessage(error)
      setIsSubmitting(false)
      return
    }

    setIsPending(true)
    setIsSubmitting(false)
  }

  return (
    <div className="max-w-md mx-auto py-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <HugeiconsIcon icon={Key01Icon} size={18} />
          </div>
          <h1 className="font-heading text-xl font-bold text-foreground">Become a Rental Provider</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Offer rental cars, vans, motorcycles, or equipment in Butuan City. Submit your application for review.
        </p>
      </div>

      <Card className="border-border/80 bg-card shadow-xs">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {errorMessage && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-foreground">
                Applicant Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramon Villanueva"
                className="h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="phone" className="text-xs font-semibold text-foreground">
                Contact Phone
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +63 917 333 8899"
                className="h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="businessName" className="text-xs font-semibold text-foreground">
                Business / Fleet Name
              </label>
              <input
                id="businessName"
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Caraga Car & Van Rentals or Butuan MotoRentals"
                className="h-9 px-3 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full text-xs font-semibold mt-2">
              {isSubmitting ? "Submitting Application..." : "Submit Provider Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

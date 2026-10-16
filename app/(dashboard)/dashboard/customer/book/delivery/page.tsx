"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PackageIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Calendar01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons"
import { LocationField } from "@/components/booking/location-field"
import { ServiceAreaNotice } from "@/components/booking/service-area-notice"
import { BookingStepper, type StepItem } from "@/components/booking/booking-stepper"
import { BookingSummary } from "@/components/booking/booking-summary"
import { BookingConfirmation } from "@/components/booking/booking-confirmation"
import { PriceSummary } from "@/components/booking/price-summary"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  PACKAGE_TYPES_CONFIG,
  PACKAGE_SIZE_TIERS,
  calculateDeliveryEstimate,
} from "@/lib/mock-data/delivery-options"
import { BUTUAN_PRESET_LOCATIONS } from "@/lib/mock-data/butuan-locations"
import { ACTIVE_SERVICE_AREA } from "@/lib/config/service-areas"
import type { LocationAddress } from "@/types/service"
import type { PackageType } from "@/types/delivery"

const STEPS: StepItem[] = [
  { id: 1, label: "Addresses & Contacts", sublabel: "Pickup & Dropoff" },
  { id: 2, label: "Package Details", sublabel: "Size, Weight & Time" },
  { id: 3, label: "Review Delivery", sublabel: "Fee Breakdown" },
  { id: 4, label: "Confirmation", sublabel: "Request Sent" },
]

export default function DeliveryBookingPage() {
  const [currentStep, setCurrentStep] = React.useState<number>(1)

  // Step 1: Contacts & Locations
  const [senderName, setSenderName] = React.useState<string>("Maria Santos")
  const [senderPhone, setSenderPhone] = React.useState<string>("+63 917 123 4567")
  const [pickupLocation, setPickupLocation] = React.useState<LocationAddress | null>(
    BUTUAN_PRESET_LOCATIONS[0].address // Robinsons Place Butuan
  )

  const [recipientName, setRecipientName] = React.useState<string>("")
  const [recipientPhone, setRecipientPhone] = React.useState<string>("")
  const [recipientNotes, setRecipientNotes] = React.useState<string>("")
  const [deliveryLocation, setDeliveryLocation] = React.useState<LocationAddress | null>(
    BUTUAN_PRESET_LOCATIONS[6].address // CSU Ampayon
  )

  const [step1Errors, setStep1Errors] = React.useState<Record<string, string>>({})

  // Step 2: Package Information & Scheduling
  const [packageType, setPackageType] = React.useState<PackageType>("parcel")
  const [sizeTierId, setSizeTierId] = React.useState<"small" | "medium" | "large">("small")
  const [estimatedWeightKg, setEstimatedWeightKg] = React.useState<number>(1.5)
  const [isFragile, setIsFragile] = React.useState<boolean>(false)
  const [packageDescription, setPackageDescription] = React.useState<string>("")
  const [pickupDate, setPickupDate] = React.useState<string>(() => {
    return new Date().toISOString().split("T")[0]
  })
  const [pickupTime, setPickupTime] = React.useState<string>("15:00")
  const [specialInstructions, setSpecialInstructions] = React.useState<string>("")
  const [step2Errors, setStep2Errors] = React.useState<Record<string, string>>({})

  // Step 3 / 4 Confirmation
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const [confirmedBookingId, setConfirmedBookingId] = React.useState<string>("")

  // Distance & Price calculations (mock 5.4 km within Butuan City)
  const distanceKm = 5.4
  const feeEstimate = React.useMemo(() => {
    return calculateDeliveryEstimate(
      packageType,
      sizeTierId,
      estimatedWeightKg,
      distanceKm,
      isFragile
    )
  }, [packageType, sizeTierId, estimatedWeightKg, distanceKm, isFragile])

  // Validate Step 1
  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {}
    if (!senderName.trim()) errs.senderName = "Sender name is required."
    if (!senderPhone.trim()) errs.senderPhone = "Sender phone is required."
    if (!pickupLocation) errs.pickupLocation = "Pickup location in Butuan City is required."

    if (!recipientName.trim()) errs.recipientName = "Recipient name is required."
    if (!recipientPhone.trim()) errs.recipientPhone = "Recipient phone is required."
    if (!deliveryLocation) errs.deliveryLocation = "Delivery location in Butuan City is required."

    if (pickupLocation && deliveryLocation && pickupLocation.address === deliveryLocation.address) {
      errs.deliveryLocation = "Delivery location cannot be identical to pickup location."
    }

    setStep1Errors(errs)
    return Object.keys(errs).length === 0
  }

  // Validate Step 2
  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {}
    if (!packageDescription.trim()) {
      errs.packageDescription = "Brief description of package contents is required."
    }
    if (!pickupDate) errs.pickupDate = "Pickup date is required."
    if (!pickupTime) errs.pickupTime = "Pickup time is required."

    setStep2Errors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNextFromStep1 = () => {
    if (validateStep1()) {
      setCurrentStep(2)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleNextFromStep2 = () => {
    if (validateStep2()) {
      setCurrentStep(3)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleConfirmDelivery = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      const generatedId = `HNG-${Math.floor(100000 + Math.random() * 900000)}`
      setConfirmedBookingId(generatedId)
      setIsSubmitting(false)
      setCurrentStep(4)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }, 800)
  }

  const handleReset = () => {
    setCurrentStep(1)
    setConfirmedBookingId("")
  }

  // Confirmation view
  if (currentStep === 4) {
    return (
      <div className="py-4">
        <BookingConfirmation
          bookingId={confirmedBookingId}
          serviceType="delivery"
          serviceTitle={`Courier Delivery: ${packageDescription || "Parcel"}`}
          location={ACTIVE_SERVICE_AREA.label}
          estimatedAmount={feeEstimate.estimatedTotal}
          details={[
            { label: "Pickup From", value: `${senderName} (${pickupLocation?.title || pickupLocation?.address})` },
            { label: "Deliver To", value: `${recipientName} (${deliveryLocation?.title || deliveryLocation?.address})` },
            { label: "Recipient Phone", value: recipientPhone },
            { label: "Package Type", value: `${packageType.toUpperCase()} (${estimatedWeightKg} kg)` },
            { label: "Size Tier", value: sizeTierId.toUpperCase() },
            { label: "Fragile Item", value: isFragile ? "Yes (Fragile handling required)" : "No" },
            { label: "Scheduled Pickup", value: `${pickupDate} at ${pickupTime}` },
            { label: "Distance", value: `~${distanceKm} km (Within Butuan City)` },
            { label: "Payment Method", value: "Cash upon pickup or GCash" },
          ]}
          onBookAgain={handleReset}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Header section */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-primary/30 text-primary bg-primary/10 text-xs font-semibold uppercase tracking-wider"
          >
            Delivery Service
          </Badge>
          <ServiceAreaNotice variant="badge" />
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Send a Delivery
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
          Send packages safely across Butuan City. Verified courier riders handle your documents, packages, and urgent goods with point-to-point speed.
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
        <BookingStepper steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Service Area Notice */}
      <ServiceAreaNotice variant="compact" />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Form Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* STEP 1: Addresses & Contacts */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-6">
              {/* Sender Details */}
              <Card className="border-border bg-card shadow-xs">
                <CardContent className="p-5 sm:p-6 flex flex-col gap-5">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-primary/15 text-primary text-xs font-bold">
                      A
                    </div>
                    <div>
                      <h2 className="font-heading text-sm font-bold text-foreground">
                        Sender & Pickup Point (Butuan City)
                      </h2>
                      <p className="text-[11px] text-muted-foreground">
                        Where the rider will collect the package.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="del-sender-name" className="text-xs font-semibold text-foreground">
                        Sender Full Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="del-sender-name"
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="e.g. Maria Santos"
                        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {step1Errors.senderName && (
                        <p className="text-[11px] text-destructive">{step1Errors.senderName}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="del-sender-phone" className="text-xs font-semibold text-foreground">
                        Sender Contact Phone <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="del-sender-phone"
                        type="tel"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        placeholder="+63 9XX XXX XXXX"
                        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {step1Errors.senderPhone && (
                        <p className="text-[11px] text-destructive">{step1Errors.senderPhone}</p>
                      )}
                    </div>
                  </div>

                  <LocationField
                    id="delivery-pickup"
                    label="Pickup Address in Butuan City"
                    placeholder="Enter pickup location in Butuan City..."
                    value={pickupLocation}
                    onChange={setPickupLocation}
                    error={step1Errors.pickupLocation}
                    required
                  />
                </CardContent>
              </Card>

              {/* Recipient Details */}
              <Card className="border-border bg-card shadow-xs">
                <CardContent className="p-5 sm:p-6 flex flex-col gap-5">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-500 text-xs font-bold">
                      B
                    </div>
                    <div>
                      <h2 className="font-heading text-sm font-bold text-foreground">
                        Recipient & Delivery Point (Butuan City)
                      </h2>
                      <p className="text-[11px] text-muted-foreground">
                        Where the rider will hand over the package.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="del-recipient-name" className="text-xs font-semibold text-foreground">
                        Recipient Full Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="del-recipient-name"
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="e.g. Roberto Gomez"
                        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {step1Errors.recipientName && (
                        <p className="text-[11px] text-destructive">{step1Errors.recipientName}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="del-recipient-phone" className="text-xs font-semibold text-foreground">
                        Recipient Contact Phone <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="del-recipient-phone"
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="+63 9XX XXX XXXX"
                        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {step1Errors.recipientPhone && (
                        <p className="text-[11px] text-destructive">{step1Errors.recipientPhone}</p>
                      )}
                    </div>
                  </div>

                  <LocationField
                    id="delivery-dropoff"
                    label="Delivery Address in Butuan City"
                    placeholder="Enter delivery destination in Butuan City..."
                    value={deliveryLocation}
                    onChange={setDeliveryLocation}
                    error={step1Errors.deliveryLocation}
                    required
                  />

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="del-recipient-notes" className="text-xs font-semibold text-foreground">
                      Delivery Instructions for Recipient (Optional)
                    </label>
                    <input
                      id="del-recipient-notes"
                      type="text"
                      value={recipientNotes}
                      onChange={(e) => setRecipientNotes(e.target.value)}
                      placeholder="e.g. Leave with building security guard, call upon arrival..."
                      className="h-10 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  {/* Continue Button */}
                  <div className="pt-2 flex justify-end">
                    <Button
                      type="button"
                      onClick={handleNextFromStep1}
                      className="w-full sm:w-auto font-semibold shadow-xs gap-2"
                    >
                      <span>Continue to Package Details</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* STEP 2: Package Information & Scheduling */}
          {currentStep === 2 && (
            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-5 sm:p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-base font-bold text-foreground">
                      2. Package Information & Schedule
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Specify the category, size, weight, and preferred collection time.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs gap-1.5"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                    <span>Back to Contacts</span>
                  </Button>
                </div>

                {/* Package Type Grid */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-foreground">
                    Package Category
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PACKAGE_TYPES_CONFIG.map((pkg) => (
                      <button
                        key={pkg.type}
                        type="button"
                        onClick={() => setPackageType(pkg.type)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                          packageType === pkg.type
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : "border-border bg-card hover:bg-muted"
                        }`}
                      >
                        <span className="font-semibold text-xs text-foreground">
                          {pkg.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground line-clamp-2">
                          {pkg.description}
                        </span>
                        <span className="text-[10px] font-mono text-primary font-bold mt-1">
                          Base Fee: ₱{pkg.basePrice}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Tier Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-foreground">
                    Package Size & Dimensions
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {PACKAGE_SIZE_TIERS.map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSizeTierId(tier.id)}
                        className={`p-3 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                          sizeTierId === tier.id
                            ? "border-primary bg-primary/10 ring-1 ring-primary"
                            : "border-border bg-card hover:bg-muted"
                        }`}
                      >
                        <span className="font-semibold text-xs text-foreground">
                          {tier.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {tier.sublabel}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {tier.weightRange}
                        </span>
                        {tier.surcharge > 0 ? (
                          <span className="text-[10px] font-mono text-amber-500 font-semibold mt-1">
                            +₱{tier.surcharge} surcharge
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-emerald-500 font-semibold mt-1">
                            Standard rate
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description and Weight */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 flex flex-col gap-1.5">
                    <label htmlFor="del-pkg-desc" className="text-xs font-semibold text-foreground">
                      Package Description & Contents <span className="text-destructive">*</span>
                    </label>
                    <input
                      id="del-pkg-desc"
                      type="text"
                      value={packageDescription}
                      onChange={(e) => setPackageDescription(e.target.value)}
                      placeholder="e.g. Notarized legal documents, clothing merchandise, birthday cake..."
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    {step2Errors.packageDescription && (
                      <p className="text-[11px] text-destructive">{step2Errors.packageDescription}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="del-pkg-weight" className="text-xs font-semibold text-foreground">
                      Estimated Weight (kg)
                    </label>
                    <input
                      id="del-pkg-weight"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="25"
                      value={estimatedWeightKg}
                      onChange={(e) => setEstimatedWeightKg(parseFloat(e.target.value) || 1)}
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Fragile Checkbox */}
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border/70 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={isFragile}
                    onChange={(e) => setIsFragile(e.target.checked)}
                    className="size-4 rounded text-primary focus:ring-primary"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-foreground">
                      Fragile or Delicate Handling (+₱35)
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Item requires extra careful padding, upright transport, or temperature sensitivity.
                    </span>
                  </div>
                </label>

                {/* Date & Time Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="del-pickup-date" className="text-xs font-semibold text-foreground">
                      Preferred Pickup Date <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <HugeiconsIcon
                        icon={Calendar01Icon}
                        size={16}
                        className="absolute left-3 top-3 text-muted-foreground pointer-events-none"
                      />
                      <input
                        id="del-pickup-date"
                        type="date"
                        value={pickupDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setPickupDate(e.target.value)}
                        className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="del-pickup-time" className="text-xs font-semibold text-foreground">
                      Preferred Pickup Time <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <HugeiconsIcon
                        icon={Clock01Icon}
                        size={16}
                        className="absolute left-3 top-3 text-muted-foreground pointer-events-none"
                      />
                      <input
                        id="del-pickup-time"
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Instructions */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="del-special-instructions" className="text-xs font-semibold text-foreground">
                    Additional Courier Instructions (Optional)
                  </label>
                  <textarea
                    id="del-special-instructions"
                    rows={2}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="e.g. Please ring doorbell 3 times, do not fold the envelope..."
                    className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>

                {/* Continue button */}
                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    onClick={handleNextFromStep2}
                    className="w-full sm:w-auto font-semibold shadow-xs gap-2"
                  >
                    <span>Review Delivery Request</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: Review Delivery */}
          {currentStep === 3 && (
            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-5 sm:p-6 flex flex-col gap-6">
                <div>
                  <h2 className="font-heading text-base font-bold text-foreground">
                    3. Review Delivery Request
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Please verify pickup, destination, and package handling instructions.
                  </p>
                </div>

                {/* Summary Table */}
                <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/20 p-4 text-xs">
                  <div className="flex items-start justify-between pb-3 border-b border-border/60">
                    <span className="text-muted-foreground">Pickup Location</span>
                    <div className="text-right">
                      <span className="font-semibold text-foreground block">
                        {pickupLocation?.title || pickupLocation?.address}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Contact: {senderName} ({senderPhone})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between pb-3 border-b border-border/60">
                    <span className="text-muted-foreground">Delivery Destination</span>
                    <div className="text-right">
                      <span className="font-semibold text-foreground block">
                        {deliveryLocation?.title || deliveryLocation?.address}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Recipient: {recipientName} ({recipientPhone})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start justify-between pb-3 border-b border-border/60">
                    <span className="text-muted-foreground">Package Details</span>
                    <span className="font-semibold text-foreground">
                      {packageDescription} ({packageType.toUpperCase()}, ~{estimatedWeightKg} kg)
                    </span>
                  </div>

                  <div className="flex items-start justify-between pb-3 border-b border-border/60">
                    <span className="text-muted-foreground">Pickup Schedule</span>
                    <span className="font-semibold text-foreground">
                      {pickupDate} at {pickupTime}
                    </span>
                  </div>

                  <div className="flex items-start justify-between pb-3 border-b border-border/60">
                    <span className="text-muted-foreground">Fragile Handling</span>
                    <span className="font-semibold text-foreground">
                      {isFragile ? "Yes (Fragile Fee applied)" : "Standard Handling"}
                    </span>
                  </div>

                  {specialInstructions && (
                    <div className="flex items-start justify-between">
                      <span className="text-muted-foreground">Instructions</span>
                      <span className="font-normal text-foreground text-right italic max-w-xs">
                        &quot;{specialInstructions}&quot;
                      </span>
                    </div>
                  )}
                </div>

                {/* Price Breakdown Component */}
                <PriceSummary
                  items={[
                    { label: "Base Delivery Fee", amount: feeEstimate.baseFee },
                    {
                      label: "Estimated Distance (~5.4 km)",
                      amount: feeEstimate.distanceFee,
                      subtitle: "Point-to-point transit in Butuan City",
                    },
                    ...(feeEstimate.sizeSurcharge > 0
                      ? [{ label: `Package Size Tier (${sizeTierId})`, amount: feeEstimate.sizeSurcharge }]
                      : []),
                    ...(feeEstimate.fragileHandlingFee > 0
                      ? [{ label: "Fragile Item Surcharge", amount: feeEstimate.fragileHandlingFee }]
                      : []),
                  ]}
                  totalAmount={feeEstimate.estimatedTotal}
                  totalLabel="Estimated Delivery Fee"
                />

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto text-xs gap-1.5 font-medium"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                    <span>Back to Package Details</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleConfirmDelivery}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto font-semibold shadow-xs gap-2"
                  >
                    {isSubmitting ? (
                      <span>Assigning Rider...</span>
                    ) : (
                      <>
                        <HugeiconsIcon icon={PackageIcon} size={16} />
                        <span>Confirm Delivery Request</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Summary (Desktop) */}
        <div className="lg:col-span-4 hidden lg:block">
          <BookingSummary
            serviceType="delivery"
            title={packageDescription || "Express Courier Delivery"}
            pickupAddress={pickupLocation?.title || pickupLocation?.address}
            destinationAddress={deliveryLocation?.title || deliveryLocation?.address}
            date={pickupDate}
            time={pickupTime}
            vehicleOrItemName={`Package: ${packageType.toUpperCase()} (~${estimatedWeightKg} kg)`}
            estimatedTotal={feeEstimate.estimatedTotal}
            totalLabel="Estimated Delivery Fee"
            showActions={false}
          />
        </div>
      </div>
    </div>
  )
}

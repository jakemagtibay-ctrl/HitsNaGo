"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Motorbike01Icon,
  Car01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Calendar01Icon,
  Clock01Icon,
  UserGroupIcon,
  Navigation01Icon,
} from "@hugeicons/core-free-icons"
import { LocationField } from "@/components/booking/location-field"
import { ServiceAreaNotice } from "@/components/booking/service-area-notice"
import { BookingStepper, type StepItem } from "@/components/booking/booking-stepper"
import { BookingConfirmation } from "@/components/booking/booking-confirmation"
import { PriceSummary } from "@/components/booking/price-summary"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MOCK_BUTUAN_RIDE_OPTIONS,
  calculateRideFare,
  type RideOption,
} from "@/lib/mock-data/ride-options"
import { BUTUAN_PRESET_LOCATIONS } from "@/lib/mock-data/butuan-locations"
import { ACTIVE_SERVICE_AREA } from "@/lib/config/service-areas"
import { createRideBooking } from "@/lib/actions/bookings"
import type { LocationAddress } from "@/types/service"

const STEPS: StepItem[] = [
  { id: 1, label: "Trip Details", sublabel: "Pickup & Dropoff" },
  { id: 2, label: "Ride Type", sublabel: "Vehicle & Fare" },
  { id: 3, label: "Review", sublabel: "Trip Summary" },
  { id: 4, label: "Confirmation", sublabel: "Request Sent" },
]

export default function RideBookingPage() {
  const [currentStep, setCurrentStep] = React.useState<number>(1)

  // Step 1 state
  const [pickup, setPickup] = React.useState<LocationAddress | null>(
    BUTUAN_PRESET_LOCATIONS[0].address
  )
  const [destination, setDestination] = React.useState<LocationAddress | null>(
    BUTUAN_PRESET_LOCATIONS[1].address
  )
  const [date, setDate] = React.useState<string>(() => new Date().toISOString().split("T")[0])
  const [time, setTime] = React.useState<string>("14:30")
  const [passengerCount, setPassengerCount] = React.useState<number>(1)
  const [notes, setNotes] = React.useState<string>("")
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Step 2 state
  const [selectedRideOption, setSelectedRideOption] = React.useState<RideOption>(
    MOCK_BUTUAN_RIDE_OPTIONS[0]
  )

  // Step 3 state
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const [submitError, setSubmitError] = React.useState<string>("")
  const [confirmedBookingRef, setConfirmedBookingRef] = React.useState<string>("")

  const distanceKm = 4.8
  const fareBreakdown = React.useMemo(
    () => calculateRideFare(selectedRideOption.baseFare, selectedRideOption.perKmRate, distanceKm),
    [selectedRideOption]
  )

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {}
    if (!pickup) errs.pickup = "Pickup location is required."
    if (!destination) errs.destination = "Destination is required."
    if (pickup && destination && pickup.address === destination.address) {
      errs.destination = "Destination cannot be identical to pickup."
    }
    if (!date) errs.date = "Please select a date."
    if (!time) errs.time = "Please select a time."
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNextFromStep1 = () => {
    if (validateStep1()) {
      setCurrentStep(2)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleSelectOption = (option: RideOption) => {
    setSelectedRideOption(option)
    setCurrentStep(3)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleConfirmBooking = async () => {
    setIsSubmitting(true)
    setSubmitError("")

    try {
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString()
      const { booking, error } = await createRideBooking({
        pickup: pickup?.address ?? "Butuan City",
        destination: destination?.address ?? "Butuan City",
        scheduledAt,
        passengers: passengerCount,
        paymentMode: "cash",
        estimatedFare: fareBreakdown.estimatedTotal,
        vehicleCategory: selectedRideOption.vehicleType,
        notes: notes || undefined,
      })

      if (error || !booking) {
        setSubmitError(error ?? "Unexpected error. Please try again.")
        return
      }

      setConfirmedBookingRef(booking.reference)
      setCurrentStep(4)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      setSubmitError("Network error. Please try again.")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setCurrentStep(1)
    setConfirmedBookingRef("")
    setSubmitError("")
  }

  // Step 4 — Confirmation
  if (currentStep === 4) {
    return (
      <div className="py-4">
        <BookingConfirmation
          bookingId={confirmedBookingRef}
          serviceType="ride"
          serviceTitle={selectedRideOption.categoryLabel}
          location={ACTIVE_SERVICE_AREA.label}
          estimatedAmount={fareBreakdown.estimatedTotal}
          details={[
            { label: "Pickup Point", value: pickup?.title || pickup?.address || "Butuan City" },
            { label: "Destination", value: destination?.title || destination?.address || "Butuan City" },
            { label: "Date & Time", value: `${date} at ${time}` },
            { label: "Passengers", value: `${passengerCount} passenger${passengerCount > 1 ? "s" : ""}` },
            { label: "Vehicle Type", value: selectedRideOption.categoryLabel },
            { label: "Rider Assignment", value: "Waiting for admin assignment" },
            { label: "Payment Mode", value: "Cash or GCash on arrival" },
          ]}
          onBookAgain={handleReset}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-primary/30 text-primary bg-primary/10 text-xs font-semibold uppercase tracking-wider"
          >
            Ride Service
          </Badge>
          <ServiceAreaNotice variant="badge" />
        </div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Book a Ride
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
          Find a verified rider for your trip around Butuan City. Fast pickups, transparent fares, and verified local drivers.
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
        <BookingStepper steps={STEPS} currentStep={currentStep} />
      </div>

      <ServiceAreaNotice variant="compact" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* STEP 1: Trip Details */}
          {currentStep === 1 && (
            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-5 sm:p-6 flex flex-col gap-6">
                <div>
                  <h2 className="font-heading text-base font-bold text-foreground">1. Trip Details</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Select your pickup point, destination, and schedule.</p>
                </div>

                <LocationField
                  id="ride-pickup"
                  label="Pickup Location"
                  placeholder="Enter pickup location in Butuan City..."
                  value={pickup}
                  onChange={setPickup}
                  error={errors.pickup}
                  required
                />

                <LocationField
                  id="ride-destination"
                  label="Destination"
                  placeholder="Enter destination in Butuan City..."
                  value={destination}
                  onChange={setDestination}
                  error={errors.destination}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ride-date" className="text-xs font-semibold text-foreground">
                      Pickup Date <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <HugeiconsIcon
                        icon={Calendar01Icon}
                        size={16}
                        className="absolute left-3 top-3 text-muted-foreground pointer-events-none"
                      />
                      <input
                        id="ride-date"
                        type="date"
                        value={date}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setDate(e.target.value)}
                        className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    {errors.date && <p className="text-[11px] text-destructive">{errors.date}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ride-time" className="text-xs font-semibold text-foreground">
                      Pickup Time <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <HugeiconsIcon
                        icon={Clock01Icon}
                        size={16}
                        className="absolute left-3 top-3 text-muted-foreground pointer-events-none"
                      />
                      <input
                        id="ride-time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    {errors.time && <p className="text-[11px] text-destructive">{errors.time}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-foreground">Number of Passengers</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setPassengerCount(count)}
                        className={`flex items-center justify-center gap-1.5 h-10 rounded-xl text-xs font-semibold transition-all ${
                          passengerCount === count
                            ? "bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/30"
                            : "border border-border bg-card text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <HugeiconsIcon icon={UserGroupIcon} size={14} />
                        <span>{count} Pax</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ride-notes" className="text-xs font-semibold text-foreground">
                    Notes or Landmarks (Optional)
                  </label>
                  <textarea
                    id="ride-notes"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Near the main entrance guardhouse..."
                    className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="button" onClick={handleNextFromStep1} className="w-full sm:w-auto font-semibold shadow-xs gap-2">
                    <span>View Ride Options</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: Choose Vehicle Type */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-base font-bold text-foreground">2. Choose Vehicle Type</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select the vehicle category for your trip. A rider will be assigned by the admin after confirmation.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setCurrentStep(1)} className="text-xs gap-1.5">
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                  <span>Edit Details</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {MOCK_BUTUAN_RIDE_OPTIONS.map((option) => {
                  const fare = calculateRideFare(option.baseFare, option.perKmRate, distanceKm)
                  const isSelected = selectedRideOption.id === option.id

                  return (
                    <Card
                      key={option.id}
                      className={`overflow-hidden transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/20 bg-primary/[0.03] shadow-xs"
                          : "border-border hover:border-primary/40 bg-card"
                      }`}
                      onClick={() => setSelectedRideOption(option)}
                    >
                      <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
                            {option.vehicleType === "motorcycle" || option.vehicleType === "tricycle" ? (
                              <HugeiconsIcon icon={Motorbike01Icon} size={24} />
                            ) : (
                              <HugeiconsIcon icon={Car01Icon} size={24} />
                            )}
                          </div>

                          <div className="flex flex-col gap-1">
                            <h3 className="font-heading text-sm font-bold text-foreground">{option.categoryLabel}</h3>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Estimated arrival: ~{option.estimatedArrivalMinutes} min after assignment
                            </p>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border gap-2 shrink-0">
                          <div className="text-left sm:text-right">
                            <span className="font-heading text-xl font-bold text-foreground">₱{fare.estimatedTotal}</span>
                            <span className="block text-[10px] text-muted-foreground">Estimated fare</span>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectOption(option)
                            }}
                            className="font-semibold shadow-xs text-xs gap-1.5"
                          >
                            <span>Select</span>
                            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Review */}
          {currentStep === 3 && (
            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-5 sm:p-6 flex flex-col gap-6">
                <div>
                  <h2 className="font-heading text-base font-bold text-foreground">3. Review Your Booking</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Please review all details. A rider will be assigned by the admin after confirmation.
                  </p>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/20 p-4 text-xs">
                  {[
                    { label: "Vehicle Type", value: selectedRideOption.categoryLabel },
                    { label: "Pickup Point", value: pickup?.address },
                    { label: "Destination", value: destination?.address },
                    { label: "Date & Time", value: `${date} at ${time}` },
                    { label: "Passengers", value: `${passengerCount} passenger${passengerCount > 1 ? "s" : ""}` },
                    { label: "Rider Assignment", value: "Pending — admin will assign a rider" },
                    ...(notes ? [{ label: "Notes", value: notes }] : []),
                  ].map((item, i, arr) => (
                    <div
                      key={item.label}
                      className={`flex items-start justify-between ${i < arr.length - 1 ? "pb-3 border-b border-border/60" : ""}`}
                    >
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold text-foreground text-right max-w-xs">{item.value}</span>
                    </div>
                  ))}
                </div>

                <PriceSummary
                  items={[
                    { label: "Base Fare", amount: fareBreakdown.baseFare },
                    {
                      label: "Estimated Distance (~4.8 km)",
                      amount: fareBreakdown.distanceFee,
                      subtitle: "Computed within Butuan City",
                    },
                  ]}
                  totalAmount={fareBreakdown.estimatedTotal}
                  totalLabel="Estimated Fare"
                />

                {submitError && (
                  <p className="text-xs text-destructive rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                    {submitError}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto text-xs gap-1.5 font-medium"
                  >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
                    <span>Change Vehicle</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto font-semibold shadow-xs gap-2"
                  >
                    {isSubmitting ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <HugeiconsIcon icon={Navigation01Icon} size={16} />
                        <span>Confirm Ride Booking</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar summary */}
        <div className="lg:col-span-4 hidden lg:block">
          <Card className="border-border bg-card shadow-xs sticky top-4">
            <CardContent className="p-4 flex flex-col gap-3 text-xs">
              <h3 className="font-heading text-sm font-bold text-foreground">Booking Summary</h3>
              <div className="flex flex-col gap-2 text-muted-foreground">
                <div className="flex justify-between">
                  <span>Vehicle</span>
                  <span className="text-foreground font-semibold">{selectedRideOption.categoryLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pickup</span>
                  <span className="text-foreground font-semibold text-right max-w-[160px] truncate">{pickup?.title || pickup?.address || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Drop-off</span>
                  <span className="text-foreground font-semibold text-right max-w-[160px] truncate">{destination?.title || destination?.address || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>Passengers</span>
                  <span className="text-foreground font-semibold">{passengerCount}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-bold text-foreground">Est. Fare</span>
                  <span className="font-heading font-bold text-foreground">₱{fareBreakdown.estimatedTotal}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

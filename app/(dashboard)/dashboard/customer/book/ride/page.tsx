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
  ShieldCheckIcon,
  Navigation01Icon,
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
  MOCK_BUTUAN_RIDE_OPTIONS,
  calculateRideFare,
  type RideOption,
} from "@/lib/mock-data/ride-options"
import { BUTUAN_PRESET_LOCATIONS } from "@/lib/mock-data/butuan-locations"
import { ACTIVE_SERVICE_AREA } from "@/lib/config/service-areas"
import type { LocationAddress } from "@/types/service"

const STEPS: StepItem[] = [
  { id: 1, label: "Trip Details", sublabel: "Pickup & Dropoff" },
  { id: 2, label: "Choose Rider", sublabel: "Vehicle & Fare" },
  { id: 3, label: "Review Booking", sublabel: "Trip Summary" },
  { id: 4, label: "Confirmation", sublabel: "Request Sent" },
]

export default function RideBookingPage() {
  const [currentStep, setCurrentStep] = React.useState<number>(1)

  // Step 1: Form state
  const [pickup, setPickup] = React.useState<LocationAddress | null>(
    BUTUAN_PRESET_LOCATIONS[0].address // default preset: Robinsons Place Butuan
  )
  const [destination, setDestination] = React.useState<LocationAddress | null>(
    BUTUAN_PRESET_LOCATIONS[1].address // default preset: SM City Butuan
  )
  const [date, setDate] = React.useState<string>(() => {
    return new Date().toISOString().split("T")[0]
  })
  const [time, setTime] = React.useState<string>("14:30")
  const [passengerCount, setPassengerCount] = React.useState<number>(1)
  const [notes, setNotes] = React.useState<string>("")
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Step 2: Selected Ride Option
  const [selectedRideOption, setSelectedRideOption] = React.useState<RideOption>(
    MOCK_BUTUAN_RIDE_OPTIONS[0]
  )

  // Step 3: Confirmation State
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const [confirmedBookingId, setConfirmedBookingId] = React.useState<string>("")

  // Estimated fare calculations
  const distanceKm = 4.8 // mock estimated distance for Butuan City trip
  const fareBreakdown = React.useMemo(() => {
    return calculateRideFare(
      selectedRideOption.baseFare,
      selectedRideOption.perKmRate,
      distanceKm
    )
  }, [selectedRideOption, distanceKm])

  // Step 1 Validation
  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {}
    if (!pickup) errs.pickup = "Pickup location in Butuan City is required."
    if (!destination) errs.destination = "Destination in Butuan City is required."
    if (pickup && destination && pickup.address === destination.address) {
      errs.destination = "Destination cannot be identical to pickup location."
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

  const handleSelectOptionAndReview = (option: RideOption) => {
    setSelectedRideOption(option)
    setCurrentStep(3)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleConfirmBooking = () => {
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

  // If in step 4 (confirmation), render confirmation view directly
  if (currentStep === 4) {
    return (
      <div className="py-4">
        <BookingConfirmation
          bookingId={confirmedBookingId}
          serviceType="ride"
          serviceTitle={selectedRideOption.categoryLabel}
          location={ACTIVE_SERVICE_AREA.label}
          estimatedAmount={fareBreakdown.estimatedTotal}
          details={[
            { label: "Pickup Point", value: pickup?.title || pickup?.address || "Butuan City" },
            { label: "Destination", value: destination?.title || destination?.address || "Butuan City" },
            { label: "Date & Time", value: `${date} at ${time}` },
            { label: "Passengers", value: `${passengerCount} passenger${passengerCount > 1 ? "s" : ""}` },
            { label: "Assigned Rider", value: `${selectedRideOption.rider.name} (${selectedRideOption.rider.rating}★)` },
            { label: "Vehicle", value: `${selectedRideOption.rider.vehicleModel} • ${selectedRideOption.rider.plateNumber}` },
            { label: "Estimated Duration", value: "~15 mins (~4.8 km in Butuan City)" },
            { label: "Payment Mode", value: "Cash or GCash on arrival" },
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
            Ride Service
          </Badge>
          <ServiceAreaNotice variant="badge" />
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Book a Ride
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
          Find a verified rider for your trip around Butuan City. Fast pickups, transparent estimated fares, and verified local drivers.
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
        <BookingStepper steps={STEPS} currentStep={currentStep} />
      </div>

      {/* Service Area Notice */}
      <ServiceAreaNotice variant="compact" />

      {/* Two-Column Layout (Form / Options on Left, Booking Summary on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* STEP 1: Enter Trip Details */}
          {currentStep === 1 && (
            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-5 sm:p-6 flex flex-col gap-6">
                <div>
                  <h2 className="font-heading text-base font-bold text-foreground">
                    1. Trip Details in Butuan City
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Select your pickup point, destination, schedule, and passenger requirements.
                  </p>
                </div>

                {/* Pickup Location */}
                <LocationField
                  id="ride-pickup"
                  label="Pickup Location"
                  placeholder="Enter pickup location in Butuan City (e.g. Robinsons Place, Doongan)..."
                  value={pickup}
                  onChange={setPickup}
                  error={errors.pickup}
                  required
                />

                {/* Destination Location */}
                <LocationField
                  id="ride-destination"
                  label="Destination"
                  placeholder="Enter destination in Butuan City (e.g. SM City, Bancasi Airport)..."
                  value={destination}
                  onChange={setDestination}
                  error={errors.destination}
                  required
                />

                {/* Date & Time Grid */}
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
                    {errors.date && (
                      <p className="text-[11px] text-destructive">{errors.date}</p>
                    )}
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
                    {errors.time && (
                      <p className="text-[11px] text-destructive">{errors.time}</p>
                    )}
                  </div>
                </div>

                {/* Passenger Count Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-foreground">
                    Number of Passengers
                  </label>
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
                        <span>{count} {count === 1 ? "Pax" : "Pax"}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Notes */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ride-notes" className="text-xs font-semibold text-foreground">
                    Trip Notes or Landmarks (Optional)
                  </label>
                  <div className="relative">
                    <textarea
                      id="ride-notes"
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Near the main entrance guardhouse, carrying two small luggage bags..."
                      className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                  </div>
                </div>

                {/* Continue button */}
                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    onClick={handleNextFromStep1}
                    className="w-full sm:w-auto font-semibold shadow-xs gap-2"
                  >
                    <span>View Available Rides</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: Choose Available Ride Option */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-base font-bold text-foreground">
                    2. Choose Available Ride Option
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Available verified riders nearby in Butuan City for your route.
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
                  <span>Edit Details</span>
                </Button>
              </div>

              {/* Ride Options Grid */}
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
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-heading text-sm font-bold text-foreground">
                                {option.categoryLabel}
                              </h3>
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <HugeiconsIcon icon={ShieldCheckIcon} size={10} />
                                <span>{option.rider.badgeText}</span>
                              </span>
                            </div>

                            <p className="text-xs text-muted-foreground">
                              {option.description}
                            </p>

                            {/* Rider info snippet */}
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span>
                                Rider: <strong className="text-foreground">{option.rider.name}</strong>
                              </span>
                              <span className="text-amber-500 font-semibold">
                                ★ {option.rider.rating.toFixed(2)} ({option.rider.totalRides} trips)
                              </span>
                              <span>
                                Vehicle: <strong className="text-foreground">{option.rider.vehicleModel}</strong> ({option.rider.plateNumber})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Price and Action */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border gap-2 shrink-0">
                          <div className="text-left sm:text-right">
                            <span className="font-heading text-xl font-bold text-foreground">
                              ₱{fare.estimatedTotal}
                            </span>
                            <span className="block text-[10px] text-muted-foreground">
                              ETA ~{option.estimatedArrivalMinutes} mins
                            </span>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleSelectOptionAndReview(option)
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

          {/* STEP 3: Review Booking */}
          {currentStep === 3 && (
            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-5 sm:p-6 flex flex-col gap-6">
                <div>
                  <h2 className="font-heading text-base font-bold text-foreground">
                    3. Review Your Butuan City Trip
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Please review all details before submitting your ride request.
                  </p>
                </div>

                {/* Summary Table */}
                <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/20 p-4 text-xs">
                  <div className="flex items-start justify-between pb-3 border-b border-border/60">
                    <span className="text-muted-foreground">Service Type</span>
                    <span className="font-semibold text-foreground">
                      {selectedRideOption.categoryLabel}
                    </span>
                  </div>

                  <div className="flex items-start justify-between pb-3 border-b border-border/60">
                    <span className="text-muted-foreground">Pickup Point</span>
                    <span className="font-semibold text-foreground text-right max-w-xs">
                      {pickup?.address}
                    </span>
                  </div>

                  <div className="flex items-start justify-between pb-3 border-b border-border/60">
                    <span className="text-muted-foreground">Destination</span>
                    <span className="font-semibold text-foreground text-right max-w-xs">
                      {destination?.address}
                    </span>
                  </div>

                  <div className="flex items-start justify-between pb-3 border-b border-border/60">
                    <span className="text-muted-foreground">Date & Scheduled Time</span>
                    <span className="font-semibold text-foreground">
                      {date} at {time}
                    </span>
                  </div>

                  <div className="flex items-start justify-between pb-3 border-b border-border/60">
                    <span className="text-muted-foreground">Passengers</span>
                    <span className="font-semibold text-foreground">
                      {passengerCount} passenger{passengerCount > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="flex items-start justify-between pb-3 border-b border-border/60">
                    <span className="text-muted-foreground">Assigned Driver</span>
                    <span className="font-semibold text-foreground">
                      {selectedRideOption.rider.name} (★ {selectedRideOption.rider.rating})
                    </span>
                  </div>

                  <div className="flex items-start justify-between pb-3 border-b border-border/60">
                    <span className="text-muted-foreground">Vehicle & Plate</span>
                    <span className="font-semibold text-foreground">
                      {selectedRideOption.rider.vehicleModel} ({selectedRideOption.rider.plateNumber})
                    </span>
                  </div>

                  {notes && (
                    <div className="flex items-start justify-between">
                      <span className="text-muted-foreground">Notes</span>
                      <span className="font-normal text-foreground text-right max-w-xs italic">
                        &quot;{notes}&quot;
                      </span>
                    </div>
                  )}
                </div>

                {/* Price Breakdown Component */}
                <PriceSummary
                  items={[
                    { label: "Base Fare", amount: fareBreakdown.baseFare },
                    {
                      label: "Estimated Distance (~4.8 km)",
                      amount: fareBreakdown.distanceFee,
                      subtitle: "Computed within Butuan City boundary",
                    },
                  ]}
                  totalAmount={fareBreakdown.estimatedTotal}
                  totalLabel="Estimated Fare"
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
                    <span>Back to Riders</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleConfirmBooking}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto font-semibold shadow-xs gap-2"
                  >
                    {isSubmitting ? (
                      <span>Submitting Request...</span>
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

        {/* Sidebar Summary (Desktop) */}
        <div className="lg:col-span-4 hidden lg:block">
          <BookingSummary
            serviceType="ride"
            title={selectedRideOption.categoryLabel}
            pickupAddress={pickup?.title || pickup?.address}
            destinationAddress={destination?.title || destination?.address}
            date={date}
            time={time}
            passengerCount={passengerCount}
            vehicleOrItemName={selectedRideOption.rider.vehicleModel}
            riderOrProviderName={selectedRideOption.rider.name}
            riderRating={selectedRideOption.rider.rating}
            isVerified={selectedRideOption.rider.isVerified}
            estimatedTotal={fareBreakdown.estimatedTotal}
            totalLabel="Estimated Fare"
            showActions={false}
          />
        </div>
      </div>
    </div>
  )
}

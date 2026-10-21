"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Motorbike01Icon,
  Car01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  ArrowUpDownIcon,
  Calendar01Icon,
  Clock01Icon,
  UserGroupIcon,
  Navigation01Icon,
  Location01Icon,
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
  type RideOption,
} from "@/lib/mock-data/ride-options"
import { BUTUAN_PRESET_LOCATIONS } from "@/lib/mock-data/butuan-locations"
import { ACTIVE_SERVICE_AREA } from "@/lib/config/service-areas"
import { createRideBooking } from "@/lib/actions/bookings"
import { ButuanCityMap } from "@/components/maps/butuan-city-map"
import { resolveButuanCoordinates, reverseGeocode } from "@/lib/maps/geocode"
import { getRoadRoute, type RouteResult } from "@/lib/maps/routing"
import { calculateAuthoritativeRideFare } from "@/lib/pricing/fare-engine"
import type { MapMarker, MapRoute } from "@/components/maps/types"
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

  // Road Routing & Telemetry
  const [routeResult, setRouteResult] = React.useState<RouteResult | null>(null)
  const [isRouting, setIsRouting] = React.useState<boolean>(false)

  React.useEffect(() => {
    let isCancelled = false
    if (!pickup || !destination) {
      Promise.resolve().then(() => {
        if (!isCancelled) {
          setRouteResult(null)
          setIsRouting(false)
        }
      })
      return () => { isCancelled = true }
    }

    const startCoords = pickup.coordinates || resolveButuanCoordinates(pickup.address)
    const endCoords = destination.coordinates || resolveButuanCoordinates(destination.address)

    if (startCoords.lat === endCoords.lat && startCoords.lng === endCoords.lng) {
      Promise.resolve().then(() => {
        if (!isCancelled) {
          setRouteResult(null)
          setIsRouting(false)
        }
      })
      return () => { isCancelled = true }
    }

    Promise.resolve().then(() => {
      if (!isCancelled) setIsRouting(true)
    })
    getRoadRoute(startCoords, endCoords)
      .then((res) => {
        if (!isCancelled) {
          setRouteResult(res)
          setIsRouting(false)
        }
      })
      .catch((err) => {
        console.error("Routing error:", err)
        if (!isCancelled) setIsRouting(false)
      })

    return () => {
      isCancelled = true
    }
  }, [pickup, destination])

  const distanceKm = routeResult ? routeResult.distanceKm : 4.8
  const estimatedDurationMinutes = routeResult ? routeResult.durationMin : 12

  // Authoritative server-side pricing logic
  const fareBreakdown = React.useMemo(
    () => calculateAuthoritativeRideFare(selectedRideOption.vehicleType, distanceKm),
    [selectedRideOption.vehicleType, distanceKm]
  )

  const mapRoute: MapRoute | undefined = React.useMemo(() => {
    if (!routeResult) return undefined
    return {
      coordinates: routeResult.coordinates,
      distanceKm: routeResult.distanceKm,
      durationMinutes: routeResult.durationMin,
      isEstimated: routeResult.isFallback,
    }
  }, [routeResult])

  const [selectedMapPoint, setSelectedMapPoint] = React.useState<{ lat: number; lng: number; label: string } | null>(null)
  const [activePinMode, setActivePinMode] = React.useState<"pickup" | "destination" | null>(null)

  const handleMarkerDragEnd = React.useCallback(
    async (type: "pickup" | "destination", coords: { lat: number; lng: number }) => {
      try {
        const rev = await reverseGeocode(coords.lat, coords.lng)
        const updated: LocationAddress = {
          title: rev.title,
          address: rev.address,
          landmark: rev.barangay ? `Brgy. ${rev.barangay}` : undefined,
          city: rev.city || "Butuan City",
          province: rev.province || "Agusan del Norte",
          postalCode: rev.postalCode || "8600",
          coordinates: coords,
        }
        if (type === "pickup") {
          setPickup(updated)
        } else {
          setDestination(updated)
        }
      } catch {
        if (type === "pickup") {
          setPickup((prev) => (prev ? { ...prev, coordinates: coords } : null))
        } else {
          setDestination((prev) => (prev ? { ...prev, coordinates: coords } : null))
        }
      }
    },
    []
  )

  const handlePinAdjust = async (type: "pickup" | "destination", coords: { lat: number; lng: number }) => {
    setActivePinMode(null)
    await handleMarkerDragEnd(type, coords)
  }

  const rideRouteMarkers: MapMarker[] = React.useMemo(() => {
    const list: MapMarker[] = []
    if (pickup) {
      const coords = pickup.coordinates || resolveButuanCoordinates(pickup.address)
      list.push({
        id: "current-pickup",
        title: `Pickup: ${pickup.title || "Selected Pickup"}`,
        description: pickup.address,
        address: pickup.address,
        lat: coords.lat,
        lng: coords.lng,
        category: "pickup",
        badgeText: "Pickup Point (Draggable)",
        draggable: true,
        onDragEnd: (c) => handleMarkerDragEnd("pickup", c),
      })
    }
    if (destination) {
      const coords = destination.coordinates || resolveButuanCoordinates(destination.address)
      list.push({
        id: "current-destination",
        title: `Destination: ${destination.title || "Selected Destination"}`,
        description: destination.address,
        address: destination.address,
        lat: coords.lat,
        lng: coords.lng,
        category: "destination",
        badgeText: "Dropoff Destination (Draggable)",
        draggable: true,
        onDragEnd: (c) => handleMarkerDragEnd("destination", c),
      })
    }
    return list
  }, [pickup, destination, handleMarkerDragEnd])

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
        pickupPlaceName: pickup?.title || pickup?.placeName,
        pickupBarangay: pickup?.barangay,
        pickupCity: pickup?.city,
        pickupDetails: pickup?.addressDetails,
        destinationPlaceName: destination?.title || destination?.placeName,
        destinationBarangay: destination?.barangay,
        destinationCity: destination?.city,
        destinationDetails: destination?.addressDetails,
        scheduledAt,
        passengers: passengerCount,
        paymentMode: "cash",
        estimatedFare: fareBreakdown.totalFare,
        vehicleCategory: selectedRideOption.vehicleType,
        notes: notes || undefined,
        pickupCoords: pickup?.coordinates,
        destinationCoords: destination?.coordinates,
        distanceKm,
        durationMin: estimatedDurationMinutes,
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
          estimatedAmount={fareBreakdown.totalFare}
          details={[
            { label: "Pickup Point", value: pickup?.title || pickup?.address || "Butuan City" },
            { label: "Destination", value: destination?.title || destination?.address || "Butuan City" },
            { label: "Date & Time", value: `${date} at ${time}` },
            { label: "Passengers", value: `${passengerCount} passenger${passengerCount > 1 ? "s" : ""}` },
            { label: "Vehicle Type", value: selectedRideOption.categoryLabel },
            { label: "Road Distance", value: `${distanceKm} km (~${estimatedDurationMinutes} mins)` },
            { label: "Rider Assignment", value: "Waiting for admin dispatch" },
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

                <div className="flex flex-col gap-3 relative">
                  <LocationField
                    id="ride-pickup"
                    label="Pickup Location"
                    placeholder="Enter street, subdivision, or establishment..."
                    value={pickup}
                    onChange={setPickup}
                    error={errors.pickup}
                    required
                    onPinOnMapClick={() => setActivePinMode(activePinMode === "pickup" ? null : "pickup")}
                    isPinningOnMap={activePinMode === "pickup"}
                  />

                  {/* Swap Button */}
                  <div className="flex justify-center -my-1 z-10">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const temp = pickup
                        setPickup(destination)
                        setDestination(temp)
                      }}
                      className="h-7 px-3 rounded-full text-[11px] font-semibold border-border/80 bg-card hover:bg-muted shadow-xs gap-1.5"
                      title="Swap pickup and destination"
                    >
                      <HugeiconsIcon icon={ArrowUpDownIcon} size={13} className="text-primary" />
                      <span>Swap Points</span>
                    </Button>
                  </div>

                  <LocationField
                    id="ride-destination"
                    label="Destination"
                    placeholder="Enter street, subdivision, or establishment..."
                    value={destination}
                    onChange={setDestination}
                    error={errors.destination}
                    required
                    onPinOnMapClick={() => setActivePinMode(activePinMode === "destination" ? null : "destination")}
                    isPinningOnMap={activePinMode === "destination"}
                  />
                </div>

                {/* Interactive Map Picker & Route Visualizer */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <HugeiconsIcon icon={Location01Icon} size={14} className="text-primary" />
                      Butuan City Route & Precise Location Map
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {isRouting ? "Calculating road route..." : "Drag pins or click map to set exact GPS coordinates"}
                    </span>
                  </div>

                  <ButuanCityMap
                    title="Interactive Route & Precise Pinpoint Map"
                    description="Drag green pickup or amber destination markers to fine-tune exact meter-level GPS locations."
                    height="360px"
                    markers={rideRouteMarkers}
                    route={mapRoute}
                    showLandmarks={true}
                    showControls={true}
                    enableLocationSelect={true}
                    activePinMode={activePinMode}
                    onPinAdjust={handlePinAdjust}
                    selectedLocation={selectedMapPoint}
                    onLocationSelect={(point) => {
                      setSelectedMapPoint({
                        lat: point.lat,
                        lng: point.lng,
                        label: point.label || `Location (${point.lat.toFixed(4)}, ${point.lng.toFixed(4)})`,
                      })
                    }}
                    roleContext="customer"
                    footerContent={
                      selectedMapPoint ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-muted/30 p-2.5 rounded-xl border border-border/60">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{selectedMapPoint.label}</span>
                            <span className="text-muted-foreground font-mono text-[11px]">
                              {selectedMapPoint.lat.toFixed(4)}°N, {selectedMapPoint.lng.toFixed(4)}°E
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                              onClick={async () => {
                                const rev = await reverseGeocode(selectedMapPoint.lat, selectedMapPoint.lng)
                                setPickup({
                                  title: rev.title,
                                  address: rev.address,
                                  landmark: rev.barangay ? `Brgy. ${rev.barangay}` : undefined,
                                  city: rev.city || "Butuan City",
                                  province: rev.province || "Agusan del Norte",
                                  postalCode: rev.postalCode || "8600",
                                  coordinates: { lat: selectedMapPoint.lat, lng: selectedMapPoint.lng },
                                })
                                setSelectedMapPoint(null)
                              }}
                            >
                              Use as Pickup
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                              onClick={async () => {
                                const rev = await reverseGeocode(selectedMapPoint.lat, selectedMapPoint.lng)
                                setDestination({
                                  title: rev.title,
                                  address: rev.address,
                                  landmark: rev.barangay ? `Brgy. ${rev.barangay}` : undefined,
                                  city: rev.city || "Butuan City",
                                  province: rev.province || "Agusan del Norte",
                                  postalCode: rev.postalCode || "8600",
                                  coordinates: { lat: selectedMapPoint.lat, lng: selectedMapPoint.lng },
                                })
                                setSelectedMapPoint(null)
                              }}
                            >
                              Use as Destination
                            </Button>
                          </div>
                        </div>
                      ) : undefined
                    }
                  />
                </div>

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
                  const fare = calculateAuthoritativeRideFare(option.vehicleType, distanceKm)
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
                            <span className="font-heading text-xl font-bold text-foreground">₱{fare.totalFare}</span>
                            <span className="block text-[10px] text-muted-foreground">Authoritative provisional fare</span>
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
                    { label: "Road Distance", value: `${distanceKm} km (~${estimatedDurationMinutes} mins)` },
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
                      label: `Road Distance (${fareBreakdown.distanceKm} km)`,
                      amount: fareBreakdown.distanceCharge,
                      subtitle: routeResult?.isFallback
                        ? "City municipal grid estimate"
                        : "Computed via Butuan City road network",
                    },
                  ]}
                  totalAmount={fareBreakdown.totalFare}
                  totalLabel="Authoritative Estimated Fare"
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
                  <span>Road Distance</span>
                  <span className="text-foreground font-semibold">{distanceKm} km</span>
                </div>
                <div className="flex justify-between">
                  <span>Passengers</span>
                  <span className="text-foreground font-semibold">{passengerCount}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-bold text-foreground">Est. Fare</span>
                  <span className="font-heading font-bold text-foreground">₱{fareBreakdown.totalFare}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

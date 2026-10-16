"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PackageIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  ArrowUpDownIcon,
  Calendar01Icon,
  Clock01Icon,
  Location01Icon,
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
} from "@/lib/mock-data/delivery-options"
import { BUTUAN_PRESET_LOCATIONS } from "@/lib/mock-data/butuan-locations"
import { ACTIVE_SERVICE_AREA } from "@/lib/config/service-areas"
import { ButuanCityMap } from "@/components/maps/butuan-city-map"
import { resolveButuanCoordinates, reverseGeocode } from "@/lib/maps/geocode"
import { getRoadRoute, type RouteResult } from "@/lib/maps/routing"
import { calculateAuthoritativeDeliveryFare } from "@/lib/pricing/fare-engine"
import { createDeliveryBooking } from "@/lib/actions/bookings"
import type { MapMarker, MapRoute } from "@/components/maps/types"
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

  // Step 3 / 4 Confirmation & Submitting
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const [submitError, setSubmitError] = React.useState<string>("")
  const [confirmedBookingId, setConfirmedBookingId] = React.useState<string>("")

  // Road Routing & Distance Telemetry
  const [routeResult, setRouteResult] = React.useState<RouteResult | null>(null)
  const [isRouting, setIsRouting] = React.useState<boolean>(false)

  React.useEffect(() => {
    let isCancelled = false
    if (!pickupLocation || !deliveryLocation) {
      Promise.resolve().then(() => {
        if (!isCancelled) {
          setRouteResult(null)
          setIsRouting(false)
        }
      })
      return () => { isCancelled = true }
    }

    const startCoords = pickupLocation.coordinates || resolveButuanCoordinates(pickupLocation.address)
    const endCoords = deliveryLocation.coordinates || resolveButuanCoordinates(deliveryLocation.address)

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
  }, [pickupLocation, deliveryLocation])

  const distanceKm = routeResult ? routeResult.distanceKm : 5.4
  const estimatedDurationMinutes = routeResult ? routeResult.durationMin : 15

  // Authoritative server-side pricing engine
  const feeEstimate = React.useMemo(() => {
    return calculateAuthoritativeDeliveryFare(
      packageType,
      sizeTierId,
      distanceKm,
      isFragile
    )
  }, [packageType, sizeTierId, distanceKm, isFragile])

  const mapRoute: MapRoute | undefined = React.useMemo(() => {
    if (!routeResult) return undefined
    return {
      coordinates: routeResult.coordinates,
      distanceKm: routeResult.distanceKm,
      durationMinutes: routeResult.durationMin,
      isEstimated: routeResult.isFallback,
    }
  }, [routeResult])

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
          setPickupLocation(updated)
        } else {
          setDeliveryLocation(updated)
        }
      } catch {
        if (type === "pickup") {
          setPickupLocation((prev) => (prev ? { ...prev, coordinates: coords } : null))
        } else {
          setDeliveryLocation((prev) => (prev ? { ...prev, coordinates: coords } : null))
        }
      }
    },
    []
  )

  const handlePinAdjust = async (type: "pickup" | "destination", coords: { lat: number; lng: number }) => {
    setActivePinMode(null)
    await handleMarkerDragEnd(type, coords)
  }

  const [selectedMapPoint, setSelectedMapPoint] = React.useState<{ lat: number; lng: number; label: string } | null>(null)

  const deliveryRouteMarkers: MapMarker[] = React.useMemo(() => {
    const list: MapMarker[] = []
    if (pickupLocation) {
      const coords = pickupLocation.coordinates || resolveButuanCoordinates(pickupLocation.address)
      list.push({
        id: "del-pickup",
        title: `Pickup: ${pickupLocation.title || pickupLocation.address}`,
        description: `${senderName} (${senderPhone})`,
        address: pickupLocation.address,
        lat: coords.lat,
        lng: coords.lng,
        category: "pickup",
        badgeText: "Collection Point (Draggable)",
        draggable: true,
        onDragEnd: (c) => handleMarkerDragEnd("pickup", c),
      })
    }
    if (deliveryLocation) {
      const coords = deliveryLocation.coordinates || resolveButuanCoordinates(deliveryLocation.address)
      list.push({
        id: "del-destination",
        title: `Dropoff: ${deliveryLocation.title || deliveryLocation.address}`,
        description: `${recipientName || "Recipient"} (${recipientPhone || "Contact"})`,
        address: deliveryLocation.address,
        lat: coords.lat,
        lng: coords.lng,
        category: "delivery",
        badgeText: "Dropoff Point (Draggable)",
        draggable: true,
        onDragEnd: (c) => handleMarkerDragEnd("destination", c),
      })
    }
    return list
  }, [pickupLocation, deliveryLocation, senderName, senderPhone, recipientName, recipientPhone, handleMarkerDragEnd])

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

  const handleConfirmDelivery = async () => {
    setIsSubmitting(true)
    setSubmitError("")

    try {
      const scheduledAt = new Date(`${pickupDate}T${pickupTime}:00`).toISOString()
      const { booking, error } = await createDeliveryBooking({
        pickup: pickupLocation?.address ?? "Butuan City",
        destination: deliveryLocation?.address ?? "Butuan City",
        scheduledAt,
        packageType,
        sizeTier: sizeTierId,
        senderName,
        senderPhone,
        recipientName,
        recipientPhone,
        packageDescription: packageDescription || "Parcel Package",
        isFragile,
        estimatedFare: feeEstimate.totalFare,
        notes: specialInstructions || undefined,
        pickupCoords: pickupLocation?.coordinates,
        destinationCoords: deliveryLocation?.coordinates,
        distanceKm,
        durationMin: estimatedDurationMinutes,
      })

      if (error || !booking) {
        setSubmitError(error ?? "Unexpected error while booking delivery.")
        return
      }

      setConfirmedBookingId(booking.reference)
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
    setConfirmedBookingId("")
    setSubmitError("")
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
          estimatedAmount={feeEstimate.totalFare}
          details={[
            { label: "Pickup From", value: `${senderName} (${pickupLocation?.title || pickupLocation?.address})` },
            { label: "Deliver To", value: `${recipientName} (${deliveryLocation?.title || deliveryLocation?.address})` },
            { label: "Recipient Phone", value: recipientPhone },
            { label: "Package Type", value: `${packageType.toUpperCase()} (${estimatedWeightKg} kg)` },
            { label: "Size Tier", value: sizeTierId.toUpperCase() },
            { label: "Fragile Item", value: isFragile ? "Yes (Fragile handling required)" : "No" },
            { label: "Scheduled Pickup", value: `${pickupDate} at ${pickupTime}` },
            { label: "Road Distance", value: `${distanceKm} km (~${estimatedDurationMinutes} mins)` },
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
                    placeholder="Enter pickup street, subdivision, or establishment..."
                    value={pickupLocation}
                    onChange={setPickupLocation}
                    error={step1Errors.pickupLocation}
                    required
                    onPinOnMapClick={() => setActivePinMode(activePinMode === "pickup" ? null : "pickup")}
                    isPinningOnMap={activePinMode === "pickup"}
                  />
                </CardContent>
              </Card>

              {/* Swap Button */}
              <div className="flex justify-center -my-3 z-10">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const tempLoc = pickupLocation
                    setPickupLocation(deliveryLocation)
                    setDeliveryLocation(tempLoc)
                  }}
                  className="h-7 px-3 rounded-full text-[11px] font-semibold border-border/80 bg-card hover:bg-muted shadow-xs gap-1.5"
                  title="Swap pickup and dropoff points"
                >
                  <HugeiconsIcon icon={ArrowUpDownIcon} size={13} className="text-primary" />
                  <span>Swap Collection & Delivery</span>
                </Button>
              </div>

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
                    placeholder="Enter delivery street, subdivision, or establishment..."
                    value={deliveryLocation}
                    onChange={setDeliveryLocation}
                    error={step1Errors.deliveryLocation}
                    required
                    onPinOnMapClick={() => setActivePinMode(activePinMode === "destination" ? null : "destination")}
                    isPinningOnMap={activePinMode === "destination"}
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
                </CardContent>
              </Card>

              {/* Interactive Butuan Route Map & Landmark Picker */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <HugeiconsIcon icon={Location01Icon} size={14} className="text-primary" />
                    Butuan City Delivery Road Route & Landmarks
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {isRouting ? "Calculating road route..." : "Drag pins or click map to set exact GPS coordinates"}
                  </span>
                </div>

                <ButuanCityMap
                  title="Delivery Transit Route & Coverage Map"
                  description="Butuan City, Agusan del Norte • Drag pins or click map to set exact meter-level GPS locations"
                  height="340px"
                  markers={deliveryRouteMarkers}
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
                              setPickupLocation({
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
                            Set Pickup
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                            onClick={async () => {
                              const rev = await reverseGeocode(selectedMapPoint.lat, selectedMapPoint.lng)
                              setDeliveryLocation({
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
                            Set Dropoff
                          </Button>
                        </div>
                      </div>
                    ) : undefined
                  }
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
                    <span className="text-muted-foreground">Road Distance</span>
                    <span className="font-semibold text-foreground">
                      {distanceKm} km (~{estimatedDurationMinutes} mins)
                    </span>
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
                    { label: "Base Delivery Fee", amount: feeEstimate.baseFare },
                    {
                      label: `Road Distance (${feeEstimate.distanceKm} km)`,
                      amount: feeEstimate.distanceCharge,
                      subtitle: routeResult?.isFallback
                        ? "City municipal grid estimate"
                        : "Computed via Butuan City road network",
                    },
                    ...(feeEstimate.surchargeDetails?.map((s) => ({
                      label: s.label,
                      amount: s.amount,
                    })) || []),
                  ]}
                  totalAmount={feeEstimate.totalFare}
                  totalLabel="Authoritative Estimated Delivery Fee"
                />

                {submitError && (
                  <p className="text-xs text-destructive rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                    {submitError}
                  </p>
                )}

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
            estimatedTotal={feeEstimate.totalFare}
            totalLabel="Estimated Delivery Fee"
            showActions={false}
          />
        </div>
      </div>
    </div>
  )
}

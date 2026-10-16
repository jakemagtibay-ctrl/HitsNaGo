"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Key01Icon,
  Search01Icon,
  Calendar01Icon,
  PinLocation01Icon,
  ShieldCheckIcon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  Location01Icon,
  Alert01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons"
import { ServiceAreaNotice } from "@/components/booking/service-area-notice"
import { BookingStepper, type StepItem } from "@/components/booking/booking-stepper"
import { BookingSummary } from "@/components/booking/booking-summary"
import { BookingConfirmation } from "@/components/booking/booking-confirmation"
import { PriceSummary } from "@/components/booking/price-summary"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MOCK_BUTUAN_RENTAL_LISTINGS,
  calculateRentalEstimate,
  type ButuanRentalItem,
} from "@/lib/mock-data/butuan-rental-listings"
import { ACTIVE_SERVICE_AREA } from "@/lib/config/service-areas"
import { ButuanCityMap } from "@/components/maps/butuan-city-map"
import { resolveButuanCoordinates } from "@/lib/maps/geocode"
import { getRoadRoute, type RouteResult } from "@/lib/maps/routing"
import { createRentalBooking } from "@/lib/actions/bookings"
import { checkRentalAvailability, checkAllListingsAvailability } from "@/lib/actions/rentals"
import type { ModelAvailabilityResult } from "@/types/rental"
import type { MapMarker } from "@/components/maps/types"
import { cn } from "@/lib/utils"

const STEPS: StepItem[] = [
  { id: 1, label: "Browse Catalog", sublabel: "Select Equipment/Vehicle" },
  { id: 2, label: "Rental Terms", sublabel: "Dates & Handover" },
  { id: 3, label: "Review Order", sublabel: "Cost Breakdown" },
  { id: 4, label: "Confirmation", sublabel: "Request Sent" },
]

export default function RentalBookingPage() {
  const [currentStep, setCurrentStep] = React.useState<number>(1)

  // Filters & Search
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all")
  const maxPrice = 5000

  // Selected Rental item
  const [selectedItem, setSelectedItem] = React.useState<ButuanRentalItem>(
    MOCK_BUTUAN_RENTAL_LISTINGS[0]
  )

  // Rental schedule
  const [startDate, setStartDate] = React.useState<string>(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [endDate, setEndDate] = React.useState<string>(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 2)
    return tomorrow.toISOString().split("T")[0]
  })
  const [handoverMethod, setHandoverMethod] = React.useState<"pickup" | "delivery">("pickup")
  const [customDeliveryAddress, setCustomDeliveryAddress] = React.useState<string>("")
  const [dateError, setDateError] = React.useState<string | null>(null)

  // Real-time Vehicle Unit Availability State
  const [currentAvailability, setCurrentAvailability] = React.useState<ModelAvailabilityResult | null>(null)
  const [catalogAvailability, setCatalogAvailability] = React.useState<Record<string, ModelAvailabilityResult>>({})
  const [isCheckingAvailability, setIsCheckingAvailability] = React.useState<boolean>(false)

  // Fetch real-time availability for selected item
  React.useEffect(() => {
    let isCancelled = false
    queueMicrotask(() => {
      if (!isCancelled) setIsCheckingAvailability(true)
    })
    checkRentalAvailability(selectedItem.id, startDate, endDate)
      .then((res) => {
        if (!isCancelled) setCurrentAvailability(res)
      })
      .catch((err) => console.warn("Availability check notice:", err))
      .finally(() => {
        if (!isCancelled) setIsCheckingAvailability(false)
      })
    return () => { isCancelled = true }
  }, [selectedItem.id, startDate, endDate])

  // Fetch catalog availability for all listings for selected dates
  React.useEffect(() => {
    let isCancelled = false
    checkAllListingsAvailability(startDate, endDate)
      .then((res) => {
        if (!isCancelled) setCatalogAvailability(res)
      })
      .catch((err) => console.warn("Catalog availability notice:", err))
    return () => { isCancelled = true }
  }, [startDate, endDate])

  // Confirmation state
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false)
  const [submitError, setSubmitError] = React.useState<string>("")
  const [confirmedBookingId, setConfirmedBookingId] = React.useState<string>("")

  // Handover Road Route calculation
  const [handoverRoute, setHandoverRoute] = React.useState<RouteResult | null>(null)

  React.useEffect(() => {
    let isCancelled = false
    const itemCoords = resolveButuanCoordinates(selectedItem.pickupAddress)
    const targetAddress = handoverMethod === "delivery" && customDeliveryAddress.trim()
      ? customDeliveryAddress
      : selectedItem.pickupAddress

    const targetCoords = resolveButuanCoordinates(targetAddress)

    if (itemCoords.lat === targetCoords.lat && itemCoords.lng === targetCoords.lng) {
      Promise.resolve().then(() => {
        if (!isCancelled) setHandoverRoute(null)
      })
      return () => { isCancelled = true }
    }

    getRoadRoute(itemCoords, targetCoords)
      .then((res) => {
        if (!isCancelled) setHandoverRoute(res)
      })
      .catch((err) => console.error("Rental routing error:", err))

    return () => { isCancelled = true }
  }, [selectedItem, handoverMethod, customDeliveryAddress])

  // Filter listings
  const filteredListings = React.useMemo(() => {
    return MOCK_BUTUAN_RENTAL_LISTINGS.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.provider.businessName.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory
      const matchesPrice = item.pricePerDay <= maxPrice

      return matchesSearch && matchesCategory && matchesPrice
    })
  }, [searchQuery, selectedCategory, maxPrice])

  const catalogMarkers: MapMarker[] = React.useMemo(() => {
    return filteredListings.map((item) => {
      const coords = resolveButuanCoordinates(item.pickupAddress)
      return {
        id: item.id,
        title: item.title,
        description: `₱${item.pricePerDay.toLocaleString()}/day • ${item.provider.businessName} (${item.pickupAddress})`,
        address: item.pickupAddress,
        lat: coords.lat,
        lng: coords.lng,
        category: "listing" as const,
        badgeText: "Rental Service",
      }
    })
  }, [filteredListings])

  // Estimate calculation
  const estimate = React.useMemo(() => {
    return calculateRentalEstimate(
      selectedItem.pricePerDay,
      selectedItem.securityDeposit,
      startDate,
      endDate
    )
  }, [selectedItem, startDate, endDate])

  const handleSelectListing = (item: ButuanRentalItem) => {
    setSelectedItem(item)
    setCurrentStep(2)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleNextFromStep2 = () => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end < start) {
      setDateError("Return date cannot be earlier than start date.")
      return
    }
    if (currentAvailability && !currentAvailability.isAvailable) {
      setDateError(currentAvailability.message)
      return
    }
    setDateError(null)
    setCurrentStep(3)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleConfirmRental = async () => {
    setIsSubmitting(true)
    setSubmitError("")

    try {
      const { booking, error } = await createRentalBooking({
        listingId: selectedItem.id,
        itemTitle: selectedItem.title,
        category: selectedItem.category,
        pickupLocation: selectedItem.pickupAddress || "Butuan City",
        handoverLocation: handoverMethod === "delivery" && customDeliveryAddress.trim()
          ? customDeliveryAddress
          : (selectedItem.pickupAddress || "Butuan City"),
        startDate,
        endDate,
        rentalDays: estimate.durationDays,
        pricePerDay: selectedItem.pricePerDay,
        securityDeposit: selectedItem.securityDeposit,
        estimatedTotal: estimate.estimatedTotal,
      })

      if (error || !booking) {
        setSubmitError(error ?? "Unable to complete rental request.")
        // Concurrency-safe refresh: Availability changed
        checkRentalAvailability(selectedItem.id, startDate, endDate).then(setCurrentAvailability)
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
          serviceType="rental"
          serviceTitle={selectedItem.title}
          location={ACTIVE_SERVICE_AREA.label}
          estimatedAmount={estimate.estimatedTotal}
          details={[
            { label: "Item / Service", value: selectedItem.title },
            { label: "Verified Provider", value: `${selectedItem.provider.businessName} (${selectedItem.provider.rating}★)` },
            { label: "Location", value: `${selectedItem.pickupAddress}` },
            { label: "Rental Schedule", value: `${startDate} to ${endDate} (${estimate.durationDays} day${estimate.durationDays > 1 ? "s" : ""})` },
            { label: "Daily Rate", value: `₱${selectedItem.pricePerDay.toLocaleString()}/day` },
            { label: "Security Deposit (Refundable)", value: `₱${selectedItem.securityDeposit.toLocaleString()}` },
            { label: "Handover Method", value: handoverMethod === "pickup" ? "Self Pickup in Butuan City" : `Delivery to: ${customDeliveryAddress || "Butuan City Address"}` },
            { label: "Payment & Deposit", value: "Payable upon handover inspection" },
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
            Rental Service
          </Badge>
          <ServiceAreaNotice variant="badge" />
        </div>

        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Rent a Service
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
          Find verified rental services available in Butuan City. Reserve commercial passenger vans, city motorbikes, and heavy-duty event power equipment from trusted local providers.
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
        {/* Main Content */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* STEP 1: Search & Browse Listings */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-6">
              {/* Search & Filter Bar */}
              <Card className="border-border bg-card shadow-xs">
                <CardContent className="p-4 sm:p-5 flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                      <HugeiconsIcon
                        icon={Search01Icon}
                        size={16}
                        className="absolute left-3 top-3 text-muted-foreground pointer-events-none"
                      />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search rentals in Butuan City (e.g. Innova, NMAX, Generator)..."
                        className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                      {[
                        { id: "all", label: "All Items" },
                        { id: "vehicle", label: "Vehicles & Bikes" },
                        { id: "equipment", label: "Equipment" },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                            selectedCategory === cat.id
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "border border-border bg-card text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
                    <span>
                      Showing <strong>{filteredListings.length}</strong> rental services in <strong>Butuan City</strong>
                    </span>
                    <span className="text-[11px] text-primary font-medium">
                      All providers identity-verified
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Butuan City Rental Fleet Map */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <HugeiconsIcon icon={Location01Icon} size={14} className="text-primary" />
                    Butuan City Fleet & Equipment Hub Locations
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Click any marker to locate rental vehicles and equipment hubs
                  </span>
                </div>
                <ButuanCityMap
                  title="Rental Services & Fleet Hubs"
                  description="Butuan City, Agusan del Norte • Verified equipment and vehicle pickup locations"
                  height="340px"
                  markers={catalogMarkers}
                  showLandmarks={true}
                  showControls={true}
                  roleContext="customer"
                />
              </div>

              {/* Listings Grid */}
              {filteredListings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center flex flex-col items-center gap-3">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <HugeiconsIcon icon={Key01Icon} size={24} />
                  </div>
                  <h3 className="font-heading text-base font-bold text-foreground">
                    No rental services match your search
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Try adjusting your search terms or view all rental categories available in Butuan City.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("")
                      setSelectedCategory("all")
                    }}
                    className="text-xs mt-2"
                  >
                    Reset Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredListings.map((item) => (
                    <Card
                      key={item.id}
                      className="group overflow-hidden border-border bg-card hover:border-primary/40 hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <CardContent className="p-0 flex flex-col h-full">
                        {/* Image header with category & price badge */}
                        <div className="relative h-44 w-full overflow-hidden bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute top-2.5 left-2.5">
                            <Badge className="bg-background/90 backdrop-blur-xs text-foreground text-[10px] font-bold uppercase border border-border shadow-xs">
                              {item.category}
                            </Badge>
                          </div>
                          <div className="absolute top-2.5 right-2.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-600/90 text-white px-2 py-0.5 rounded-full shadow-xs">
                              <HugeiconsIcon icon={ShieldCheckIcon} size={11} />
                              Verified Host
                            </span>
                          </div>
                          <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-xs text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs">
                            ₱{item.pricePerDay.toLocaleString()}{" "}
                            <span className="text-[10px] font-normal text-white/80">/day</span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-heading text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                                {item.title}
                              </h3>
                              <span className="text-xs font-bold text-amber-500 shrink-0">
                                ★ {item.rating.toFixed(1)}
                              </span>
                            </div>

                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {item.description}
                            </p>

                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                              <HugeiconsIcon icon={PinLocation01Icon} size={13} className="text-primary shrink-0" />
                              <span className="line-clamp-1">{item.pickupAddress}</span>
                            </div>
                          </div>

                          {/* Features preview */}
                          <div className="flex flex-wrap gap-1 pt-2 border-t border-border/50">
                            {item.features.slice(0, 3).map((feat, idx) => (
                              <span
                                key={idx}
                                className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                              >
                                {feat}
                              </span>
                            ))}
                          </div>

                          {/* Real-time Fleet Unit Availability Badge */}
                          {(() => {
                            const itemAvail = catalogAvailability[item.id]
                            if (!itemAvail) return null

                            if (itemAvail.isAvailable) {
                              return (
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} className="shrink-0" />
                                  <span>{itemAvail.availableUnits} of {itemAvail.totalUnits} Units Available</span>
                                </div>
                              )
                            }
                            if (itemAvail.status === "all_maintenance") {
                              return (
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
                                  <HugeiconsIcon icon={Alert01Icon} size={13} className="shrink-0" />
                                  <span>Under Maintenance</span>
                                </div>
                              )
                            }
                            if (itemAvail.status === "all_booked") {
                              return (
                                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-destructive bg-destructive/10 px-2 py-1 rounded-lg">
                                  <HugeiconsIcon icon={Cancel01Icon} size={13} className="shrink-0" />
                                  <span>Fully Booked for Selected Dates</span>
                                </div>
                              )
                            }
                            return (
                              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                                <span>Unavailable</span>
                              </div>
                            )
                          })()}

                          {/* Provider & Action */}
                          <div className="flex items-center justify-between gap-3 pt-3 border-t border-border mt-1">
                            <div className="flex flex-col">
                              <span className="text-[10px] text-muted-foreground uppercase">
                                Provided by
                              </span>
                              <span className="text-xs font-semibold text-foreground line-clamp-1">
                                {item.provider.businessName}
                              </span>
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              onClick={() => handleSelectListing(item)}
                              className="font-semibold shadow-xs text-xs gap-1.5"
                            >
                              <span>Rent Now</span>
                              <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Rental Dates & Handover Details */}
          {currentStep === 2 && (
            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-5 sm:p-6 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-heading text-base font-bold text-foreground">
                      2. Configure Rental Dates & Handover
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Select your reservation dates and handover preference within Butuan City.
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
                    <span>Change Item</span>
                  </Button>
                </div>

                {/* Selected Item Recap Card */}
                <div className="flex items-start gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedItem.images[0]}
                    alt={selectedItem.title}
                    className="size-16 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <h3 className="font-heading text-sm font-bold text-foreground truncate">
                      {selectedItem.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {selectedItem.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <span className="text-foreground font-bold">
                        ₱{selectedItem.pricePerDay.toLocaleString()}/day
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-muted-foreground">
                        Deposit: ₱{selectedItem.securityDeposit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="rent-start-date" className="text-xs font-semibold text-foreground">
                      Start Date <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <HugeiconsIcon
                        icon={Calendar01Icon}
                        size={16}
                        className="absolute left-3 top-3 text-muted-foreground pointer-events-none"
                      />
                      <input
                        id="rent-start-date"
                        type="date"
                        value={startDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="rent-end-date" className="text-xs font-semibold text-foreground">
                      Return Date <span className="text-destructive">*</span>
                    </label>
                    <div className="relative">
                      <HugeiconsIcon
                        icon={Calendar01Icon}
                        size={16}
                        className="absolute left-3 top-3 text-muted-foreground pointer-events-none"
                      />
                      <input
                        id="rent-end-date"
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {dateError && (
                  <p className="text-xs text-destructive font-medium">{dateError}</p>
                )}

                {/* Real-time Fleet Unit Availability Card */}
                {currentAvailability && (
                  <div
                    className={cn(
                      "p-4 rounded-xl border flex flex-col gap-2 transition-all",
                      currentAvailability.isAvailable
                        ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300"
                        : "border-destructive/30 bg-destructive/5 text-destructive"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {currentAvailability.isAvailable ? (
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} className="text-emerald-600 shrink-0" />
                        ) : (
                          <HugeiconsIcon icon={Cancel01Icon} size={18} className="text-destructive shrink-0" />
                        )}
                        <span className="font-bold text-xs sm:text-sm">
                          {currentAvailability.isAvailable ? "Eligible Vehicle Unit Available" : "Vehicle Model Unavailable"}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-mono uppercase font-bold",
                          currentAvailability.isAvailable
                            ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                            : "border-destructive/30 text-destructive bg-destructive/10"
                        )}
                      >
                        {currentAvailability.availableUnits} of {currentAvailability.totalUnits} Units Free
                      </Badge>
                    </div>

                    <p className="text-xs leading-relaxed font-medium">
                      {isCheckingAvailability ? "Checking fleet availability for selected dates..." : currentAvailability.message}
                    </p>

                    {currentAvailability.isAvailable && currentAvailability.bookedUnits > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        Note: {currentAvailability.bookedUnits} unit(s) of this model are reserved on adjacent dates. Your reservation will secure 1 of the {currentAvailability.availableUnits} remaining free units.
                      </span>
                    )}

                    {!currentAvailability.isAvailable && (
                      <p className="text-[11px] font-medium text-destructive/90">
                        Please adjust your rental dates or return to Step 1 to select another vehicle model.
                      </p>
                    )}
                  </div>
                )}

                {/* Handover Method Selector */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-foreground">
                    Handover Method in Butuan City
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setHandoverMethod("pickup")}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        handoverMethod === "pickup"
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border bg-card hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          Self Pickup (Free)
                        </span>
                        {handoverMethod === "pickup" && (
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} className="text-primary" />
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Collect directly at provider&apos;s verified hub in Butuan City.
                      </span>
                      <span className="text-[10px] text-primary/80 font-mono mt-1">
                        {selectedItem.pickupAddress}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setHandoverMethod("delivery")}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col gap-1 ${
                        handoverMethod === "delivery"
                          ? "border-primary bg-primary/10 ring-1 ring-primary"
                          : "border-border bg-card hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">
                          Delivery to Location
                        </span>
                        {handoverMethod === "delivery" && (
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} className="text-primary" />
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Delivered straight to your hotel or residence in Butuan City.
                      </span>
                    </button>
                  </div>
                </div>

                {/* Custom Delivery Address Input if Delivery selected */}
                {handoverMethod === "delivery" && (
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="rent-delivery-addr" className="text-xs font-semibold text-foreground">
                        Delivery Address in Butuan City
                      </label>
                      <input
                        id="rent-delivery-addr"
                        type="text"
                        value={customDeliveryAddress}
                        onChange={(e) => setCustomDeliveryAddress(e.target.value)}
                        placeholder="e.g. Hotel Obrero, Montilla Blvd, Butuan City..."
                        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    {handoverRoute && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/80 text-xs">
                        <div className="flex items-center gap-2">
                          <HugeiconsIcon icon={Location01Icon} size={15} className="text-primary shrink-0" />
                          <div>
                            <span className="font-semibold text-foreground block">
                              Road Distance from Provider: {handoverRoute.distanceKm} km
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              Estimated handover transit: ~{handoverRoute.durationMin} mins from {selectedItem.pickupAddress}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {handoverRoute.isFallback ? "Grid Estimate" : "OSRM Routing"}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Continue button */}
                <div className="pt-2 flex justify-end">
                  <Button
                    type="button"
                    onClick={handleNextFromStep2}
                    disabled={Boolean(currentAvailability && !currentAvailability.isAvailable)}
                    className="w-full sm:w-auto font-semibold shadow-xs gap-2"
                  >
                    <span>Review Rental Order</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 3: Review Order */}
          {currentStep === 3 && (
            <Card className="border-border bg-card shadow-xs">
              <CardContent className="p-5 sm:p-6 flex flex-col gap-6">
                <div>
                  <h2 className="font-heading text-base font-bold text-foreground">
                    3. Review Rental Order
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Please verify your reservation details, provider terms, and estimated costs.
                  </p>
                </div>

                {/* Summary Table */}
                <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/20 p-4 text-xs">
                  <div className="flex items-start justify-between pb-3 border-b border-border/60">
                    <span className="text-muted-foreground">Listing Item</span>
                    <span className="font-semibold text-foreground text-right">
                      {selectedItem.title}
                    </span>
                  </div>

                  <div className="flex items-start justify-between pb-3 border-b border-border/60">
                    <span className="text-muted-foreground">Verified Provider</span>
                    <span className="font-semibold text-foreground">
                      {selectedItem.provider.businessName} (★ {selectedItem.provider.rating})
                    </span>
                  </div>

                  <div className="flex items-start justify-between pb-3 border-b border-border/60">
                    <span className="text-muted-foreground">Rental Location</span>
                    <span className="font-semibold text-primary">
                      {ACTIVE_SERVICE_AREA.label}
                    </span>
                  </div>

                  <div className="flex items-start justify-between pb-3 border-b border-border/60">
                    <span className="text-muted-foreground">Rental Period</span>
                    <span className="font-semibold text-foreground">
                      {startDate} to {endDate} ({estimate.durationDays} day{estimate.durationDays > 1 ? "s" : ""})
                    </span>
                  </div>

                  <div className="flex items-start justify-between pb-3 border-b border-border/60">
                    <span className="text-muted-foreground">Handover Method</span>
                    <span className="font-semibold text-foreground">
                      {handoverMethod === "pickup"
                        ? `Pickup at ${selectedItem.pickupAddress}`
                        : `Delivery to ${customDeliveryAddress || "Butuan City Address"}`}
                    </span>
                  </div>

                  <div className="flex items-start justify-between">
                    <span className="text-muted-foreground">Security Deposit</span>
                    <span className="font-semibold text-foreground">
                      ₱{selectedItem.securityDeposit.toLocaleString()} (Refundable upon inspection)
                    </span>
                  </div>
                </div>

                {/* Price Breakdown Component */}
                <PriceSummary
                  items={[
                    {
                      label: `Daily Rate (₱${selectedItem.pricePerDay.toLocaleString()} × ${estimate.durationDays} day${estimate.durationDays > 1 ? "s" : ""})`,
                      amount: estimate.rentalFee,
                    },
                    {
                      label: "Security Deposit (Refundable)",
                      amount: estimate.securityDeposit,
                      subtitle: "Held by provider during rental, returned on check-in inspection",
                    },
                  ]}
                  totalAmount={estimate.estimatedTotal}
                  totalLabel="Estimated Total (Rent + Deposit)"
                />

                {/* Confirmed Fleet Allocation Notice */}
                {currentAvailability && currentAvailability.isAvailable && (
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-foreground">
                    <div className="flex items-center gap-2">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} className="text-primary shrink-0" />
                      <div>
                        <span className="font-bold block">Vehicle Unit Allocation Verified</span>
                        <span className="text-[11px] text-muted-foreground">
                          {currentAvailability.availableUnits} of {currentAvailability.totalUnits} physical units free for your reservation window.
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-[10px] uppercase font-bold">
                      Secured on Submit
                    </Badge>
                  </div>
                )}

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
                    <span>Back to Schedule</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleConfirmRental}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto font-semibold shadow-xs gap-2"
                  >
                    {isSubmitting ? (
                      <span>Processing Request...</span>
                    ) : (
                      <>
                        <HugeiconsIcon icon={Key01Icon} size={16} />
                        <span>Confirm Rental Request</span>
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
            serviceType="rental"
            title={selectedItem.title}
            pickupAddress={selectedItem.pickupAddress}
            date={`${startDate} to ${endDate}`}
            vehicleOrItemName={`Category: ${selectedItem.category.toUpperCase()}`}
            riderOrProviderName={selectedItem.provider.businessName}
            riderRating={selectedItem.provider.rating}
            isVerified={selectedItem.provider.isVerified}
            estimatedTotal={estimate.estimatedTotal}
            totalLabel="Estimated Total"
            showActions={false}
          />
        </div>
      </div>
    </div>
  )
}

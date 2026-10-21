"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { PinLocation01Icon } from "@hugeicons/core-free-icons"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { AdminDetailSheet } from "@/components/admin/admin-detail-sheet"
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MOCK_BUTUAN_RENTAL_LISTINGS,
  type ButuanRentalItem,
} from "@/lib/mock-data/butuan-rental-listings"
import { VerifiedBadge } from "@/components/common/verified-badge"

export default function AdminRentalsPage() {
  const [listings, setListings] = React.useState<ButuanRentalItem[]>(MOCK_BUTUAN_RENTAL_LISTINGS)
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [selectedItem, setSelectedItem] = React.useState<ButuanRentalItem | null>(null)

  const [dialogState, setDialogState] = React.useState<{
    isOpen: boolean
    action: "approve" | "suspend" | "unavailable"
    item: ButuanRentalItem | null
  }>({
    isOpen: false,
    action: "approve",
    item: null,
  })

  const filteredListings = React.useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.provider.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.pickupAddress || "").toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter
      const matchesStatus = statusFilter === "all" || item.status === statusFilter

      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [listings, searchQuery, categoryFilter, statusFilter])

  const handleExecuteAction = () => {
    if (!dialogState.item) return
    const targetId = dialogState.item.id

    setListings((prev) =>
      prev.map((l) => {
        if (l.id === targetId) {
          if (dialogState.action === "approve") {
            return { ...l, status: "available" }
          }
          if (dialogState.action === "suspend") {
            return { ...l, status: "inactive" }
          }
          if (dialogState.action === "unavailable") {
            return { ...l, status: "maintenance" }
          }
        }
        return l
      })
    )

    if (selectedItem?.id === targetId) {
      setSelectedItem((prev) =>
        prev
          ? {
              ...prev,
              status:
                dialogState.action === "approve"
                  ? "available"
                  : dialogState.action === "suspend"
                  ? "inactive"
                  : "maintenance",
            }
          : null
      )
    }

    setDialogState({ isOpen: false, action: "approve", item: null })
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Rental Service Catalog"
        badgeText="Rental Operations"
        description="Inspect registered passenger vans, motorbikes, power tools, and sound equipment hosted in Butuan City."
      />

      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search rental listing, host, or location..."
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        categoryOptions={[
          { id: "all", label: "All Categories" },
          { id: "vehicle", label: "Vehicles" },
          { id: "equipment", label: "Equipment" },
        ]}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { id: "all", label: "All Statuses" },
          { id: "available", label: "Available" },
          { id: "rented", label: "Rented" },
          { id: "maintenance", label: "Maintenance" },
          { id: "inactive", label: "Inactive" },
        ]}
        totalResults={filteredListings.length}
        onResetFilters={() => {
          setSearchQuery("")
          setCategoryFilter("all")
          setStatusFilter("all")
        }}
      />

      {/* Grid of Listings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredListings.map((item) => (
          <Card
            key={item.id}
            className="group overflow-hidden border-border/80 bg-card hover:border-primary/40 shadow-xs flex flex-col justify-between"
          >
            <CardContent className="p-0 flex flex-col h-full">
              {/* Image & Badges */}
              <div className="relative h-40 w-full overflow-hidden bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2.5 left-2.5">
                  <Badge className="bg-background/90 text-foreground text-[10px] uppercase font-bold border border-border">
                    {item.category}
                  </Badge>
                </div>
                <div className="absolute top-2.5 right-2.5">
                  <AdminStatusBadge status={item.status} />
                </div>
                <div className="absolute bottom-2.5 right-2.5 bg-black/80 px-2 py-0.5 rounded text-white text-xs font-mono font-bold">
                  ₱{item.pricePerDay.toLocaleString()}/day
                </div>
              </div>

              {/* Body */}
              <div className="p-4 flex flex-col gap-3 flex-1 justify-between text-xs">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-heading font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <span className="text-amber-500 font-bold shrink-0">
                      ★ {item.rating.toFixed(1)}
                    </span>
                  </div>

                  <p className="text-muted-foreground line-clamp-2 text-[11px]">
                    {item.description}
                  </p>

                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                    <HugeiconsIcon icon={PinLocation01Icon} size={13} className="text-primary shrink-0" />
                    <span className="truncate">{item.pickupAddress}</span>
                  </div>
                </div>

                {/* Host info & action */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/60">
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] text-muted-foreground uppercase">Host</span>
                    <span className="font-semibold text-foreground flex items-center gap-1 truncate">
                      <span className="truncate">{item.provider.businessName}</span>
                      <VerifiedBadge role="provider" isVerified={item.provider.isVerified} size="sm" />
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedItem(item)}
                      className="h-7 text-[11px] px-2 font-semibold"
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Item Management Sheet */}
      <AdminDetailSheet
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.title || "Listing Details"}
        subtitle={`ID: ${selectedItem?.id} • Category: ${selectedItem?.category?.toUpperCase()}`}
        footerActions={
          selectedItem && (
            <div className="flex items-center gap-2">
              {selectedItem.status !== "available" && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    setDialogState({ isOpen: true, action: "approve", item: selectedItem })
                  }
                  className="text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Approve / Set Available
                </Button>
              )}
              {selectedItem.status !== "inactive" && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    setDialogState({ isOpen: true, action: "suspend", item: selectedItem })
                  }
                  className="text-xs font-semibold"
                >
                  Suspend Listing
                </Button>
              )}
              {selectedItem.status === "available" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDialogState({ isOpen: true, action: "unavailable", item: selectedItem })
                  }
                  className="text-xs font-semibold"
                >
                  Mark Under Maintenance
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedItem(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          )
        }
      >
        {selectedItem && (
          <div className="flex flex-col gap-5 text-xs">
            {/* Image */}
            <div className="h-44 w-full rounded-xl overflow-hidden bg-muted relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedItem.images[0]}
                alt={selectedItem.title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Pricing and status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-border/80 bg-muted/20 flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Daily Rental Rate
                </span>
                <span className="font-heading text-lg font-bold text-foreground">
                  ₱{selectedItem.pricePerDay.toLocaleString()}/day
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Deposit: ₱{selectedItem.securityDeposit.toLocaleString()}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-border/80 bg-muted/20 flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Listing Status
                </span>
                <div className="mt-1">
                  <AdminStatusBadge status={selectedItem.status} />
                </div>
              </div>
            </div>

            {/* Provider Info */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-card flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                Verified Provider
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-foreground text-sm">
                  {selectedItem.provider.businessName}
                </span>
                <VerifiedBadge role="provider" isVerified={selectedItem.provider.isVerified} size="sm" />
              </div>
              <span className="text-muted-foreground text-[11px] flex items-center gap-1 flex-wrap">
                <span>Host: {selectedItem.provider.name}</span>
                <VerifiedBadge role="provider" isVerified={selectedItem.provider.isVerified} size="sm" />
                <span>• Rating: ★ {selectedItem.provider.rating}</span>
              </span>
            </div>

            {/* Features */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-card flex flex-col gap-2">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                Equipment Features
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedItem.features.map((feat, idx) => (
                  <span
                    key={idx}
                    className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-foreground font-medium"
                  >
                    {feat}
                  </span>
                ))}
              </div>
            </div>

            {/* Terms and Requirements */}
            <div className="p-3.5 rounded-xl border border-border/80 bg-card flex flex-col gap-2">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                Terms & Requirements
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {selectedItem.termsAndConditions || "Standard HitsNaGo rental agreement."}
              </p>
            </div>
          </div>
        )}
      </AdminDetailSheet>

      {/* Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={dialogState.isOpen}
        title={
          dialogState.action === "approve"
            ? `Approve ${dialogState.item?.title}?`
            : dialogState.action === "suspend"
            ? `Suspend ${dialogState.item?.title}?`
            : `Set Maintenance for ${dialogState.item?.title}?`
        }
        description={`This action will update the listing availability for customers searching in Butuan City.`}
        variant={dialogState.action === "suspend" ? "destructive" : "primary"}
        confirmLabel={
          dialogState.action === "approve"
            ? "Approve Listing"
            : dialogState.action === "suspend"
            ? "Suspend Listing"
            : "Set Maintenance"
        }
        onConfirm={handleExecuteAction}
        onCancel={() => setDialogState({ isOpen: false, action: "approve", item: null })}
      />
    </div>
  )
}

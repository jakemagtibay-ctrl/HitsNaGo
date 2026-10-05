"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PinLocation01Icon,
  CallIcon,
  Mail01Icon,
} from "@hugeicons/core-free-icons"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { AdminDetailSheet } from "@/components/admin/admin-detail-sheet"
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MOCK_ADMIN_USERS, type AdminUserRecord } from "@/lib/mock-data/admin-data"
import type { UserRole } from "@/types/user"

interface AdminUsersViewProps {
  initialRoleFilter?: "all" | UserRole
  pageTitle: string
  pageDescription: string
}

export function AdminUsersView({
  initialRoleFilter = "all",
  pageTitle,
  pageDescription,
}: AdminUsersViewProps) {
  const [users, setUsers] = React.useState<AdminUserRecord[]>(MOCK_ADMIN_USERS)
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [roleFilter, setRoleFilter] = React.useState<string>(initialRoleFilter)
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [selectedUser, setSelectedUser] = React.useState<AdminUserRecord | null>(null)

  // Dialog state
  const [dialogState, setDialogState] = React.useState<{
    isOpen: boolean
    type: "verify" | "suspend" | "activate"
    user: AdminUserRecord | null
  }>({
    isOpen: false,
    type: "verify",
    user: null,
  })

  // Filtered users
  const filteredUsers = React.useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.phone.includes(searchQuery) ||
        u.barangay.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesRole = roleFilter === "all" || u.role === roleFilter
      const matchesStatus =
        statusFilter === "all" ||
        u.accountStatus === statusFilter ||
        u.verificationStatus === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchQuery, roleFilter, statusFilter])

  // Frontend mock actions
  const handleConfirmAction = () => {
    if (!dialogState.user) return

    const targetId = dialogState.user.id
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === targetId) {
          if (dialogState.type === "verify") {
            return { ...u, verificationStatus: "verified" }
          }
          if (dialogState.type === "suspend") {
            return { ...u, accountStatus: "suspended" }
          }
          if (dialogState.type === "activate") {
            return { ...u, accountStatus: "active" }
          }
        }
        return u
      })
    )

    // Update selectedUser if open in sheet
    if (selectedUser?.id === targetId) {
      setSelectedUser((prev) =>
        prev
          ? {
              ...prev,
              verificationStatus:
                dialogState.type === "verify" ? "verified" : prev.verificationStatus,
              accountStatus:
                dialogState.type === "suspend"
                  ? "suspended"
                  : dialogState.type === "activate"
                  ? "active"
                  : prev.accountStatus,
            }
          : null
      )
    }

    setDialogState({ isOpen: false, type: "verify", user: null })
  }

  return (
    <div className="flex flex-col gap-6">
      {pageTitle && (
        <div className="sr-only">
          <h2>{pageTitle}</h2>
          {pageDescription && <p>{pageDescription}</p>}
        </div>
      )}
      {/* Filter and Search Bar */}
      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name, email, phone, or Butuan barangay..."
        categoryFilter={roleFilter}
        onCategoryChange={setRoleFilter}
        categoryOptions={[
          { id: "all", label: "All Roles" },
          { id: "customer", label: "Customers" },
          { id: "rider", label: "Riders" },
          { id: "provider", label: "Providers" },
        ]}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { id: "all", label: "All Statuses" },
          { id: "active", label: "Active" },
          { id: "pending", label: "Pending" },
          { id: "suspended", label: "Suspended" },
          { id: "verified", label: "Verified" },
        ]}
        totalResults={filteredUsers.length}
        onResetFilters={() => {
          setSearchQuery("")
          setRoleFilter(initialRoleFilter)
          setStatusFilter("all")
        }}
      />

      {/* Users Data Table */}
      <Card className="border-border/80 bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Location (Butuan)</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Trips / Rating</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    {/* User name & avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="size-8 rounded-full object-cover shrink-0"
                        />
                        <div className="flex flex-col">
                          <span className="font-heading font-bold text-foreground text-xs group-hover:text-primary transition-colors">
                            {user.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-foreground">
                        {user.role}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Brgy. {user.barangay}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        Butuan City
                      </span>
                    </td>

                    {/* Verification */}
                    <td className="py-3.5 px-4">
                      <AdminStatusBadge status={user.verificationStatus} />
                    </td>

                    {/* Account Status */}
                    <td className="py-3.5 px-4">
                      <AdminStatusBadge status={user.accountStatus} />
                    </td>

                    {/* Trips & Rating */}
                    <td className="py-3.5 px-4 text-foreground font-mono">
                      <div>
                        {user.completedTripsCount || 0} completed
                      </div>
                      {user.rating ? (
                        <span className="text-amber-500 font-bold text-[11px]">
                          ★ {user.rating.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">N/A</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUser(user)}
                          className="h-7 text-[11px] px-2 font-semibold"
                        >
                          Details
                        </Button>

                        {user.accountStatus === "active" ? (
                          <button
                            type="button"
                            onClick={() =>
                              setDialogState({ isOpen: true, type: "suspend", user })
                            }
                            className="h-7 rounded-lg border border-destructive/30 px-2 text-[11px] font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setDialogState({ isOpen: true, type: "activate", user })
                            }
                            className="h-7 rounded-lg border border-emerald-500/30 px-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* User Detail Slide-Over Sheet */}
      <AdminDetailSheet
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
        title={selectedUser?.name || "User Details"}
        subtitle={`ID: ${selectedUser?.id} • Butuan City, Agusan del Norte`}
        footerActions={
          selectedUser && (
            <div className="flex items-center gap-2">
              {selectedUser.verificationStatus !== "verified" && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setDialogState({ isOpen: true, type: "verify", user: selectedUser })
                  }}
                  className="text-xs font-semibold"
                >
                  Verify User
                </Button>
              )}
              {selectedUser.accountStatus === "active" ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDialogState({ isOpen: true, type: "suspend", user: selectedUser })
                  }}
                  className="text-xs font-semibold"
                >
                  Suspend Account
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setDialogState({ isOpen: true, type: "activate", user: selectedUser })
                  }}
                  className="text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Activate Account
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedUser(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          )
        }
      >
        {selectedUser && (
          <div className="flex flex-col gap-6 text-xs">
            {/* User profile card */}
            <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedUser.avatarUrl}
                alt={selectedUser.name}
                className="size-16 rounded-2xl object-cover shrink-0"
              />
              <div className="flex flex-col gap-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <h4 className="font-heading text-base font-bold text-foreground">
                    {selectedUser.name}
                  </h4>
                  <Badge variant="outline" className="text-[10px] font-bold uppercase">
                    {selectedUser.role}
                  </Badge>
                </div>
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <HugeiconsIcon icon={Mail01Icon} size={13} />
                  {selectedUser.email}
                </span>
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <HugeiconsIcon icon={CallIcon} size={13} />
                  {selectedUser.phone}
                </span>
              </div>
            </div>

            {/* Status overview */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-border/70 bg-card flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Verification Status
                </span>
                <div>
                  <AdminStatusBadge status={selectedUser.verificationStatus} />
                </div>
              </div>

              <div className="p-3 rounded-xl border border-border/70 bg-card flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Account Status
                </span>
                <div>
                  <AdminStatusBadge status={selectedUser.accountStatus} />
                </div>
              </div>
            </div>

            {/* Geographical Location */}
            <div className="p-4 rounded-xl border border-border/70 bg-card flex flex-col gap-2">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                Operational Residence (Butuan City)
              </span>
              <div className="flex items-start gap-2 text-foreground font-medium">
                <HugeiconsIcon icon={PinLocation01Icon} size={15} className="text-primary shrink-0 mt-0.5" />
                <span>
                  Barangay {selectedUser.barangay}, {selectedUser.location}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground">
                Registered service member under Butuan City local platform network.
              </span>
            </div>

            {/* Specific details by role */}
            {selectedUser.role === "rider" && (
              <div className="p-4 rounded-xl border border-border/70 bg-card flex flex-col gap-2">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Vehicle & Telemetry
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Model</span>
                    <strong className="text-foreground">{selectedUser.vehicleModel || "Motorcycle"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Plate Number</span>
                    <strong className="text-foreground font-mono">{selectedUser.plateNumber || "N/A"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Lifetime Trips</span>
                    <strong className="text-foreground">{selectedUser.completedTripsCount}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Driver Rating</span>
                    <strong className="text-amber-500 font-bold">★ {selectedUser.rating || "5.0"}</strong>
                  </div>
                </div>
              </div>
            )}

            {selectedUser.role === "provider" && (
              <div className="p-4 rounded-xl border border-border/70 bg-card flex flex-col gap-2">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Business Entity
                </span>
                <span className="text-sm font-bold text-foreground">
                  {selectedUser.businessName}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Joined platform on {selectedUser.joinedDate} • {selectedUser.completedTripsCount} fulfilled rentals
                </span>
              </div>
            )}
          </div>
        )}
      </AdminDetailSheet>

      {/* Confirmation Dialog */}
      <AdminConfirmDialog
        isOpen={dialogState.isOpen}
        title={
          dialogState.type === "verify"
            ? `Verify ${dialogState.user?.name}?`
            : dialogState.type === "suspend"
            ? `Suspend ${dialogState.user?.name}?`
            : `Activate ${dialogState.user?.name}?`
        }
        description={
          dialogState.type === "verify"
            ? `This will grant verified badge and full operational privileges in Butuan City to ${dialogState.user?.name}.`
            : dialogState.type === "suspend"
            ? `This will temporarily pause ${dialogState.user?.name}'s ability to book, accept rides, or rent services on HitsNaGo.`
            : `This will restore full active platform access for ${dialogState.user?.name}.`
        }
        variant={dialogState.type === "suspend" ? "destructive" : "primary"}
        confirmLabel={
          dialogState.type === "verify"
            ? "Verify Account"
            : dialogState.type === "suspend"
            ? "Suspend User"
            : "Activate Account"
        }
        onConfirm={handleConfirmAction}
        onCancel={() => setDialogState({ isOpen: false, type: "verify", user: null })}
      />
    </div>
  )
}

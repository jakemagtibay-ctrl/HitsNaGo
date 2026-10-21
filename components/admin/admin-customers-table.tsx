"use client"

// Admin table listing registered customer accounts, booking totals, and join dates
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"

import {
  Search01Icon,
  RefreshIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { AdminCustomerItem } from "@/lib/actions/admin"
import { getAllCustomers } from "@/lib/actions/admin"

interface AdminCustomersTableProps {
  initialCustomers: AdminCustomerItem[]
}

export function AdminCustomersTable({ initialCustomers }: AdminCustomersTableProps) {
  const [customers, setCustomers] = React.useState<AdminCustomerItem[]>(initialCustomers)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const updated = await getAllCustomers()
      setCustomers(updated)
    } finally {
      setIsRefreshing(false)
    }
  }

  const filteredCustomers = React.useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase()
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      )
    })
  }, [customers, searchQuery])

  return (
    <div className="flex flex-col gap-4">
      {/* Search box & Refresh */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name or email..."
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-9 px-2.5 text-xs gap-1.5"
          title="Refresh table"
        >
          <HugeiconsIcon icon={RefreshIcon} size={14} className={isRefreshing ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Table */}
      <Card className="border-border/80 bg-card shadow-xs overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-right">Number of Bookings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <HugeiconsIcon icon={UserGroupIcon} size={28} className="opacity-40" />
                      <p className="font-semibold text-foreground">No customers found</p>
                      <p className="text-[11px]">
                        {searchQuery
                          ? "Try clearing your search query."
                          : "No customer accounts or bookings yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c.id || c.email} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs uppercase">
                          {c.name.charAt(0) || "C"}
                        </div>
                        <span className="font-heading font-bold text-foreground text-xs">
                          {c.name}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-muted-foreground font-mono text-[11px]">
                        {c.email}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Badge
                        variant="outline"
                        className={
                          c.bookingsCount > 0
                            ? "border-primary/30 bg-primary/10 text-primary font-semibold text-[11px] font-mono"
                            : "border-border bg-muted/30 text-muted-foreground font-normal text-[11px] font-mono"
                        }
                      >
                        {c.bookingsCount} {c.bookingsCount === 1 ? "booking" : "bookings"}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

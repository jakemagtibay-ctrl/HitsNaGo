"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Calendar01Icon,
  Coins01Icon,
  Motorbike01Icon,
  Key01Icon,
  CheckmarkCircle01Icon,
  Download01Icon,
} from "@hugeicons/core-free-icons"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { AdminChartCard } from "@/components/admin/admin-chart-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getAdminFinancialReport, type FinancialReportData } from "@/lib/actions/admin"

export default function AdminReportsPage() {
  const [activeTimeframe, setActiveTimeframe] = React.useState<"today" | "7d" | "30d" | "3m">("30d")
  const [reportData, setReportData] = React.useState<FinancialReportData>({
    totalRevenue: 0,
    totalBookings: 0,
    completedRides: 0,
    rentalTransactions: 0,
    deliveries: 0,
    cancellations: 0,
    disputes: 0,
    chartData: [],
    bookings: [],
  })
  const [isLoading, setIsLoading] = React.useState<boolean>(true)

  React.useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    getAdminFinancialReport(activeTimeframe)
      .then((data) => {
        if (!cancelled) {
          setReportData(data)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        console.error("Failed to load report data:", err)
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activeTimeframe])

  const handleExportCsv = () => {
    if (!reportData || !reportData.bookings || reportData.bookings.length === 0) {
      alert("No booking records available to export for the selected period.")
      return
    }

    const headers = [
      "Booking Reference",
      "Service Type",
      "Customer Name",
      "Customer Email",
      "Pickup Location",
      "Destination",
      "Scheduled At",
      "Status",
      "Fare (PHP)",
      "Created At",
    ]
    const rows = reportData.bookings.map((b) => [
      `"${b.reference.replace(/"/g, '""')}"`,
      `"${b.service_type}"`,
      `"${(b.customer_name || "").replace(/"/g, '""')}"`,
      `"${(b.customer_email || "").replace(/"/g, '""')}"`,
      `"${(b.pickup || "").replace(/"/g, '""')}"`,
      `"${(b.destination || "").replace(/"/g, '""')}"`,
      `"${b.scheduled_at}"`,
      `"${b.status}"`,
      b.estimated_fare,
      `"${b.created_at}"`,
    ])

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `hitsnago-report-${activeTimeframe}-${new Date().toISOString().slice(0, 10)}.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Reports & Financial Analytics"
        badgeText="Intelligence"
        description="Comprehensive volume, gross receipts, and operational performance for Butuan City, Agusan del Norte."
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExportCsv}
          disabled={isLoading || reportData.bookings.length === 0}
          className="text-xs font-semibold gap-1.5"
        >
          <HugeiconsIcon icon={Download01Icon} size={14} />
          <span>Export Summary (CSV)</span>
        </Button>
      </AdminPageHeader>

      {/* Timeframe Filters */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3">
        <span className="text-xs font-bold text-muted-foreground mr-1 flex items-center gap-1">
          <HugeiconsIcon icon={Calendar01Icon} size={14} />
          Period:
        </span>
        {(
          [
            { id: "today", label: "Today" },
            { id: "7d", label: "Last 7 Days" },
            { id: "30d", label: "Last 30 Days" },
            { id: "3m", label: "Last 3 Months" },
          ] as const
        ).map((tf) => (
          <button
            key={tf.id}
            type="button"
            onClick={() => setActiveTimeframe(tf.id)}
            className={cn(
              "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all",
              activeTimeframe === tf.id
                ? "bg-primary text-primary-foreground shadow-xs"
                : "border border-border/60 bg-card text-muted-foreground hover:bg-muted"
            )}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          title="Gross Revenue"
          value={`₱${reportData.totalRevenue.toLocaleString("en-PH")}`}
          subtitle="Processed platform volume"
          icon={Coins01Icon}
          variant="primary"
        />
        <AdminStatCard
          title="Total Completed Trips"
          value={reportData.totalBookings}
          subtitle="Across all services"
          icon={CheckmarkCircle01Icon}
        />
        <AdminStatCard
          title="Passenger Rides"
          value={reportData.completedRides}
          subtitle="Motorcycle & sedan transit"
          icon={Motorbike01Icon}
        />
        <AdminStatCard
          title="Rentals & Deliveries"
          value={reportData.rentalTransactions + reportData.deliveries}
          subtitle={`${reportData.rentalTransactions} rentals • ${reportData.deliveries} courier`}
          icon={Key01Icon}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <AdminChartCard
            title={`Revenue Trend (${activeTimeframe.toUpperCase()})`}
            subtitle="Financial flow across Butuan City operations"
            type="bar"
            unit="₱"
            totalDisplay={`₱${reportData.totalRevenue.toLocaleString("en-PH")}`}
            data={reportData.chartData}
          />
        </div>

        <div className="lg:col-span-4">
          <AdminChartCard
            title="Service Volume Breakdown"
            subtitle="Proportion of bookings by vertical"
            type="distribution"
            unit=""
            totalDisplay={`${reportData.totalBookings} Trips`}
            data={[
              { label: "Ride Transport", value: reportData.completedRides, secondaryValue: `${reportData.completedRides} trips` },
              { label: "Rental Equipment", value: reportData.rentalTransactions, secondaryValue: `${reportData.rentalTransactions} orders` },
              { label: "Courier Logistics", value: reportData.deliveries, secondaryValue: `${reportData.deliveries} parcels` },
            ]}
          />
        </div>
      </div>

      {/* Quality & Risk Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/80 bg-card shadow-xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">
              Cancellation Rate
            </span>
            <span className="font-heading text-xl font-bold text-foreground">
              {((reportData.cancellations / Math.max(reportData.totalBookings, 1)) * 100).toFixed(1)}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              {reportData.cancellations} cancelled trips in period
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">
              Dispute Ratio
            </span>
            <span className="font-heading text-xl font-bold text-foreground">
              {((reportData.disputes / Math.max(reportData.totalBookings, 1)) * 100).toFixed(2)}%
            </span>
            <span className="text-[11px] text-muted-foreground">
              {reportData.disputes} mediation incidents
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card shadow-xs">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">
              Service Territory
            </span>
            <span className="font-heading text-xl font-bold text-primary">
              Butuan City (100%)
            </span>
            <span className="text-[11px] text-muted-foreground">
              Exclusively Caraga Region XIII
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

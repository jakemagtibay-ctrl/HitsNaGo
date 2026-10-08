"use client"

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { StarIcon } from "@hugeicons/core-free-icons"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminFilterBar } from "@/components/admin/admin-filter-bar"
import { AdminStatusBadge } from "@/components/admin/admin-status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export interface AdminReviewRecord {
  id: string
  bookingId: string
  bookingReference: string
  customerName: string
  targetName: string
  targetRole: string
  targetType: "rider" | "rental_provider"
  rating: number
  comment: string
  status: "published" | "flagged" | "hidden"
  date: string
  createdAt: string
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = React.useState<AdminReviewRecord[]>([])
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [ratingFilter, setRatingFilter] = React.useState<string>("all")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")

  const filteredReviews = React.useMemo(() => {
    return reviews.filter((r) => {
      const matchesSearch =
        r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.targetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.comment.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesRating = ratingFilter === "all" || r.rating.toString() === ratingFilter
      const matchesStatus = statusFilter === "all" || r.status === statusFilter

      return matchesSearch && matchesRating && matchesStatus
    })
  }, [reviews, searchQuery, ratingFilter, statusFilter])

  const toggleFlagStatus = (id: string) => {
    setReviews((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return {
            ...r,
            status: r.status === "flagged" ? "published" : "flagged",
          }
        }
        return r
      })
    )
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      <AdminPageHeader
        title="Ratings & Reviews Moderation"
        badgeText="Community Quality"
        description="Audit passenger and provider ratings across Butuan City. Review flagged comments and address negative feedback."
      />

      <AdminFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search review comment, reviewer, or driver..."
        categoryFilter={ratingFilter}
        onCategoryChange={setRatingFilter}
        categoryOptions={[
          { id: "all", label: "All Stars" },
          { id: "5", label: "5 Stars" },
          { id: "4", label: "4 Stars" },
          { id: "3", label: "3 Stars" },
          { id: "2", label: "2 Stars" },
          { id: "1", label: "1 Star" },
        ]}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { id: "all", label: "All Statuses" },
          { id: "published", label: "Published" },
          { id: "flagged", label: "Flagged" },
        ]}
        totalResults={filteredReviews.length}
        onResetFilters={() => {
          setSearchQuery("")
          setRatingFilter("all")
          setStatusFilter("all")
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReviews.map((rev) => (
          <Card key={rev.id} className="border-border/80 bg-card shadow-xs">
            <CardContent className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-foreground text-xs">
                    {rev.customerName}
                  </span>
                  <span className="text-[10px] text-muted-foreground">&rarr;</span>
                  <span className="font-semibold text-primary text-xs">
                    {rev.targetName} ({rev.targetRole})
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-amber-500 font-bold text-xs flex items-center gap-0.5">
                    <HugeiconsIcon icon={StarIcon} size={14} />
                    {rev.rating}
                  </span>
                  <AdminStatusBadge status={rev.status} />
                </div>
              </div>

              <p className="text-xs text-foreground bg-muted/30 p-3 rounded-xl border border-border/50 italic leading-relaxed">
                &quot;{rev.comment}&quot;
              </p>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/50">
                <span>Trip #{rev.bookingId} • {rev.date}</span>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleFlagStatus(rev.id)}
                  className="h-7 text-[11px] font-semibold"
                >
                  {rev.status === "flagged" ? "Unflag Review" : "Flag for Review"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

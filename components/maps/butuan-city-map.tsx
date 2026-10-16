"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { HugeiconsIcon } from "@hugeicons/react"
import { Location01Icon } from "@hugeicons/core-free-icons"
import { Card } from "@/components/ui/card"
import type { ButuanCityMapProps } from "./types"

/**
 * Skeleton fallback rendered while Leaflet JS bundle loads on client
 */
function MapLoadingSkeleton({ height = "440px", title }: { height?: string; title?: string }) {
  return (
    <Card
      style={{ height, minHeight: "320px" }}
      className="relative flex flex-col items-center justify-center overflow-hidden border border-border/70 bg-muted/30 p-6 text-center shadow-xs"
    >
      <div className="absolute inset-0 bg-radial from-primary/5 via-transparent to-transparent animate-pulse" />
      <div className="relative z-10 flex flex-col items-center gap-3 max-w-sm">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm animate-bounce">
          <HugeiconsIcon icon={Location01Icon} size={28} />
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="font-heading text-sm sm:text-base font-bold text-foreground">
            {title || "Loading Butuan City Interactive Map..."}
          </h4>
          <p className="text-xs text-muted-foreground">
            Initializing OpenStreetMap tiles for Agusan del Norte, Caraga Region...
          </p>
        </div>
      </div>
    </Card>
  )
}

/**
 * Dynamically imported Leaflet map component with SSR disabled
 */
const DynamicLeafletMap = dynamic(
  () => import("./leaflet-map-view").then((mod) => mod.LeafletMapView),
  {
    ssr: false,
    loading: ({ error }) => {
      if (error) {
        return (
          <Card className="p-6 text-center text-xs text-destructive bg-destructive/10 border-destructive/20">
            Failed to initialize map library. Please refresh the page.
          </Card>
        )
      }
      return <MapLoadingSkeleton />
    },
  }
)

/**
 * Primary Reusable Butuan City Map Component
 * Safe for use in both Server and Client subtrees.
 */
export function ButuanCityMap(props: ButuanCityMapProps) {
  return <DynamicLeafletMap {...props} />
}

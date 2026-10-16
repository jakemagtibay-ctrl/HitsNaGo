/**
 * HitsNaGo Rental Availability Pure Domain Utilities
 * Computes interval overlaps and availability states without server action overhead
 */

/**
 * Helper to test if two date ranges overlap [startA, endA] and [startB, endB]
 * Standard interval arithmetic: startA <= endB AND endA >= startB
 */
export function doDateRangesOverlap(
  startA: Date | string,
  endA: Date | string,
  startB: Date | string,
  endB: Date | string
): boolean {
  const sA = new Date(startA).getTime()
  const eA = new Date(endA).getTime()
  const sB = new Date(startB).getTime()
  const eB = new Date(endB).getTime()

  return sA <= eB && eA >= sB
}

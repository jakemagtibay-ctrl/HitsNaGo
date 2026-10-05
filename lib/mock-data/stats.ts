export const mockCustomerStats = {
  activeBookingsCount: 1,
  upcomingCount: 1,
  completedCount: 18,
  cancelledCount: 1,
  totalSpent: 8450,
  currency: "PHP",
}

export const mockRiderStats = {
  isOnline: true,
  todayRidesCount: 7,
  activeRideCount: 1,
  todayEarnings: 1280,
  weekEarnings: 6450,
  monthEarnings: 24800,
  currency: "PHP",
  rating: 4.92,
  totalRatingsCount: 148,
  acceptanceRate: 98,
}

export const mockProviderStats = {
  activeListingsCount: 4,
  pendingBookingsCount: 2,
  upcomingRentalsCount: 3,
  monthlyEarnings: 38500,
  weekEarnings: 9400,
  todayEarnings: 2800,
  currency: "PHP",
  rating: 4.88,
  totalRatingsCount: 92,
  occupancyRate: 82,
}

export const mockAdminStats = {
  totalUsers: 1420,
  activeUsers: 890,
  totalBookings: 3840,
  completedBookings: 3620,
  totalPlatformRevenue: 486200,
  monthlyRevenue: 98400,
  pendingVerifications: 14,
  currency: "PHP",
  serviceBreakdown: {
    rides: 2410,
    rentals: 580,
    deliveries: 850,
  },
  userBreakdown: {
    customers: 1120,
    riders: 185,
    providers: 108,
    admins: 7,
  },
  systemHealth: {
    serverStatus: "operational" as const,
    apiUptime: "99.98%",
    activeSockets: 342,
    lastBackupTime: "2026-10-05T04:00:00Z",
  },
}

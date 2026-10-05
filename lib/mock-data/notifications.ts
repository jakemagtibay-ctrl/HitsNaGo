import type { Notification } from "@/types/notification"

export const mockNotifications: Notification[] = [
  {
    id: "notif_001",
    userId: "user_cust_01",
    type: "booking",
    title: "Ride in Progress",
    message: "Rider Danilo Reyes is en route to Libertad Public Market, Butuan City.",
    data: {
      bookingId: "bk_ride_101",
      serviceType: "ride",
      actionUrl: "/dashboard/customer",
    },
    isRead: false,
    createdAt: "2026-10-05T15:20:00Z",
  },
  {
    id: "notif_002",
    userId: "user_prov_01",
    type: "booking",
    title: "New Rental Request",
    message: "Customer Roberto Gomez requested Toyota HiAce for 2 days.",
    data: {
      bookingId: "bk_rent_203",
      serviceType: "rental",
      actionUrl: "/dashboard/provider",
    },
    isRead: false,
    createdAt: "2026-10-05T12:30:00Z",
  },
  {
    id: "notif_003",
    userId: "user_rider_01",
    type: "system",
    title: "Payout Transferred",
    message: "Weekly earnings of ₱4,850.00 were disbursed to your GCash wallet.",
    isRead: true,
    createdAt: "2026-10-04T18:00:00Z",
  },
  {
    id: "notif_004",
    userId: "user_admin_01",
    type: "verification",
    title: "Pending Rider Verification",
    message: "New rider submitted professional driver's license and vehicle registration.",
    data: {
      verificationId: "verif_req_001",
      actionUrl: "/dashboard/admin",
    },
    isRead: false,
    createdAt: "2026-10-04T10:20:00Z",
  },
]

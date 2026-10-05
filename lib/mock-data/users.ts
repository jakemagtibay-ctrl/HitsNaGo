import type { Customer, Rider, Provider, Admin } from "@/types/user"

export const mockCustomer: Customer = {
  id: "user_cust_01",
  name: "Maria Santos",
  email: "maria.santos@example.com",
  phone: "+63 917 123 4567",
  avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  role: "customer",
  verificationStatus: "verified",
  createdAt: "2026-01-15T08:30:00Z",
  updatedAt: "2026-03-20T10:15:00Z",
  savedAddresses: [
    {
      id: "addr_01",
      label: "Home",
      address: "Brgy. Villa Kananga, South Montilla Boulevard, Butuan City",
      lat: 8.9325,
      lng: 125.529,
      isDefault: true,
    },
    {
      id: "addr_02",
      label: "Office",
      address: "J.C. Aquino Avenue, Brgy. Doongan, Butuan City",
      lat: 8.9498,
      lng: 125.5298,
    },
  ],
  emergencyContact: {
    name: "Carlos Santos",
    phone: "+63 918 765 4321",
    relation: "Brother",
  },
}

export const mockRider: Rider = {
  id: "user_rider_01",
  name: "Danilo Reyes",
  email: "danilo.reyes@example.com",
  phone: "+63 920 555 7890",
  avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  role: "rider",
  verificationStatus: "verified",
  createdAt: "2025-11-10T14:20:00Z",
  updatedAt: "2026-04-01T07:45:00Z",
  vehicleId: "veh_rider_01",
  isOnline: true,
  isAcceptingRides: true,
  isAcceptingDeliveries: true,
  currentLocation: {
    lat: 11.244,
    lng: 124.91,
    updatedAt: "2026-10-05T15:00:00Z",
  },
  rating: 4.92,
  totalRatingsCount: 148,
  completedRidesCount: 215,
  completedDeliveriesCount: 84,
}

export const mockProvider: Provider = {
  id: "user_prov_01",
  name: "Elena Bautista",
  email: "elena.bautista@example.com",
  phone: "+63 928 333 4455",
  avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  role: "provider",
  verificationStatus: "verified",
  businessName: "Bautista Vehicle & Equipment Rentals",
  businessAddress: "Langihan Road, Brgy. Holy Redeemer, Butuan City, Agusan del Norte",
  bio: "Trusted local provider of commercial vans, mountain gear, and power generators since 2023. Proudly serving Butuan City and surrounding areas.",
  servicesOffered: ["Van Rentals", "Tricycle Fleet", "Power Tools", "Camping Gear"],
  rating: 4.88,
  totalRatingsCount: 92,
  completedBookingsCount: 118,
  createdAt: "2025-08-20T09:00:00Z",
  updatedAt: "2026-03-15T16:30:00Z",
}

export const mockAdmin: Admin = {
  id: "user_admin_01",
  name: "Marcus V. Tan",
  email: "marcus.admin@hitsnago.ph",
  phone: "+63 917 888 9900",
  avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  role: "admin",
  verificationStatus: "verified",
  department: "Platform Operations & Trust Safety",
  permissions: ["manage_users", "review_verifications", "moderate_disputes", "system_settings", "audit_logs"],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2026-04-01T12:00:00Z",
}

export const mockUsers = [mockCustomer, mockRider, mockProvider, mockAdmin]

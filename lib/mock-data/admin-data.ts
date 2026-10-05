import type { UserRole } from "@/types/user"
import type { VerificationStatus } from "@/types/verification"
import type { BookingStatus } from "@/types/booking"
import type { ServiceType } from "@/types/service"
import type { VehicleType } from "@/types/vehicle"

export type AccountStatus = "active" | "suspended" | "pending"

export interface AdminUserRecord {
  id: string
  name: string
  email: string
  phone: string
  avatarUrl: string
  role: UserRole
  verificationStatus: VerificationStatus
  accountStatus: AccountStatus
  location: string
  barangay: string
  joinedDate: string
  rating?: number
  completedTripsCount?: number
  businessName?: string
  vehicleModel?: string
  plateNumber?: string
}

/**
 * Authentic Butuan City Admin User Directory
 */
export const MOCK_ADMIN_USERS: AdminUserRecord[] = [
  {
    id: "usr_cust_101",
    name: "Maria Santos",
    email: "maria.santos@gmail.com",
    phone: "+63 917 123 4567",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    role: "customer",
    verificationStatus: "verified",
    accountStatus: "active",
    location: "Butuan City, Agusan del Norte",
    barangay: "Doongan",
    joinedDate: "2026-01-15",
    completedTripsCount: 24,
  },
  {
    id: "usr_cust_102",
    name: "Carlos Mendoza",
    email: "carlos.mendoza@yahoo.com",
    phone: "+63 918 765 4321",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    role: "customer",
    verificationStatus: "verified",
    accountStatus: "active",
    location: "Butuan City, Agusan del Norte",
    barangay: "Libertad",
    joinedDate: "2026-02-01",
    completedTripsCount: 18,
  },
  {
    id: "usr_cust_103",
    name: "Jocelyn Dizon",
    email: "jocelyn.dizon@outlook.com",
    phone: "+63 929 111 2233",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    role: "customer",
    verificationStatus: "pending",
    accountStatus: "active",
    location: "Butuan City, Agusan del Norte",
    barangay: "Villa Kananga",
    joinedDate: "2026-03-10",
    completedTripsCount: 6,
  },
  {
    id: "usr_cust_104",
    name: "Ariel Fernandez",
    email: "ariel.fernandez@gmail.com",
    phone: "+63 908 444 5566",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    role: "customer",
    verificationStatus: "unverified",
    accountStatus: "pending",
    location: "Butuan City, Agusan del Norte",
    barangay: "Ampayon",
    joinedDate: "2026-04-01",
    completedTripsCount: 0,
  },
  {
    id: "usr_rider_201",
    name: "Danilo Reyes",
    email: "danilo.reyes@hitsnago.ph",
    phone: "+63 920 555 7890",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    role: "rider",
    verificationStatus: "verified",
    accountStatus: "active",
    location: "Butuan City, Agusan del Norte",
    barangay: "Doongan",
    joinedDate: "2025-11-10",
    rating: 4.95,
    completedTripsCount: 342,
    vehicleModel: "Yamaha NMAX 155",
    plateNumber: "7718-HA",
  },
  {
    id: "usr_rider_202",
    name: "Rodrigo 'Boy' Alcantara",
    email: "rodrigo.alcantara@gmail.com",
    phone: "+63 919 333 4455",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    role: "rider",
    verificationStatus: "verified",
    accountStatus: "active",
    location: "Butuan City, Agusan del Norte",
    barangay: "Diego Silang",
    joinedDate: "2025-12-05",
    rating: 4.88,
    completedTripsCount: 512,
    vehicleModel: "Kawasaki Barako II Tricycle",
    plateNumber: "BXU-4491",
  },
  {
    id: "usr_rider_203",
    name: "Eduardo Mendoza",
    email: "eduardo.mendoza@gmail.com",
    phone: "+63 917 888 2211",
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80",
    role: "rider",
    verificationStatus: "verified",
    accountStatus: "active",
    location: "Butuan City, Agusan del Norte",
    barangay: "Bancasi",
    joinedDate: "2026-01-20",
    rating: 4.98,
    completedTripsCount: 189,
    vehicleModel: "Toyota Vios 1.3 XLE",
    plateNumber: "KAG-8201",
  },
  {
    id: "usr_rider_204",
    name: "Jonathan 'Jong' Salcedo",
    email: "jong.salcedo@gmail.com",
    phone: "+63 922 777 9900",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    role: "rider",
    verificationStatus: "verified",
    accountStatus: "active",
    location: "Butuan City, Agusan del Norte",
    barangay: "Holy Redeemer",
    joinedDate: "2026-02-14",
    rating: 4.91,
    completedTripsCount: 275,
    vehicleModel: "Toyota HiAce Commuter",
    plateNumber: "ZAA-3920",
  },
  {
    id: "usr_rider_205",
    name: "Arnel Bautista",
    email: "arnel.bautista@gmail.com",
    phone: "+63 928 666 1122",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    role: "rider",
    verificationStatus: "pending",
    accountStatus: "pending",
    location: "Butuan City, Agusan del Norte",
    barangay: "San Vicente",
    joinedDate: "2026-04-02",
    rating: 0,
    completedTripsCount: 0,
    vehicleModel: "Honda Beat 110cc",
    plateNumber: "8821-NC",
  },
  {
    id: "usr_rider_206",
    name: "Felix 'Tikboy' Cortez",
    email: "felix.cortez@gmail.com",
    phone: "+63 915 222 7788",
    avatarUrl: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80",
    role: "rider",
    verificationStatus: "rejected",
    accountStatus: "suspended",
    location: "Butuan City, Agusan del Norte",
    barangay: "Poblacion",
    joinedDate: "2026-02-28",
    rating: 3.2,
    completedTripsCount: 14,
    vehicleModel: "Yamaha Mio i125",
    plateNumber: "6612-HB",
  },
  {
    id: "usr_prov_301",
    name: "Ramon Villanueva",
    email: "ramon@caragarentals.ph",
    phone: "+63 917 333 8899",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    role: "provider",
    verificationStatus: "verified",
    accountStatus: "active",
    location: "Butuan City, Agusan del Norte",
    barangay: "Doongan",
    joinedDate: "2025-10-15",
    businessName: "Caraga Car & Van Rentals",
    rating: 4.95,
    completedTripsCount: 110,
  },
  {
    id: "usr_prov_302",
    name: "Kristine Joy Alcantara",
    email: "kristine@butuanmotorentals.com",
    phone: "+63 928 444 3322",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    role: "provider",
    verificationStatus: "verified",
    accountStatus: "active",
    location: "Butuan City, Agusan del Norte",
    barangay: "Poblacion",
    joinedDate: "2025-12-01",
    businessName: "Butuan MotoRentals",
    rating: 4.9,
    completedTripsCount: 64,
  },
  {
    id: "usr_prov_303",
    name: "Gregorio 'Boy' Tan",
    email: "greg@agusanindustrial.com",
    phone: "+63 917 555 6677",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    role: "provider",
    verificationStatus: "verified",
    accountStatus: "active",
    location: "Butuan City, Agusan del Norte",
    barangay: "Libertad",
    joinedDate: "2026-01-08",
    businessName: "Agusan Industrial & Events Supply",
    rating: 4.86,
    completedTripsCount: 43,
  },
  {
    id: "usr_prov_304",
    name: "Lourdes 'Lulu' Yap",
    email: "lulu.yap@soundpro.ph",
    phone: "+63 920 888 1234",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    role: "provider",
    verificationStatus: "pending",
    accountStatus: "pending",
    location: "Butuan City, Agusan del Norte",
    barangay: "Villa Kananga",
    joinedDate: "2026-03-25",
    businessName: "Caraga Audio & Visuals",
    rating: 0,
    completedTripsCount: 0,
  },
  {
    id: "usr_admin_01",
    name: "Marcus V. Tan",
    email: "marcus.admin@hitsnago.ph",
    phone: "+63 917 888 9900",
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    role: "admin",
    verificationStatus: "verified",
    accountStatus: "active",
    location: "Butuan City, Agusan del Norte",
    barangay: "Doongan",
    joinedDate: "2025-01-01",
  },
]

export interface AdminVerificationRecord {
  id: string
  userId: string
  userName: string
  userRole: UserRole
  submittedDate: string
  documentType: string
  documentNumber: string
  priority: "high" | "medium" | "low"
  status: VerificationStatus
  submittedFiles: { name: string; url: string; type: string }[]
  notes?: string
  reviewedBy?: string
  reviewedAt?: string
}

export const MOCK_ADMIN_VERIFICATIONS: AdminVerificationRecord[] = [
  {
    id: "verif_req_01",
    userId: "usr_rider_205",
    userName: "Arnel Bautista",
    userRole: "rider",
    submittedDate: "2026-04-02T10:15:00Z",
    documentType: "Professional Driver's License & NBI Clearance",
    documentNumber: "N02-18-994102",
    priority: "high",
    status: "pending",
    submittedFiles: [
      { name: "LTO_Driver_License_Front.jpg", url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600", type: "ID Card" },
      { name: "NBI_Clearance_2026.pdf", url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600", type: "Clearance" },
      { name: "Motorcycle_OR_CR_Plate8821NC.pdf", url: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600", type: "Registration" },
    ],
    notes: "Applicant operates Honda Beat in Brgy. San Vicente. LTO check pending.",
  },
  {
    id: "verif_req_02",
    userId: "usr_prov_304",
    userName: "Lourdes 'Lulu' Yap",
    userRole: "provider",
    submittedDate: "2026-04-01T14:30:00Z",
    documentType: "Mayor's Business Permit & DTI Registration",
    documentNumber: "BP-BUTUAN-2026-0819",
    priority: "medium",
    status: "pending",
    submittedFiles: [
      { name: "Mayors_Permit_Butuan_City.pdf", url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600", type: "Business Permit" },
      { name: "DTI_Certificate_CaragaAudio.pdf", url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600", type: "DTI Certificate" },
      { name: "BIR_Form_2303.pdf", url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600", type: "Tax Registration" },
    ],
    notes: "Rental service offering audio equipment in Villa Kananga.",
  },
  {
    id: "verif_req_03",
    userId: "usr_cust_103",
    userName: "Jocelyn Dizon",
    userRole: "customer",
    submittedDate: "2026-03-31T09:00:00Z",
    documentType: "Philippine National ID (PhilSys)",
    documentNumber: "9481-2291-0041-3310",
    priority: "low",
    status: "pending",
    submittedFiles: [
      { name: "PhilSys_Front_Scan.jpg", url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600", type: "Government ID" },
    ],
    notes: "Customer requesting verified status for high-value equipment rental booking.",
  },
  {
    id: "verif_req_04",
    userId: "usr_rider_201",
    userName: "Danilo Reyes",
    userRole: "rider",
    submittedDate: "2025-11-10T08:00:00Z",
    documentType: "Driver's License & Motorcycle Registration",
    documentNumber: "N01-14-884912",
    priority: "high",
    status: "verified",
    submittedFiles: [
      { name: "Drivers_License.jpg", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600", type: "ID Card" },
    ],
    reviewedBy: "Marcus V. Tan",
    reviewedAt: "2025-11-11T10:00:00Z",
    notes: "All documents authentic. Clean driving record in Butuan City.",
  },
  {
    id: "verif_req_05",
    userId: "usr_rider_206",
    userName: "Felix 'Tikboy' Cortez",
    userRole: "rider",
    submittedDate: "2026-02-28T16:00:00Z",
    documentType: "Expired Student Permit (Invalid)",
    documentNumber: "SP-19-114401",
    priority: "high",
    status: "rejected",
    submittedFiles: [
      { name: "Expired_Permit.jpg", url: "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=600", type: "ID Card" },
    ],
    reviewedBy: "Marcus V. Tan",
    reviewedAt: "2026-03-01T09:30:00Z",
    notes: "Submitted student permit expired in 2024. Non-professional permit cannot be authorized for ride-hailing.",
  },
]

export interface AdminBookingRecord {
  id: string
  serviceType: ServiceType
  status: BookingStatus
  customerName: string
  customerPhone: string
  providerOrRiderName: string
  providerOrRiderRole: "rider" | "provider"
  pickupAddress: string
  destinationAddress?: string
  totalAmount: number
  paymentMethod: string
  date: string
  time: string
  notes?: string
}

export const MOCK_ADMIN_BOOKINGS: AdminBookingRecord[] = [
  {
    id: "HNG-849201",
    serviceType: "ride",
    status: "active",
    customerName: "Maria Santos",
    customerPhone: "+63 917 123 4567",
    providerOrRiderName: "Danilo Reyes (Motorcycle)",
    providerOrRiderRole: "rider",
    pickupAddress: "Robinsons Place Butuan, Brgy. Doongan",
    destinationAddress: "SM City Butuan, J.C. Aquino Ave",
    totalAmount: 115,
    paymentMethod: "GCash",
    date: "2026-10-05",
    time: "15:20",
    notes: "Live en route along J.C. Aquino Avenue",
  },
  {
    id: "HNG-738192",
    serviceType: "delivery",
    status: "assigned",
    customerName: "Manuel J. Santos Hospital",
    customerPhone: "+63 917 222 3344",
    providerOrRiderName: "Danilo Reyes (Express Courier)",
    providerOrRiderRole: "rider",
    pickupAddress: "554 Montilla Blvd, Butuan City",
    destinationAddress: "Caraga State University, Brgy. Ampayon",
    totalAmount: 160,
    paymentMethod: "GCash",
    date: "2026-10-05",
    time: "15:35",
    notes: "Urgent laboratory diagnostic supplies",
  },
  {
    id: "HNG-629183",
    serviceType: "ride",
    status: "pending",
    customerName: "Carlos Mendoza",
    customerPhone: "+63 918 765 4321",
    providerOrRiderName: "Pending Rider Assignment",
    providerOrRiderRole: "rider",
    pickupAddress: "Libertad Public Market, Butuan City",
    destinationAddress: "Butuan City Hall Complex, Brgy. Doongan",
    totalAmount: 65,
    paymentMethod: "Cash",
    date: "2026-10-05",
    time: "15:40",
  },
  {
    id: "HNG-518294",
    serviceType: "rental",
    status: "confirmed",
    customerName: "Carlos Mendoza",
    customerPhone: "+63 918 765 4321",
    providerOrRiderName: "Caraga Car & Van Rentals",
    providerOrRiderRole: "provider",
    pickupAddress: "J.C. Aquino Ave, Brgy. Doongan, Butuan City",
    destinationAddress: "Self Pickup Hub",
    totalAmount: 8000,
    paymentMethod: "GCash",
    date: "2026-10-10",
    time: "08:00",
    notes: "Toyota Innova MPV • 2-Day reservation",
  },
  {
    id: "HNG-407185",
    serviceType: "rental",
    status: "pending",
    customerName: "Jocelyn Dizon",
    customerPhone: "+63 929 111 2233",
    providerOrRiderName: "Agusan Industrial & Events Supply",
    providerOrRiderRole: "provider",
    pickupAddress: "National Highway, Brgy. Libertad, Butuan City",
    destinationAddress: "Delivery to Villa Kananga",
    totalAmount: 6100,
    paymentMethod: "Bank Transfer",
    date: "2026-10-15",
    time: "09:00",
    notes: "5kVA Silent Diesel Generator • 2-Day reservation",
  },
  {
    id: "HNG-396274",
    serviceType: "ride",
    status: "completed",
    customerName: "Maria Santos",
    customerPhone: "+63 917 123 4567",
    providerOrRiderName: "Eduardo Mendoza (Private Sedan)",
    providerOrRiderRole: "rider",
    pickupAddress: "Bancasi Airport (BXU), Butuan City",
    destinationAddress: "Downtown Guingona Park, Butuan City",
    totalAmount: 290,
    paymentMethod: "Cash",
    date: "2026-10-04",
    time: "09:00",
  },
  {
    id: "HNG-285163",
    serviceType: "delivery",
    status: "completed",
    customerName: "Gaisano Express Desk",
    customerPhone: "+63 917 111 2233",
    providerOrRiderName: "Rodrigo Alcantara",
    providerOrRiderRole: "rider",
    pickupAddress: "Gaisano Mall Butuan, J.C. Aquino Ave",
    destinationAddress: "Brgy. Villa Kananga, Butuan City",
    totalAmount: 85,
    paymentMethod: "Cash",
    date: "2026-10-02",
    time: "14:15",
  },
  {
    id: "HNG-174052",
    serviceType: "ride",
    status: "cancelled",
    customerName: "Ariel Fernandez",
    customerPhone: "+63 908 444 5566",
    providerOrRiderName: "Jonathan Salcedo",
    providerOrRiderRole: "rider",
    pickupAddress: "Caraga State University Main Campus",
    destinationAddress: "SM City Butuan",
    totalAmount: 180,
    paymentMethod: "GCash",
    date: "2026-10-01",
    time: "11:00",
    notes: "Passenger cancelled: schedule conflict",
  },
]

export interface AdminDisputeRecord {
  id: string
  bookingId: string
  serviceType: ServiceType
  customerName: string
  partyName: string
  partyRole: "rider" | "provider"
  issue: string
  submittedDate: string
  status: "open" | "under_review" | "resolved" | "closed"
  amount: number
  adminNotes?: string
  evidencePlaceholder: string
}

export const MOCK_ADMIN_DISPUTES: AdminDisputeRecord[] = [
  {
    id: "disp_01",
    bookingId: "HNG-396274",
    serviceType: "ride",
    customerName: "Carlos Mendoza",
    partyName: "Eduardo Mendoza",
    partyRole: "rider",
    issue: "Route deviation and delayed arrival at Bancasi Airport",
    submittedDate: "2026-10-04T12:00:00Z",
    status: "open",
    amount: 290,
    evidencePlaceholder: "GPS route timestamp log, Passenger screenshot of estimated vs actual route via Baan bridge",
    adminNotes: "Customer claims driver took bypass road without verbal consent.",
  },
  {
    id: "disp_02",
    bookingId: "HNG-285163",
    serviceType: "delivery",
    customerName: "Gaisano Express Desk",
    partyName: "Rodrigo Alcantara",
    partyRole: "rider",
    issue: "Slight outer box deformation during package transit",
    submittedDate: "2026-10-02T16:30:00Z",
    status: "under_review",
    amount: 85,
    evidencePlaceholder: "Photo of external carton crease upon delivery handover in Villa Kananga",
    adminNotes: "Internal items undamaged. Investigating carrier strap pressure.",
  },
  {
    id: "disp_03",
    bookingId: "HNG-174052",
    serviceType: "rental",
    customerName: "Maria Santos",
    partyName: "Caraga Car & Van Rentals",
    partyRole: "provider",
    issue: "Security deposit refund turnaround inquiry",
    submittedDate: "2026-09-28T10:00:00Z",
    status: "resolved",
    amount: 3000,
    evidencePlaceholder: "Bank transfer reference slip, Vehicle inspection sign-off sheet",
    adminNotes: "Deposit of ₱3,000 refunded via Maya on Sep 29 after vehicle inspection.",
  },
]

export interface AdminReviewRecord {
  id: string
  bookingId: string
  serviceType: ServiceType
  customerName: string
  targetName: string
  targetRole: "rider" | "provider"
  rating: number
  comment: string
  date: string
  status: "published" | "flagged" | "hidden"
}

export const MOCK_ADMIN_REVIEWS: AdminReviewRecord[] = [
  {
    id: "rev_01",
    bookingId: "HNG-849201",
    serviceType: "ride",
    customerName: "Maria Santos",
    targetName: "Danilo Reyes",
    targetRole: "rider",
    rating: 5,
    comment: "Very polite rider! Arrived at Robinsons Place in under 3 minutes with clean helmet.",
    date: "2026-10-04",
    status: "published",
  },
  {
    id: "rev_02",
    bookingId: "HNG-518294",
    serviceType: "rental",
    customerName: "Carlos Mendoza",
    targetName: "Caraga Car & Van Rentals",
    targetRole: "provider",
    rating: 5,
    comment: "The Innova was spotless and well-maintained. Handover in Doongan was seamless.",
    date: "2026-10-03",
    status: "published",
  },
  {
    id: "rev_03",
    bookingId: "HNG-396274",
    serviceType: "ride",
    customerName: "Anonymous Passenger",
    targetName: "Felix Cortez",
    targetRole: "rider",
    rating: 1,
    comment: "Rider was driving aggressively along Montilla Boulevard and refused to slow down.",
    date: "2026-09-30",
    status: "flagged",
  },
  {
    id: "rev_04",
    bookingId: "HNG-285163",
    serviceType: "delivery",
    customerName: "Gaisano Express",
    targetName: "Danilo Reyes",
    targetRole: "rider",
    rating: 5,
    comment: "Fast delivery to CSU Ampayon. Recipient acknowledged proof of delivery right away.",
    date: "2026-09-28",
    status: "published",
  },
  {
    id: "rev_05",
    bookingId: "HNG-174052",
    serviceType: "rental",
    customerName: "Jocelyn Dizon",
    targetName: "Butuan MotoRentals",
    targetRole: "provider",
    rating: 4,
    comment: "Great scooter for navigating Butuan traffic. Would rent again.",
    date: "2026-09-25",
    status: "published",
  },
]

export interface AdminAuditLogRecord {
  id: string
  adminName: string
  action: string
  target: string
  timestamp: string
  ipAddress: string
  result: "success" | "warning" | "failed"
  details: string
}

export const MOCK_ADMIN_AUDIT_LOGS: AdminAuditLogRecord[] = [
  {
    id: "audit_01",
    adminName: "Marcus V. Tan",
    action: "Approved ID Verification",
    target: "Rider: Danilo Reyes (usr_rider_201)",
    timestamp: "2026-10-05T09:12:00Z",
    ipAddress: "122.54.198.42 (Butuan, Caraga)",
    result: "success",
    details: "Verified professional driver license and motorcycle OR/CR documentation.",
  },
  {
    id: "audit_02",
    adminName: "Marcus V. Tan",
    action: "Suspended User Account",
    target: "Rider: Felix Cortez (usr_rider_206)",
    timestamp: "2026-10-04T16:45:00Z",
    ipAddress: "122.54.198.42 (Butuan, Caraga)",
    result: "warning",
    details: "Suspended due to invalid license documents and safety review report.",
  },
  {
    id: "audit_03",
    adminName: "Marcus V. Tan",
    action: "Updated Service Area Boundaries",
    target: "Config: Butuan City Active Zone",
    timestamp: "2026-10-03T11:20:00Z",
    ipAddress: "122.54.198.42 (Butuan, Caraga)",
    result: "success",
    details: "Restricted geofence strictly to Butuan City municipal boundary.",
  },
  {
    id: "audit_04",
    adminName: "Marcus V. Tan",
    action: "Resolved Customer Dispute",
    target: "Dispute #disp_03 (HNG-174052)",
    timestamp: "2026-09-29T14:10:00Z",
    ipAddress: "122.54.198.42 (Butuan, Caraga)",
    result: "success",
    details: "Confirmed release of ₱3,000 security deposit to Maria Santos.",
  },
  {
    id: "audit_05",
    adminName: "Marcus V. Tan",
    action: "Approved Rental Listing",
    target: "Listing: Toyota Innova 2.8 E Diesel (rent_btn_01)",
    timestamp: "2026-09-20T08:30:00Z",
    ipAddress: "122.54.198.42 (Butuan, Caraga)",
    result: "success",
    details: "Verified comprehensive commercial insurance and LTFRB authority.",
  },
]

export interface AdminVehicleRecord {
  id: string
  type: VehicleType
  ownerName: string
  ownerRole: "rider" | "provider"
  brandModel: string
  year: number
  plateNumber: string
  color: string
  status: "active" | "maintenance" | "pending_inspection"
  verificationStatus: VerificationStatus
  registrationExpiry: string
}

export const MOCK_ADMIN_VEHICLES: AdminVehicleRecord[] = [
  {
    id: "veh_btn_01",
    type: "motorcycle",
    ownerName: "Danilo Reyes",
    ownerRole: "rider",
    brandModel: "Yamaha NMAX 155",
    year: 2024,
    plateNumber: "7718-HA",
    color: "Midnight Black",
    status: "active",
    verificationStatus: "verified",
    registrationExpiry: "2027-02-15",
  },
  {
    id: "veh_btn_02",
    type: "tricycle",
    ownerName: "Rodrigo Alcantara",
    ownerRole: "rider",
    brandModel: "Kawasaki Barako II",
    year: 2023,
    plateNumber: "BXU-4491",
    color: "Blue & Silver",
    status: "active",
    verificationStatus: "verified",
    registrationExpiry: "2026-11-20",
  },
  {
    id: "veh_btn_03",
    type: "car",
    ownerName: "Eduardo Mendoza",
    ownerRole: "rider",
    brandModel: "Toyota Vios 1.3 XLE",
    year: 2024,
    plateNumber: "KAG-8201",
    color: "Silver Metallic",
    status: "active",
    verificationStatus: "verified",
    registrationExpiry: "2027-04-10",
  },
  {
    id: "veh_btn_04",
    type: "van",
    ownerName: "Caraga Car & Van Rentals",
    ownerRole: "provider",
    brandModel: "Toyota HiAce Grandia GL",
    year: 2023,
    plateNumber: "ZAA-3920",
    color: "Pearl White",
    status: "active",
    verificationStatus: "verified",
    registrationExpiry: "2027-01-18",
  },
  {
    id: "veh_btn_05",
    type: "car",
    ownerName: "Caraga Car & Van Rentals",
    ownerRole: "provider",
    brandModel: "Toyota Innova 2.8 E Diesel",
    year: 2024,
    plateNumber: "MB-2024-09",
    color: "Bronze Mica",
    status: "active",
    verificationStatus: "verified",
    registrationExpiry: "2027-05-30",
  },
  {
    id: "veh_btn_06",
    type: "motorcycle",
    ownerName: "Arnel Bautista",
    ownerRole: "rider",
    brandModel: "Honda Beat 110cc",
    year: 2023,
    plateNumber: "8821-NC",
    color: "Red / White",
    status: "pending_inspection",
    verificationStatus: "pending",
    registrationExpiry: "2026-08-14",
  },
]

export interface AdminServiceRecord {
  id: string
  name: string
  providerName: string
  category: string
  price: number
  priceUnit: string
  availability: "available" | "busy" | "maintenance"
  approvalStatus: "approved" | "pending" | "rejected"
  location: string
}

export const MOCK_ADMIN_SERVICES: AdminServiceRecord[] = [
  {
    id: "srv_01",
    name: "Toyota Innova 7-Seater Self-Drive / Chauffeur",
    providerName: "Caraga Car & Van Rentals",
    category: "Vehicle Rental",
    price: 2500,
    priceUnit: "day",
    availability: "available",
    approvalStatus: "approved",
    location: "Brgy. Doongan, Butuan City",
  },
  {
    id: "srv_02",
    name: "Toyota HiAce Grandia 12-Seater Commuter Van",
    providerName: "Caraga Car & Van Rentals",
    category: "Vehicle Rental",
    price: 3800,
    priceUnit: "day",
    availability: "available",
    approvalStatus: "approved",
    location: "Brgy. Doongan, Butuan City",
  },
  {
    id: "srv_03",
    name: "Honda Click 125i City Scooter",
    providerName: "Butuan MotoRentals",
    category: "Motorcycle Rental",
    price: 500,
    priceUnit: "day",
    availability: "available",
    approvalStatus: "approved",
    location: "Brgy. Poblacion, Butuan City",
  },
  {
    id: "srv_04",
    name: "Yamaha NMAX 155 ABS Maxi-Scooter",
    providerName: "Butuan MotoRentals",
    category: "Motorcycle Rental",
    price: 850,
    priceUnit: "day",
    availability: "available",
    approvalStatus: "approved",
    location: "Brgy. Poblacion, Butuan City",
  },
  {
    id: "srv_05",
    name: "5.0kVA Silent Diesel Generator",
    providerName: "Agusan Industrial & Events Supply",
    category: "Equipment",
    price: 1800,
    priceUnit: "day",
    availability: "available",
    approvalStatus: "approved",
    location: "Brgy. Libertad, Butuan City",
  },
  {
    id: "srv_06",
    name: "Dual 15-inch Powered PA Sound System",
    providerName: "Caraga Audio & Visuals",
    category: "Equipment",
    price: 2200,
    priceUnit: "day",
    availability: "maintenance",
    approvalStatus: "pending",
    location: "Brgy. Villa Kananga, Butuan City",
  },
]

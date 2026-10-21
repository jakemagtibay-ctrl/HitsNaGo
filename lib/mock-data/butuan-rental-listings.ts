// Sample rental listings (cars, vans, motorbikes) available in Butuan City for testing and demo purposes
import type { RentalListing } from "@/types/rental"

export interface ButuanRentalItem extends RentalListing {

  rating: number
  reviewsCount: number
  features: string[]
  provider: {
    id: string
    name: string
    businessName: string
    avatarUrl: string
    isVerified: boolean
    rating: number
    badgeText: string
  }
}

/**
 * Authentic Butuan City Rental Listings
 * Strictly located within Butuan City, Agusan del Norte.
 */
export const MOCK_BUTUAN_RENTAL_LISTINGS: ButuanRentalItem[] = [
  {
    id: "rent_btn_01",
    providerId: "user_prov_btn_01",
    title: "Toyota Innova 2.8 E Diesel (7-Seater MPV)",
    description: "Reliable and fuel-efficient family MPV. Perfect for city tours around Butuan City, business delegates, and Bancasi Airport transfers.",
    category: "vehicle",
    pricePerDay: 2500,
    pricePerHour: 350,
    securityDeposit: 3000,
    currency: "PHP",
    rating: 4.93,
    reviewsCount: 48,
    features: ["Automatic Transmission", "7 Passengers", "Ice-cold Dual AC", "Dashcam Equipped", "Bluetooth Audio"],
    images: [
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&auto=format&fit=crop&q=80",
    ],
    termsAndConditions: "Self-drive requires valid driver's license + 2 government IDs. Chauffeur option available on request. Return with same fuel level.",
    requirements: ["Valid Driver's License", "2 Government IDs", "Proof of Billing / Hotel Voucher"],
    pickupAddress: "J.C. Aquino Avenue, Brgy. Doongan, Butuan City",
    status: "available",
    createdAt: "2026-01-10T08:00:00Z",
    updatedAt: "2026-03-15T09:30:00Z",
    provider: {
      id: "user_prov_btn_01",
      name: "Ramon Villanueva",
      businessName: "Caraga Car & Van Rentals",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      rating: 4.95,
      badgeText: "Verified Fleet Provider",
    },
  },
  {
    id: "rent_btn_02",
    providerId: "user_prov_btn_01",
    title: "Toyota HiAce Grandia GL 12-Seater Passenger Van",
    description: "Executive high-roof commuter van. Ideal for corporate delegations, family reunions, and Caraga regional tours originating in Butuan.",
    category: "vehicle",
    pricePerDay: 3800,
    pricePerHour: 450,
    securityDeposit: 4000,
    currency: "PHP",
    rating: 4.97,
    reviewsCount: 62,
    features: ["12 Captain Seats", "High-Roof Clearance", "Dual Climate AC", "Rear Luggage Bay", "USB Charging Ports"],
    images: [
      "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?w=600&auto=format&fit=crop&q=80",
    ],
    termsAndConditions: "Available with verified professional driver. Fuel excluded.",
    requirements: ["Valid ID", "Rental Contract Signing", "Advance Booking Deposit"],
    pickupAddress: "Near Robinsons Place, Brgy. Doongan, Butuan City",
    status: "available",
    createdAt: "2026-01-15T10:00:00Z",
    updatedAt: "2026-03-20T11:00:00Z",
    provider: {
      id: "user_prov_btn_01",
      name: "Ramon Villanueva",
      businessName: "Caraga Car & Van Rentals",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      rating: 4.95,
      badgeText: "Verified Fleet Provider",
    },
  },
  {
    id: "rent_btn_03",
    providerId: "user_prov_btn_02",
    title: "Honda Click 125i Scooter (City Commuter)",
    description: "Nimble, highly economical automatic scooter. Great for solo travelers or students maneuvering Butuan City downtown lanes.",
    category: "vehicle",
    pricePerDay: 500,
    pricePerHour: 80,
    securityDeposit: 1000,
    currency: "PHP",
    rating: 4.88,
    reviewsCount: 35,
    features: ["Automatic Transmission", "Comes with 2 Helmets", "125cc PGM-FI", "Underseat Storage", "Phone Mount"],
    images: [
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80",
    ],
    termsAndConditions: "Driver must have valid Motorcycle license (Code A/A1). Helmet mandatory at all times.",
    requirements: ["Valid Driver's License (Code A)", "1 Government ID"],
    pickupAddress: "Montilla Boulevard, Brgy. Poblacion, Butuan City",
    status: "available",
    createdAt: "2026-02-01T14:00:00Z",
    updatedAt: "2026-03-28T16:00:00Z",
    provider: {
      id: "user_prov_btn_02",
      name: "Kristine Joy Alcantara",
      businessName: "Butuan MotoRentals",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      rating: 4.9,
      badgeText: "Verified Moto Host",
    },
  },
  {
    id: "rent_btn_04",
    providerId: "user_prov_btn_02",
    title: "Yamaha NMAX 155 ABS Maxi-Scooter",
    description: "Premium maxi-scooter with ABS and comfortable seating. Ideal for comfortable cruising across Butuan and neighboring Agusan districts.",
    category: "vehicle",
    pricePerDay: 850,
    pricePerHour: 120,
    securityDeposit: 1500,
    currency: "PHP",
    rating: 4.92,
    reviewsCount: 29,
    features: ["ABS Brakes", "Spacious Floorboard", "LED Headlights", "2 Premium Helmets", "Digital Gauge"],
    images: [
      "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80",
    ],
    termsAndConditions: "Valid motorcycle driver's license required. Security deposit refundable upon inspection.",
    requirements: ["Valid Driver's License", "Proof of Residence / Hotel Booking"],
    pickupAddress: "Montilla Boulevard, Brgy. Poblacion, Butuan City",
    status: "available",
    createdAt: "2026-02-05T12:00:00Z",
    updatedAt: "2026-03-25T10:00:00Z",
    provider: {
      id: "user_prov_btn_02",
      name: "Kristine Joy Alcantara",
      businessName: "Butuan MotoRentals",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      rating: 4.9,
      badgeText: "Verified Moto Host",
    },
  },
  {
    id: "rent_btn_05",
    providerId: "user_prov_btn_03",
    title: "Heavy-Duty 5.0kVA Silent Diesel Generator",
    description: "Powerful, soundproof diesel generator. Essential for outdoor events, construction jobs, wedding catering, and power emergency backup in Butuan.",
    category: "equipment",
    pricePerDay: 1800,
    securityDeposit: 2500,
    currency: "PHP",
    rating: 4.85,
    reviewsCount: 19,
    features: ["5000 Watts Peak", "Ultra-Silent Canopy", "Electric Push Start", "AVR Voltage Regulated", "Includes Heavy Extension Cords"],
    images: [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
    ],
    termsAndConditions: "Delivery and pickup within Butuan City can be arranged. Fuel (diesel) provided separately.",
    requirements: ["2 Government IDs", "Signed Equipment Agreement"],
    pickupAddress: "Brgy. Libertad, National Highway, Butuan City",
    status: "available",
    createdAt: "2026-02-12T09:00:00Z",
    updatedAt: "2026-03-22T14:00:00Z",
    provider: {
      id: "user_prov_btn_03",
      name: "Gregorio 'Boy' Tan",
      businessName: "Agusan Industrial & Events Supply",
      avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      rating: 4.86,
      badgeText: "Verified Equipment Supplier",
    },
  },
  {
    id: "rent_btn_06",
    providerId: "user_prov_btn_03",
    title: "Professional Sound & PA System with Wireless Mics",
    description: "Complete audio setup with two 15-inch active speakers, 8-channel mixer, 2 wireless UHF microphones, and bluetooth connectivity.",
    category: "equipment",
    pricePerDay: 2200,
    securityDeposit: 2000,
    currency: "PHP",
    rating: 4.91,
    reviewsCount: 24,
    features: ["Two 15-Inch Powered Speakers", "8-Channel Audio Mixer", "2 Cordless UHF Mics", "Speaker Tripods Included", "Bluetooth/AUX Support"],
    images: [
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    ],
    termsAndConditions: "Includes basic setup assistance within Butuan City central barangays.",
    requirements: ["Valid ID", "Venue Address in Butuan City"],
    pickupAddress: "Brgy. Libertad, National Highway, Butuan City",
    status: "available",
    createdAt: "2026-02-18T11:00:00Z",
    updatedAt: "2026-03-30T17:00:00Z",
    provider: {
      id: "user_prov_btn_03",
      name: "Gregorio 'Boy' Tan",
      businessName: "Agusan Industrial & Events Supply",
      avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      rating: 4.86,
      badgeText: "Verified Equipment Supplier",
    },
  },
]

/**
 * Helper to calculate estimated rental cost
 */
export function calculateRentalEstimate(
  pricePerDay: number,
  securityDeposit: number,
  startDateStr: string,
  endDateStr: string
): {
  durationDays: number
  rentalFee: number
  securityDeposit: number
  estimatedTotal: number
} {
  const start = new Date(startDateStr)
  const end = new Date(endDateStr)
  const diffTime = Math.max(end.getTime() - start.getTime(), 0)
  const durationDays = Math.max(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), 1)
  const rentalFee = durationDays * pricePerDay
  const estimatedTotal = rentalFee + securityDeposit

  return {
    durationDays,
    rentalFee,
    securityDeposit,
    estimatedTotal,
  }
}

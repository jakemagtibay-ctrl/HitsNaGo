import type { LocationAddress } from "@/types/service"

export interface ButuanLocationPreset {
  id: string
  name: string
  barangay: string
  type: "hub" | "commercial" | "hospital" | "transport" | "school" | "landmark"
  address: LocationAddress
}

/**
 * Verified landmarks and hubs within Butuan City, Agusan del Norte.
 * All coordinates correspond accurately to the Butuan City metropolitan area (~8.94°N, 125.54°E).
 */
export const BUTUAN_PRESET_LOCATIONS: ButuanLocationPreset[] = [
  {
    id: "loc_robinsons_butuan",
    name: "Robinsons Place Butuan",
    barangay: "Doongan",
    type: "commercial",
    address: {
      title: "Robinsons Place Butuan",
      address: "J.C. Aquino Avenue, Brgy. Doongan, Butuan City",
      landmark: "Near City Hall Complex",
      city: "Butuan City",
      province: "Agusan del Norte",
      postalCode: "8600",
      coordinates: { lat: 8.9498, lng: 125.5298 },
    },
  },
  {
    id: "loc_sm_city_butuan",
    name: "SM City Butuan",
    barangay: "Diego Silang",
    type: "commercial",
    address: {
      title: "SM City Butuan",
      address: "J.C. Aquino Avenue, Brgy. Diego Silang, Butuan City",
      landmark: "Downtown Commercial Corridor",
      city: "Butuan City",
      province: "Agusan del Norte",
      postalCode: "8600",
      coordinates: { lat: 8.9512, lng: 125.5385 },
    },
  },
  {
    id: "loc_gaisano_butuan",
    name: "Gaisano Mall Butuan",
    barangay: "Poblacion",
    type: "commercial",
    address: {
      title: "Gaisano Mall Butuan",
      address: "J.C. Aquino Avenue cor. Montilla Blvd, Butuan City",
      landmark: "Opposite Luz Homes",
      city: "Butuan City",
      province: "Agusan del Norte",
      postalCode: "8600",
      coordinates: { lat: 8.9492, lng: 125.535 },
    },
  },
  {
    id: "loc_city_hall_butuan",
    name: "Butuan City Hall Complex",
    barangay: "Doongan",
    type: "hub",
    address: {
      title: "Butuan City Hall Complex",
      address: "J.P. Rosales Avenue, Brgy. Doongan, Butuan City",
      landmark: "Agusan del Norte Provincial Government Center",
      city: "Butuan City",
      province: "Agusan del Norte",
      postalCode: "8600",
      coordinates: { lat: 8.9535, lng: 125.5264 },
    },
  },
  {
    id: "loc_bancasi_airport",
    name: "Bancasi Airport (BXU)",
    barangay: "Bancasi",
    type: "transport",
    address: {
      title: "Bancasi Airport (Butuan Airport)",
      address: "National Highway, Brgy. Bancasi, Butuan City",
      landmark: "Passenger Departure / Arrival Gates",
      city: "Butuan City",
      province: "Agusan del Norte",
      postalCode: "8600",
      coordinates: { lat: 8.9511, lng: 125.4789 },
    },
  },
  {
    id: "loc_langihan_terminal",
    name: "Butuan Integrated Bus Terminal (Langihan)",
    barangay: "Holy Redeemer",
    type: "transport",
    address: {
      title: "Butuan Integrated Bus Terminal (Langihan)",
      address: "Langihan Road, Brgy. Holy Redeemer, Butuan City",
      landmark: "Langihan Public Market",
      city: "Butuan City",
      province: "Agusan del Norte",
      postalCode: "8600",
      coordinates: { lat: 8.9612, lng: 125.5412 },
    },
  },
  {
    id: "loc_csu_ampayon",
    name: "Caraga State University (CSU Main)",
    barangay: "Ampayon",
    type: "school",
    address: {
      title: "Caraga State University (Main Campus)",
      address: "KM 7, National Highway, Brgy. Ampayon, Butuan City",
      landmark: "Main University Gate",
      city: "Butuan City",
      province: "Agusan del Norte",
      postalCode: "8600",
      coordinates: { lat: 8.9575, lng: 125.5976 },
    },
  },
  {
    id: "loc_fsuu_downtown",
    name: "Father Saturnino Urios University (FSUU)",
    barangay: "Poblacion",
    type: "school",
    address: {
      title: "Father Saturnino Urios University (Main)",
      address: "San Francisco Street cor. J.C. Aquino Ave, Butuan City",
      landmark: "Near St. Joseph Cathedral",
      city: "Butuan City",
      province: "Agusan del Norte",
      postalCode: "8600",
      coordinates: { lat: 8.9481, lng: 125.5418 },
    },
  },
  {
    id: "loc_mjs_hospital",
    name: "Manuel J. Santos Hospital",
    barangay: "Montilla",
    type: "hospital",
    address: {
      title: "Manuel J. Santos Hospital",
      address: "554 Montilla Boulevard, Butuan City",
      landmark: "Emergency Entrance / Outpatient Clinic",
      city: "Butuan City",
      province: "Agusan del Norte",
      postalCode: "8600",
      coordinates: { lat: 8.9458, lng: 125.5372 },
    },
  },
  {
    id: "loc_butuan_medical_center",
    name: "Butuan Medical Center (BMC)",
    barangay: "Baan Km. 5",
    type: "hospital",
    address: {
      title: "Butuan Medical Center (Public Hospital)",
      address: "Km. 5, National Highway, Brgy. Baan, Butuan City",
      landmark: "Hospital Main Gate",
      city: "Butuan City",
      province: "Agusan del Norte",
      postalCode: "8600",
      coordinates: { lat: 8.9712, lng: 125.5615 },
    },
  },
  {
    id: "loc_guingona_park",
    name: "Guingona Park & St. Joseph Cathedral",
    barangay: "Downtown",
    type: "landmark",
    address: {
      title: "Guingona Park & St. Joseph Cathedral",
      address: "Ester Luna Street, Downtown, Butuan City",
      landmark: "Historic Cathedral Plaza",
      city: "Butuan City",
      province: "Agusan del Norte",
      postalCode: "8600",
      coordinates: { lat: 8.9489, lng: 125.5432 },
    },
  },
  {
    id: "loc_balangay_shrine",
    name: "Balangay Shrine Museum",
    barangay: "Libertad",
    type: "landmark",
    address: {
      title: "Balangay Shrine Museum",
      address: "Barangay Libertad, Butuan City",
      landmark: "Balanghai Archaeological Site",
      city: "Butuan City",
      province: "Agusan del Norte",
      postalCode: "8600",
      coordinates: { lat: 8.9515, lng: 125.5098 },
    },
  },
  {
    id: "loc_villa_kananga",
    name: "Villa Kananga Commercial Center",
    barangay: "Villa Kananga",
    type: "commercial",
    address: {
      title: "Villa Kananga Commercial Center",
      address: "South Montilla Boulevard, Brgy. Villa Kananga, Butuan City",
      landmark: "Across Holy Child Colleges",
      city: "Butuan City",
      province: "Agusan del Norte",
      postalCode: "8600",
      coordinates: { lat: 8.9325, lng: 125.529 },
    },
  },
  {
    id: "loc_libertad_market",
    name: "Libertad Public Market",
    barangay: "Libertad",
    type: "commercial",
    address: {
      title: "Libertad Public Market",
      address: "National Highway, Brgy. Libertad, Butuan City",
      landmark: "Near Libertad Overpass",
      city: "Butuan City",
      province: "Agusan del Norte",
      postalCode: "8600",
      coordinates: { lat: 8.9529, lng: 125.5122 },
    },
  },
  {
    id: "loc_magsaysay_bridge",
    name: "Agusan River Magsaysay Bridge",
    barangay: "Baan Riverside",
    type: "landmark",
    address: {
      title: "Magsaysay Bridge Crossing",
      address: "Mayor Democrito O. Plaza II Bridge, Baan Riverside, Butuan City",
      landmark: "Agusan River Promenade",
      city: "Butuan City",
      province: "Agusan del Norte",
      postalCode: "8600",
      coordinates: { lat: 8.9482, lng: 125.552 },
    },
  },
]

/**
 * Common verified barangays of Butuan City for selection and autocomplete.
 */
export const BUTUAN_BARANGAYS = [
  "Ambago",
  "Ampayon",
  "Agao",
  "Agusan Pequeño",
  "Baan Km. 3",
  "Baan Riverside",
  "Babag",
  "Bancasi",
  "Banza",
  "Bayanihan",
  "Bit-os",
  "Bonbon",
  "Dagohoy",
  "Dankias",
  "De Oro",
  "Diego Silang",
  "Don Francisco",
  "Doongan",
  "Dumalagan",
  "Golden Ribbon",
  "Holy Redeemer",
  "Humabon",
  "Imadejas",
  "Kinamlutan",
  "Lapu-Lapu",
  "Libertad",
  "Limaha",
  "Los Angeles",
  "Lumbocan",
  "Maguinda",
  "Mahay",
  "Maibu",
  "Mandamo",
  "Manila de Bugabus",
  "Maon",
  "Masao",
  "New Society Village",
  "Nongnong",
  "Obrero",
  "Ong Yiu",
  "Pangabugan",
  "Pecan",
  "Pigdaulan",
  "Pinamanculan",
  "Port Poyohon",
  "Rajah Humabon",
  "Salvacion",
  "San Ignacio",
  "San Mateo",
  "San Vicente",
  "Santo Niño",
  "Sikatuna",
  "Silongan",
  "Tagabaca",
  "Taguibo",
  "Taligaman",
  "Tiniwisan",
  "Tungao",
  "Urduja",
  "Villa Kananga",
]

/**
 * Helper to get a preset location by ID
 */
export function getButuanLocationById(id: string): LocationAddress | undefined {
  const preset = BUTUAN_PRESET_LOCATIONS.find((loc) => loc.id === id)
  return preset ? preset.address : undefined
}

/**
 * Helper to build a LocationAddress object from custom user text inside Butuan City
 */
export function createCustomButuanLocation(customAddress: string, landmark?: string): LocationAddress {
  return {
    title: customAddress.split(",")[0].trim() || "Butuan City Location",
    address: `${customAddress.trim()}, Butuan City, Agusan del Norte`,
    landmark: landmark || "Butuan City area",
    city: "Butuan City",
    province: "Agusan del Norte",
    postalCode: "8600",
    coordinates: {
      lat: 8.9475,
      lng: 125.5406,
    },
  }
}

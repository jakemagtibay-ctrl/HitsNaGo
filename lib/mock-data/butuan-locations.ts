// Preset list of popular landmarks, malls, schools, and hospitals in Butuan City for quick location selection
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
      placeName: "Robinsons Place Butuan",
      address: "J.C. Aquino Avenue, Brgy. Doongan, Butuan City",
      formattedAddress: "J.C. Aquino Avenue, Brgy. Doongan, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Near City Hall Complex",
      barangay: "Doongan",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9498, lng: 125.5298 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_sm_city_butuan",
    name: "SM City Butuan",
    barangay: "Diego Silang",
    type: "commercial",
    address: {
      title: "SM City Butuan",
      placeName: "SM City Butuan",
      address: "J.C. Aquino Avenue, Brgy. Diego Silang, Butuan City",
      formattedAddress: "J.C. Aquino Avenue, Brgy. Diego Silang, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Downtown Commercial Corridor",
      barangay: "Diego Silang",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9512, lng: 125.5385 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_gaisano_butuan",
    name: "Gaisano Mall Butuan",
    barangay: "Poblacion",
    type: "commercial",
    address: {
      title: "Gaisano Mall Butuan",
      placeName: "Gaisano Mall Butuan",
      address: "J.C. Aquino Avenue cor. Montilla Blvd, Butuan City",
      formattedAddress: "J.C. Aquino Avenue cor. Montilla Blvd, Brgy. Poblacion, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Opposite Luz Homes",
      barangay: "Poblacion",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9492, lng: 125.535 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_city_hall_butuan",
    name: "Butuan City Hall Complex",
    barangay: "Doongan",
    type: "hub",
    address: {
      title: "Butuan City Hall Complex",
      placeName: "Butuan City Hall Complex",
      address: "J.P. Rosales Avenue, Brgy. Doongan, Butuan City",
      formattedAddress: "J.P. Rosales Avenue, Brgy. Doongan, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Agusan del Norte Provincial Government Center",
      barangay: "Doongan",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9535, lng: 125.5264 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_bancasi_airport",
    name: "Bancasi Airport (BXU)",
    barangay: "Bancasi",
    type: "transport",
    address: {
      title: "Bancasi Airport (Butuan Airport)",
      placeName: "Bancasi Airport (BXU)",
      address: "National Highway, Brgy. Bancasi, Butuan City",
      formattedAddress: "National Highway, Brgy. Bancasi, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Passenger Departure / Arrival Gates",
      barangay: "Bancasi",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9511, lng: 125.4789 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_langihan_terminal",
    name: "Butuan Integrated Bus Terminal (Langihan)",
    barangay: "Holy Redeemer",
    type: "transport",
    address: {
      title: "Butuan Integrated Bus Terminal (Langihan)",
      placeName: "Butuan Integrated Bus Terminal (Langihan)",
      address: "Langihan Road, Brgy. Holy Redeemer, Butuan City",
      formattedAddress: "Langihan Road, Brgy. Holy Redeemer, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Langihan Public Market",
      barangay: "Holy Redeemer",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9612, lng: 125.5412 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_csu_ampayon",
    name: "Caraga State University (CSU Main)",
    barangay: "Ampayon",
    type: "school",
    address: {
      title: "Caraga State University (Main Campus)",
      placeName: "Caraga State University (CSU Main)",
      address: "KM 7, National Highway, Brgy. Ampayon, Butuan City",
      formattedAddress: "KM 7, National Highway, Brgy. Ampayon, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Main University Gate",
      barangay: "Ampayon",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9575, lng: 125.5976 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_fsuu_downtown",
    name: "Father Saturnino Urios University (FSUU)",
    barangay: "Poblacion",
    type: "school",
    address: {
      title: "Father Saturnino Urios University (Main)",
      placeName: "Father Saturnino Urios University (FSUU)",
      address: "San Francisco Street cor. J.C. Aquino Ave, Butuan City",
      formattedAddress: "San Francisco Street cor. J.C. Aquino Ave, Brgy. Poblacion, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Near St. Joseph Cathedral",
      barangay: "Poblacion",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9481, lng: 125.5418 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_sjit_montilla",
    name: "Saint Joseph Institute of Technology (SJIT)",
    barangay: "Montilla",
    type: "school",
    address: {
      title: "Saint Joseph Institute of Technology",
      placeName: "Saint Joseph Institute of Technology (SJIT)",
      address: "Montilla Boulevard, Butuan City",
      formattedAddress: "Montilla Boulevard, Brgy. Montilla, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Main Campus Entrance",
      barangay: "Montilla",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9465, lng: 125.5395 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_mjs_hospital",
    name: "Manuel J. Santos Hospital",
    barangay: "Montilla",
    type: "hospital",
    address: {
      title: "Manuel J. Santos Hospital",
      placeName: "Manuel J. Santos Hospital",
      address: "554 Montilla Boulevard, Butuan City",
      formattedAddress: "554 Montilla Boulevard, Brgy. Montilla, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Emergency Entrance / Outpatient Clinic",
      barangay: "Montilla",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9458, lng: 125.5372 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_butuan_doctors",
    name: "Butuan Doctors' Hospital",
    barangay: "Doongan",
    type: "hospital",
    address: {
      title: "Butuan Doctors' Hospital",
      placeName: "Butuan Doctors' Hospital",
      address: "J.C. Aquino Avenue, Brgy. Doongan, Butuan City",
      formattedAddress: "J.C. Aquino Avenue, Brgy. Doongan, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Near Robinsons Place Butuan",
      barangay: "Doongan",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9485, lng: 125.528 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_butuan_medical_center",
    name: "Butuan Medical Center (BMC)",
    barangay: "Baan Km. 5",
    type: "hospital",
    address: {
      title: "Butuan Medical Center (Public Hospital)",
      placeName: "Butuan Medical Center (BMC)",
      address: "Km. 5, National Highway, Brgy. Baan, Butuan City",
      formattedAddress: "Km. 5, National Highway, Brgy. Baan, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Hospital Main Gate",
      barangay: "Baan Km. 5",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9712, lng: 125.5615 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_guingona_park",
    name: "Guingona Park & St. Joseph Cathedral",
    barangay: "Downtown",
    type: "landmark",
    address: {
      title: "Guingona Park & St. Joseph Cathedral",
      placeName: "St. Joseph Cathedral & Guingona Park",
      address: "Ester Luna Street, Downtown, Butuan City",
      formattedAddress: "Ester Luna Street, Downtown, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Historic Cathedral Plaza",
      barangay: "Downtown",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9489, lng: 125.5432 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_almont_inland",
    name: "Almont Inland Resort",
    barangay: "Doongan",
    type: "commercial",
    address: {
      title: "Almont Inland Resort",
      placeName: "Almont Inland Resort",
      address: "J.C. Aquino Avenue, Brgy. Doongan, Butuan City",
      formattedAddress: "J.C. Aquino Avenue, Brgy. Doongan, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Convention Center Gate",
      barangay: "Doongan",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9505, lng: 125.5255 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_almont_city_hotel",
    name: "Almont City Hotel",
    barangay: "San Pedro",
    type: "commercial",
    address: {
      title: "Almont City Hotel",
      placeName: "Almont City Hotel",
      address: "San Pedro Street, Butuan City",
      formattedAddress: "San Pedro Street, Brgy. San Pedro, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Near Agusan River Promenade",
      barangay: "San Pedro",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9472, lng: 125.544 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_balangay_shrine",
    name: "Balangay Shrine Museum",
    barangay: "Libertad",
    type: "landmark",
    address: {
      title: "Balangay Shrine Museum",
      placeName: "Balangay Shrine Museum",
      address: "Barangay Libertad, Butuan City",
      formattedAddress: "Barangay Libertad, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Balanghai Archaeological Site",
      barangay: "Libertad",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9515, lng: 125.5098 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_puregold_langihan",
    name: "Puregold Butuan (Langihan)",
    barangay: "Holy Redeemer",
    type: "commercial",
    address: {
      title: "Puregold Butuan",
      placeName: "Puregold Butuan",
      address: "Langihan Road, Brgy. Holy Redeemer, Butuan City",
      formattedAddress: "Langihan Road, Brgy. Holy Redeemer, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Across Langihan Public Market",
      barangay: "Holy Redeemer",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9595, lng: 125.5398 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_villa_kananga",
    name: "Villa Kananga Commercial Center",
    barangay: "Villa Kananga",
    type: "commercial",
    address: {
      title: "Villa Kananga Commercial Center",
      placeName: "Villa Kananga Commercial Center",
      address: "South Montilla Boulevard, Brgy. Villa Kananga, Butuan City",
      formattedAddress: "South Montilla Boulevard, Brgy. Villa Kananga, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Across Holy Child Colleges",
      barangay: "Villa Kananga",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9325, lng: 125.529 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_libertad_market",
    name: "Libertad Public Market",
    barangay: "Libertad",
    type: "commercial",
    address: {
      title: "Libertad Public Market",
      placeName: "Libertad Public Market",
      address: "National Highway, Brgy. Libertad, Butuan City",
      formattedAddress: "National Highway, Brgy. Libertad, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Near Libertad Overpass",
      barangay: "Libertad",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9529, lng: 125.5122 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_magsaysay_bridge",
    name: "Agusan River Magsaysay Bridge",
    barangay: "Baan Riverside",
    type: "landmark",
    address: {
      title: "Magsaysay Bridge Crossing",
      placeName: "Magsaysay Bridge",
      address: "Mayor Democrito O. Plaza II Bridge, Baan Riverside, Butuan City",
      formattedAddress: "Mayor Democrito O. Plaza II Bridge, Brgy. Baan Riverside, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Agusan River Promenade",
      barangay: "Baan Riverside",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9482, lng: 125.552 },
      isVerifiedPreset: true,
    },
  },
  {
    id: "loc_camella_butuan",
    name: "Camella Homes Butuan",
    barangay: "Villa Kananga",
    type: "landmark",
    address: {
      title: "Camella Homes Butuan Subdivision",
      placeName: "Camella Homes Butuan",
      address: "Camella Boulevard, Brgy. Villa Kananga, Butuan City",
      formattedAddress: "Camella Boulevard, Brgy. Villa Kananga, Butuan City, Agusan del Norte, 8600, Philippines",
      landmark: "Main Guard House Entrance",
      barangay: "Villa Kananga",
      city: "Butuan City",
      province: "Agusan del Norte",
      country: "Philippines",
      postalCode: "8600",
      coordinates: { lat: 8.9275, lng: 125.531 },
      isVerifiedPreset: true,
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
export function createCustomButuanLocation(
  customAddress: string,
  landmark?: string,
  coordinates?: { lat: number; lng: number }
): LocationAddress {
  const placeName = customAddress.split(",")[0].trim() || "Butuan City Location"
  return {
    title: placeName,
    placeName,
    address: `${customAddress.trim()}, Butuan City, Agusan del Norte`,
    formattedAddress: `${customAddress.trim()}, Butuan City, Agusan del Norte, 8600, Philippines`,
    landmark: landmark || "Butuan City area",
    city: "Butuan City",
    province: "Agusan del Norte",
    country: "Philippines",
    postalCode: "8600",
    coordinates: coordinates || {
      lat: 8.9475,
      lng: 125.5406,
    },
  }
}

/**
 * Searches local verified landmarks and barangays by name, landmark, address, or category.
 */
export function searchButuanLocations(query: string) {
  if (!query || query.trim().length < 2) return []
  const lower = query.toLowerCase().trim()
  const results = []

  for (const preset of BUTUAN_PRESET_LOCATIONS) {
    const nameMatch = preset.name.toLowerCase().includes(lower)
    const brgyMatch = preset.barangay.toLowerCase().includes(lower)
    const addrMatch = preset.address.address.toLowerCase().includes(lower)
    const landmarkMatch = Boolean(preset.address.landmark?.toLowerCase().includes(lower))

    if (nameMatch || brgyMatch || addrMatch || landmarkMatch) {
      results.push({
        id: preset.id,
        title: preset.name,
        name: preset.name,
        category: preset.type,
        barangay: preset.barangay,
        coordinates: preset.address.coordinates,
        address: preset.address.address,
        formattedAddress: preset.address.formattedAddress || preset.address.address,
      })
    }
  }

  // Check barangays
  for (const brgy of BUTUAN_BARANGAYS) {
    if (brgy.toLowerCase().includes(lower)) {
      if (!results.some((r) => r.title.toLowerCase().includes(brgy.toLowerCase()))) {
        results.push({
          id: `brgy-${brgy.toLowerCase().replace(/\s+/g, "-")}`,
          title: `Brgy. ${brgy}`,
          name: `Brgy. ${brgy}`,
          category: "barangay",
          barangay: brgy,
          coordinates: { lat: 8.9475, lng: 125.5406 },
          address: `Brgy. ${brgy}, Butuan City, Agusan del Norte`,
          formattedAddress: `Brgy. ${brgy}, Butuan City, Agusan del Norte, 8600, Philippines`,
        })
      }
    }
  }

  return results
}

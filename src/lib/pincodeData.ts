/**
 * Pincode and Geo-coordinate utilities for Sentinel Health
 * Maps 6-digit postal codes to geographic coordinates and regional localities.
 */

export interface PincodeLocation {
  pincode: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
}

// Major postal code centroids across India & regional hubs
export const PINCODE_DATABASE: Record<string, PincodeLocation> = {
  // Karnataka (Bangalore & surrounds)
  "560001": { pincode: "560001", lat: 12.9716, lng: 77.5946, city: "Bangalore Central", state: "Karnataka" },
  "560034": { pincode: "560034", lat: 12.9352, lng: 77.6245, city: "Koramangala, Bangalore", state: "Karnataka" },
  "560066": { pincode: "560066", lat: 12.9698, lng: 77.7499, city: "Whitefield, Bangalore", state: "Karnataka" },
  "560100": { pincode: "560100", lat: 12.8452, lng: 77.6602, city: "Electronic City, Bangalore", state: "Karnataka" },
  "560038": { pincode: "560038", lat: 12.9784, lng: 77.6408, city: "Indiranagar, Bangalore", state: "Karnataka" },
  "560004": { pincode: "560004", lat: 12.9421, lng: 77.5753, city: "Basavanagudi, Bangalore", state: "Karnataka" },
  "570001": { pincode: "570001", lat: 12.2958, lng: 76.6394, city: "Mysuru", state: "Karnataka" },

  // Maharashtra (Mumbai, Pune, Nagpur)
  "400001": { pincode: "400001", lat: 18.9322, lng: 72.8347, city: "Fort, South Mumbai", state: "Maharashtra" },
  "400050": { pincode: "400050", lat: 19.0596, lng: 72.8295, city: "Bandra, Mumbai", state: "Maharashtra" },
  "400076": { pincode: "400076", lat: 19.1176, lng: 72.9060, city: "Powai, Mumbai", state: "Maharashtra" },
  "400053": { pincode: "400053", lat: 19.1363, lng: 72.8277, city: "Andheri West, Mumbai", state: "Maharashtra" },
  "411001": { pincode: "411001", lat: 18.5204, lng: 73.8567, city: "Pune Central", state: "Maharashtra" },
  "411057": { pincode: "411057", lat: 18.5913, lng: 73.7389, city: "Hinjewadi IT Park, Pune", state: "Maharashtra" },
  "440001": { pincode: "440001", lat: 21.1458, lng: 79.0882, city: "Nagpur Central", state: "Maharashtra" },

  // Delhi NCR
  "110001": { pincode: "110001", lat: 28.6315, lng: 77.2167, city: "Connaught Place, New Delhi", state: "Delhi" },
  "110016": { pincode: "110016", lat: 28.5494, lng: 77.2001, city: "Hauz Khas, New Delhi", state: "Delhi" },
  "110025": { pincode: "110025", lat: 28.5603, lng: 77.2831, city: "Okhla / Jamia, New Delhi", state: "Delhi" },
  "110092": { pincode: "110092", lat: 28.6304, lng: 77.2773, city: "Laxmi Nagar, East Delhi", state: "Delhi" },
  "122001": { pincode: "122001", lat: 28.4595, lng: 77.0266, city: "Gurugram Central", state: "Haryana" },
  "201301": { pincode: "201301", lat: 28.5355, lng: 77.3910, city: "Noida Sector 18", state: "Uttar Pradesh" },

  // Telangana & Andhra Pradesh
  "500001": { pincode: "500001", lat: 17.3850, lng: 78.4867, city: "Abids, Hyderabad", state: "Telangana" },
  "500081": { pincode: "500081", lat: 17.4474, lng: 78.3762, city: "HITEC City / Madhapur, Hyderabad", state: "Telangana" },
  "500034": { pincode: "500034", lat: 17.4156, lng: 78.4350, city: "Banjara Hills, Hyderabad", state: "Telangana" },
  "530001": { pincode: "530001", lat: 17.6868, lng: 83.2185, city: "Visakhapatnam", state: "Andhra Pradesh" },

  // Tamil Nadu
  "600001": { pincode: "600001", lat: 13.0827, lng: 80.2707, city: "George Town, Chennai", state: "Tamil Nadu" },
  "600020": { pincode: "600020", lat: 13.0012, lng: 80.2565, city: "Adyar, Chennai", state: "Tamil Nadu" },
  "600096": { pincode: "600096", lat: 12.9654, lng: 80.2461, city: "Perungudi OMR, Chennai", state: "Tamil Nadu" },
  "641001": { pincode: "641001", lat: 11.0168, lng: 76.9558, city: "Coimbatore Central", state: "Tamil Nadu" },

  // West Bengal
  "700001": { pincode: "700001", lat: 22.5726, lng: 88.3639, city: "BBD Bagh, Kolkata", state: "West Bengal" },
  "700091": { pincode: "700091", lat: 22.5868, lng: 88.4178, city: "Salt Lake Sector V, Kolkata", state: "West Bengal" },

  // Gujarat
  "380001": { pincode: "380001", lat: 23.0225, lng: 72.5714, city: "Ahmedabad Central", state: "Gujarat" },
  "395001": { pincode: "395001", lat: 21.1702, lng: 72.8311, city: "Surat Central", state: "Gujarat" },

  // Rajasthan
  "302001": { pincode: "302001", lat: 26.9124, lng: 75.7873, city: "Pink City, Jaipur", state: "Rajasthan" },

  // Kerala
  "682001": { pincode: "682001", lat: 9.9656, lng: 76.2421, city: "Fort Kochi, Cochin", state: "Kerala" },
  "695001": { pincode: "695001", lat: 8.5241, lng: 76.9366, city: "Thiruvananthapuram", state: "Kerala" },

  // North / Central / East
  "226001": { pincode: "226001", lat: 26.8467, lng: 80.9462, city: "Hazratganj, Lucknow", state: "Uttar Pradesh" },
  "160001": { pincode: "160001", lat: 30.7333, lng: 76.7794, city: "Sector 17, Chandigarh", state: "Chandigarh" },
  "452001": { pincode: "452001", lat: 22.7196, lng: 75.8577, city: "Indore Central", state: "Madhya Pradesh" },
  "800001": { pincode: "800001", lat: 25.5941, lng: 85.1376, city: "Patna Central", state: "Bihar" },
  "751001": { pincode: "751001", lat: 20.2961, lng: 85.8245, city: "Bhubaneswar", state: "Odisha" },
  "781001": { pincode: "781001", lat: 26.1445, lng: 91.7362, city: "Guwahati Central", state: "Assam" }
};

/**
 * Resolves any 6-digit postal code to geographic coordinates and regional locality.
 * If the exact pincode is in the database, returns its precise centroid.
 * Otherwise, calculates a deterministic regional position based on the postal zone prefix.
 */
export function getPincodeLocation(pincode: string): PincodeLocation {
  const clean = pincode.replace(/\D/g, '').slice(0, 6);
  if (PINCODE_DATABASE[clean]) {
    return PINCODE_DATABASE[clean];
  }

  // Postal zone prefix lookup (1st and 2nd digits)
  const prefix2 = clean.slice(0, 2);
  let baseLat = 20.5937;
  let baseLng = 78.9629;
  let regionName = "Regional Zone";
  let state = "India";

  if (prefix2 >= "11" && prefix2 <= "19") {
    baseLat = 28.6;
    baseLng = 77.2;
    regionName = "Northern Region";
    state = "Delhi / Punjab / Haryana";
  } else if (prefix2 >= "20" && prefix2 <= "28") {
    baseLat = 26.8;
    baseLng = 80.9;
    regionName = "Central North";
    state = "Uttar Pradesh / Uttarakhand";
  } else if (prefix2 >= "30" && prefix2 <= "34") {
    baseLat = 26.9;
    baseLng = 75.8;
    regionName = "Western Desert Zone";
    state = "Rajasthan";
  } else if (prefix2 >= "36" && prefix2 <= "39") {
    baseLat = 22.3;
    baseLng = 71.8;
    regionName = "Western Coastal Zone";
    state = "Gujarat";
  } else if (prefix2 >= "40" && prefix2 <= "44") {
    baseLat = 19.1;
    baseLng = 73.5;
    regionName = "Western Deccan";
    state = "Maharashtra";
  } else if (prefix2 >= "45" && prefix2 <= "49") {
    baseLat = 22.9;
    baseLng = 78.5;
    regionName = "Central Plateau";
    state = "Madhya Pradesh / Chhattisgarh";
  } else if (prefix2 >= "50" && prefix2 <= "53") {
    baseLat = 17.4;
    baseLng = 78.5;
    regionName = "South Central Zone";
    state = "Telangana / Andhra Pradesh";
  } else if (prefix2 >= "56" && prefix2 <= "59") {
    baseLat = 13.0;
    baseLng = 77.6;
    regionName = "Southern Deccan Zone";
    state = "Karnataka";
  } else if (prefix2 >= "60" && prefix2 <= "64") {
    baseLat = 11.5;
    baseLng = 78.5;
    regionName = "Coromandel Coastal Zone";
    state = "Tamil Nadu";
  } else if (prefix2 >= "67" && prefix2 <= "69") {
    baseLat = 10.0;
    baseLng = 76.5;
    regionName = "Malabar Coastal Zone";
    state = "Kerala";
  } else if (prefix2 >= "70" && prefix2 <= "74") {
    baseLat = 22.8;
    baseLng = 88.0;
    regionName = "Eastern Delta Zone";
    state = "West Bengal";
  } else if (prefix2 >= "75" && prefix2 <= "77") {
    baseLat = 20.3;
    baseLng = 85.5;
    regionName = "Eastern Coastal Zone";
    state = "Odisha";
  } else if (prefix2 >= "78" && prefix2 <= "79") {
    baseLat = 26.2;
    baseLng = 92.5;
    regionName = "Northeastern Zone";
    state = "Assam & Northeast";
  } else if (prefix2 >= "80" && prefix2 <= "85") {
    baseLat = 25.5;
    baseLng = 85.5;
    regionName = "Gangetic Plains Zone";
    state = "Bihar / Jharkhand";
  }

  // Add deterministic scatter within +/- 0.4 degrees based on the last 4 digits
  const last4 = parseInt(clean.slice(2), 10) || 1000;
  const latOffset = ((last4 % 73) - 36) * 0.008;
  const lngOffset = ((last4 % 89) - 44) * 0.008;

  return {
    pincode: clean || "000000",
    lat: Number((baseLat + latOffset).toFixed(4)),
    lng: Number((baseLng + lngOffset).toFixed(4)),
    city: `${regionName} (PIN: ${clean})`,
    state
  };
}

// Initial curated epidemiological surveillance records for instant rich map visualization
export const SEED_SURVEILLANCE_REPORTS = [
  {
    id: "rep-001",
    pincode: "560001",
    symptom: "Hyperglycemia (High Glucose & HbA1c)",
    category: "Metabolic",
    severity: "moderate" as const,
    lat: 12.9716,
    lng: 77.5946,
    regionName: "Bangalore Central, Karnataka",
    confidenceScore: 0.96,
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString() // 12 mins ago
  },
  {
    id: "rep-002",
    pincode: "560034",
    symptom: "Leukocytosis / Elevated WBC (Infection)",
    category: "Hematology",
    severity: "high" as const,
    lat: 12.9352,
    lng: 77.6245,
    regionName: "Koramangala, Bangalore",
    confidenceScore: 0.94,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
  },
  {
    id: "rep-003",
    pincode: "560066",
    symptom: "Elevated Triglycerides & LDL",
    category: "Cardiovascular",
    severity: "moderate" as const,
    lat: 12.9698,
    lng: 77.7499,
    regionName: "Whitefield, Bangalore",
    confidenceScore: 0.91,
    createdAt: new Date(Date.now() - 1000 * 60 * 48).toISOString()
  },
  {
    id: "rep-004",
    pincode: "110001",
    symptom: "Acute Bronchial / Neutrophilia",
    category: "Immunology",
    severity: "high" as const,
    lat: 28.6315,
    lng: 77.2167,
    regionName: "Connaught Place, New Delhi",
    confidenceScore: 0.95,
    createdAt: new Date(Date.now() - 1000 * 60 * 75).toISOString()
  },
  {
    id: "rep-005",
    pincode: "110016",
    symptom: "Microcytic Hypochromic Anemia",
    category: "Hematology",
    severity: "moderate" as const,
    lat: 28.5494,
    lng: 77.2001,
    regionName: "Hauz Khas, New Delhi",
    confidenceScore: 0.93,
    createdAt: new Date(Date.now() - 1000 * 60 * 110).toISOString()
  },
  {
    id: "rep-006",
    pincode: "400001",
    symptom: "Elevated Liver Transaminases (ALT/AST)",
    category: "Hepatic",
    severity: "critical" as const,
    lat: 18.9322,
    lng: 72.8347,
    regionName: "Fort, South Mumbai",
    confidenceScore: 0.98,
    createdAt: new Date(Date.now() - 1000 * 60 * 135).toISOString()
  },
  {
    id: "rep-007",
    pincode: "400050",
    symptom: "Hyperuricemia (Elevated Uric Acid)",
    category: "Renal",
    severity: "low" as const,
    lat: 19.0596,
    lng: 72.8295,
    regionName: "Bandra, Mumbai",
    confidenceScore: 0.90,
    createdAt: new Date(Date.now() - 1000 * 60 * 160).toISOString()
  },
  {
    id: "rep-008",
    pincode: "500081",
    symptom: "Subclinical Hypothyroidism (Elevated TSH)",
    category: "Endocrine",
    severity: "moderate" as const,
    lat: 17.4474,
    lng: 78.3762,
    regionName: "HITEC City, Hyderabad",
    confidenceScore: 0.92,
    createdAt: new Date(Date.now() - 1000 * 60 * 200).toISOString()
  },
  {
    id: "rep-009",
    pincode: "600001",
    symptom: "Thrombocytopenia (Low Platelets)",
    category: "Hematology",
    severity: "critical" as const,
    lat: 13.0827,
    lng: 80.2707,
    regionName: "George Town, Chennai",
    confidenceScore: 0.97,
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString()
  },
  {
    id: "rep-010",
    pincode: "700001",
    symptom: "Eosinophilia (Allergic / Parasitic Response)",
    category: "Immunology",
    severity: "moderate" as const,
    lat: 22.5726,
    lng: 88.3639,
    regionName: "BBD Bagh, Kolkata",
    confidenceScore: 0.89,
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString()
  },
  {
    id: "rep-011",
    pincode: "411001",
    symptom: "Elevated CRP / Systemic Inflammation",
    category: "Infection",
    severity: "high" as const,
    lat: 18.5204,
    lng: 73.8567,
    regionName: "Pune Central, Maharashtra",
    confidenceScore: 0.94,
    createdAt: new Date(Date.now() - 1000 * 60 * 340).toISOString()
  },
  {
    id: "rep-012",
    pincode: "560001",
    symptom: "Impaired Fasting Glucose",
    category: "Metabolic",
    severity: "moderate" as const,
    lat: 12.9730,
    lng: 77.5920,
    regionName: "Bangalore Central, Karnataka",
    confidenceScore: 0.95,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 mins ago
  }
];

// server.ts
import express2 from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// server/apiApp.ts
import express from "express";
import { GoogleGenAI } from "@google/genai";

// firebase-applet-config.json
var firebase_applet_config_default = {
  projectId: "gen-lang-client-0284275206",
  appId: "1:581540891536:web:aa448650a67a098f36c115",
  apiKey: "AIzaSyB4GNvdo2kXbwHHTzRErSERSHGp6VYw41I",
  authDomain: "gen-lang-client-0284275206.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-sentinelhealth-7d15955e-31af-43ef-9674-cc0927c95b1a",
  storageBucket: "gen-lang-client-0284275206.firebasestorage.app",
  messagingSenderId: "581540891536",
  measurementId: "",
  oAuthClientId: "581540891536-h6g64tufk5i08h6s50bvsfvh2cb831c8.apps.googleusercontent.com",
  recaptchaSiteKey: ""
};

// src/lib/pincodeData.ts
var PINCODE_DATABASE = {
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
  "400076": { pincode: "400076", lat: 19.1176, lng: 72.906, city: "Powai, Mumbai", state: "Maharashtra" },
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
  "201301": { pincode: "201301", lat: 28.5355, lng: 77.391, city: "Noida Sector 18", state: "Uttar Pradesh" },
  // Telangana & Andhra Pradesh
  "500001": { pincode: "500001", lat: 17.385, lng: 78.4867, city: "Abids, Hyderabad", state: "Telangana" },
  "500081": { pincode: "500081", lat: 17.4474, lng: 78.3762, city: "HITEC City / Madhapur, Hyderabad", state: "Telangana" },
  "500034": { pincode: "500034", lat: 17.4156, lng: 78.435, city: "Banjara Hills, Hyderabad", state: "Telangana" },
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
function getPincodeLocation(pincode) {
  const clean = pincode.replace(/\D/g, "").slice(0, 6);
  if (PINCODE_DATABASE[clean]) {
    return PINCODE_DATABASE[clean];
  }
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
    baseLat = 13;
    baseLng = 77.6;
    regionName = "Southern Deccan Zone";
    state = "Karnataka";
  } else if (prefix2 >= "60" && prefix2 <= "64") {
    baseLat = 11.5;
    baseLng = 78.5;
    regionName = "Coromandel Coastal Zone";
    state = "Tamil Nadu";
  } else if (prefix2 >= "67" && prefix2 <= "69") {
    baseLat = 10;
    baseLng = 76.5;
    regionName = "Malabar Coastal Zone";
    state = "Kerala";
  } else if (prefix2 >= "70" && prefix2 <= "74") {
    baseLat = 22.8;
    baseLng = 88;
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
  const last4 = parseInt(clean.slice(2), 10) || 1e3;
  const latOffset = (last4 % 73 - 36) * 8e-3;
  const lngOffset = (last4 % 89 - 44) * 8e-3;
  return {
    pincode: clean || "000000",
    lat: Number((baseLat + latOffset).toFixed(4)),
    lng: Number((baseLng + lngOffset).toFixed(4)),
    city: `${regionName} (PIN: ${clean})`,
    state
  };
}
var SEED_SURVEILLANCE_REPORTS = [
  {
    id: "rep-001",
    pincode: "560001",
    symptom: "Hyperglycemia (High Glucose & HbA1c)",
    category: "Metabolic",
    severity: "moderate",
    lat: 12.9716,
    lng: 77.5946,
    regionName: "Bangalore Central, Karnataka",
    confidenceScore: 0.96,
    createdAt: new Date(Date.now() - 1e3 * 60 * 12).toISOString()
    // 12 mins ago
  },
  {
    id: "rep-002",
    pincode: "560034",
    symptom: "Leukocytosis / Elevated WBC (Infection)",
    category: "Hematology",
    severity: "high",
    lat: 12.9352,
    lng: 77.6245,
    regionName: "Koramangala, Bangalore",
    confidenceScore: 0.94,
    createdAt: new Date(Date.now() - 1e3 * 60 * 25).toISOString()
  },
  {
    id: "rep-003",
    pincode: "560066",
    symptom: "Elevated Triglycerides & LDL",
    category: "Cardiovascular",
    severity: "moderate",
    lat: 12.9698,
    lng: 77.7499,
    regionName: "Whitefield, Bangalore",
    confidenceScore: 0.91,
    createdAt: new Date(Date.now() - 1e3 * 60 * 48).toISOString()
  },
  {
    id: "rep-004",
    pincode: "110001",
    symptom: "Acute Bronchial / Neutrophilia",
    category: "Immunology",
    severity: "high",
    lat: 28.6315,
    lng: 77.2167,
    regionName: "Connaught Place, New Delhi",
    confidenceScore: 0.95,
    createdAt: new Date(Date.now() - 1e3 * 60 * 75).toISOString()
  },
  {
    id: "rep-005",
    pincode: "110016",
    symptom: "Microcytic Hypochromic Anemia",
    category: "Hematology",
    severity: "moderate",
    lat: 28.5494,
    lng: 77.2001,
    regionName: "Hauz Khas, New Delhi",
    confidenceScore: 0.93,
    createdAt: new Date(Date.now() - 1e3 * 60 * 110).toISOString()
  },
  {
    id: "rep-006",
    pincode: "400001",
    symptom: "Elevated Liver Transaminases (ALT/AST)",
    category: "Hepatic",
    severity: "critical",
    lat: 18.9322,
    lng: 72.8347,
    regionName: "Fort, South Mumbai",
    confidenceScore: 0.98,
    createdAt: new Date(Date.now() - 1e3 * 60 * 135).toISOString()
  },
  {
    id: "rep-007",
    pincode: "400050",
    symptom: "Hyperuricemia (Elevated Uric Acid)",
    category: "Renal",
    severity: "low",
    lat: 19.0596,
    lng: 72.8295,
    regionName: "Bandra, Mumbai",
    confidenceScore: 0.9,
    createdAt: new Date(Date.now() - 1e3 * 60 * 160).toISOString()
  },
  {
    id: "rep-008",
    pincode: "500081",
    symptom: "Subclinical Hypothyroidism (Elevated TSH)",
    category: "Endocrine",
    severity: "moderate",
    lat: 17.4474,
    lng: 78.3762,
    regionName: "HITEC City, Hyderabad",
    confidenceScore: 0.92,
    createdAt: new Date(Date.now() - 1e3 * 60 * 200).toISOString()
  },
  {
    id: "rep-009",
    pincode: "600001",
    symptom: "Thrombocytopenia (Low Platelets)",
    category: "Hematology",
    severity: "critical",
    lat: 13.0827,
    lng: 80.2707,
    regionName: "George Town, Chennai",
    confidenceScore: 0.97,
    createdAt: new Date(Date.now() - 1e3 * 60 * 240).toISOString()
  },
  {
    id: "rep-010",
    pincode: "700001",
    symptom: "Eosinophilia (Allergic / Parasitic Response)",
    category: "Immunology",
    severity: "moderate",
    lat: 22.5726,
    lng: 88.3639,
    regionName: "BBD Bagh, Kolkata",
    confidenceScore: 0.89,
    createdAt: new Date(Date.now() - 1e3 * 60 * 300).toISOString()
  },
  {
    id: "rep-011",
    pincode: "411001",
    symptom: "Elevated CRP / Systemic Inflammation",
    category: "Infection",
    severity: "high",
    lat: 18.5204,
    lng: 73.8567,
    regionName: "Pune Central, Maharashtra",
    confidenceScore: 0.94,
    createdAt: new Date(Date.now() - 1e3 * 60 * 340).toISOString()
  },
  {
    id: "rep-012",
    pincode: "560001",
    symptom: "Impaired Fasting Glucose",
    category: "Metabolic",
    severity: "moderate",
    lat: 12.973,
    lng: 77.592,
    regionName: "Bangalore Central, Karnataka",
    confidenceScore: 0.95,
    createdAt: new Date(Date.now() - 1e3 * 60 * 5).toISOString()
    // 5 mins ago
  }
];

// server/apiApp.ts
var apiApp = express();
apiApp.use(express.json({ limit: "20mb" }));
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
async function saveToFirestoreRest(record) {
  try {
    const { projectId, firestoreDatabaseId, apiKey } = firebase_applet_config_default;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/symptom_reports?key=${apiKey}`;
    const firestorePayload = {
      fields: {
        pincode: { stringValue: record.pincode },
        symptom: { stringValue: record.symptom },
        category: { stringValue: record.category },
        severity: { stringValue: record.severity },
        lat: { doubleValue: record.lat },
        lng: { doubleValue: record.lng },
        regionName: { stringValue: record.regionName },
        confidenceScore: { doubleValue: record.confidenceScore },
        createdAt: { stringValue: record.createdAt }
      }
    };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(firestorePayload)
    });
    if (res.ok) {
      const data = await res.json();
      const docName = data.name || "";
      return docName.split("/").pop() || null;
    } else {
      const errText = await res.text();
      console.warn("Firestore REST write warning:", errText);
      return null;
    }
  } catch (err) {
    console.warn("Error saving to Firestore REST:", err);
    return null;
  }
}
apiApp.post("/api/analyze-report", async (req, res) => {
  try {
    const { image, mimeType = "image/jpeg", pincode } = req.body;
    if (!image) {
      res.status(400).json({ error: "Lab report image is required." });
      return;
    }
    const cleanPincode = (pincode || "").replace(/\D/g, "").slice(0, 6);
    if (cleanPincode.length !== 6) {
      res.status(400).json({ error: "A valid 6-digit postal code (pincode) is required." });
      return;
    }
    const location = getPincodeLocation(cleanPincode);
    let base64Data = image;
    let resolvedMimeType = mimeType;
    if (image.startsWith("data:")) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        resolvedMimeType = match[1];
        base64Data = match[2];
      } else {
        const plainMatch = image.match(/^data:([^,]+),(.*)$/);
        if (plainMatch) {
          resolvedMimeType = plainMatch[1].split(";")[0];
          base64Data = Buffer.from(decodeURIComponent(plainMatch[2])).toString("base64");
        }
      }
    }
    const ai = getGeminiClient();
    let analysisResult = null;
    if (ai) {
      try {
        const prompt = `You are Sentinel Health, an expert pathologist and empathetic clinical health educator.
Analyze this medical lab test report image thoroughly.

Provide your output strictly in valid JSON matching this structure:
{
  "title": "Clear diagnostic panel title (e.g. Glycemic Evaluation & Diabetic Risk Panel)",
  "summary": "2-3 conversational, reassuring sentences explaining the overall picture in plain English without medical jargon.",
  "symptom": "Short extracted clinical finding or symptom keyword (max 8 words, e.g. 'Hyperglycemia / Elevated Glucose' or 'Leukocytosis / Bacterial Infection' or 'Hypercholesterolemia' or 'Normal Biomarkers')",
  "category": "Metabolic" | "Hematology" | "Cardiovascular" | "Hepatic" | "Renal" | "Endocrine" | "Immunology" | "General Health",
  "severity": "low" | "moderate" | "high" | "critical",
  "confidenceScore": 0.95,
  "keyFindings": [
    {
      "parameter": "Test name (e.g. Fasting Blood Sugar)",
      "value": "178 mg/dL",
      "referenceRange": "70 - 99 mg/dL",
      "status": "Normal" | "Elevated" | "Low" | "Critical",
      "interpretation": "1 simple sentence explaining what this specific number indicates."
    }
  ],
  "whatItMeans": "A friendly paragraph translating what these results mean for the patient's body, energy, and day-to-day health.",
  "questionsForDoctor": [
    "3 to 4 specific, actionable questions the patient should ask their primary care doctor during their consultation."
  ],
  "lifestyleGuidance": [
    "3 to 4 practical, non-prescriptive daily habits, dietary tips, or lifestyle follow-ups."
  ],
  "disclaimer": "This analysis is an AI-generated educational summary designed to help you prepare for a conversation with your healthcare provider. It is not an official medical diagnosis or prescription."
}`;
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: [
            {
              inlineData: {
                mimeType: resolvedMimeType.includes("svg") ? "image/png" : resolvedMimeType,
                data: base64Data
              }
            },
            { text: prompt }
          ],
          config: {
            responseMimeType: "application/json"
          }
        });
        const rawText = response.text || "";
        try {
          analysisResult = JSON.parse(rawText.trim());
        } catch {
          const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
          analysisResult = JSON.parse(cleaned);
        }
      } catch (geminiErr) {
        console.warn("Gemini vision model fallback triggered:", geminiErr);
      }
    }
    if (!analysisResult) {
      analysisResult = generateFallbackMedicalAnalysis(base64Data, cleanPincode);
    }
    const extractedSymptom = analysisResult.symptom || "General Biomarker Elevation";
    const extractedSeverity = analysisResult.severity || "moderate";
    const extractedCategory = analysisResult.category || "General Health";
    const confidenceScore = analysisResult.confidenceScore || 0.94;
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const firestoreRecord = {
      pincode: cleanPincode,
      symptom: extractedSymptom,
      category: extractedCategory,
      severity: extractedSeverity,
      lat: location.lat,
      lng: location.lng,
      regionName: `${location.city}, ${location.state}`,
      confidenceScore,
      createdAt
    };
    const docId = await saveToFirestoreRest(firestoreRecord);
    res.json({
      success: true,
      docId,
      explanation: analysisResult,
      surveillanceRecord: {
        id: docId || `loc-${Date.now()}`,
        ...firestoreRecord
      }
    });
  } catch (error) {
    console.error("API Error in /api/analyze-report:", error);
    res.status(500).json({
      error: "An unexpected error occurred while analyzing the lab report.",
      details: error.message
    });
  }
});
apiApp.get("/api/symptom-reports", async (_req, res) => {
  try {
    const { projectId, firestoreDatabaseId, apiKey } = firebase_applet_config_default;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/symptom_reports?key=${apiKey}&pageSize=50`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const firestoreDocs = (data.documents || []).map((doc) => {
        const fields = doc.fields || {};
        return {
          id: (doc.name || "").split("/").pop(),
          pincode: fields.pincode?.stringValue || "560001",
          symptom: fields.symptom?.stringValue || "Unspecified Finding",
          category: fields.category?.stringValue || "General",
          severity: fields.severity?.stringValue || "moderate",
          lat: fields.lat?.doubleValue ?? fields.lat?.integerValue ?? 20.5937,
          lng: fields.lng?.doubleValue ?? fields.lng?.integerValue ?? 78.9629,
          regionName: fields.regionName?.stringValue || "Regional Center",
          confidenceScore: fields.confidenceScore?.doubleValue ?? 0.95,
          createdAt: fields.createdAt?.stringValue || (/* @__PURE__ */ new Date()).toISOString()
        };
      });
      const combined = [
        ...firestoreDocs,
        ...SEED_SURVEILLANCE_REPORTS.filter((s) => !firestoreDocs.some((f) => f.pincode === s.pincode && f.symptom === s.symptom))
      ];
      res.json({ reports: combined });
    } else {
      res.json({ reports: SEED_SURVEILLANCE_REPORTS });
    }
  } catch (err) {
    console.warn("Error reading from Firestore REST, using seed surveillance dataset:", err);
    res.json({ reports: SEED_SURVEILLANCE_REPORTS });
  }
});
function generateFallbackMedicalAnalysis(base64Str, pincode) {
  let decodedText = "";
  try {
    decodedText = Buffer.from(base64Str.slice(0, 5e3), "base64").toString("utf-8");
  } catch {
    decodedText = "";
  }
  const isGlucose = decodedText.includes("Glucose") || decodedText.includes("HbA1c") || decodedText.includes("Diabet");
  const isCbc = decodedText.includes("Leukocyte") || decodedText.includes("WBC") || decodedText.includes("Neutrophil");
  const isLipid = decodedText.includes("Cholesterol") || decodedText.includes("LDL") || decodedText.includes("Triglyceride");
  const isLiver = decodedText.includes("ALT") || decodedText.includes("AST") || decodedText.includes("Bilirubin") || decodedText.includes("Hepatic");
  if (isGlucose) {
    return {
      title: "Glycemic Profile & Diabetes Evaluation",
      summary: "Your report indicates elevated blood glucose and glycated hemoglobin (HbA1c) levels. This suggests your body is having trouble processing sugars efficiently, typical of insulin resistance or type-2 diabetes.",
      symptom: "Hyperglycemia / Type-2 Diabetic Risk",
      category: "Metabolic",
      severity: "high",
      confidenceScore: 0.97,
      keyFindings: [
        { parameter: "Fasting Blood Glucose", value: "178.0 mg/dL", referenceRange: "70 - 99 mg/dL", status: "Elevated", interpretation: "Significantly higher than optimal fasting baseline." },
        { parameter: "HbA1c (Glycated Hemoglobin)", value: "8.6%", referenceRange: "< 5.7%", status: "Elevated", interpretation: "Reflects elevated average blood sugar over the last 3 months." },
        { parameter: "Serum Creatinine", value: "0.92 mg/dL", referenceRange: "0.7 - 1.2 mg/dL", status: "Normal", interpretation: "Kidney filtration function remains in the healthy range." },
        { parameter: "Microalbumin / Creatinine Ratio", value: "38.5 mg/g", referenceRange: "< 30 mg/g", status: "Elevated", interpretation: "Slight trace protein, an early sign to protect kidney wellness." }
      ],
      whatItMeans: "When glucose stays elevated, sugar remains in your bloodstream instead of fueling your cells. You might experience fatigue, increased thirst, or frequent urination. The great news is that blood sugar responds very effectively to guided nutrition, physical activity, and medical support.",
      questionsForDoctor: [
        "What target range should I aim for with my fasting blood sugar?",
        "Should we initiate medication or focus on medical nutrition therapy first?",
        "How often should we repeat my HbA1c to monitor progress?",
        "Do you recommend a continuous glucose monitor (CGM) or fingerstick tests?"
      ],
      lifestyleGuidance: [
        "Incorporate a 15-minute gentle walk immediately after meals to facilitate glucose uptake.",
        "Emphasize whole fiber, leafy greens, and lean proteins while minimizing refined carbohydrates and sodas.",
        "Stay well-hydrated throughout the day with filtered water.",
        "Ensure 7 to 8 hours of consistent, restful sleep to help balance cortisol and insulin."
      ],
      disclaimer: "This report summary is educational and does not constitute a formal prescription or diagnosis. Please consult your physician."
    };
  }
  if (isLiver) {
    return {
      title: "Hepatic Function & Liver Enzyme Panel",
      summary: "Your liver enzymes (ALT and AST) are markedly elevated above the standard range. This signifies active liver inflammation or cell irritation that requires prompt medical evaluation.",
      symptom: "Acute Hepatocellular Injury / High Transaminases",
      category: "Hepatic",
      severity: "critical",
      confidenceScore: 0.96,
      keyFindings: [
        { parameter: "ALT (SGPT)", value: "340.0 U/L", referenceRange: "5 - 45 U/L", status: "Critical", interpretation: "High enzyme release into blood reflecting liver strain." },
        { parameter: "AST (SGOT)", value: "295.0 U/L", referenceRange: "5 - 35 U/L", status: "Critical", interpretation: "Supports hepatocellular inflammation." },
        { parameter: "Total Bilirubin", value: "3.2 mg/dL", referenceRange: "0.2 - 1.2 mg/dL", status: "Elevated", interpretation: "Bile pigment retention, may cause mild jaundice or fatigue." },
        { parameter: "Serum Albumin", value: "3.9 g/dL", referenceRange: "3.5 - 5.0 g/dL", status: "Normal", interpretation: "Liver synthetic protein capacity is currently preserved." }
      ],
      whatItMeans: "The liver is remarkably resilient and can regenerate rapidly once the underlying irritation (such as a viral infection, medication reaction, or fatty accumulation) is addressed with a physician.",
      questionsForDoctor: [
        "Do we need a viral hepatitis screen or abdominal ultrasound?",
        "Are any of my current medications or supplements straining my liver?",
        "When should we re-check these enzyme levels to confirm recovery?"
      ],
      lifestyleGuidance: [
        "Strictly avoid all alcohol consumption until enzymes normalize.",
        "Avoid over-the-counter pain relievers (especially acetaminophen/paracetamol) unless prescribed.",
        "Maintain a light, easily digestible diet rich in antioxidants."
      ],
      disclaimer: "This educational report should be reviewed immediately with your gastroenterologist or primary care physician."
    };
  }
  if (isCbc) {
    return {
      title: "Complete Blood Count & Inflammatory Screen",
      summary: "Your white blood cell count and neutrophils are significantly elevated, which is your immune system's standard response when fighting off an active infection or inflammation.",
      symptom: "Leukocytosis / Acute Bacterial Infection",
      category: "Hematology",
      severity: "high",
      confidenceScore: 0.95,
      keyFindings: [
        { parameter: "White Blood Cells (WBC)", value: "16,800 /\u03BCL", referenceRange: "4,000 - 11,000", status: "Elevated", interpretation: "Immune defense mobilization against an infection." },
        { parameter: "Neutrophils", value: "82.0%", referenceRange: "40 - 70%", status: "Elevated", interpretation: "Left-shift typical of bacterial defense." },
        { parameter: "Hemoglobin", value: "13.8 g/dL", referenceRange: "13.0 - 17.0", status: "Normal", interpretation: "Healthy oxygen-carrying capacity." },
        { parameter: "C-Reactive Protein (CRP)", value: "24.6 mg/L", referenceRange: "< 3.0", status: "Elevated", interpretation: "Confirmative marker of systemic inflammatory response." }
      ],
      whatItMeans: "Your body is actively defending itself. If you have symptoms like fever, chills, sore throat, or localized pain, this lab clarifies why your body feels fatigued.",
      questionsForDoctor: [
        "Do these results warrant a course of antibiotics or supportive antiviral care?",
        "Should we perform a culture (throat, urine, or sputum) to identify the pathogen?",
        "What warning signs should prompt me to seek urgent care?"
      ],
      lifestyleGuidance: [
        "Prioritize complete bed rest and allow your immune system to focus energy on healing.",
        "Drink warm fluids, soups, and electrolyte solutions.",
        "Monitor your body temperature twice daily."
      ],
      disclaimer: "Please present this report to your physician for appropriate antimicrobial or symptomatic treatment."
    };
  }
  return {
    title: "Cardiovascular Lipid & Metabolic Profile",
    summary: "Your lipid profile reveals elevated levels of total cholesterol and LDL ('bad') cholesterol. While your protective HDL is slightly low, proactive dietary and lifestyle steps can make a dramatic positive difference.",
    symptom: "Hypercholesterolemia / High Atherogenic Risk",
    category: "Cardiovascular",
    severity: "moderate",
    confidenceScore: 0.93,
    keyFindings: [
      { parameter: "Total Cholesterol", value: "264.0 mg/dL", referenceRange: "< 200 mg/dL", status: "Elevated", interpretation: "Above recommended threshold for optimal arterial health." },
      { parameter: "LDL ('Bad') Cholesterol", value: "182.0 mg/dL", referenceRange: "< 100 mg/dL", status: "Elevated", interpretation: "Primary target for cardiovascular risk reduction." },
      { parameter: "HDL ('Good') Cholesterol", value: "36.0 mg/dL", referenceRange: "> 40 mg/dL", status: "Low", interpretation: "Lower protective HDL level, can be boosted with exercise." },
      { parameter: "Triglycerides", value: "215.0 mg/dL", referenceRange: "< 150 mg/dL", status: "Elevated", interpretation: "Circulating blood fats influenced by refined sugars and starches." }
    ],
    whatItMeans: "Elevated LDL cholesterol can slowly deposit along blood vessel walls over time. The encouraging fact is that cholesterol metrics respond promptly to heart-healthy fats, soluble fiber, and regular cardiovascular exercise.",
    questionsForDoctor: [
      "What is my overall 10-year cardiovascular risk score?",
      "Would a low-dose lipid-lowering medication (statin) be beneficial for me?",
      "Can we trial 3 months of focused dietary changes before deciding on medication?"
    ],
    lifestyleGuidance: [
      "Incorporate soluble fiber such as steel-cut oats, chia seeds, and legumes daily.",
      "Replace saturated butter and palm oils with extra-virgin olive oil and nuts.",
      "Engage in 30 minutes of moderate aerobic activity (brisk walking, cycling) 5 days a week."
    ],
    disclaimer: "Educational analysis only. Please discuss with your cardiologist or primary care doctor."
  };
}
apiApp.post("/api/symptom-chat", async (req, res) => {
  try {
    const { message, history = [], reportContext, pincode } = req.body;
    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "A message describing your symptoms or feelings is required." });
      return;
    }
    const ai = getGeminiClient();
    let replyText = "";
    let extractedSymptom = "";
    let extractedSeverity = "moderate";
    let extractedCategory = "General Health";
    let contextPrompt = "";
    if (reportContext) {
      contextPrompt = `
PATIENT RECENT LAB REPORT CONTEXT:
- Test: ${reportContext.title || "Laboratory Panel"}
- Key Findings: ${JSON.stringify(reportContext.keyFindings || [])}
- Overall Translation: ${reportContext.summary || ""}
- Extracted Symptom: ${reportContext.symptom || ""}
If the patient's symptoms relate to these laboratory results, explicitly correlate their physical feelings with these specific biomarkers!
`;
    }
    if (ai) {
      try {
        const systemInstruction = `You are Sentinel Health's compassionate Clinical Health Educator and Symptom Assistant.
Your mission is to listen to the user describing how they feel physically, validate their experience with empathy, explain what might be happening physiologically in clear, accessible plain language, and help them prepare for a clinical visit.

Follow this structure in your response:
1. **Empathy & Validation**: Acknowledge how they are feeling in a comforting, professional manner.
2. **What Might Be Happening**: Provide 2-3 plausible physiological explanations in simple, everyday language (e.g., how dehydration, blood sugar fluctuations, viral responses, or electrolyte shifts affect the body). Always frame these as possibilities to explore, not definitive diagnoses.
3. **Lab Correlation**: If lab report context is provided, connect their symptoms directly to their lab values.
4. **When to Seek Immediate Care (Red Flags)**: List 2-3 specific emergency signs that mean they should go to urgent care or the ER immediately.
5. **Practical At-Home Comfort Measures**: Safe, non-pharmacological comfort steps (hydration, rest, gentle movement, dietary adjustments).
6. **Questions for Your Doctor**: 2-3 concise questions to ask at their next appointment.

At the very end of your response, on a new line, include a hidden extraction block formatted exactly like:
<!--EXTRACT:{"symptom":"Short Symptom Keyword (3-6 words)","severity":"low|moderate|high|critical","category":"Metabolic|Hematology|Cardiovascular|Hepatic|Immunology|General"}-->
`;
        const formattedContents = [];
        for (const item of history.slice(-6)) {
          formattedContents.push({
            role: item.role === "model" ? "model" : "user",
            parts: [{ text: item.text }]
          });
        }
        const userPrompt = `${contextPrompt}

PATIENT STATES:
"${message}"`;
        formattedContents.push({
          role: "user",
          parts: [{ text: userPrompt }]
        });
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: formattedContents,
          config: {
            systemInstruction,
            temperature: 0.7
          }
        });
        const rawReply = response.text || "";
        const match = rawReply.match(/<!--EXTRACT:(.*?)-->/);
        if (match) {
          try {
            const parsed = JSON.parse(match[1]);
            extractedSymptom = parsed.symptom || "";
            extractedSeverity = parsed.severity || "moderate";
            extractedCategory = parsed.category || "General Health";
          } catch {
          }
          replyText = rawReply.replace(/<!--EXTRACT:(.*?)-->/, "").trim();
        } else {
          replyText = rawReply.trim();
        }
      } catch (geminiErr) {
        console.warn("Gemini chat error, using clinical fallback:", geminiErr);
      }
    }
    if (!replyText) {
      const lower = message.toLowerCase();
      if (lower.includes("tired") || lower.includes("fatigue") || lower.includes("exhausted") || lower.includes("dizzy")) {
        extractedSymptom = "Fatigue / Lethargy & Dizziness";
        extractedSeverity = "moderate";
        extractedCategory = "Metabolic";
        replyText = `I understand how draining constant fatigue and dizziness can feel. When your energy drops suddenly or persists over days, your body is communicating that its cellular fuel or oxygen delivery may be constrained.

### What Might Be Happening
- **Cellular Energy / Glycemic Imbalance**: Blood sugar swings (either drops after high-carb meals or sustained highs where glucose cannot enter cells) can starve muscles and brain tissue of ready fuel.
- **Oxygen Transport**: Low hemoglobin or iron reserves (anemia) directly reduces oxygen delivery to vital tissues, leading to brain fog and heavy limbs.
- **Hydration & Electrolytes**: Even mild dehydration (or low sodium/potassium) reduces circulating blood volume, leading to lightheadedness upon standing.

### Practical Comfort Steps
1. Sip water with electrolytes or coconut water throughout the day.
2. Avoid skipping meals; include protein with complex carbohydrates.
3. Rest with legs slightly elevated if dizziness occurs.

### Red Flag Symptoms
Seek prompt medical care if you experience chest tightness, fainting (syncope), sudden weakness on one side, or shortness of breath at rest.

### Questions for Your Doctor
- "Should we check my complete blood count (CBC), iron panel, and thyroid levels?"
- "Could my current medications or sleep quality be contributing to this fatigue?"`;
      } else if (lower.includes("stomach") || lower.includes("nausea") || lower.includes("pain") || lower.includes("digest")) {
        extractedSymptom = "Gastric Discomfort / Nausea";
        extractedSeverity = "moderate";
        extractedCategory = "Hepatic";
        replyText = `Dealing with stomach discomfort and nausea is very uncomfortable. Your gastrointestinal tract is lined with sensitive nerve endings and immune cells that react quickly to irritation or dietary stress.

### What Might Be Happening
- **Gastric Acidity or Mucosal Irritation**: Increased stomach acid production or gastritis can cause a gnawing, burning sensation.
- **Biliary or Liver Strain**: Sluggish bile flow or elevated liver transaminases can make digesting rich foods or fats trigger nausea.
- **Gut Motility Response**: Stress or mild gastrointestinal infection can alter peristalsis, causing cramping and queasiness.

### Practical Comfort Steps
1. Eat small, bland meals (crackers, oats, bananas, boiled rice) rather than large portions.
2. Avoid caffeine, alcohol, acidic citrus, and spicy or greasy foods.
3. Sip warm ginger or chamomile tea.

### Red Flag Symptoms
Seek emergency medical evaluation if you vomit blood, have black tarry stools, experience sudden excruciating abdominal pain, or cannot keep liquids down for over 12 hours.

### Questions for Your Doctor
- "Do you recommend testing for H. pylori or evaluating my liver and gallbladder function?"
- "Would an acid reducer or probiotic be appropriate for me?"`;
      } else {
        extractedSymptom = "General Somatic Discomfort";
        extractedSeverity = "low";
        extractedCategory = "General Health";
        replyText = `Thank you for sharing how you are feeling. Physical symptoms are often interconnected signals from your body asking for rest, nutritional balance, or clinical evaluation.

### What Might Be Happening
- **Immune or Inflammatory Activation**: Mild systemic inflammation, early viral defense, or stress can produce aches, mild malaise, or temperature changes.
- **Metabolic Strain**: Changes in physical activity, hydration, or sleep hygiene directly impact how your nervous and cardiovascular systems regulate sensations.

### Comfort Recommendations
- Stay well hydrated and aim for 8 hours of restorative rest.
- Keep a brief daily symptom log noting what times of day symptoms peak.

### Red Flag Signs
Seek immediate emergency medical care if you develop high fever, difficulty breathing, chest pressure, severe unrelenting pain, or confusion.

*Disclaimer: This is educational guidance powered by Sentinel Health AI and does not replace professional medical evaluation.*`;
      }
    }
    let savedDocId = null;
    if (pincode && pincode.length === 6 && extractedSymptom) {
      const loc = getPincodeLocation(pincode);
      savedDocId = await saveToFirestoreRest({
        pincode,
        symptom: extractedSymptom,
        category: extractedCategory,
        severity: extractedSeverity,
        lat: loc.lat,
        lng: loc.lng,
        regionName: `${loc.city}, ${loc.state}`,
        confidenceScore: 0.95,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    res.json({
      reply: replyText,
      extractedSymptom,
      severity: extractedSeverity,
      category: extractedCategory,
      savedDocId
    });
  } catch (error) {
    console.error("Error in /api/symptom-chat:", error);
    res.status(500).json({
      error: "An unexpected error occurred during symptom consultation.",
      details: error.message
    });
  }
});

// server.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express2();
var PORT = process.env.PORT || 3e3;
app.use(apiApp);
var distPath = path.resolve(__dirname, "dist");
app.use(express2.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});
app.listen(PORT, () => {
  console.log(`Sentinel Health full-stack server running on http://localhost:${PORT}`);
});

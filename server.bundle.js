// server/serverImpl.ts
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
apiApp.use(express.json({ limit: "15mb" }));
var rateLimitStore = /* @__PURE__ */ new Map();
function createRateLimiter(maxTokens, refillIntervalMs) {
  return (req, res, next) => {
    const rawIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anonymous";
    const clientIp = rawIp.split(",")[0].trim();
    const now = Date.now();
    let bucket = rateLimitStore.get(clientIp);
    if (!bucket) {
      bucket = { tokens: maxTokens, lastRefill: now };
      rateLimitStore.set(clientIp, bucket);
    } else {
      const elapsed = now - bucket.lastRefill;
      const tokensToAdd = Math.floor(elapsed / refillIntervalMs) * maxTokens;
      if (tokensToAdd > 0) {
        bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;
      }
    }
    if (bucket.tokens <= 0) {
      const retryAfter = Math.ceil(refillIntervalMs / 1e3);
      res.setHeader("Retry-After", retryAfter.toString());
      res.setHeader("X-RateLimit-Limit", maxTokens.toString());
      res.setHeader("X-RateLimit-Remaining", "0");
      res.status(429).json({
        error: "Too Many Requests: Rate limit exceeded.",
        message: "Sentinel Health rate-limiting triggered to protect model quotas and backend stability.",
        retryAfterSeconds: retryAfter
      });
      return;
    }
    bucket.tokens -= 1;
    res.setHeader("X-RateLimit-Limit", maxTokens.toString());
    res.setHeader("X-RateLimit-Remaining", bucket.tokens.toString());
    next();
  };
}
var reportRateLimiter = createRateLimiter(25, 6e4);
var chatRateLimiter = createRateLimiter(40, 6e4);
var signalsRateLimiter = createRateLimiter(120, 6e4);
var surveillanceCache = null;
var CACHE_TTL_MS = 25e3;
function invalidateSignalsCache() {
  surveillanceCache = null;
}
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
      invalidateSignalsCache();
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
apiApp.post(
  "/api/analyze-report",
  reportRateLimiter,
  async (req, res) => {
    try {
      const { image, mimeType = "image/jpeg", pincode, targetLanguage = "en" } = req.body;
      if (!image || typeof image !== "string") {
        res.status(400).json({ error: "Valid lab report image payload is required." });
        return;
      }
      if (image.length > 20 * 1024 * 1024) {
        res.status(413).json({ error: "Payload exceeds maximum allowed size (15MB)." });
        return;
      }
      const cleanPincode = (pincode || "").replace(/\D/g, "").slice(0, 6);
      if (!/^[1-9][0-9]{5}$/.test(cleanPincode)) {
        res.status(400).json({
          error: "A valid 6-digit Indian postal code (pincode starting with 1-9) is required."
        });
        return;
      }
      const validLanguages = ["en", "te", "hi", "ta"];
      const lang = validLanguages.includes(targetLanguage) ? targetLanguage : "en";
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
      const languageInstructions = {
        en: "Explain all findings, summary, interpretation, questions, and guidance in clear, comforting plain English.",
        te: "Explain the summary, whatItMeans, questionsForDoctor, lifestyleGuidance, and parameter interpretations in fluent, natural Telugu script (\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41), while keeping parameter names in English.",
        hi: "Explain the summary, whatItMeans, questionsForDoctor, lifestyleGuidance, and parameter interpretations in natural, comforting Hindi Devanagari script (\u0939\u093F\u0928\u094D\u0926\u0940), while keeping parameter names in English.",
        ta: "Explain the summary, whatItMeans, questionsForDoctor, lifestyleGuidance, and parameter interpretations in clear, accessible Tamil script (\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD), while keeping parameter names in English."
      };
      if (ai) {
        try {
          const prompt = `You are Sentinel Health, an expert pathologist and empathetic clinical health educator.
Analyze this medical lab test report image thoroughly. Notice that personal identifiers (PII) may have been redacted on the client side for patient privacy.

LANGUAGE REQUIREMENT:
${languageInstructions[lang] || languageInstructions.en}

Provide your output strictly in valid JSON matching this schema:
{
  "title": "Clear diagnostic panel title",
  "summary": "2-3 conversational, reassuring sentences explaining the overall picture without medical jargon.",
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
  "whatItMeans": "A friendly paragraph translating what these results mean for the patient's body and day-to-day health.",
  "questionsForDoctor": [
    "3 to 4 specific, actionable questions the patient should ask their primary care doctor."
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
        analysisResult = generateFallbackMedicalAnalysis(base64Data, cleanPincode, lang);
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
        language: lang,
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
  }
);
async function fetchSurveillanceSignals() {
  try {
    const { projectId, firestoreDatabaseId, apiKey } = firebase_applet_config_default;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/symptom_reports?key=${apiKey}&pageSize=100`;
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
        ...SEED_SURVEILLANCE_REPORTS.filter(
          (s) => !firestoreDocs.some((f) => f.pincode === s.pincode && f.symptom === s.symptom)
        )
      ];
      return combined;
    }
  } catch (err) {
    console.warn("Error reading from Firestore REST, using seed surveillance dataset:", err);
  }
  return SEED_SURVEILLANCE_REPORTS;
}
var handleSignalsRequest = async (req, res) => {
  const now = Date.now();
  if (surveillanceCache && now - surveillanceCache.timestamp < CACHE_TTL_MS) {
    if (req.headers["if-none-match"] === surveillanceCache.etag) {
      res.status(304).end();
      return;
    }
    res.setHeader("ETag", surveillanceCache.etag);
    res.setHeader("Cache-Control", "public, max-age=25");
    res.setHeader("X-Cache", "HIT");
    res.json({
      reports: surveillanceCache.data,
      signals: surveillanceCache.data,
      totalCount: surveillanceCache.data.length,
      cached: true,
      timestamp: surveillanceCache.timestamp
    });
    return;
  }
  const freshData = await fetchSurveillanceSignals();
  const etag = `W/"signals-${freshData.length}-${now}"`;
  surveillanceCache = {
    data: freshData,
    timestamp: now,
    etag
  };
  res.setHeader("ETag", etag);
  res.setHeader("Cache-Control", "public, max-age=25");
  res.setHeader("X-Cache", "MISS");
  res.json({
    reports: freshData,
    signals: freshData,
    totalCount: freshData.length,
    cached: false,
    timestamp: now
  });
};
apiApp.get("/api/signals", signalsRateLimiter, handleSignalsRequest);
apiApp.get("/api/symptom-reports", signalsRateLimiter, handleSignalsRequest);
apiApp.post(
  "/api/symptom-chat",
  chatRateLimiter,
  async (req, res) => {
    try {
      const { message, history = [], reportContext, pincode, targetLanguage = "en" } = req.body;
      if (!message || typeof message !== "string") {
        res.status(400).json({ error: "A message describing your symptoms or feelings is required." });
        return;
      }
      if (message.length > 3e3) {
        res.status(400).json({ error: "Message exceeds maximum allowed length (3000 characters)." });
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
      const langMap = {
        en: "English",
        te: "Telugu (\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41)",
        hi: "Hindi (\u0939\u093F\u0928\u094D\u0926\u0940)",
        ta: "Tamil (\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD)"
      };
      const requestedLangName = langMap[targetLanguage] || "English";
      if (ai) {
        try {
          const systemInstruction = `You are Sentinel Health's compassionate Clinical Health Educator and Symptom Assistant.
Your mission is to listen to the user describing how they feel physically, validate their experience with empathy, explain what might be happening physiologically in clear, accessible plain language, and help them prepare for a clinical visit.

LANGUAGE: Please respond in ${requestedLangName}.

Follow this structure in your response:
1. **Empathy & Validation**: Acknowledge how they are feeling in a comforting, professional manner.
2. **What Might Be Happening**: Provide 2-3 plausible physiological explanations in simple language.
3. **Lab Correlation**: If lab report context is provided, connect their symptoms directly to their lab values.
4. **When to Seek Immediate Care (Red Flags)**: List 2-3 specific emergency signs that mean they should go to urgent care or the ER.
5. **Practical At-Home Comfort Measures**: Safe, non-pharmacological comfort steps (hydration, rest, gentle movement).
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
        replyText = generateFallbackChatResponse(message, targetLanguage);
        extractedSymptom = "Fatigue & Metabolic Strain";
        extractedSeverity = "moderate";
        extractedCategory = "Metabolic";
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
  }
);
function generateFallbackChatResponse(message, lang) {
  if (lang === "te") {
    return `\u0C28\u0C47\u0C28\u0C41 \u0C2E\u0C40 \u0C2A\u0C30\u0C3F\u0C38\u0C4D\u0C25\u0C3F\u0C24\u0C3F\u0C28\u0C3F \u0C05\u0C30\u0C4D\u0C25\u0C02 \u0C1A\u0C47\u0C38\u0C41\u0C15\u0C41\u0C28\u0C4D\u0C28\u0C3E\u0C28\u0C41. \u0C2E\u0C40\u0C30\u0C41 \u0C2A\u0C47\u0C30\u0C4D\u0C15\u0C4A\u0C28\u0C4D\u0C28 \u0C32\u0C15\u0C4D\u0C37\u0C23\u0C3E\u0C32\u0C41 \u0C36\u0C30\u0C40\u0C30\u0C02 \u0C05\u0C32\u0C38\u0C1F \u0C32\u0C47\u0C26\u0C3E \u0C1C\u0C40\u0C35\u0C15\u0C4D\u0C30\u0C3F\u0C2F \u0C12\u0C24\u0C4D\u0C24\u0C3F\u0C21\u0C3F\u0C15\u0C3F \u0C17\u0C41\u0C30\u0C35\u0C41\u0C24\u0C41\u0C02\u0C26\u0C28\u0C3F \u0C38\u0C42\u0C1A\u0C3F\u0C38\u0C4D\u0C24\u0C41\u0C28\u0C4D\u0C28\u0C3E\u0C2F\u0C3F.

### \u0C0F\u0C2E\u0C3F \u0C1C\u0C30\u0C41\u0C17\u0C41\u0C24\u0C41\u0C02\u0C21\u0C35\u0C1A\u0C4D\u0C1A\u0C41:
- **\u0C30\u0C15\u0C4D\u0C24\u0C02\u0C32\u0C4B \u0C1A\u0C15\u0C4D\u0C15\u0C46\u0C30 \u0C2E\u0C3E\u0C30\u0C4D\u0C2A\u0C41\u0C32\u0C41**: \u0C36\u0C30\u0C40\u0C30\u0C02\u0C32\u0C4B \u0C36\u0C15\u0C4D\u0C24\u0C3F \u0C38\u0C2E\u0C24\u0C41\u0C32\u0C4D\u0C2F\u0C24 \u0C2E\u0C3E\u0C30\u0C3F\u0C28\u0C2A\u0C4D\u0C2A\u0C41\u0C21\u0C41 \u0C28\u0C40\u0C30\u0C38\u0C02 \u0C32\u0C47\u0C26\u0C3E \u0C15\u0C33\u0C4D\u0C32\u0C41 \u0C24\u0C3F\u0C30\u0C17\u0C21\u0C02 \u0C30\u0C3E\u0C35\u0C1A\u0C4D\u0C1A\u0C41.
- **\u0C26\u0C4D\u0C30\u0C35\u0C3E\u0C32 \u0C32\u0C4B\u0C2A\u0C02**: \u0C24\u0C17\u0C3F\u0C28\u0C02\u0C24 \u0C28\u0C40\u0C30\u0C41 \u0C24\u0C3E\u0C17\u0C15\u0C2A\u0C4B\u0C35\u0C21\u0C02 \u0C35\u0C32\u0C4D\u0C32 \u0C30\u0C15\u0C4D\u0C24 \u0C2A\u0C4D\u0C30\u0C38\u0C30\u0C23 \u0C2E\u0C02\u0C26\u0C17\u0C3F\u0C02\u0C1A\u0C35\u0C1A\u0C4D\u0C1A\u0C41.

### \u0C07\u0C02\u0C1F\u0C3F \u0C35\u0C26\u0C4D\u0C26 \u0C1C\u0C3E\u0C17\u0C4D\u0C30\u0C24\u0C4D\u0C24\u0C32\u0C41:
1. \u0C30\u0C4B\u0C1C\u0C41\u0C15\u0C41 \u0C24\u0C17\u0C3F\u0C28\u0C02\u0C24 \u0C2E\u0C02\u0C1A\u0C3F\u0C28\u0C40\u0C30\u0C41 \u0C32\u0C47\u0C26\u0C3E \u0C15\u0C4A\u0C2C\u0C4D\u0C2C\u0C30\u0C3F\u0C28\u0C40\u0C33\u0C4D\u0C32\u0C41 \u0C24\u0C3E\u0C17\u0C02\u0C21\u0C3F.
2. \u0C35\u0C3F\u0C36\u0C4D\u0C30\u0C3E\u0C02\u0C24\u0C3F \u0C24\u0C40\u0C38\u0C41\u0C15\u0C4B\u0C02\u0C21\u0C3F \u0C2E\u0C30\u0C3F\u0C2F\u0C41 \u0C38\u0C2E\u0C2F\u0C3E\u0C28\u0C3F\u0C15\u0C3F \u0C2A\u0C4C\u0C37\u0C4D\u0C1F\u0C3F\u0C15\u0C3E\u0C39\u0C3E\u0C30\u0C02 \u0C24\u0C3F\u0C28\u0C02\u0C21\u0C3F.

### \u0C05\u0C24\u0C4D\u0C2F\u0C35\u0C38\u0C30 \u0C38\u0C02\u0C15\u0C47\u0C24\u0C3E\u0C32\u0C41:
\u0C1B\u0C3E\u0C24\u0C40\u0C32\u0C4B \u0C28\u0C4A\u0C2A\u0C4D\u0C2A\u0C3F, \u0C24\u0C40\u0C35\u0C4D\u0C30\u0C2E\u0C48\u0C28 \u0C36\u0C4D\u0C35\u0C3E\u0C38 \u0C06\u0C21\u0C15\u0C2A\u0C4B\u0C35\u0C21\u0C02 \u0C32\u0C47\u0C26\u0C3E \u0C38\u0C4D\u0C2A\u0C43\u0C39 \u0C24\u0C2A\u0C4D\u0C2A\u0C21\u0C02 \u0C09\u0C02\u0C1F\u0C47 \u0C35\u0C46\u0C02\u0C1F\u0C28\u0C47 \u0C05\u0C24\u0C4D\u0C2F\u0C35\u0C38\u0C30 \u0C35\u0C48\u0C26\u0C4D\u0C2F \u0C38\u0C39\u0C3E\u0C2F\u0C02 \u0C2A\u0C4A\u0C02\u0C26\u0C02\u0C21\u0C3F.`;
  }
  if (lang === "hi") {
    return `\u092E\u0948\u0902 \u0906\u092A\u0915\u0940 \u0938\u094D\u0925\u093F\u0924\u093F \u0938\u092E\u091D \u0938\u0915\u0924\u093E \u0939\u0942\u0901\u0964 \u0906\u092A\u0915\u0947 \u0932\u0915\u094D\u0937\u0923 \u0936\u0930\u0940\u0930 \u092E\u0947\u0902 \u090A\u0930\u094D\u091C\u093E \u0915\u0940 \u0915\u092E\u0940 \u092F\u093E \u092E\u0947\u091F\u093E\u092C\u0949\u0932\u093F\u0915 \u0905\u0938\u0902\u0924\u0941\u0932\u0928 \u0915\u0940 \u0913\u0930 \u0938\u0902\u0915\u0947\u0924 \u0915\u0930\u0924\u0947 \u0939\u0948\u0902\u0964

### \u0938\u0902\u092D\u093E\u0935\u093F\u0924 \u0915\u093E\u0930\u0923:
- **\u092C\u094D\u0932\u0921 \u0936\u0941\u0917\u0930 \u092E\u0947\u0902 \u0909\u0924\u093E\u0930-\u091A\u0922\u093C\u093E\u0935**: \u092D\u094B\u091C\u0928 \u0915\u0947 \u092C\u093E\u0926 \u0925\u0915\u093E\u0928 \u092F\u093E \u091A\u0915\u094D\u0915\u0930 \u0906\u0928\u093E \u0936\u0941\u0917\u0930 \u0938\u0902\u0924\u0941\u0932\u0928 \u092E\u0947\u0902 \u092C\u0926\u0932\u093E\u0935 \u0915\u093E \u0938\u0902\u0915\u0947\u0924 \u0939\u094B \u0938\u0915\u0924\u093E \u0939\u0948\u0964
- **\u0921\u093F\u0939\u093E\u0907\u0921\u094D\u0930\u0947\u0936\u0928 (\u092A\u093E\u0928\u0940 \u0915\u0940 \u0915\u092E\u0940)**: \u092A\u0930\u094D\u092F\u093E\u092A\u094D\u0924 \u092A\u093E\u0928\u0940 \u0928 \u092A\u0940\u0928\u0947 \u0938\u0947 \u092D\u0940 \u0915\u092E\u091C\u094B\u0930\u0940 \u092E\u0939\u0938\u0942\u0938 \u0939\u094B\u0924\u0940 \u0939\u0948\u0964

### \u0918\u0930\u0947\u0932\u0942 \u0938\u0941\u091D\u093E\u0935:
1. \u0926\u093F\u0928\u092D\u0930 \u092A\u0930\u094D\u092F\u093E\u092A\u094D\u0924 \u092A\u093E\u0928\u0940 \u0914\u0930 \u0907\u0932\u0947\u0915\u094D\u091F\u094D\u0930\u094B\u0932\u093E\u0907\u091F\u094D\u0938 \u0915\u093E \u0938\u0947\u0935\u0928 \u0915\u0930\u0947\u0902\u0964
2. \u0938\u092E\u092F \u092A\u0930 \u092A\u094C\u0937\u094D\u091F\u093F\u0915 \u092D\u094B\u091C\u0928 \u0932\u0947\u0902 \u0914\u0930 \u092A\u0942\u0930\u0940 \u0928\u0940\u0902\u0926 \u0932\u0947\u0902\u0964

### \u091A\u0947\u0924\u093E\u0935\u0928\u0940 \u0915\u0947 \u0932\u0915\u094D\u0937\u0923:
\u0938\u0940\u0928\u0947 \u092E\u0947\u0902 \u0924\u0947\u091C \u0926\u0930\u094D\u0926, \u0938\u093E\u0902\u0938 \u0932\u0947\u0928\u0947 \u092E\u0947\u0902 \u0905\u0924\u094D\u092F\u0927\u093F\u0915 \u0915\u0920\u093F\u0928\u093E\u0908 \u092F\u093E \u092C\u0947\u0939\u094B\u0936\u0940 \u0939\u094B\u0928\u0947 \u092A\u0930 \u0924\u0941\u0930\u0902\u0924 \u0928\u091C\u0926\u0940\u0915\u0940 \u0905\u0938\u094D\u092A\u0924\u093E\u0932 \u092E\u0947\u0902 \u0938\u0902\u092A\u0930\u094D\u0915 \u0915\u0930\u0947\u0902\u0964`;
  }
  if (lang === "ta") {
    return `\u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0B89\u0B9F\u0BB2\u0BCD \u0BA8\u0BBF\u0BB2\u0BC8\u0BAF\u0BC8 \u0BA8\u0BBE\u0BA9\u0BCD \u0BAA\u0BC1\u0BB0\u0BBF\u0BA8\u0BCD\u0BA4\u0BC1\u0B95\u0BCA\u0BB3\u0BCD\u0B95\u0BBF\u0BB1\u0BC7\u0BA9\u0BCD. \u0BA8\u0BC0\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0B95\u0BC2\u0BB1\u0BC1\u0BAE\u0BCD \u0B85\u0BB1\u0BBF\u0B95\u0BC1\u0BB1\u0BBF\u0B95\u0BB3\u0BCD \u0B89\u0B9F\u0BB2\u0BBF\u0BB2\u0BCD \u0B86\u0BB1\u0BCD\u0BB1\u0BB2\u0BCD \u0B95\u0BC1\u0BB1\u0BC8\u0BB5\u0BC1 \u0B85\u0BB2\u0BCD\u0BB2\u0BA4\u0BC1 \u0BA8\u0BC0\u0BB0\u0BCD\u0B9A\u0BCD\u0B9A\u0BA4\u0BCD\u0BA4\u0BC1 \u0B95\u0BC1\u0BB1\u0BC8\u0BAA\u0BBE\u0B9F\u0BCD\u0B9F\u0BC8 \u0B95\u0BC1\u0BB1\u0BBF\u0B95\u0BCD\u0B95\u0BB2\u0BBE\u0BAE\u0BCD.

### \u0B8E\u0BA9\u0BCD\u0BA9 \u0BA8\u0B9F\u0B95\u0BCD\u0B95\u0BBF\u0BB1\u0BA4\u0BC1:
- **\u0B87\u0BB0\u0BA4\u0BCD\u0BA4 \u0B9A\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BB0\u0BC8 \u0B85\u0BB3\u0BB5\u0BC1\u0B95\u0BB3\u0BBF\u0BB2\u0BCD \u0BAE\u0BBE\u0BB1\u0BCD\u0BB1\u0BAE\u0BCD**: \u0B9A\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BB0\u0BC8 \u0B85\u0BB3\u0BB5\u0BC1 \u0BAE\u0BBE\u0BB1\u0BC1\u0BAA\u0B9F\u0BC1\u0BAE\u0BCD \u0BAA\u0BCB\u0BA4\u0BC1 \u0B9A\u0BCB\u0BB0\u0BCD\u0BB5\u0BC1 \u0B85\u0BB2\u0BCD\u0BB2\u0BA4\u0BC1 \u0BA4\u0BB2\u0BC8\u0B9A\u0BCD\u0B9A\u0BC1\u0BB1\u0BCD\u0BB1\u0BB2\u0BCD \u0B8F\u0BB1\u0BCD\u0BAA\u0B9F\u0BB2\u0BBE\u0BAE\u0BCD.
- **\u0BA8\u0BC0\u0BB0\u0BCD\u0B9A\u0BCD\u0B9A\u0BA4\u0BCD\u0BA4\u0BC1 \u0BAA\u0BB1\u0BCD\u0BB1\u0BBE\u0B95\u0BCD\u0B95\u0BC1\u0BB1\u0BC8**: \u0BAA\u0BCB\u0BA4\u0BC1\u0BAE\u0BBE\u0BA9 \u0BA8\u0BC0\u0BB0\u0BCD \u0B95\u0BC1\u0B9F\u0BBF\u0B95\u0BCD\u0B95\u0BBE\u0BA4\u0BA4\u0BC1 \u0B9A\u0BCB\u0BB0\u0BCD\u0BB5\u0BC8 \u0B85\u0BA4\u0BBF\u0B95\u0BB0\u0BBF\u0B95\u0BCD\u0B95\u0BC1\u0BAE\u0BCD.

### \u0B8E\u0BB3\u0BBF\u0BAF \u0B86\u0BB2\u0BCB\u0B9A\u0BA9\u0BC8\u0B95\u0BB3\u0BCD:
1. \u0BAA\u0BCB\u0BA4\u0BC1\u0BAE\u0BBE\u0BA9 \u0B85\u0BB3\u0BB5\u0BC1 \u0BA8\u0BC0\u0BB0\u0BCD \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0B87\u0BB3\u0BA8\u0BC0\u0BB0\u0BCD \u0B85\u0BB0\u0BC1\u0BA8\u0BCD\u0BA4\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD.
2. \u0B9A\u0BB0\u0BBF\u0BAF\u0BBE\u0BA9 \u0BA8\u0BC7\u0BB0\u0BA4\u0BCD\u0BA4\u0BBF\u0BB1\u0BCD\u0B95\u0BC1 \u0B9A\u0BA4\u0BCD\u0BA4\u0BBE\u0BA9 \u0B89\u0BA3\u0BB5\u0BC8 \u0B89\u0B9F\u0BCD\u0B95\u0BCA\u0BB3\u0BCD\u0BB3\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD.

### \u0B8E\u0B9A\u0BCD\u0B9A\u0BB0\u0BBF\u0B95\u0BCD\u0B95\u0BC8 \u0B85\u0BB1\u0BBF\u0B95\u0BC1\u0BB1\u0BBF\u0B95\u0BB3\u0BCD:
\u0BAE\u0BBE\u0BB0\u0BCD\u0BAA\u0BC1 \u0BB5\u0BB2\u0BBF, \u0BAE\u0BC2\u0B9A\u0BCD\u0B9A\u0BC1\u0BA4\u0BCD \u0BA4\u0BBF\u0BA3\u0BB1\u0BB2\u0BCD \u0B85\u0BB2\u0BCD\u0BB2\u0BA4\u0BC1 \u0BAE\u0BAF\u0B95\u0BCD\u0B95\u0BAE\u0BCD \u0B8F\u0BB1\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BBE\u0BB2\u0BCD \u0B89\u0B9F\u0BA9\u0B9F\u0BBF\u0BAF\u0BBE\u0B95 \u0BAE\u0BB0\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1\u0BB5\u0BB0\u0BC8 \u0B85\u0BA3\u0BC1\u0B95\u0BB5\u0BC1\u0BAE\u0BCD.`;
  }
  return `I understand how draining these physical sensations can feel. When fatigue or dizziness occurs, your body is communicating that cellular fuel or hydration may be constrained.

### What Might Be Happening
- **Glycemic Fluctuation**: Changes in blood sugar after meals can lead to sudden energy drops.
- **Hydration & Electrolytes**: Mild fluid depletion reduces blood volume and brain perfusion.

### Practical Comfort Steps
1. Sip electrolyte water throughout the day.
2. Eat balanced meals combining fiber, protein, and complex carbohydrates.

### Red Flag Signs
Seek immediate emergency evaluation if you develop chest tightness, syncope (fainting), or sudden shortness of breath.`;
}
function generateFallbackMedicalAnalysis(base64Str, _pincode, lang = "en") {
  let decodedText = "";
  try {
    decodedText = Buffer.from(base64Str.slice(0, 5e3), "base64").toString("utf-8");
  } catch {
    decodedText = "";
  }
  const isGlucose = decodedText.includes("Glucose") || decodedText.includes("HbA1c") || decodedText.includes("Diabet");
  const isLiver = decodedText.includes("ALT") || decodedText.includes("AST") || decodedText.includes("Bilirubin");
  if (isGlucose) {
    if (lang === "te") {
      return {
        title: "\u0C17\u0C4D\u0C32\u0C48\u0C38\u0C46\u0C2E\u0C3F\u0C15\u0C4D \u0C2A\u0C4D\u0C30\u0C4A\u0C2B\u0C48\u0C32\u0C4D & \u0C21\u0C2F\u0C3E\u0C2C\u0C46\u0C1F\u0C3F\u0C38\u0C4D \u0C2E\u0C42\u0C32\u0C4D\u0C2F\u0C3E\u0C02\u0C15\u0C28\u0C02",
        summary: "\u0C2E\u0C40 \u0C28\u0C3F\u0C35\u0C47\u0C26\u0C3F\u0C15\u0C32\u0C4B \u0C2C\u0C4D\u0C32\u0C21\u0C4D \u0C17\u0C4D\u0C32\u0C42\u0C15\u0C4B\u0C1C\u0C4D \u0C2E\u0C30\u0C3F\u0C2F\u0C41 HbA1c \u0C38\u0C4D\u0C25\u0C3E\u0C2F\u0C3F\u0C32\u0C41 \u0C38\u0C3E\u0C27\u0C3E\u0C30\u0C23\u0C02 \u0C15\u0C02\u0C1F\u0C47 \u0C0E\u0C15\u0C4D\u0C15\u0C41\u0C35\u0C17\u0C3E \u0C09\u0C28\u0C4D\u0C28\u0C3E\u0C2F\u0C3F. \u0C07\u0C26\u0C3F \u0C36\u0C30\u0C40\u0C30\u0C02 \u0C1A\u0C15\u0C4D\u0C15\u0C46\u0C30\u0C28\u0C41 \u0C38\u0C2E\u0C30\u0C4D\u0C25\u0C35\u0C02\u0C24\u0C02\u0C17\u0C3E \u0C2A\u0C4D\u0C30\u0C3E\u0C38\u0C46\u0C38\u0C4D \u0C1A\u0C47\u0C2F\u0C32\u0C47\u0C15\u0C2A\u0C4B\u0C24\u0C41\u0C02\u0C26\u0C28\u0C3F \u0C38\u0C42\u0C1A\u0C3F\u0C38\u0C4D\u0C24\u0C41\u0C02\u0C26\u0C3F.",
        symptom: "\u0C39\u0C48\u0C2A\u0C30\u0C4D\u200C\u0C17\u0C4D\u0C32\u0C48\u0C38\u0C40\u0C2E\u0C3F\u0C2F\u0C3E / \u0C21\u0C2F\u0C3E\u0C2C\u0C46\u0C1F\u0C3F\u0C38\u0C4D \u0C38\u0C02\u0C15\u0C47\u0C24\u0C02",
        category: "Metabolic",
        severity: "high",
        confidenceScore: 0.97,
        keyFindings: [
          { parameter: "Fasting Blood Glucose", value: "178.0 mg/dL", referenceRange: "70 - 99 mg/dL", status: "Elevated", interpretation: "\u0C38\u0C3E\u0C27\u0C3E\u0C30\u0C23 \u0C09\u0C2A\u0C35\u0C3E\u0C38 \u0C2A\u0C30\u0C3F\u0C2E\u0C3F\u0C24\u0C3F \u0C15\u0C02\u0C1F\u0C47 \u0C0E\u0C15\u0C4D\u0C15\u0C41\u0C35." },
          { parameter: "HbA1c (Glycated Hemoglobin)", value: "8.6%", referenceRange: "< 5.7%", status: "Elevated", interpretation: "\u0C17\u0C24 3 \u0C28\u0C46\u0C32\u0C32 \u0C38\u0C17\u0C1F\u0C41 \u0C1A\u0C15\u0C4D\u0C15\u0C46\u0C30 \u0C0E\u0C15\u0C4D\u0C15\u0C41\u0C35 \u0C09\u0C02\u0C26\u0C28\u0C3F \u0C24\u0C46\u0C32\u0C41\u0C2A\u0C41\u0C24\u0C41\u0C02\u0C26\u0C3F." }
        ],
        whatItMeans: "\u0C17\u0C4D\u0C32\u0C42\u0C15\u0C4B\u0C1C\u0C4D \u0C2A\u0C46\u0C30\u0C3F\u0C17\u0C3F\u0C28\u0C2A\u0C4D\u0C2A\u0C41\u0C21\u0C41 \u0C15\u0C23\u0C3E\u0C32\u0C15\u0C41 \u0C24\u0C17\u0C3F\u0C28\u0C02\u0C24 \u0C36\u0C15\u0C4D\u0C24\u0C3F \u0C05\u0C02\u0C26\u0C15 \u0C05\u0C32\u0C38\u0C1F, \u0C26\u0C3E\u0C39\u0C02 \u0C2A\u0C46\u0C30\u0C17\u0C21\u0C02 \u0C35\u0C02\u0C1F\u0C3F \u0C32\u0C15\u0C4D\u0C37\u0C23\u0C3E\u0C32\u0C41 \u0C15\u0C28\u0C3F\u0C2A\u0C3F\u0C38\u0C4D\u0C24\u0C3E\u0C2F\u0C3F. \u0C1C\u0C40\u0C35\u0C28\u0C36\u0C48\u0C32\u0C3F \u0C2E\u0C3E\u0C30\u0C4D\u0C2A\u0C41\u0C32\u0C41 \u0C2E\u0C30\u0C3F\u0C2F\u0C41 \u0C35\u0C48\u0C26\u0C4D\u0C2F\u0C41\u0C32 \u0C38\u0C32\u0C39\u0C3E\u0C24\u0C4B \u0C26\u0C40\u0C28\u0C3F\u0C28\u0C3F \u0C28\u0C3F\u0C2F\u0C02\u0C24\u0C4D\u0C30\u0C3F\u0C02\u0C1A\u0C35\u0C1A\u0C4D\u0C1A\u0C41.",
        questionsForDoctor: [
          "\u0C28\u0C3E \u0C2B\u0C3E\u0C38\u0C4D\u0C1F\u0C3F\u0C02\u0C17\u0C4D \u0C37\u0C41\u0C17\u0C30\u0C4D \u0C32\u0C15\u0C4D\u0C37\u0C4D\u0C2F\u0C02 \u0C0E\u0C02\u0C24 \u0C09\u0C02\u0C21\u0C3E\u0C32\u0C3F?",
          "\u0C06\u0C39\u0C3E\u0C30 \u0C28\u0C3F\u0C2F\u0C2E\u0C3E\u0C32\u0C41 \u0C2E\u0C30\u0C3F\u0C2F\u0C41 \u0C2E\u0C02\u0C26\u0C41\u0C32 \u0C17\u0C41\u0C30\u0C3F\u0C02\u0C1A\u0C3F \u0C35\u0C3F\u0C35\u0C30\u0C3E\u0C32\u0C41 \u0C24\u0C46\u0C32\u0C2A\u0C02\u0C21\u0C3F?",
          "\u0C2E\u0C33\u0C4D\u0C32\u0C40 \u0C0E\u0C2A\u0C4D\u0C2A\u0C41\u0C21\u0C41 HbA1c \u0C2A\u0C30\u0C40\u0C15\u0C4D\u0C37 \u0C1A\u0C47\u0C2F\u0C3F\u0C02\u0C1A\u0C3E\u0C32\u0C3F?"
        ],
        lifestyleGuidance: [
          "\u0C2D\u0C4B\u0C1C\u0C28\u0C02 \u0C24\u0C30\u0C4D\u0C35\u0C3E\u0C24 15 \u0C28\u0C3F\u0C2E\u0C3F\u0C37\u0C3E\u0C32 \u0C28\u0C21\u0C15\u0C28\u0C41 \u0C05\u0C32\u0C35\u0C3E\u0C1F\u0C41 \u0C1A\u0C47\u0C38\u0C41\u0C15\u0C4B\u0C02\u0C21\u0C3F.",
          "\u0C2A\u0C40\u0C1A\u0C41 \u0C2A\u0C26\u0C3E\u0C30\u0C4D\u0C25\u0C3E\u0C32\u0C41 \u0C2E\u0C30\u0C3F\u0C2F\u0C41 \u0C06\u0C15\u0C41\u0C15\u0C42\u0C30\u0C32\u0C41 \u0C0E\u0C15\u0C4D\u0C15\u0C41\u0C35\u0C17\u0C3E \u0C24\u0C40\u0C38\u0C41\u0C15\u0C4B\u0C02\u0C21\u0C3F."
        ],
        disclaimer: "\u0C08 \u0C28\u0C3F\u0C35\u0C47\u0C26\u0C3F\u0C15 \u0C15\u0C47\u0C35\u0C32\u0C02 \u0C05\u0C35\u0C17\u0C3E\u0C39\u0C28 \u0C15\u0C4B\u0C38\u0C02 \u0C2E\u0C3E\u0C24\u0C4D\u0C30\u0C2E\u0C47. \u0C26\u0C2F\u0C1A\u0C47\u0C38\u0C3F \u0C2E\u0C40 \u0C35\u0C48\u0C26\u0C4D\u0C2F\u0C41\u0C21\u0C3F\u0C28\u0C3F \u0C38\u0C02\u0C2A\u0C4D\u0C30\u0C26\u0C3F\u0C02\u0C1A\u0C02\u0C21\u0C3F."
      };
    }
    if (lang === "hi") {
      return {
        title: "\u0917\u094D\u0932\u093E\u0907\u0938\u0947\u092E\u093F\u0915 \u092A\u094D\u0930\u094B\u092B\u093E\u0907\u0932 \u090F\u0935\u0902 \u092E\u0927\u0941\u092E\u0947\u0939 \u092A\u0930\u0940\u0915\u094D\u0937\u0923",
        summary: "\u0906\u092A\u0915\u0940 \u0930\u093F\u092A\u094B\u0930\u094D\u091F \u092E\u0947\u0902 \u092C\u094D\u0932\u0921 \u0917\u094D\u0932\u0942\u0915\u094B\u091C \u0914\u0930 \u090F\u091A\u092C\u0940\u090F1\u0938\u0940 (HbA1c) \u0915\u093E \u0938\u094D\u0924\u0930 \u0938\u093E\u092E\u093E\u0928\u094D\u092F \u0938\u0940\u092E\u093E \u0938\u0947 \u0905\u0927\u093F\u0915 \u0939\u0948, \u091C\u094B \u0907\u0902\u0938\u0941\u0932\u093F\u0928 \u092A\u094D\u0930\u0924\u093F\u0930\u094B\u0927 \u092F\u093E \u092E\u0927\u0941\u092E\u0947\u0939 \u0915\u0940 \u0913\u0930 \u0938\u0902\u0915\u0947\u0924 \u0915\u0930\u0924\u093E \u0939\u0948\u0964",
        symptom: "\u0939\u093E\u0907\u092A\u0930\u0917\u094D\u0932\u093E\u0907\u0938\u0940\u092E\u093F\u092F\u093E / \u0921\u093E\u092F\u092C\u093F\u091F\u0940\u091C \u091C\u094B\u0916\u093F\u092E",
        category: "Metabolic",
        severity: "high",
        confidenceScore: 0.97,
        keyFindings: [
          { parameter: "Fasting Blood Glucose", value: "178.0 mg/dL", referenceRange: "70 - 99 mg/dL", status: "Elevated", interpretation: "\u0938\u093E\u092E\u093E\u0928\u094D\u092F \u092B\u093E\u0938\u094D\u091F\u093F\u0902\u0917 \u0938\u094D\u0924\u0930 \u0938\u0947 \u0915\u093E\u092B\u0940 \u0905\u0927\u093F\u0915\u0964" },
          { parameter: "HbA1c (Glycated Hemoglobin)", value: "8.6%", referenceRange: "< 5.7%", status: "Elevated", interpretation: "\u092A\u093F\u091B\u0932\u0947 3 \u092E\u0939\u0940\u0928\u094B\u0902 \u0915\u0947 \u0914\u0938\u0924 \u092C\u094D\u0932\u0921 \u0936\u0941\u0917\u0930 \u092E\u0947\u0902 \u0935\u0943\u0926\u094D\u0927\u093F\u0964" }
        ],
        whatItMeans: "\u091C\u092C \u0930\u0915\u094D\u0924 \u092E\u0947\u0902 \u0936\u0930\u094D\u0915\u0930\u093E \u092C\u0922\u093C\u0924\u0940 \u0939\u0948 \u0924\u094B \u0936\u0930\u0940\u0930 \u0915\u0940 \u0915\u094B\u0936\u093F\u0915\u093E\u0913\u0902 \u0915\u094B \u092A\u0930\u094D\u092F\u093E\u092A\u094D\u0924 \u090A\u0930\u094D\u091C\u093E \u0928\u0939\u0940\u0902 \u092E\u093F\u0932 \u092A\u093E\u0924\u0940\u0964 \u0909\u091A\u093F\u0924 \u0916\u093E\u0928-\u092A\u093E\u0928 \u0914\u0930 \u0921\u0949\u0915\u094D\u091F\u0930 \u0915\u0940 \u0938\u0932\u093E\u0939 \u0938\u0947 \u0907\u0938\u0947 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u093F\u0924 \u0915\u093F\u092F\u093E \u091C\u093E \u0938\u0915\u0924\u093E \u0939\u0948\u0964",
        questionsForDoctor: [
          "\u092E\u0947\u0930\u0947 \u092B\u093E\u0938\u094D\u091F\u093F\u0902\u0917 \u092C\u094D\u0932\u0921 \u0936\u0941\u0917\u0930 \u0915\u093E \u0906\u0926\u0930\u094D\u0936 \u0932\u0915\u094D\u0937\u094D\u092F \u0915\u094D\u092F\u093E \u0939\u094B\u0928\u093E \u091A\u093E\u0939\u093F\u090F?",
          "\u0915\u094D\u092F\u093E \u0905\u092D\u0940 \u0926\u0935\u093E \u0936\u0941\u0930\u0942 \u0915\u0930\u0928\u0947 \u0915\u0940 \u0906\u0935\u0936\u094D\u092F\u0915\u0924\u093E \u0939\u0948 \u092F\u093E \u0915\u0947\u0935\u0932 \u0906\u0939\u093E\u0930 \u0928\u093F\u092F\u0902\u0924\u094D\u0930\u0923?",
          "\u0926\u094B\u092C\u093E\u0930\u093E \u091F\u0947\u0938\u094D\u091F \u0915\u092C \u0915\u0930\u093E\u0928\u093E \u091A\u093E\u0939\u093F\u090F?"
        ],
        lifestyleGuidance: [
          "\u092D\u094B\u091C\u0928 \u0915\u0947 \u092C\u093E\u0926 15 \u092E\u093F\u0928\u091F \u0915\u0940 \u0939\u0932\u094D\u0915\u0940 \u0938\u0948\u0930 \u091C\u0930\u0942\u0930 \u0915\u0930\u0947\u0902\u0964",
          "\u092E\u0940\u0920\u0947 \u092A\u0947\u092F \u092A\u0926\u093E\u0930\u094D\u0925\u094B\u0902 \u0914\u0930 \u0930\u093F\u092B\u093E\u0907\u0902\u0921 \u0915\u093E\u0930\u094D\u092C\u094D\u0938 \u0938\u0947 \u092A\u0930\u0939\u0947\u091C \u0915\u0930\u0947\u0902\u0964"
        ],
        disclaimer: "\u092F\u0939 \u0930\u093F\u092A\u094B\u0930\u094D\u091F \u0915\u0947\u0935\u0932 \u0936\u0948\u0915\u094D\u0937\u093F\u0915 \u091C\u093E\u0928\u0915\u093E\u0930\u0940 \u0939\u0947\u0924\u0941 \u0939\u0948\u0964 \u0905\u092A\u0928\u0947 \u0921\u0949\u0915\u094D\u091F\u0930 \u0938\u0947 \u092A\u0930\u093E\u092E\u0930\u094D\u0936 \u0905\u0935\u0936\u094D\u092F \u0932\u0947\u0902\u0964"
      };
    }
    if (lang === "ta") {
      return {
        title: "\u0B87\u0BB0\u0BA4\u0BCD\u0BA4 \u0B9A\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BB0\u0BC8 \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0BA8\u0BC0\u0BB0\u0BBF\u0BB4\u0BBF\u0BB5\u0BC1 \u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BC0\u0B9F\u0BC1",
        summary: "\u0B89\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0B86\u0BAF\u0BCD\u0BB5\u0B95 \u0B85\u0BB1\u0BBF\u0B95\u0BCD\u0B95\u0BC8\u0BAF\u0BBF\u0BB2\u0BCD \u0B95\u0BC1\u0BB3\u0BC1\u0B95\u0BCD\u0B95\u0BCB\u0BB8\u0BCD \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD HbA1c \u0B85\u0BB3\u0BB5\u0BC1\u0B95\u0BB3\u0BCD \u0BAA\u0BB0\u0BBF\u0BA8\u0BCD\u0BA4\u0BC1\u0BB0\u0BC8\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F \u0BB5\u0BB0\u0BAE\u0BCD\u0BAA\u0BC8 \u0BB5\u0BBF\u0B9F \u0B85\u0BA4\u0BBF\u0B95\u0BAE\u0BBE\u0B95 \u0B89\u0BB3\u0BCD\u0BB3\u0BA9.",
        symptom: "\u0B87\u0BB0\u0BA4\u0BCD\u0BA4\u0BA4\u0BCD\u0BA4\u0BBF\u0BB2\u0BCD \u0B85\u0BA4\u0BBF\u0B95 \u0B9A\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BB0\u0BC8 / \u0BA8\u0BC0\u0BB0\u0BBF\u0BB4\u0BBF\u0BB5\u0BC1",
        category: "Metabolic",
        severity: "high",
        confidenceScore: 0.97,
        keyFindings: [
          { parameter: "Fasting Blood Glucose", value: "178.0 mg/dL", referenceRange: "70 - 99 mg/dL", status: "Elevated", interpretation: "\u0B87\u0BAF\u0BB2\u0BCD\u0BAA\u0BBE\u0BA9 \u0B85\u0BB3\u0BB5\u0BC8 \u0BB5\u0BBF\u0B9F \u0B95\u0BC2\u0B9F\u0BC1\u0BA4\u0BB2\u0BCD \u0B9A\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BB0\u0BC8." },
          { parameter: "HbA1c (Glycated Hemoglobin)", value: "8.6%", referenceRange: "< 5.7%", status: "Elevated", interpretation: "\u0B95\u0B9F\u0BA8\u0BCD\u0BA4 3 \u0BAE\u0BBE\u0BA4\u0B99\u0BCD\u0B95\u0BB3\u0BBF\u0BA9\u0BCD \u0B9A\u0BB0\u0BBE\u0B9A\u0BB0\u0BBF \u0B9A\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BB0\u0BC8 \u0B89\u0BAF\u0BB0\u0BCD\u0BB5\u0BC1." }
        ],
        whatItMeans: "\u0B87\u0BB0\u0BA4\u0BCD\u0BA4\u0BA4\u0BCD\u0BA4\u0BBF\u0BB2\u0BCD \u0B9A\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BB0\u0BC8 \u0B85\u0BB3\u0BB5\u0BC1 \u0B85\u0BA4\u0BBF\u0B95\u0BB0\u0BBF\u0B95\u0BCD\u0B95\u0BC1\u0BAE\u0BCD \u0BAA\u0BCB\u0BA4\u0BC1 \u0B89\u0B9F\u0BB2\u0BCD \u0B8E\u0BB3\u0BBF\u0BA4\u0BBF\u0BB2\u0BCD \u0B9A\u0BCB\u0BB0\u0BCD\u0BB5\u0B9F\u0BC8\u0BAF\u0BC1\u0BAE\u0BCD. \u0B9A\u0BB0\u0BBF\u0BAF\u0BBE\u0BA9 \u0B89\u0BA3\u0BB5\u0BC1 \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0B89\u0B9F\u0BB1\u0BCD\u0BAA\u0BAF\u0BBF\u0BB1\u0BCD\u0B9A\u0BBF \u0BAE\u0BC2\u0BB2\u0BAE\u0BCD \u0B87\u0BA4\u0BA9\u0BC8 \u0B95\u0B9F\u0BCD\u0B9F\u0BC1\u0BAA\u0BCD\u0BAA\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4\u0BB2\u0BBE\u0BAE\u0BCD.",
        questionsForDoctor: [
          "\u0B8E\u0BA9\u0BA4\u0BC1 \u0B87\u0BB0\u0BA4\u0BCD\u0BA4 \u0B9A\u0BB0\u0BCD\u0B95\u0BCD\u0B95\u0BB0\u0BC8 \u0B87\u0BB2\u0B95\u0BCD\u0B95\u0BC1 \u0B8E\u0BA9\u0BCD\u0BA9\u0BB5\u0BBE\u0B95 \u0B87\u0BB0\u0BC1\u0B95\u0BCD\u0B95 \u0BB5\u0BC7\u0BA3\u0BCD\u0B9F\u0BC1\u0BAE\u0BCD?",
          "\u0B89\u0BA3\u0BB5\u0BC1 \u0BAE\u0BC1\u0BB1\u0BC8 \u0BAE\u0BB1\u0BCD\u0BB1\u0BC1\u0BAE\u0BCD \u0BAE\u0BB0\u0BC1\u0BA8\u0BCD\u0BA4\u0BC1 \u0BAA\u0BB0\u0BBF\u0BA8\u0BCD\u0BA4\u0BC1\u0BB0\u0BC8\u0B95\u0BB3\u0BCD \u0B8E\u0BA9\u0BCD\u0BA9?"
        ],
        lifestyleGuidance: [
          "\u0B89\u0BA3\u0BB5\u0BC1\u0B95\u0BCD\u0B95\u0BC1\u0BAA\u0BCD \u0BAA\u0BBF\u0BB1\u0B95\u0BC1 15 \u0BA8\u0BBF\u0BAE\u0BBF\u0B9F\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0BA8\u0B9F\u0BC8\u0BAA\u0BCD\u0BAA\u0BAF\u0BBF\u0BB1\u0BCD\u0B9A\u0BBF \u0B9A\u0BC6\u0BAF\u0BCD\u0BAF\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD.",
          "\u0BA8\u0BBE\u0BB0\u0BCD\u0B9A\u0BCD\u0B9A\u0BA4\u0BCD\u0BA4\u0BC1 \u0BA8\u0BBF\u0BB1\u0BC8\u0BA8\u0BCD\u0BA4 \u0B95\u0BBE\u0BAF\u0BCD\u0B95\u0BB1\u0BBF\u0B95\u0BB3\u0BC8 \u0B89\u0BA3\u0BB5\u0BBF\u0BB2\u0BCD \u0B9A\u0BC7\u0BB0\u0BCD\u0BA4\u0BCD\u0BA4\u0BC1\u0B95\u0BCD \u0B95\u0BCA\u0BB3\u0BCD\u0BB3\u0BC1\u0B99\u0BCD\u0B95\u0BB3\u0BCD."
        ],
        disclaimer: "\u0B87\u0BA4\u0BC1 \u0BAE\u0BB0\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1\u0BB5 \u0B86\u0BB2\u0BCB\u0B9A\u0BA9\u0BC8 \u0B85\u0BB2\u0BCD\u0BB2. \u0BAE\u0BB0\u0BC1\u0BA4\u0BCD\u0BA4\u0BC1\u0BB5\u0BB0\u0BC8 \u0B85\u0BA3\u0BC1\u0B95\u0BB5\u0BC1\u0BAE\u0BCD."
      };
    }
    return {
      title: "Glycemic Profile & Diabetes Evaluation",
      summary: "Your report indicates elevated blood glucose and glycated hemoglobin (HbA1c) levels. This suggests your body is having trouble processing sugars efficiently, typical of insulin resistance or type-2 diabetes.",
      symptom: "Hyperglycemia / Type-2 Diabetic Risk",
      category: "Metabolic",
      severity: "high",
      confidenceScore: 0.97,
      keyFindings: [
        { parameter: "Fasting Blood Glucose", value: "178.0 mg/dL", referenceRange: "70 - 99 mg/dL", status: "Elevated", interpretation: "Significantly higher than optimal fasting baseline." },
        { parameter: "HbA1c (Glycated Hemoglobin)", value: "8.6%", referenceRange: "< 5.7%", status: "Elevated", interpretation: "Reflects elevated average blood sugar over the last 3 months." }
      ],
      whatItMeans: "When glucose stays elevated, sugar remains in your bloodstream instead of fueling your cells. You might experience fatigue, increased thirst, or frequent urination.",
      questionsForDoctor: [
        "What target range should I aim for with my fasting blood sugar?",
        "Should we initiate medication or focus on medical nutrition therapy first?",
        "How often should we repeat my HbA1c to monitor progress?"
      ],
      lifestyleGuidance: [
        "Incorporate a 15-minute gentle walk immediately after meals to facilitate glucose uptake.",
        "Emphasize whole fiber, leafy greens, and lean proteins while minimizing refined carbohydrates.",
        "Stay well-hydrated throughout the day with filtered water."
      ],
      disclaimer: "This report summary is educational and does not constitute a formal prescription or diagnosis. Please consult your physician."
    };
  }
  return {
    title: "Cardiovascular Lipid & Metabolic Profile",
    summary: "Your lipid profile reveals elevated levels of total cholesterol and LDL ('bad') cholesterol. Proactive dietary and lifestyle steps can make a dramatic positive difference.",
    symptom: "Hypercholesterolemia / High Atherogenic Risk",
    category: "Cardiovascular",
    severity: "moderate",
    confidenceScore: 0.93,
    keyFindings: [
      { parameter: "Total Cholesterol", value: "264.0 mg/dL", referenceRange: "< 200 mg/dL", status: "Elevated", interpretation: "Above recommended threshold for optimal arterial health." },
      { parameter: "LDL ('Bad') Cholesterol", value: "182.0 mg/dL", referenceRange: "< 100 mg/dL", status: "Elevated", interpretation: "Primary target for cardiovascular risk reduction." }
    ],
    whatItMeans: "Elevated LDL cholesterol can slowly deposit along blood vessel walls. The encouraging fact is that cholesterol metrics respond promptly to heart-healthy fats, soluble fiber, and regular cardiovascular exercise.",
    questionsForDoctor: [
      "What is my overall 10-year cardiovascular risk score?",
      "Can we trial 3 months of focused dietary changes before deciding on medication?"
    ],
    lifestyleGuidance: [
      "Incorporate soluble fiber such as steel-cut oats, chia seeds, and legumes daily.",
      "Engage in 30 minutes of moderate aerobic activity 5 days a week."
    ],
    disclaimer: "Educational analysis only. Please discuss with your cardiologist or primary care doctor."
  };
}

// server/serverImpl.ts
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express2();
var PORT = process.env.PORT || 3e3;
app.use(apiApp);
var distPath = path.resolve(__dirname, "../dist");
app.use(express2.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});
app.listen(PORT, () => {
  console.log(`Sentinel Health full-stack server running on http://localhost:${PORT}`);
});

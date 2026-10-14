# Sentinel Health

> **AI-Powered Medical Lab Report Translator & Real-Time Epidemiological Surveillance Network**

Sentinel Health is a full-stack clinical health application designed to bridge the communication gap between complex diagnostic laboratory reports and patient comprehension, while simultaneously enabling real-time, privacy-preserving public health surveillance.

---

## 🌟 Key Capabilities

### 1. Patient Portal (Mobile-First)
* **Optical Lab Report Scanner**: Patients can photograph or upload laboratory test results (CBC, Fasting Blood Glucose & HbA1c, Lipid Profiles, Liver Function Panels, etc.).
* **Instant Sample Datasets**: Includes 4 realistic medical test cases (Diabetic Panel, Infection CBC, Hypercholesterolemia, Acute Transaminitis) for one-click testing without needing a physical lab sheet.
* **6-Digit Pincode Geocoding**: Automatically detects city and postal zone centroids across postal circles for regional mapping.
* **Plain-English Clinical Translation**:
  * Conversational, reassuring high-level summary eliminating confusing medical jargon.
  * Structured Biomarkers Table comparing patient results to reference ranges with color-coded severity indicators (Normal, Elevated, Low, Critical).
  * Plain-language explanation of physiological impacts on energy, metabolism, and daily health.
  * Checkable "Questions to Ask Your Doctor" preparation guide.
  * Non-prescriptive lifestyle and dietary follow-up recommendations.
  * Integrated Text-to-Speech audio readout for accessibility.
* **Symptom Health Assistant (Conversational AI Chat)**:
  * Allows patients to describe their physical sensations and symptoms in plain language.
  * Analyzes potential physiological mechanisms and provides educational triage.
  * Correlates patient symptoms directly with active laboratory test values.
  * Highlights red-flag warning signs that require emergency medical evaluation.

### 2. Backend & Multimodal Intelligence
* **Google Gemini AI Integration (`gemini-3.8-flash`)**: Server-side multimodal vision analysis powered by the `@google/genai` TypeScript SDK with automated telemetry headers (`User-Agent: aistudio-build`).
* **Privacy-Preserving Telemetry**: When a report is translated or symptoms are described, Sentinel Health extracts an anonymized clinical finding keyword (e.g. *"Hyperglycemia / Diabetic Risk"*, *"Leukocytosis / Bacterial Infection"*) and persists only the symptom keyword, timestamp, severity, and 6-digit pincode to Cloud Firestore. No patient names, addresses, or identifiers are ever stored.

### 3. Admin Dashboard (`/dashboard`)
* **Interactive Leaflet.js Map (Street View)**: OpenStreetMap-powered street view detailing road networks, cities, terrain, and district boundaries.
* **Epidemiological Heat Markers**:
  * Concentric glowing heat circles and pulse markers centered on pincode centroids.
  * Radius, color, and pulse intensity automatically scale with case count and severity (Rose for Critical, Orange for High, Amber for Moderate, Teal for Low).
  * Interactive marker popups displaying total incident counts, dominant symptoms, and regional incident breakdowns.
* **Live Symptom Feed**: Real-time sidebar stream connected to Firestore via `onSnapshot` listeners, with severity filters, clinical category filtering, and keyword search. Clicking any incident card smoothly flies the map to that location.
* **Operational Controls**: Quick-jump metro shortcuts (Bangalore, Mumbai, Delhi, Hyderabad, Kolkata, Chennai, Pune), one-click incident simulation, and CSV data export.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19 (TypeScript), Vite 8 |
| **Styling & Design** | Tailwind CSS v4, Lucide Icons, Custom Leaflet Dark/Light Components |
| **Mapping & Geospatial** | Leaflet.js 1.9, OpenStreetMap Tiles, Algorithmic Pincode Centroid Database |
| **Backend & API** | Node.js (v22), Express 4, ESBuild (Production Server Bundler) |
| **Artificial Intelligence** | Google Gemini API (`@google/genai` SDK, `gemini-3.8-flash`) |
| **Database & Realtime** | Google Cloud Firestore (Firebase SDK, Firestore REST API) |
| **Deployment** | Docker / Cloud Run (`start: node server.ts`) |

---

## 📁 Repository Structure

```
.
├── firebase-applet-config.json  # Firebase client credentials & Firestore database ID
├── firebase-blueprint.json      # Firestore Intermediate Representation (IR) schema
├── firestore.rules              # Attribute-Based Access Control security rules
├── index.html                   # HTML entry point with Leaflet styles & SEO metadata
├── metadata.json                # AI Studio application metadata & capability flags
├── package.json                 # Node dependencies & production build scripts
├── server.ts                    # Production Cloud Run entry point (loads server.bundle.js)
├── server/
│   ├── apiApp.ts                # Express API router (Gemini AI & Firestore endpoints)
│   └── serverImpl.ts            # Server bundling entry point (ESM express app)
├── src/
│   ├── App.tsx                  # Root component & client URL routing
│   ├── main.tsx                 # React DOM mount point
│   ├── index.css                # Tailwind CSS v4 imports & Leaflet custom styles
│   ├── components/
│   │   ├── Navbar.tsx           # Responsive header with route switcher & status
│   │   ├── PatientPortal.tsx    # Lab scanner, sample reports & results breakdown
│   │   ├── SymptomChat.tsx      # Interactive AI symptom assistant & lab correlation
│   │   └── AdminDashboard.tsx   # Leaflet Street View map & live surveillance feed
│   └── lib/
│       ├── firebase.ts          # Firebase Firestore client initialization & listeners
│       ├── pincodeData.ts       # Indian pincode geo-coordinates & seed surveillance
│       └── sampleReports.ts     # Curated SVG medical lab reports for instant testing
└── vite.config.ts               # Vite build configuration with Express dev middleware
```

---

## 🔌 API Endpoints

### `POST /api/analyze-report`
Analyzes an uploaded lab report image, extracts clinical parameters, generates patient explanations, and saves anonymized telemetry to Firestore.
* **Request Body**:
  ```json
  {
    "image": "data:image/jpeg;base64,...",
    "pincode": "560001"
  }
  ```
* **Response**:
  ```json
  {
    "success": true,
    "docId": "firestore-doc-id",
    "explanation": {
      "title": "Glycemic Profile & Diabetes Evaluation",
      "summary": "...",
      "symptom": "Hyperglycemia / Type-2 Diabetic Risk",
      "category": "Metabolic",
      "severity": "high",
      "keyFindings": [...],
      "whatItMeans": "...",
      "questionsForDoctor": [...],
      "lifestyleGuidance": [...]
    }
  }
  ```

### `POST /api/symptom-chat`
Conversational clinical triage endpoint where users describe physical sensations and symptoms.
* **Request Body**:
  ```json
  {
    "message": "I feel unusually dizzy and fatigued after meals",
    "history": [],
    "pincode": "560001",
    "reportContext": { ... }
  }
  ```
* **Response**:
  ```json
  {
    "reply": "Empathetic clinical explanation...",
    "extractedSymptom": "Fatigue / Lethargy & Dizziness",
    "severity": "moderate",
    "category": "Metabolic"
  }
  ```

### `GET /api/symptom-reports`
Retrieves the most recent anonymized surveillance entries from Cloud Firestore for map visualization.

---

## 🚀 Running Locally

1. **Clone the repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the root directory (based on `.env.example`):
   ```env
   GEMINI_API_KEY="your-google-gemini-api-key"
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

4. **Production Build & Execution**:
   ```bash
   npm run build
   npm start
   ```

---

## ⚖️ Medical Disclaimer

Sentinel Health is an educational lab report translation and public health surveillance research tool powered by Google Gemini AI. It does not provide medical diagnosis, treatment protocols, or prescriptions. Laboratory metrics and symptom assessments should always be evaluated by a certified medical doctor or healthcare provider.

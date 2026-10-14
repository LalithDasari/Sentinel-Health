/**
 * Realistic medical laboratory test sample data and generated report images
 * for seamless user testing and demonstration in Sentinel Health.
 */

export interface SampleReportOption {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  pincode: string;
  expectedSymptom: string;
  severity: "low" | "moderate" | "high" | "critical";
  imageDataUrl: string;
  previewSummary: string;
}

// Generate realistic SVG-based medical lab report images as Data URLs
function generateLabReportSvg(params: {
  testTitle: string;
  patientId: string;
  date: string;
  doctor: string;
  facility: string;
  items: Array<{ name: string; value: string; unit: string; refRange: string; flag?: "H" | "L" | "Normal" }>;
  notes: string;
}): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1050" width="800" height="1050">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.1" />
    </filter>
  </defs>

  <!-- Background Sheet -->
  <rect width="800" height="1050" fill="#ffffff" />
  <rect x="0" y="0" width="800" height="8" fill="#0d9488" />

  <!-- Lab Header -->
  <rect x="40" y="40" width="720" height="100" rx="8" fill="url(#headerGrad)" />
  <circle cx="85" cy="90" r="24" fill="#0d9488" />
  <path d="M85 76 L85 104 M71 90 L99 90" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
  <text x="125" y="80" font-family="system-ui, sans-serif" font-size="22" font-weight="700" fill="#ffffff">SENTINEL CLINICAL LABORATORIES</text>
  <text x="125" y="104" font-family="system-ui, sans-serif" font-size="13" font-weight="400" fill="#94a3b8">NABL ACCREDITED & ISO 15189 CERTIFIED • AUTOMATED DIAGNOSTIC WING</text>
  <text x="125" y="122" font-family="system-ui, sans-serif" font-size="11" font-weight="500" fill="#2dd4bf">REF: ${params.facility} • SCAN PROTOCOL AI-VERIFIED</text>

  <!-- Patient & Sample Metadata Box -->
  <rect x="40" y="160" width="720" height="96" rx="6" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5" />
  
  <text x="60" y="190" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#64748b">PATIENT ID:</text>
  <text x="145" y="190" font-family="system-ui, sans-serif" font-size="13" font-weight="700" fill="#0f172a">${params.patientId}</text>
  
  <text x="320" y="190" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#64748b">DATE & TIME:</text>
  <text x="415" y="190" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#0f172a">${params.date}</text>
  
  <text x="560" y="190" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#64748b">AGE / SEX:</text>
  <text x="640" y="190" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#0f172a">42 Y / M</text>

  <text x="60" y="230" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#64748b">REFERRED BY:</text>
  <text x="160" y="230" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#0f172a">${params.doctor}</text>
  
  <text x="320" y="230" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#64748b">SPECIMEN:</text>
  <text x="400" y="230" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#0f172a">Venous Blood (EDTA / Plain)</text>

  <!-- Test Name Banner -->
  <rect x="40" y="275" width="720" height="42" fill="#f1f5f9" />
  <text x="60" y="302" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="#0f172a">${params.testTitle.toUpperCase()}</text>

  <!-- Table Header -->
  <rect x="40" y="330" width="720" height="36" fill="#0f172a" />
  <text x="60" y="353" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff">INVESTIGATION / PARAMETER</text>
  <text x="360" y="353" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff">RESULT</text>
  <text x="470" y="353" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff">UNIT</text>
  <text x="560" y="353" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff">REFERENCE RANGE</text>
  <text x="700" y="353" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#ffffff">FLAG</text>

  <!-- Table Rows -->
  ${params.items.map((item, idx) => {
    const y = 390 + idx * 46;
    const isAbnormal = item.flag === "H" || item.flag === "L";
    const flagColor = item.flag === "H" ? "#dc2626" : item.flag === "L" ? "#ea580c" : "#16a34a";
    const bgRow = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
    return `
      <rect x="40" y="${y - 24}" width="720" height="46" fill="${bgRow}" />
      <line x1="40" y1="${y + 22}" x2="760" y2="${y + 22}" stroke="#f1f5f9" stroke-width="1" />
      <text x="60" y="${y + 4}" font-family="system-ui, sans-serif" font-size="13" font-weight="${isAbnormal ? '700' : '500'}" fill="#1e293b">${item.name}</text>
      <text x="360" y="${y + 4}" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="${isAbnormal ? flagColor : '#0f172a'}">${item.value}</text>
      <text x="470" y="${y + 4}" font-family="system-ui, sans-serif" font-size="13" font-weight="400" fill="#64748b">${item.unit}</text>
      <text x="560" y="${y + 4}" font-family="system-ui, sans-serif" font-size="13" font-weight="500" fill="#475569">${item.refRange}</text>
      <rect x="696" y="${y - 12}" width="34" height="22" rx="4" fill="${isAbnormal ? flagColor + '20' : '#16a34a15'}" stroke="${flagColor}" stroke-width="1" />
      <text x="713" y="${y + 3}" text-anchor="middle" font-family="system-ui, sans-serif" font-size="11" font-weight="800" fill="${flagColor}">${item.flag || 'NORMAL'}</text>
    `;
  }).join("")}

  <!-- Interpretation & Notes Box -->
  <rect x="40" y="800" width="720" height="110" rx="6" fill="#fffbeb" stroke="#fef3c7" stroke-width="1.5" />
  <text x="60" y="828" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#b45309">PATHOLOGIST CLINICAL OBSERVATIONS & NOTES:</text>
  <text x="60" y="854" font-family="system-ui, sans-serif" font-size="13" font-weight="500" fill="#78350f">${params.notes}</text>
  <text x="60" y="884" font-family="system-ui, sans-serif" font-size="11" font-weight="400" fill="#92400e">Automated analysis verified on Sysmex XN-1000 & Roche Cobas c501 analyzers.</text>

  <!-- Signatures Footer -->
  <line x1="40" y1="940" x2="760" y2="940" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="4 4" />
  <text x="60" y="975" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748b">Verified by Lab Technologist</text>
  <text x="60" y="995" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#0f172a">Dr. R. K. Sharma, MD (Pathology)</text>
  
  <text x="560" y="975" font-family="system-ui, sans-serif" font-size="11" font-weight="600" fill="#64748b">Consultant Pathologist</text>
  <text x="560" y="995" font-family="system-ui, sans-serif" font-size="12" font-weight="700" fill="#0f172a">Dr. Sunita Menon, FRCPath</text>

  <!-- Page bottom line -->
  <rect x="0" y="1042" width="800" height="8" fill="#0f172a" />
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_LAB_REPORTS: SampleReportOption[] = [
  {
    id: "sample-glucose-diabetes",
    title: "Diabetic Metabolic Panel (Hyperglycemia)",
    subtitle: "Elevated Fasting Glucose (178 mg/dL) & HbA1c (8.6%)",
    category: "Metabolic",
    pincode: "560001",
    expectedSymptom: "Hyperglycemia / Type-2 Diabetic Risk",
    severity: "high",
    previewSummary: "Fasting Blood Glucose 178 mg/dL (Ref: 70-99), HbA1c 8.6% (Ref: <5.7%). Indicative of uncontrolled blood glucose.",
    imageDataUrl: generateLabReportSvg({
      testTitle: "Glycemic Profile & Diabetes Evaluation Panel",
      patientId: "SN-94812",
      date: "14-Oct-2026 08:30 AM",
      doctor: "Dr. A. V. Rao, MD (Endocrinology)",
      facility: "Apex Diabetology Center, Bangalore",
      items: [
        { name: "Fasting Blood Glucose (FBS)", value: "178.0", unit: "mg/dL", refRange: "70.0 - 99.0", flag: "H" },
        { name: "Post-Prandial Glucose (PPBS)", value: "245.0", unit: "mg/dL", refRange: "70.0 - 140.0", flag: "H" },
        { name: "Glycated Hemoglobin (HbA1c)", value: "8.6", unit: "%", refRange: "4.0 - 5.6", flag: "H" },
        { name: "Estimated Average Glucose (eAG)", value: "200.0", unit: "mg/dL", refRange: "80.0 - 120.0", flag: "H" },
        { name: "Serum Creatinine", value: "0.92", unit: "mg/dL", refRange: "0.70 - 1.20", flag: "Normal" },
        { name: "Microalbumin / Creatinine Ratio", value: "38.5", unit: "mg/g", refRange: "< 30.0", flag: "H" },
        { name: "Urine Glucose", value: "Positive (++ )", unit: "-", refRange: "Negative", flag: "H" }
      ],
      notes: "Pronounced hyperglycemia noted with HbA1c indicative of poor glycemic control over the preceding 90 days. Early microalbuminuria detected. Clinical correlation and immediate diabetology review advised."
    })
  },
  {
    id: "sample-cbc-infection",
    title: "Complete Blood Count (Leukocytosis / Infection)",
    subtitle: "High White Blood Cells (16,800 /μL) with Neutrophilia (82%)",
    category: "Hematology",
    pincode: "110001",
    expectedSymptom: "Leukocytosis / Acute Bacterial Infection",
    severity: "high",
    previewSummary: "Total Leukocyte Count (TLC) 16,800 /μL, Neutrophils 82%, CRP elevated. Strong indication of inflammatory or bacterial response.",
    imageDataUrl: generateLabReportSvg({
      testTitle: "Complete Blood Count (CBC) with Differential",
      patientId: "SN-82019",
      date: "14-Oct-2026 09:15 AM",
      doctor: "Dr. P. Singhal, MD (Internal Med)",
      facility: "Metro Health Research Labs, New Delhi",
      items: [
        { name: "Total Leukocyte Count (WBC)", value: "16,800", unit: "/μL", refRange: "4,000 - 11,000", flag: "H" },
        { name: "Neutrophils (Absolute)", value: "82.0", unit: "%", refRange: "40.0 - 70.0", flag: "H" },
        { name: "Lymphocytes", value: "12.5", unit: "%", refRange: "20.0 - 40.0", flag: "L" },
        { name: "Hemoglobin (Hb)", value: "13.8", unit: "g/dL", refRange: "13.0 - 17.0", flag: "Normal" },
        { name: "Platelet Count", value: "310,000", unit: "/μL", refRange: "150,000 - 450,000", flag: "Normal" },
        { name: "C-Reactive Protein (High Sensitivity)", value: "24.6", unit: "mg/L", refRange: "< 3.0", flag: "H" },
        { name: "Erythrocyte Sed. Rate (ESR)", value: "38", unit: "mm/hr", refRange: "0 - 15", flag: "H" }
      ],
      notes: "Marked leukocytosis with absolute neutrophilic left-shift and elevated acute phase reactants (CRP, ESR). Correlates with acute bacterial infection or active inflammatory process."
    })
  },
  {
    id: "sample-lipid-cholesterol",
    title: "Lipid Profile (Hypercholesterolemia & High LDL)",
    subtitle: "Total Cholesterol (264 mg/dL) & LDL 'Bad' Cholesterol (182 mg/dL)",
    category: "Cardiovascular",
    pincode: "400001",
    expectedSymptom: "Hypercholesterolemia / High Atherogenic Risk",
    severity: "moderate",
    previewSummary: "Total Cholesterol 264 mg/dL, LDL 182 mg/dL, Triglycerides 215 mg/dL, HDL 36 mg/dL. Elevated cardiovascular risk.",
    imageDataUrl: generateLabReportSvg({
      testTitle: "Comprehensive Fasting Lipid Cardiovascular Profile",
      patientId: "SN-77402",
      date: "13-Oct-2026 07:45 AM",
      doctor: "Dr. K. Merchant, MD, DM (Cardiology)",
      facility: "Bombay Heart Institute Laboratories, Mumbai",
      items: [
        { name: "Total Serum Cholesterol", value: "264.0", unit: "mg/dL", refRange: "< 200.0", flag: "H" },
        { name: "LDL Cholesterol (Direct)", value: "182.0", unit: "mg/dL", refRange: "< 100.0", flag: "H" },
        { name: "HDL 'Good' Cholesterol", value: "36.0", unit: "mg/dL", refRange: "> 40.0", flag: "L" },
        { name: "Serum Triglycerides", value: "215.0", unit: "mg/dL", refRange: "< 150.0", flag: "H" },
        { name: "VLDL Cholesterol", value: "43.0", unit: "mg/dL", refRange: "5.0 - 30.0", flag: "H" },
        { name: "Total Cholesterol / HDL Ratio", value: "7.33", unit: "Ratio", refRange: "< 4.5", flag: "H" },
        { name: "Non-HDL Cholesterol", value: "228.0", unit: "mg/dL", refRange: "< 130.0", flag: "H" }
      ],
      notes: "Severe dyslipidemia profile characterized by elevated atherogenic fractions (LDL-C, Non-HDL-C) and depressed protective HDL. High 10-year ASCVD risk profile. Dietary intervention & statin therapy consultation recommended."
    })
  },
  {
    id: "sample-liver-critical",
    title: "Liver Function Test (Acute Transaminitis)",
    subtitle: "Severely Elevated ALT (340 U/L) & AST (295 U/L)",
    category: "Hepatic",
    pincode: "500081",
    expectedSymptom: "Acute Hepatocellular Injury / High Transaminases",
    severity: "critical",
    previewSummary: "ALT 340 U/L (Ref: <45), AST 295 U/L (Ref: <35), Total Bilirubin 3.2 mg/dL. Marked acute hepatic enzyme elevation requiring urgent attention.",
    imageDataUrl: generateLabReportSvg({
      testTitle: "Hepatic Biochemical Function Profile (LFT)",
      patientId: "SN-65319",
      date: "14-Oct-2026 11:00 AM",
      doctor: "Dr. S. Reddy, MD, DM (Hepatology)",
      facility: "Asian Institute of Gastroenterology Labs, Hyderabad",
      items: [
        { name: "Alanine Aminotransferase (ALT/SGPT)", value: "340.0", unit: "U/L", refRange: "5.0 - 45.0", flag: "H" },
        { name: "Aspartate Aminotransferase (AST/SGOT)", value: "295.0", unit: "U/L", refRange: "5.0 - 35.0", flag: "H" },
        { name: "Total Bilirubin", value: "3.20", unit: "mg/dL", refRange: "0.20 - 1.20", flag: "H" },
        { name: "Direct (Conjugated) Bilirubin", value: "2.10", unit: "mg/dL", refRange: "0.00 - 0.30", flag: "H" },
        { name: "Alkaline Phosphatase (ALP)", value: "210.0", unit: "U/L", refRange: "40.0 - 130.0", flag: "H" },
        { name: "Gamma-Glutamyl Transferase (GGT)", value: "185.0", unit: "U/L", refRange: "8.0 - 61.0", flag: "H" },
        { name: "Serum Albumin", value: "3.9", unit: "g/dL", refRange: "3.5 - 5.0", flag: "Normal" }
      ],
      notes: "Critical hepatocellular cytolysis pattern indicated by tenfold transaminase spike and conjugated hyperbilirubinemia. Differential diagnosis includes acute viral hepatitis, drug-induced liver injury, or biliary obstruction. Urgent clinical review required."
    })
  }
];

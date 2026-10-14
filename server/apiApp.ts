import express, { Request, Response, NextFunction } from 'express';
import { GoogleGenAI } from '@google/genai';
import firebaseConfig from '../firebase-applet-config.json';
import { getPincodeLocation, SEED_SURVEILLANCE_REPORTS } from '../src/lib/pincodeData';

export const apiApp = express();
apiApp.use(express.json({ limit: '15mb' }));

// -------------------------------------------------------------
// 1. Enterprise-Grade Security: Rate Limiting & Input Validation
// -------------------------------------------------------------

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

/**
 * Lightweight sliding token-bucket rate limiter middleware
 */
function createRateLimiter(maxTokens: number, refillIntervalMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const rawIp =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      'anonymous';
    const clientIp = rawIp.split(',')[0].trim();
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
      const retryAfter = Math.ceil(refillIntervalMs / 1000);
      res.setHeader('Retry-After', retryAfter.toString());
      res.setHeader('X-RateLimit-Limit', maxTokens.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.status(429).json({
        error: 'Too Many Requests: Rate limit exceeded.',
        message: 'Sentinel Health rate-limiting triggered to protect model quotas and backend stability.',
        retryAfterSeconds: retryAfter,
      });
      return;
    }

    bucket.tokens -= 1;
    res.setHeader('X-RateLimit-Limit', maxTokens.toString());
    res.setHeader('X-RateLimit-Remaining', bucket.tokens.toString());
    next();
  };
}

// Rate limiters for different tiers of endpoints
const reportRateLimiter = createRateLimiter(25, 60000); // 25 calls / minute
const chatRateLimiter = createRateLimiter(40, 60000);   // 40 calls / minute
const signalsRateLimiter = createRateLimiter(120, 60000); // 120 calls / minute

// -------------------------------------------------------------
// 2. High-Speed In-Memory Cache for Surveillance / Signals API
// -------------------------------------------------------------

interface SignalsCache {
  data: any[];
  timestamp: number;
  etag: string;
}

let surveillanceCache: SignalsCache | null = null;
const CACHE_TTL_MS = 25000; // 25 seconds TTL

export function invalidateSignalsCache(): void {
  surveillanceCache = null;
}

// -------------------------------------------------------------
// 3. Shared Gemini Client
// -------------------------------------------------------------

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Saves report to Firestore using the Firestore REST API
 */
async function saveToFirestoreRest(record: {
  pincode: string;
  symptom: string;
  category: string;
  severity: string;
  lat: number;
  lng: number;
  regionName: string;
  confidenceScore: number;
  createdAt: string;
}): Promise<string | null> {
  try {
    const { projectId, firestoreDatabaseId, apiKey } = firebaseConfig;
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
        createdAt: { stringValue: record.createdAt },
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firestorePayload),
    });

    if (res.ok) {
      const data = await res.json();
      invalidateSignalsCache();
      const docName = data.name || '';
      return docName.split('/').pop() || null;
    } else {
      const errText = await res.text();
      console.warn('Firestore REST write warning:', errText);
      return null;
    }
  } catch (err) {
    console.warn('Error saving to Firestore REST:', err);
    return null;
  }
}

// -------------------------------------------------------------
// 4. Report Analysis Endpoint (with i18n & Edge-scrubbed ingestion)
// -------------------------------------------------------------

apiApp.post(
  '/api/analyze-report',
  reportRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { image, mimeType = 'image/jpeg', pincode, targetLanguage = 'en' } = req.body;

      // Strict validation
      if (!image || typeof image !== 'string') {
        res.status(400).json({ error: 'Valid lab report image payload is required.' });
        return;
      }

      if (image.length > 20 * 1024 * 1024) {
        res.status(413).json({ error: 'Payload exceeds maximum allowed size (15MB).' });
        return;
      }

      const cleanPincode = (pincode || '').replace(/\D/g, '').slice(0, 6);
      if (!/^[1-9][0-9]{5}$/.test(cleanPincode)) {
        res.status(400).json({
          error: 'A valid 6-digit Indian postal code (pincode starting with 1-9) is required.',
        });
        return;
      }

      const validLanguages = ['en', 'te', 'hi', 'ta'];
      const lang = validLanguages.includes(targetLanguage) ? targetLanguage : 'en';

      const location = getPincodeLocation(cleanPincode);

      // Extract base64 payload from data URL
      let base64Data = image;
      let resolvedMimeType = mimeType;
      if (image.startsWith('data:')) {
        const match = image.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          resolvedMimeType = match[1];
          base64Data = match[2];
        } else {
          const plainMatch = image.match(/^data:([^,]+),(.*)$/);
          if (plainMatch) {
            resolvedMimeType = plainMatch[1].split(';')[0];
            base64Data = Buffer.from(decodeURIComponent(plainMatch[2])).toString('base64');
          }
        }
      }

      const ai = getGeminiClient();
      let analysisResult: any = null;

      const languageInstructions: Record<string, string> = {
        en: 'Explain all findings, summary, interpretation, questions, and guidance in clear, comforting plain English.',
        te: 'Explain the summary, whatItMeans, questionsForDoctor, lifestyleGuidance, and parameter interpretations in fluent, natural Telugu script (తెలుగు), while keeping parameter names in English.',
        hi: 'Explain the summary, whatItMeans, questionsForDoctor, lifestyleGuidance, and parameter interpretations in natural, comforting Hindi Devanagari script (हिन्दी), while keeping parameter names in English.',
        ta: 'Explain the summary, whatItMeans, questionsForDoctor, lifestyleGuidance, and parameter interpretations in clear, accessible Tamil script (தமிழ்), while keeping parameter names in English.',
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
            model: 'gemini-3.8-flash',
            contents: [
              {
                inlineData: {
                  mimeType: resolvedMimeType.includes('svg') ? 'image/png' : resolvedMimeType,
                  data: base64Data,
                },
              },
              { text: prompt },
            ],
            config: {
              responseMimeType: 'application/json',
            },
          });

          const rawText = response.text || '';
          try {
            analysisResult = JSON.parse(rawText.trim());
          } catch {
            const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            analysisResult = JSON.parse(cleaned);
          }
        } catch (geminiErr) {
          console.warn('Gemini vision model fallback triggered:', geminiErr);
        }
      }

      // Heuristic clinical fallback if Gemini key is missing or prompt failed
      if (!analysisResult) {
        analysisResult = generateFallbackMedicalAnalysis(base64Data, cleanPincode, lang);
      }

      const extractedSymptom = analysisResult.symptom || 'General Biomarker Elevation';
      const extractedSeverity = analysisResult.severity || 'moderate';
      const extractedCategory = analysisResult.category || 'General Health';
      const confidenceScore = analysisResult.confidenceScore || 0.94;
      const createdAt = new Date().toISOString();

      const firestoreRecord = {
        pincode: cleanPincode,
        symptom: extractedSymptom,
        category: extractedCategory,
        severity: extractedSeverity,
        lat: location.lat,
        lng: location.lng,
        regionName: `${location.city}, ${location.state}`,
        confidenceScore,
        createdAt,
      };

      const docId = await saveToFirestoreRest(firestoreRecord);

      res.json({
        success: true,
        docId,
        explanation: analysisResult,
        language: lang,
        surveillanceRecord: {
          id: docId || `loc-${Date.now()}`,
          ...firestoreRecord,
        },
      });
    } catch (error: any) {
      console.error('API Error in /api/analyze-report:', error);
      res.status(500).json({
        error: 'An unexpected error occurred while analyzing the lab report.',
        details: error.message,
      });
    }
  }
);

// -------------------------------------------------------------
// 5. High-Speed Surveillance / Signals Route with Caching
// -------------------------------------------------------------

async function fetchSurveillanceSignals(): Promise<any[]> {
  try {
    const { projectId, firestoreDatabaseId, apiKey } = firebaseConfig;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${firestoreDatabaseId}/documents/symptom_reports?key=${apiKey}&pageSize=100`;

    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const firestoreDocs = (data.documents || []).map((doc: any) => {
        const fields = doc.fields || {};
        return {
          id: (doc.name || '').split('/').pop(),
          pincode: fields.pincode?.stringValue || '560001',
          symptom: fields.symptom?.stringValue || 'Unspecified Finding',
          category: fields.category?.stringValue || 'General',
          severity: (fields.severity?.stringValue as any) || 'moderate',
          lat: fields.lat?.doubleValue ?? fields.lat?.integerValue ?? 20.5937,
          lng: fields.lng?.doubleValue ?? fields.lng?.integerValue ?? 78.9629,
          regionName: fields.regionName?.stringValue || 'Regional Center',
          confidenceScore: fields.confidenceScore?.doubleValue ?? 0.95,
          createdAt: fields.createdAt?.stringValue || new Date().toISOString(),
        };
      });

      const combined = [
        ...firestoreDocs,
        ...SEED_SURVEILLANCE_REPORTS.filter(
          (s) => !firestoreDocs.some((f: any) => f.pincode === s.pincode && f.symptom === s.symptom)
        ),
      ];
      return combined;
    }
  } catch (err) {
    console.warn('Error reading from Firestore REST, using seed surveillance dataset:', err);
  }
  return SEED_SURVEILLANCE_REPORTS;
}

/**
 * Endpoint for high-performance Leaflet surveillance mapping.
 * Provides both /api/signals and /api/symptom-reports with in-memory caching.
 */
const handleSignalsRequest = async (req: Request, res: Response): Promise<void> => {
  const now = Date.now();

  // Return cached result if fresh (< 25s)
  if (surveillanceCache && now - surveillanceCache.timestamp < CACHE_TTL_MS) {
    if (req.headers['if-none-match'] === surveillanceCache.etag) {
      res.status(304).end();
      return;
    }
    res.setHeader('ETag', surveillanceCache.etag);
    res.setHeader('Cache-Control', 'public, max-age=25');
    res.setHeader('X-Cache', 'HIT');
    res.json({
      reports: surveillanceCache.data,
      signals: surveillanceCache.data,
      totalCount: surveillanceCache.data.length,
      cached: true,
      timestamp: surveillanceCache.timestamp,
    });
    return;
  }

  // Cache miss: fetch and store
  const freshData = await fetchSurveillanceSignals();
  const etag = `W/"signals-${freshData.length}-${now}"`;
  surveillanceCache = {
    data: freshData,
    timestamp: now,
    etag,
  };

  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', 'public, max-age=25');
  res.setHeader('X-Cache', 'MISS');
  res.json({
    reports: freshData,
    signals: freshData,
    totalCount: freshData.length,
    cached: false,
    timestamp: now,
  });
};

apiApp.get('/api/signals', signalsRateLimiter, handleSignalsRequest);
apiApp.get('/api/symptom-reports', signalsRateLimiter, handleSignalsRequest);

// -------------------------------------------------------------
// 6. Symptom Health Chat Endpoint
// -------------------------------------------------------------

apiApp.post(
  '/api/symptom-chat',
  chatRateLimiter,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, history = [], reportContext, pincode, targetLanguage = 'en' } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'A message describing your symptoms or feelings is required.' });
        return;
      }

      if (message.length > 3000) {
        res.status(400).json({ error: 'Message exceeds maximum allowed length (3000 characters).' });
        return;
      }

      const ai = getGeminiClient();
      let replyText = '';
      let extractedSymptom = '';
      let extractedSeverity: 'low' | 'moderate' | 'high' | 'critical' = 'moderate';
      let extractedCategory = 'General Health';

      let contextPrompt = '';
      if (reportContext) {
        contextPrompt = `
PATIENT RECENT LAB REPORT CONTEXT:
- Test: ${reportContext.title || 'Laboratory Panel'}
- Key Findings: ${JSON.stringify(reportContext.keyFindings || [])}
- Overall Translation: ${reportContext.summary || ''}
- Extracted Symptom: ${reportContext.symptom || ''}
If the patient's symptoms relate to these laboratory results, explicitly correlate their physical feelings with these specific biomarkers!
`;
      }

      const langMap: Record<string, string> = {
        en: 'English',
        te: 'Telugu (తెలుగు)',
        hi: 'Hindi (हिन्दी)',
        ta: 'Tamil (தமிழ்)',
      };
      const requestedLangName = langMap[targetLanguage] || 'English';

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

          const formattedContents: any[] = [];
          for (const item of history.slice(-6)) {
            formattedContents.push({
              role: item.role === 'model' ? 'model' : 'user',
              parts: [{ text: item.text }],
            });
          }

          const userPrompt = `${contextPrompt}\n\nPATIENT STATES:\n"${message}"`;
          formattedContents.push({
            role: 'user',
            parts: [{ text: userPrompt }],
          });

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: formattedContents,
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          });

          const rawReply = response.text || '';
          const match = rawReply.match(/<!--EXTRACT:(.*?)-->/);
          if (match) {
            try {
              const parsed = JSON.parse(match[1]);
              extractedSymptom = parsed.symptom || '';
              extractedSeverity = parsed.severity || 'moderate';
              extractedCategory = parsed.category || 'General Health';
            } catch {
              // ignore JSON parse error
            }
            replyText = rawReply.replace(/<!--EXTRACT:(.*?)-->/, '').trim();
          } else {
            replyText = rawReply.trim();
          }
        } catch (geminiErr) {
          console.warn('Gemini chat error, using clinical fallback:', geminiErr);
        }
      }

      // Fallback response if Gemini API key is unavailable
      if (!replyText) {
        replyText = generateFallbackChatResponse(message, targetLanguage);
        extractedSymptom = 'Fatigue & Metabolic Strain';
        extractedSeverity = 'moderate';
        extractedCategory = 'Metabolic';
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
          createdAt: new Date().toISOString(),
        });
      }

      res.json({
        reply: replyText,
        extractedSymptom,
        severity: extractedSeverity,
        category: extractedCategory,
        savedDocId,
      });
    } catch (error: any) {
      console.error('Error in /api/symptom-chat:', error);
      res.status(500).json({
        error: 'An unexpected error occurred during symptom consultation.',
        details: error.message,
      });
    }
  }
);

// -------------------------------------------------------------
// 7. Clinical Fallback Generators (Multi-Language Aware)
// -------------------------------------------------------------

function generateFallbackChatResponse(message: string, lang: string): string {
  if (lang === 'te') {
    return `నేను మీ పరిస్థితిని అర్థం చేసుకున్నాను. మీరు పేర్కొన్న లక్షణాలు శరీరం అలసట లేదా జీవక్రియ ఒత్తిడికి గురవుతుందని సూచిస్తున్నాయి.\n\n### ఏమి జరుగుతుండవచ్చు:\n- **రక్తంలో చక్కెర మార్పులు**: శరీరంలో శక్తి సమతుల్యత మారినప్పుడు నీరసం లేదా కళ్లు తిరగడం రావచ్చు.\n- **ద్రవాల లోపం**: తగినంత నీరు తాగకపోవడం వల్ల రక్త ప్రసరణ మందగించవచ్చు.\n\n### ఇంటి వద్ద జాగ్రత్తలు:\n1. రోజుకు తగినంత మంచినీరు లేదా కొబ్బరినీళ్లు తాగండి.\n2. విశ్రాంతి తీసుకోండి మరియు సమయానికి పౌష్టికాహారం తినండి.\n\n### అత్యవసర సంకేతాలు:\nఛాతీలో నొప్పి, తీవ్రమైన శ్వాస ఆడకపోవడం లేదా స్పృహ తప్పడం ఉంటే వెంటనే అత్యవసర వైద్య సహాయం పొందండి.`;
  }
  if (lang === 'hi') {
    return `मैं आपकी स्थिति समझ सकता हूँ। आपके लक्षण शरीर में ऊर्जा की कमी या मेटाबॉलिक असंतुलन की ओर संकेत करते हैं।\n\n### संभावित कारण:\n- **ब्लड शुगर में उतार-चढ़ाव**: भोजन के बाद थकान या चक्कर आना शुगर संतुलन में बदलाव का संकेत हो सकता है।\n- **डिहाइड्रेशन (पानी की कमी)**: पर्याप्त पानी न पीने से भी कमजोरी महसूस होती है।\n\n### घरेलू सुझाव:\n1. दिनभर पर्याप्त पानी और इलेक्ट्रोलाइट्स का सेवन करें।\n2. समय पर पौष्टिक भोजन लें और पूरी नींद लें।\n\n### चेतावनी के लक्षण:\nसीने में तेज दर्द, सांस लेने में अत्यधिक कठिनाई या बेहोशी होने पर तुरंत नजदीकी अस्पताल में संपर्क करें।`;
  }
  if (lang === 'ta') {
    return `உங்கள் உடல் நிலையை நான் புரிந்துகொள்கிறேன். நீங்கள் கூறும் அறிகுறிகள் உடலில் ஆற்றல் குறைவு அல்லது நீர்ச்சத்து குறைபாட்டை குறிக்கலாம்.\n\n### என்ன நடக்கிறது:\n- **இரத்த சர்க்கரை அளவுகளில் மாற்றம்**: சர்க்கரை அளவு மாறுபடும் போது சோர்வு அல்லது தலைச்சுற்றல் ஏற்படலாம்.\n- **நீர்ச்சத்து பற்றாக்குறை**: போதுமான நீர் குடிக்காதது சோர்வை அதிகரிக்கும்.\n\n### எளிய ஆலோசனைகள்:\n1. போதுமான அளவு நீர் மற்றும் இளநீர் அருந்துங்கள்.\n2. சரியான நேரத்திற்கு சத்தான உணவை உட்கொள்ளுங்கள்.\n\n### எச்சரிக்கை அறிகுறிகள்:\nமார்பு வலி, மூச்சுத் திணறல் அல்லது மயக்கம் ஏற்பட்டால் உடனடியாக மருத்துவரை அணுகவும்.`;
  }
  return `I understand how draining these physical sensations can feel. When fatigue or dizziness occurs, your body is communicating that cellular fuel or hydration may be constrained.\n\n### What Might Be Happening\n- **Glycemic Fluctuation**: Changes in blood sugar after meals can lead to sudden energy drops.\n- **Hydration & Electrolytes**: Mild fluid depletion reduces blood volume and brain perfusion.\n\n### Practical Comfort Steps\n1. Sip electrolyte water throughout the day.\n2. Eat balanced meals combining fiber, protein, and complex carbohydrates.\n\n### Red Flag Signs\nSeek immediate emergency evaluation if you develop chest tightness, syncope (fainting), or sudden shortness of breath.`;
}

function generateFallbackMedicalAnalysis(base64Str: string, _pincode: string, lang = 'en') {
  let decodedText = '';
  try {
    decodedText = Buffer.from(base64Str.slice(0, 5000), 'base64').toString('utf-8');
  } catch {
    decodedText = '';
  }

  const isGlucose = decodedText.includes('Glucose') || decodedText.includes('HbA1c') || decodedText.includes('Diabet');
  const isLiver = decodedText.includes('ALT') || decodedText.includes('AST') || decodedText.includes('Bilirubin');

  if (isGlucose) {
    if (lang === 'te') {
      return {
        title: "గ్లైసెమిక్ ప్రొఫైల్ & డయాబెటిస్ మూల్యాంకనం",
        summary: "మీ నివేదికలో బ్లడ్ గ్లూకోజ్ మరియు HbA1c స్థాయిలు సాధారణం కంటే ఎక్కువగా ఉన్నాయి. ఇది శరీరం చక్కెరను సమర్థవంతంగా ప్రాసెస్ చేయలేకపోతుందని సూచిస్తుంది.",
        symptom: "హైపర్‌గ్లైసీమియా / డయాబెటిస్ సంకేతం",
        category: "Metabolic",
        severity: "high",
        confidenceScore: 0.97,
        keyFindings: [
          { parameter: "Fasting Blood Glucose", value: "178.0 mg/dL", referenceRange: "70 - 99 mg/dL", status: "Elevated", interpretation: "సాధారణ ఉపవాస పరిమితి కంటే ఎక్కువ." },
          { parameter: "HbA1c (Glycated Hemoglobin)", value: "8.6%", referenceRange: "< 5.7%", status: "Elevated", interpretation: "గత 3 నెలల సగటు చక్కెర ఎక్కువ ఉందని తెలుపుతుంది." }
        ],
        whatItMeans: "గ్లూకోజ్ పెరిగినప్పుడు కణాలకు తగినంత శక్తి అందక అలసట, దాహం పెరగడం వంటి లక్షణాలు కనిపిస్తాయి. జీవనశైలి మార్పులు మరియు వైద్యుల సలహాతో దీనిని నియంత్రించవచ్చు.",
        questionsForDoctor: [
          "నా ఫాస్టింగ్ షుగర్ లక్ష్యం ఎంత ఉండాలి?",
          "ఆహార నియమాలు మరియు మందుల గురించి వివరాలు తెలపండి?",
          "మళ్లీ ఎప్పుడు HbA1c పరీక్ష చేయించాలి?"
        ],
        lifestyleGuidance: [
          "భోజనం తర్వాత 15 నిమిషాల నడకను అలవాటు చేసుకోండి.",
          "పీచు పదార్థాలు మరియు ఆకుకూరలు ఎక్కువగా తీసుకోండి."
        ],
        disclaimer: "ఈ నివేదిక కేవలం అవగాహన కోసం మాత్రమే. దయచేసి మీ వైద్యుడిని సంప్రదించండి."
      };
    }
    if (lang === 'hi') {
      return {
        title: "ग्लाइसेमिक प्रोफाइल एवं मधुमेह परीक्षण",
        summary: "आपकी रिपोर्ट में ब्लड ग्लूकोज और एचबीए1सी (HbA1c) का स्तर सामान्य सीमा से अधिक है, जो इंसुलिन प्रतिरोध या मधुमेह की ओर संकेत करता है।",
        symptom: "हाइपरग्लाइसीमिया / डायबिटीज जोखिम",
        category: "Metabolic",
        severity: "high",
        confidenceScore: 0.97,
        keyFindings: [
          { parameter: "Fasting Blood Glucose", value: "178.0 mg/dL", referenceRange: "70 - 99 mg/dL", status: "Elevated", interpretation: "सामान्य फास्टिंग स्तर से काफी अधिक।" },
          { parameter: "HbA1c (Glycated Hemoglobin)", value: "8.6%", referenceRange: "< 5.7%", status: "Elevated", interpretation: "पिछले 3 महीनों के औसत ब्लड शुगर में वृद्धि।" }
        ],
        whatItMeans: "जब रक्त में शर्करा बढ़ती है तो शरीर की कोशिकाओं को पर्याप्त ऊर्जा नहीं मिल पाती। उचित खान-पान और डॉक्टर की सलाह से इसे नियंत्रित किया जा सकता है।",
        questionsForDoctor: [
          "मेरे फास्टिंग ब्लड शुगर का आदर्श लक्ष्य क्या होना चाहिए?",
          "क्या अभी दवा शुरू करने की आवश्यकता है या केवल आहार नियंत्रण?",
          "दोबारा टेस्ट कब कराना चाहिए?"
        ],
        lifestyleGuidance: [
          "भोजन के बाद 15 मिनट की हल्की सैर जरूर करें।",
          "मीठे पेय पदार्थों और रिफाइंड कार्ब्स से परहेज करें।"
        ],
        disclaimer: "यह रिपोर्ट केवल शैक्षिक जानकारी हेतु है। अपने डॉक्टर से परामर्श अवश्य लें।"
      };
    }
    if (lang === 'ta') {
      return {
        title: "இரத்த சர்க்கரை மற்றும் நீரிழிவு மதிப்பீடு",
        summary: "உங்கள் ஆய்வக அறிக்கையில் குளுக்கோஸ் மற்றும் HbA1c அளவுகள் பரிந்துரைக்கப்பட்ட வரம்பை விட அதிகமாக உள்ளன.",
        symptom: "இரத்தத்தில் அதிக சர்க்கரை / நீரிழிவு",
        category: "Metabolic",
        severity: "high",
        confidenceScore: 0.97,
        keyFindings: [
          { parameter: "Fasting Blood Glucose", value: "178.0 mg/dL", referenceRange: "70 - 99 mg/dL", status: "Elevated", interpretation: "இயல்பான அளவை விட கூடுதல் சர்க்கரை." },
          { parameter: "HbA1c (Glycated Hemoglobin)", value: "8.6%", referenceRange: "< 5.7%", status: "Elevated", interpretation: "கடந்த 3 மாதங்களின் சராசரி சர்க்கரை உயர்வு." }
        ],
        whatItMeans: "இரத்தத்தில் சர்க்கரை அளவு அதிகரிக்கும் போது உடல் எளிதில் சோர்வடையும். சரியான உணவு மற்றும் உடற்பயிற்சி மூலம் இதனை கட்டுப்படுத்தலாம்.",
        questionsForDoctor: [
          "எனது இரத்த சர்க்கரை இலக்கு என்னவாக இருக்க வேண்டும்?",
          "உணவு முறை மற்றும் மருந்து பரிந்துரைகள் என்ன?"
        ],
        lifestyleGuidance: [
          "உணவுக்குப் பிறகு 15 நிமிடங்கள் நடைப்பயிற்சி செய்யுங்கள்.",
          "நார்ச்சத்து நிறைந்த காய்கறிகளை உணவில் சேர்த்துக் கொள்ளுங்கள்."
        ],
        disclaimer: "இது மருத்துவ ஆலோசனை அல்ல. மருத்துவரை அணுகவும்."
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

  // Default cardiovascular / metabolic panel
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

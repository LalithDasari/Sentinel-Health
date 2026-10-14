import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  FileCheck2,
  Sparkles,
  MapPin,
  AlertCircle,
  CheckCircle2,
  HeartPulse,
  Volume2,
  VolumeX,
  ArrowRight,
  RefreshCw,
  X,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  FileText,
  Lock,
  WifiOff,
  Languages,
  Check
} from 'lucide-react';
import { getPincodeLocation } from '../lib/pincodeData';
import { SAMPLE_LAB_REPORTS, SampleReportOption } from '../lib/sampleReports';
import { SymptomReportItem, saveSymptomReportToFirestore } from '../lib/firebase';
import { SymptomChat } from './SymptomChat';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  getTranslation,
} from '../lib/i18n';
import { scrubPiiFromImagePayload, PiiScrubResult } from '../lib/piiScrubber';
import {
  enqueueOfflineReport,
  getQueuedReports,
  flushOfflineQueue,
  subscribeToQueueUpdates
} from '../lib/offlineQueue';

interface PatientPortalProps {
  onNavigateToDashboard: (highlightPincode?: string) => void;
  onReportProcessed?: (report: SymptomReportItem) => void;
  language?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  isHighContrast?: boolean;
}

interface KeyFinding {
  parameter: string;
  value: string;
  referenceRange: string;
  status: 'Normal' | 'Elevated' | 'Low' | 'Critical';
  interpretation: string;
}

interface TranslatedExplanation {
  title: string;
  summary: string;
  symptom: string;
  category: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  confidenceScore?: number;
  keyFindings: KeyFinding[];
  whatItMeans: string;
  questionsForDoctor: string[];
  lifestyleGuidance: string[];
  disclaimer: string;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  onNavigateToDashboard,
  onReportProcessed,
  language = 'en',
  onLanguageChange,
  isHighContrast = false,
}) => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'chat'>('scanner');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [pincode, setPincode] = useState<string>('560001');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<number>(1);
  const [explanation, setExplanation] = useState<TranslatedExplanation | null>(null);
  const [savedDocId, setSavedDocId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);

  // Security & Offline states
  const [piiScrubStats, setPiiScrubStats] = useState<{
    redactedCount: number;
    types: string[];
  } | null>(null);
  const [isOfflineQueued, setIsOfflineQueued] = useState<boolean>(false);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(() => getQueuedReports().length);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-derived location for the entered pincode
  const pincodeInfo = pincode.length === 6 ? getPincodeLocation(pincode) : null;

  // Listen to offline queue updates and auto-flush on reconnection
  useEffect(() => {
    const updateCount = () => {
      setPendingQueueCount(getQueuedReports().length);
    };

    const unsubscribeQueue = subscribeToQueueUpdates(updateCount);

    const handleOnline = async () => {
      const processed = await flushOfflineQueue((jobId, data) => {
        if (data.explanation) {
          setExplanation(data.explanation);
          setSavedDocId(data.docId || 'synced-from-offline');
        }
      });
      if (processed > 0) {
        setIsOfflineQueued(false);
      }
      updateCount();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      unsubscribeQueue();
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Multi-step loading messages
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      setLoadingStage(1);
      timer = setInterval(() => {
        setLoadingStage((prev) => (prev < 4 ? prev + 1 : prev));
      }, 1200);
    }
    return () => clearInterval(timer);
  }, [loading]);

  // Clean up audio speech synthesis on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && !file.type.includes('pdf')) {
        setErrorMessage('Please upload a valid image file (JPG, PNG, WebP).');
        return;
      }
      setErrorMessage(null);
      setImageFileName(file.name);
      setSelectedSample(null);

      const reader = new FileReader();
      reader.onload = () => {
        const rawPayload = reader.result as string;
        // Edge-side PII scrubbing immediately upon file selection
        const scrubbed = scrubPiiFromImagePayload(rawPayload);
        setSelectedImage(scrubbed.scrubbedImage);
        setPiiScrubStats({
          redactedCount: scrubbed.redactedCount,
          types: scrubbed.detectedTypes,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (sample: SampleReportOption) => {
    // Edge-side PII scrub sample report payload
    const scrubbed = scrubPiiFromImagePayload(sample.imageDataUrl);
    setSelectedImage(scrubbed.scrubbedImage);
    setImageFileName(`${sample.title}.svg`);
    setPincode(sample.pincode);
    setSelectedSample(sample.id);
    setErrorMessage(null);
    setPiiScrubStats({
      redactedCount: scrubbed.redactedCount,
      types: scrubbed.detectedTypes,
    });
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImageFileName('');
    setSelectedSample(null);
    setPiiScrubStats(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage) {
      setErrorMessage('Please upload or select a lab report image.');
      return;
    }

    const cleanPincode = pincode.replace(/\D/g, '').slice(0, 6);
    if (!/^[1-9][0-9]{5}$/.test(cleanPincode)) {
      setErrorMessage('Please enter a valid 6-digit Indian postal PIN code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setExplanation(null);
    setIsOfflineQueued(false);

    // If client is offline, queue request locally for PWA auto-sync
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      enqueueOfflineReport({
        image: selectedImage,
        pincode: cleanPincode,
        targetLanguage: language,
      });
      setLoading(false);
      setIsOfflineQueued(true);
      return;
    }

    try {
      const response = await fetch('/api/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage,
          pincode: cleanPincode,
          targetLanguage: language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze lab report');
      }

      setExplanation(data.explanation);
      setSavedDocId(data.docId || 'synced');

      const surveillanceItem: SymptomReportItem = {
        pincode: cleanPincode,
        symptom: data.explanation?.symptom || 'General Biomarker Elevation',
        category: data.explanation?.category || 'General Health',
        severity: data.explanation?.severity || 'moderate',
        lat: pincodeInfo?.lat,
        lng: pincodeInfo?.lng,
        regionName: `${pincodeInfo?.city}, ${pincodeInfo?.state}`,
        confidenceScore: data.explanation?.confidenceScore || 0.95,
        createdAt: new Date().toISOString(),
      };

      try {
        await saveSymptomReportToFirestore(surveillanceItem);
      } catch {
        // Silently handled if direct client SDK rule is strict
      }

      if (onReportProcessed) {
        onReportProcessed(surveillanceItem);
      }

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err: any) {
      console.error('Translation error:', err);
      // If network failure occurred, offer queueing
      if (!navigator.onLine || err.message?.includes('Failed to fetch')) {
        enqueueOfflineReport({
          image: selectedImage,
          pincode: cleanPincode,
          targetLanguage: language,
        });
        setIsOfflineQueued(true);
      } else {
        setErrorMessage(
          err.message || 'An error occurred while analyzing the report. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakSummary = () => {
    if (!('speechSynthesis' in window) || !explanation) return;

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    const textToRead = `${explanation.title}. ${explanation.summary}. ${explanation.whatItMeans}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);

    // Set voice language based on chosen translation language
    const langOption = SUPPORTED_LANGUAGES.find((l) => l.code === language);
    if (langOption) {
      utterance.lang = langOption.voiceLang;
    }
    utterance.rate = 0.92;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <span className="h-2 w-2 rounded-full bg-rose-600 animate-ping"></span>
            Critical Priority
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
            <span className="h-2 w-2 rounded-full bg-orange-600"></span>
            High Attention
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <span className="h-2 w-2 rounded-full bg-amber-600"></span>
            Moderate Variation
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
            Optimal / Baseline
          </span>
        );
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'Critical':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-600 text-white">Critical</span>;
      case 'Elevated':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500 text-white">Elevated</span>;
      case 'Low':
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-orange-500 text-white">Low</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-600 text-white">Normal</span>;
    }
  };

  return (
    <div
      className={`min-h-screen py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200 ${
        isHighContrast ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Offline Banner Notification */}
        {isOfflineQueued && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-2xl bg-amber-500/10 border-2 border-amber-500 p-4 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-sm"
          >
            <WifiOff className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold">Offline Queue Active</h3>
              <p className="text-xs leading-relaxed">
                {getTranslation(language, 'offlineQueued')}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-semibold bg-amber-200/60 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">
                  1 job pending local sync
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Patient Portal Dual Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div
            role="tablist"
            aria-label="Patient Portal Options"
            className="inline-flex p-1.5 bg-slate-200/90 dark:bg-slate-800 rounded-2xl border border-slate-300 dark:border-slate-700 shadow-sm w-full sm:w-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'scanner'}
              aria-controls="scanner-panel"
              onClick={() => setActiveTab('scanner')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition duration-150 ${
                activeTab === 'scanner'
                  ? 'bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-teal-600" aria-hidden="true" />
              <span>{getTranslation(language, 'scannerTab')}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'chat'}
              aria-controls="chat-panel"
              onClick={() => setActiveTab('chat')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition duration-150 ${
                activeTab === 'chat'
                  ? 'bg-slate-900 text-teal-400 shadow-sm border border-slate-800'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-teal-400" aria-hidden="true" />
              <span>{getTranslation(language, 'chatTab')}</span>
              <span className="hidden sm:inline-block ml-1 px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {getTranslation(language, 'aiAssistantBadge')}
              </span>
            </button>
          </div>

          {/* Quick Language Selector inside Portal */}
          {onLanguageChange && (
            <div className="flex items-center gap-1.5 text-xs font-medium ml-auto">
              <Languages className="w-4 h-4 text-teal-600" aria-hidden="true" />
              <label htmlFor="portal-lang-select" className="text-slate-500 dark:text-slate-400 font-semibold">
                {getTranslation(language, 'languageSelect')}:
              </label>
              <select
                id="portal-lang-select"
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 shadow-xs cursor-pointer focus:ring-2 focus:ring-teal-500"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName} ({l.label})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab 1: Scanner View */}
        {activeTab === 'scanner' ? (
          <div id="scanner-panel" role="tabpanel" className="space-y-6">
            {/* Edge PII Scrubbing Active Shield Banner */}
            <div
              className={`rounded-2xl p-4 border transition-all ${
                isHighContrast
                  ? 'border-white bg-black'
                  : 'border-teal-200/80 bg-gradient-to-r from-teal-500/5 via-cyan-500/5 to-emerald-500/5'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{getTranslation(language, 'piiScrubberActive')}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300">
                        100% Client-Side
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {getTranslation(language, 'piiCleanDesc')}
                    </p>
                  </div>
                </div>

                {piiScrubStats && piiScrubStats.redactedCount > 0 && (
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200">
                      <Lock className="w-3 h-3" />
                      {piiScrubStats.redactedCount} Identifiers Masked
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Main Form Card */}
            <div
              className={`rounded-3xl border shadow-xl p-6 sm:p-8 space-y-6 ${
                isHighContrast
                  ? 'bg-black border-white'
                  : 'bg-white border-slate-200/80 shadow-slate-200/50'
              }`}
            >
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                  {getTranslation(language, 'heroTitle')}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {getTranslation(language, 'heroDesc')}
                </p>
              </div>

              <form onSubmit={handleTranslate} className="space-y-6">
                {/* 1. File Upload Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {getTranslation(language, 'uploadLabel')}
                    </label>
                    <span className="text-xs text-slate-500">
                      {getTranslation(language, 'uploadHint')}
                    </span>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="lab-report-upload"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                    id="lab-report-camera"
                  />

                  {!selectedImage ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-400 rounded-2xl p-6 text-center cursor-pointer transition group bg-slate-50/50 dark:bg-slate-900/40"
                    >
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 group-hover:scale-110 transition transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {getTranslation(language, 'dropText')}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {getTranslation(language, 'dropSubtext')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              fileInputRef.current?.click();
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 shadow-xs"
                          >
                            {getTranslation(language, 'browseFile')}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              cameraInputRef.current?.click();
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white shadow-xs"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>{getTranslation(language, 'takePhoto')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border overflow-hidden flex-shrink-0 flex items-center justify-center">
                          <img
                            src={selectedImage}
                            alt="Lab report preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {imageFileName || 'Selected Lab Report Image'}
                          </p>
                          <p className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold flex items-center gap-1">
                            <FileCheck2 className="w-3 h-3" />
                            Ready for translation
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearImage}
                        aria-label="Remove uploaded lab report image"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Sample Lab Reports Selector */}
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-slate-500 mb-2">
                      {getTranslation(language, 'sampleSelector')}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SAMPLE_LAB_REPORTS.map((sample) => (
                        <button
                          key={sample.id}
                          type="button"
                          onClick={() => handleSelectSample(sample)}
                          className={`text-left p-2.5 rounded-xl border text-xs transition flex items-center justify-between ${
                            selectedSample === sample.id
                              ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                          }`}
                        >
                          <div>
                            <p className="font-bold">{sample.title}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              {sample.subtitle}
                            </p>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            PIN {sample.pincode}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Pincode Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="pincode-input"
                      className="text-sm font-bold text-slate-800 dark:text-slate-200"
                    >
                      {getTranslation(language, 'pincodeLabel')}
                    </label>
                    <span className="text-xs text-slate-500">
                      {getTranslation(language, 'pincodeHint')}
                    </span>
                  </div>

                  <div className="relative">
                    <MapPin className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="pincode-input"
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder={getTranslation(language, 'pincodePlaceholder')}
                      aria-label="6-Digit Indian Postal Pincode"
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-base font-bold focus:ring-2 focus:ring-teal-500 focus:border-teal-500 tracking-wider shadow-xs"
                    />
                  </div>

                  {pincodeInfo && (
                    <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800">
                      <span>
                        {getTranslation(language, 'detectedLocality')}:{' '}
                        <strong className="text-teal-700 dark:text-teal-400">
                          {pincodeInfo.city}, {pincodeInfo.state}
                        </strong>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Geo: {pincodeInfo.lat.toFixed(2)}, {pincodeInfo.lng.toFixed(2)}
                      </span>
                    </div>
                  )}

                  {/* Quick City Jumps */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] text-slate-400">
                      {getTranslation(language, 'quickCities')}
                    </span>
                    {[
                      { city: 'Bengaluru', pin: '560001' },
                      { city: 'Hyderabad', pin: '500001' },
                      { city: 'Chennai', pin: '600001' },
                      { city: 'Delhi', pin: '110001' },
                      { city: 'Mumbai', pin: '400001' },
                    ].map((c) => (
                      <button
                        key={c.pin}
                        type="button"
                        onClick={() => setPincode(c.pin)}
                        className={`text-[11px] px-2 py-0.5 rounded-md border transition ${
                          pincode === c.pin
                            ? 'bg-teal-600 text-white border-teal-600 font-bold'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {c.city}
                      </button>
                    ))}
                  </div>
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="p-3.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading || !selectedImage || pincode.length !== 6}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-lg shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 flex items-center justify-center gap-2 focus:ring-4 focus:ring-teal-500/30"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{getTranslation(language, 'processingButton')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {getTranslation(language, 'translateButton')} (
                        {SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeName})
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Loading Indicator */}
            {loading && (
              <div
                role="status"
                aria-live="polite"
                className="rounded-3xl border border-teal-200 bg-white dark:bg-slate-900 p-8 text-center space-y-4 shadow-xl"
              >
                <div className="relative w-16 h-16 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-teal-200 dark:border-teal-900 animate-ping opacity-30"></div>
                  <div className="relative w-16 h-16 rounded-full border-4 border-teal-600 border-t-transparent animate-spin flex items-center justify-center">
                    <HeartPulse className="w-6 h-6 text-teal-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {loadingStage === 1 && 'Decoding medical report terminology...'}
                    {loadingStage === 2 && 'Scrubbing personal identifiers (Edge PII)...'}
                    {loadingStage === 3 && `Translating into ${language.toUpperCase()}...`}
                    {loadingStage === 4 && 'Syncing epidemiological surveillance signals...'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Applying multimodal intelligence with Gemini 3.8 Flash
                  </p>
                </div>
              </div>
            )}

            {/* Translation Output Results */}
            {explanation && (
              <div
                ref={resultsRef}
                tabIndex={-1}
                aria-label="Medical Lab Report Translation Results"
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden space-y-6 p-6 sm:p-8"
              >
                {/* Header Banner */}
                <div className="flex items-start justify-between flex-wrap gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-md bg-teal-500/10 text-teal-600">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                      <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                        {getTranslation(language, 'educationalDisclaimerTag')}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {explanation.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {getSeverityBadge(explanation.severity)}
                    <button
                      type="button"
                      onClick={handleSpeakSummary}
                      aria-label={
                        isPlayingAudio
                          ? getTranslation(language, 'stopListening')
                          : getTranslation(language, 'listenSummary')
                      }
                      className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                        isPlayingAudio
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {isPlayingAudio ? (
                        <>
                          <VolumeX className="w-4 h-4 animate-pulse" />
                          <span className="hidden sm:inline">
                            {getTranslation(language, 'stopListening')}
                          </span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-4 h-4" />
                          <span className="hidden sm:inline">
                            {getTranslation(language, 'listenSummary')}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Overall Summary Card */}
                <div className="rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 p-4 sm:p-5">
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    {explanation.summary}
                  </p>
                </div>

                {/* Extracted Surveillance Tag Card */}
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 text-teal-400">
                      <HeartPulse className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Extracted Surveillance Signal
                      </p>
                      <p className="text-sm font-black text-slate-900 dark:text-white">
                        {explanation.symptom}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onNavigateToDashboard(pincode)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-teal-400 hover:bg-slate-800 transition shadow-xs"
                  >
                    <span>{getTranslation(language, 'viewOnMap')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Key Findings Table */}
                {explanation.keyFindings && explanation.keyFindings.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      {getTranslation(language, 'keyFindingsLabel')}
                    </h4>
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {explanation.keyFindings.map((finding, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 sm:p-4 bg-white dark:bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                {finding.parameter}
                              </span>
                              {getStatusChip(finding.status)}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {finding.interpretation}
                            </p>
                          </div>
                          <div className="text-left sm:text-right flex-shrink-0">
                            <p className="text-sm font-mono font-black text-slate-900 dark:text-white">
                              {finding.value}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Ref: {finding.referenceRange}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* What it means */}
                {explanation.whatItMeans && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {getTranslation(language, 'whatItMeans')}
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {explanation.whatItMeans}
                    </p>
                  </div>
                )}

                {/* Questions for Doctor */}
                {explanation.questionsForDoctor && explanation.questionsForDoctor.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {getTranslation(language, 'questionsForDoctor')}
                    </h4>
                    <ul className="space-y-1.5 list-disc list-inside text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      {explanation.questionsForDoctor.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Lifestyle Guidance */}
                {explanation.lifestyleGuidance && explanation.lifestyleGuidance.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {getTranslation(language, 'lifestyleGuidance')}
                    </h4>
                    <ul className="space-y-1.5 list-disc list-inside text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                      {explanation.lifestyleGuidance.map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Medical Disclaimer */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
                  {explanation.disclaimer || getTranslation(language, 'medicalDisclaimer')}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Tab 2: Symptom Health Chat */
          <div id="chat-panel" role="tabpanel">
            <SymptomChat
              pincode={pincode}
              targetLanguage={language}
              reportContext={
                explanation
                  ? {
                      title: explanation.title,
                      summary: explanation.summary,
                      symptom: explanation.symptom,
                      keyFindings: explanation.keyFindings,
                    }
                  : null
              }
              onNavigateToDashboard={onNavigateToDashboard}
              onSwitchToScanner={() => setActiveTab('scanner')}
            />
          </div>
        )}
      </div>
    </div>
  );
};

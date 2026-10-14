import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  FileCheck2,
  Sparkles,
  MapPin,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  HeartPulse,
  Volume2,
  VolumeX,
  ArrowRight,
  RefreshCw,
  Eye,
  X,
  Stethoscope,
  ShieldCheck,
  ChevronRight,
  MessageSquare,
  FileText
} from 'lucide-react';
import { getPincodeLocation } from '../lib/pincodeData';
import { SAMPLE_LAB_REPORTS, SampleReportOption } from '../lib/sampleReports';
import { SymptomReportItem, saveSymptomReportToFirestore } from '../lib/firebase';
import { SymptomChat } from './SymptomChat';

interface PatientPortalProps {
  onNavigateToDashboard: (highlightPincode?: string) => void;
  onReportProcessed?: (report: SymptomReportItem) => void;
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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Auto-derived location for the entered pincode
  const pincodeInfo = pincode.length === 6 ? getPincodeLocation(pincode) : null;

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
        setErrorMessage('Please upload an image file (JPG, PNG, WebP).');
        return;
      }
      setErrorMessage(null);
      setImageFileName(file.name);
      setSelectedSample(null);

      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectSample = (sample: SampleReportOption) => {
    setSelectedImage(sample.imageDataUrl);
    setImageFileName(`${sample.title}.svg`);
    setPincode(sample.pincode);
    setSelectedSample(sample.id);
    setErrorMessage(null);
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setImageFileName('');
    setSelectedSample(null);
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
    if (cleanPincode.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit postal code (PIN code).');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setExplanation(null);

    try {
      const response = await fetch('/api/analyze-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage,
          pincode: cleanPincode,
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
        // Handled silently
      }

      if (onReportProcessed) {
        onReportProcessed(surveillanceItem);
      }

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } catch (err: any) {
      console.error('Translation error:', err);
      setErrorMessage(err.message || 'An error occurred while analyzing the report. Please try again.');
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

    const textToRead = `${explanation.title}. Summary: ${explanation.summary}. What it means: ${explanation.whatItMeans}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
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
            Critical Attention Required
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300">
            <span className="h-2 w-2 rounded-full bg-orange-600"></span>
            High Priority Finding
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
            Normal / Optimal Range
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
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Patient Portal Dual Tabs: Lab Report Scanner vs Symptom Chat */}
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300 shadow-sm w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('scanner')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition duration-150 ${
                activeTab === 'scanner'
                  ? 'bg-white text-teal-800 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Lab Report Scanner</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition duration-150 ${
                activeTab === 'chat'
                  ? 'bg-slate-900 text-teal-400 shadow-sm border border-slate-800'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-teal-400" />
              <span>Describe How You Feel</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-teal-400/20 text-teal-600 border border-teal-500/30">
                AI CHAT
              </span>
            </button>
          </div>
        </div>

        {/* Tab 2: Symptom Chat Interface */}
        {activeTab === 'chat' ? (
          <SymptomChat
            pincode={pincode}
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
        ) : (
          /* Tab 1: Lab Report Upload and Translation */
          <>
            {/* Hero Banner Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
              <div className="absolute -right-12 -top-12 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold border border-teal-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Patient-Centric Medical AI • Multimodal Vision</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Translate Your Lab Report Into Plain English
                </h1>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  Upload a photo of your blood test, metabolic panel, or pathology results. Sentinel Health decodes complicated medical terminology, highlights critical values, and anonymously logs clinical findings to our regional public health surveillance network.
                </p>
              </div>
            </div>

            {/* Upload Form Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8">
              <form onSubmit={handleTranslate} className="space-y-6">
                {/* Step 1: Lab Report Capture / Upload */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-800">
                      1. Lab Report Image
                    </label>
                    <span className="text-xs text-slate-500">Supports JPG, PNG, WebP or Camera</span>
                  </div>

                  {/* Upload Dropzone or Preview */}
                  {!selectedImage ? (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 transition-colors rounded-2xl p-6 sm:p-8 text-center bg-slate-50/50">
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

                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shadow-inner">
                            <Upload className="w-7 h-7" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-800">
                              Click to browse or drag & drop your lab sheet
                            </p>
                            <p className="text-xs text-slate-500">
                              Clear photo or scan of your blood test, CBC, lipid or diabetic report
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                            <label
                              htmlFor="lab-report-upload"
                              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 shadow-sm transition"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Browse File
                            </label>
                            <label
                              htmlFor="lab-report-camera"
                              className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 shadow-sm transition"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              Take Photo
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Sample Lab Reports Quick Picker */}
                      <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2.5">
                          Or select a realistic sample lab report to test instantly:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {SAMPLE_LAB_REPORTS.map((sample) => (
                            <button
                              key={sample.id}
                              type="button"
                              onClick={() => handleSelectSample(sample)}
                              className="text-left p-3 rounded-xl border border-slate-200 bg-white hover:border-teal-500 hover:bg-teal-50/40 transition group shadow-sm flex items-start gap-3"
                            >
                              <div className="w-8 h-8 rounded-lg bg-teal-100/80 text-teal-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-teal-600 group-hover:text-white transition">
                                <FileCheck2 className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 group-hover:text-teal-900 truncate">
                                  {sample.title}
                                </p>
                                <p className="text-[11px] text-slate-500 truncate">{sample.subtitle}</p>
                                <span className="inline-block mt-1 text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                                  PIN {sample.pincode}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative border border-slate-200 rounded-2xl p-4 bg-slate-50/80 flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-28 h-36 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center p-1">
                        <img
                          src={selectedImage}
                          alt="Uploaded lab report"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 space-y-1 text-center sm:text-left">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                          <FileCheck2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-sm font-bold text-slate-900 truncate max-w-[220px]">
                            {imageFileName || 'Lab Report Document'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Image attached and ready for clinical translation and optical parameter extraction.
                        </p>
                        {selectedSample && (
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-100 text-teal-800">
                            Realistic Sample Dataset Selected
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                        Change Image
                      </button>
                    </div>
                  )}
                </div>

                {/* Step 2: 6-digit Pincode Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="pincode-input" className="block text-sm font-bold text-slate-800">
                      2. 6-Digit Postal Pincode
                    </label>
                    <span className="text-xs text-slate-500">Required for regional epidemiological mapping</span>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-5 h-5 text-teal-600" />
                    </div>
                    <input
                      id="pincode-input"
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="e.g. 560001"
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-base font-bold text-slate-900 tracking-wider focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
                    />
                  </div>

                  {/* Detected Locality Badge */}
                  {pincodeInfo && (
                    <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-teal-800 bg-teal-50/80 border border-teal-200/80 px-3 py-1.5 rounded-lg">
                      <span className="h-2 w-2 rounded-full bg-teal-600"></span>
                      <span>
                        Detected Locality: {pincodeInfo.city}, {pincodeInfo.state}
                      </span>
                    </div>
                  )}

                  {/* Quick Pincode presets */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <span className="text-[11px] text-slate-500 self-center mr-1">Quick Cities:</span>
                    {[
                      { code: '560001', label: 'Bangalore' },
                      { code: '110001', label: 'Delhi' },
                      { code: '400001', label: 'Mumbai' },
                      { code: '500001', label: 'Hyderabad' },
                      { code: '600001', label: 'Chennai' },
                      { code: '700001', label: 'Kolkata' },
                    ].map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => setPincode(item.code)}
                        className={`text-[11px] px-2 py-0.5 rounded-md font-medium transition ${
                          pincode === item.code
                            ? 'bg-teal-600 text-white font-bold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {item.code} ({item.label})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={loading || !selectedImage || pincode.length !== 6}
                    className="w-full py-4 px-6 rounded-xl font-bold text-white text-base bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 shadow-lg shadow-teal-700/25 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <span>Processing...</span>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Translate Report</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Professional Loading State Spinner */}
              {loading && (
                <div className="mt-8 pt-8 border-t border-slate-200">
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    {/* Radar Medical Scanner Animation */}
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full border-4 border-teal-200 animate-ping opacity-30"></div>
                      <div className="absolute inset-2 rounded-full border-4 border-t-teal-600 border-r-transparent border-b-cyan-500 border-l-transparent animate-spin"></div>
                      <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shadow-inner">
                        <HeartPulse className="w-5 h-5 animate-pulse text-teal-600" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-slate-900">
                        Sentinel Medical AI Translating Report...
                      </h3>
                      <p className="text-xs text-slate-500">
                        Evaluating clinical metrics, translating terminology, and syncing surveillance database.
                      </p>
                    </div>

                    {/* Stepper Progress Bar */}
                    <div className="w-full max-w-md bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-500 rounded-full"
                        style={{ width: `${(loadingStage / 4) * 100}%` }}
                      ></div>
                    </div>

                    {/* Step checklist */}
                    <div className="w-full max-w-sm text-left space-y-2 pt-2">
                      {[
                        { step: 1, text: 'Scanning lab imagery & layout structure...' },
                        { step: 2, text: 'Extracting biomarkers & normal reference ranges...' },
                        { step: 3, text: 'Generating patient-friendly clinical translation...' },
                        { step: 4, text: 'Persisting anonymized symptom & PIN to Firestore...' },
                      ].map((s) => (
                        <div key={s.step} className="flex items-center gap-2 text-xs">
                          {loadingStage > s.step ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : loadingStage === s.step ? (
                            <div className="w-4 h-4 rounded-full border-2 border-teal-600 border-t-transparent animate-spin shrink-0"></div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0"></div>
                          )}
                          <span
                            className={
                              loadingStage === s.step
                                ? 'font-bold text-teal-800'
                                : loadingStage > s.step
                                ? 'text-slate-600'
                                : 'text-slate-400'
                            }
                          >
                            {s.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results Card Area */}
            {explanation && (
              <div ref={resultsRef} className="space-y-6">
                {/* Header & Badges */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                          {explanation.category}
                        </span>
                        {getSeverityBadge(explanation.severity)}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                        {explanation.title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Discuss in Chat Button */}
                      <button
                        type="button"
                        onClick={() => setActiveTab('chat')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition shadow-sm"
                        title="Discuss these results with AI Assistant"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Chat About Results</span>
                      </button>

                      {/* Read Aloud Audio Button */}
                      <button
                        type="button"
                        onClick={handleSpeakSummary}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        title="Listen to report summary audio"
                      >
                        {isPlayingAudio ? (
                          <>
                            <VolumeX className="w-4 h-4 text-rose-600" />
                            <span>Stop</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4 text-teal-600" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Firestore Surveillance Persistence Notice Banner */}
                  <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-teal-900">
                          Logged to Public Health Surveillance (Firestore)
                        </p>
                        <p className="text-xs text-teal-700">
                          Extracted symptom: <span className="font-extrabold">"{explanation.symptom}"</span> under PIN <span className="font-bold">{pincode}</span> ({pincodeInfo?.city}).
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigateToDashboard(pincode)}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-teal-400 hover:bg-slate-800 transition"
                    >
                      <span>View on Admin Map</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Plain English Summary */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-teal-600" />
                      <span>Clinical Summary in Plain Words</span>
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                      {explanation.summary}
                    </p>
                  </div>

                  {/* Biomarkers / Key Findings Table */}
                  {explanation.keyFindings && explanation.keyFindings.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-900">
                        Specific Test Values & Findings
                      </h3>
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">Test Parameter</th>
                              <th className="py-2.5 px-3">Your Result</th>
                              <th className="py-2.5 px-3">Reference Range</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3">What This Means</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {explanation.keyFindings.map((finding, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/70 transition">
                                <td className="py-2.5 px-3 font-semibold text-slate-900">
                                  {finding.parameter}
                                </td>
                                <td className="py-2.5 px-3 font-extrabold text-slate-900">
                                  {finding.value}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500">
                                  {finding.referenceRange}
                                </td>
                                <td className="py-2.5 px-3">
                                  {getStatusChip(finding.status)}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                                  {finding.interpretation}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* What It Means For Your Body */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-slate-900">
                      What This Means For Your Body
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {explanation.whatItMeans}
                    </p>
                  </div>

                  {/* Questions for Doctor */}
                  {explanation.questionsForDoctor && explanation.questionsForDoctor.length > 0 && (
                    <div className="space-y-2.5 bg-blue-50/60 border border-blue-200/80 p-4 rounded-xl">
                      <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                        <span>Questions to ask your doctor at your next visit:</span>
                      </h3>
                      <ul className="space-y-2">
                        {explanation.questionsForDoctor.map((q, idx) => (
                          <li key={idx} className="text-xs text-blue-950 flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-900 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Lifestyle Guidance */}
                  {explanation.lifestyleGuidance && explanation.lifestyleGuidance.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Practical Lifestyle & Follow-up Tips:
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {explanation.lifestyleGuidance.map((tip, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2"
                          >
                            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Medical Disclaimer */}
                  <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1">
                    <p className="font-bold">Medical Disclaimer:</p>
                    <p className="text-[11px] leading-relaxed text-amber-800">
                      {explanation.disclaimer ||
                        'Sentinel Health is an educational lab report translation tool powered by Google Gemini AI. It does not provide medical diagnosis, treatment plans, or prescription recommendations. Always discuss laboratory test results with a qualified healthcare provider.'}
                    </p>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleClearImage();
                          setExplanation(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Translate Another Report
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('chat')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat About Symptoms
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onNavigateToDashboard(pincode)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-teal-400 hover:bg-slate-800 transition shadow-md"
                    >
                      <span>Explore Admin Heatmap Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

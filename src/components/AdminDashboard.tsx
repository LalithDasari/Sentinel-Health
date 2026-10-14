import React, { useEffect, useState, useMemo, Suspense } from 'react';
import {
  Search,
  PlusCircle,
  Download,
  RefreshCw,
  Clock,
  MapPin,
  Check,
  ChevronRight,
  Flame,
  Radio,
  Sliders,
  ShieldAlert,
  Zap
} from 'lucide-react';
import {
  SymptomReportItem,
  subscribeToSurveillanceReports,
  saveSymptomReportToFirestore,
} from '../lib/firebase';
import { getPincodeLocation, SEED_SURVEILLANCE_REPORTS } from '../lib/pincodeData';
import { MapSkeletonLoader } from './MapSkeletonLoader';
import type { PincodeCluster, FocusTarget } from './SurveillanceMap';

// Component Code Splitting: Dynamically import heavy Leaflet Surveillance Map
const SurveillanceMap = React.lazy(() => import('./SurveillanceMap'));

interface AdminDashboardProps {
  initialHighlightPincode?: string | null;
  onClearHighlight?: () => void;
  isHighContrast?: boolean;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialHighlightPincode,
  onClearHighlight,
  isHighContrast = false,
}) => {
  const [reports, setReports] = useState<SymptomReportItem[]>(SEED_SURVEILLANCE_REPORTS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isLiveCached, setIsLiveCached] = useState<boolean>(false);
  const [intensityMultiplier, setIntensityMultiplier] = useState<number>(1.2);
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(() => {
    if (initialHighlightPincode) {
      return { pincode: initialHighlightPincode, timestamp: Date.now(), zoom: 11 };
    }
    return null;
  });

  // 1. Initial fast load from cached /api/signals route for instant rendering
  useEffect(() => {
    let isMounted = true;
    async function loadCachedSignals() {
      try {
        const res = await fetch('/api/signals');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.reports && data.reports.length > 0) {
            setReports(data.reports);
            setIsLiveCached(data.cached === true);
          }
        }
      } catch (err) {
        console.warn('Fast /api/signals fetch error, using local seed:', err);
      }
    }
    loadCachedSignals();

    // 2. Continuous real-time Firestore sync for incoming live reports
    const unsubscribe = subscribeToSurveillanceReports((updatedReports) => {
      if (isMounted && updatedReports && updatedReports.length > 0) {
        setReports(updatedReports);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Update focus target when initialHighlightPincode prop changes
  useEffect(() => {
    if (initialHighlightPincode) {
      setFocusTarget({ pincode: initialHighlightPincode, timestamp: Date.now(), zoom: 11 });
    }
  }, [initialHighlightPincode]);

  // Filtered reports for sidebar live feed
  const filteredReports = useMemo(() => {
    return reports.filter((item) => {
      const matchSearch =
        searchQuery === '' ||
        item.symptom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.pincode.includes(searchQuery) ||
        (item.regionName && item.regionName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory =
        selectedCategory === 'All' || item.category === selectedCategory;

      const matchSeverity =
        selectedSeverity === 'All' || item.severity === selectedSeverity;

      return matchSearch && matchCategory && matchSeverity;
    });
  }, [reports, searchQuery, selectedCategory, selectedSeverity]);

  // Aggregate reports by Pincode for Dynamic Pulsing Heat Markers
  const pincodeClusters = useMemo<PincodeCluster[]>(() => {
    const clusterMap: Record<string, PincodeCluster> = {};

    reports.forEach((item) => {
      const pin = item.pincode;
      if (!clusterMap[pin]) {
        const loc = getPincodeLocation(pin);
        clusterMap[pin] = {
          pincode: pin,
          lat: item.lat || loc.lat,
          lng: item.lng || loc.lng,
          regionName: item.regionName || `${loc.city}, ${loc.state}`,
          reports: [],
          dominantSymptom: item.symptom,
          highestSeverity: item.severity || 'low',
          count: 0,
        };
      }

      clusterMap[pin].reports.push(item);
      clusterMap[pin].count += 1;

      // Calculate highest severity in cluster
      const severityOrder = { low: 1, moderate: 2, high: 3, critical: 4 };
      const currentLevel = severityOrder[clusterMap[pin].highestSeverity] || 1;
      const itemLevel = severityOrder[item.severity || 'low'] || 1;
      if (itemLevel > currentLevel) {
        clusterMap[pin].highestSeverity = item.severity || 'low';
      }
    });

    return Object.values(clusterMap);
  }, [reports]);

  // Overall analytics metrics
  const stats = useMemo(() => {
    const total = reports.length;
    const criticalCount = reports.filter((r) => r.severity === 'critical').length;
    const highCount = reports.filter((r) => r.severity === 'high').length;

    const symptomFreq: Record<string, number> = {};
    reports.forEach((r) => {
      symptomFreq[r.symptom] = (symptomFreq[r.symptom] || 0) + 1;
    });
    let topSymptom = 'N/A';
    let topSymptomCount = 0;
    Object.entries(symptomFreq).forEach(([sym, count]) => {
      if (count > topSymptomCount) {
        topSymptomCount = count;
        topSymptom = sym;
      }
    });

    const activeClusters = pincodeClusters.length;

    return {
      total,
      criticalCount,
      highCount,
      topSymptom,
      activeClusters,
    };
  }, [reports, pincodeClusters]);

  const handleFlyToPincode = (pincode: string, reportId?: string) => {
    setFocusTarget({ pincode, timestamp: Date.now(), zoom: 11 });
    if (reportId) {
      setActiveReportId(reportId);
    }
  };

  const handleSimulateInflux = async () => {
    setIsSimulating(true);
    const cities = [
      { pincode: '560001', city: 'Bengaluru', state: 'Karnataka' },
      { pincode: '500001', city: 'Hyderabad', state: 'Telangana' },
      { pincode: '600001', city: 'Chennai', state: 'Tamil Nadu' },
      { pincode: '110001', city: 'New Delhi', state: 'Delhi' },
      { pincode: '400001', city: 'Mumbai', state: 'Maharashtra' },
    ];
    const picked = cities[Math.floor(Math.random() * cities.length)];
    const loc = getPincodeLocation(picked.pincode);

    const randomSymptoms = [
      { symptom: 'Dengue NS1 Antigen Reactive / Thrombocytopenia', severity: 'critical' as const, category: 'Hematology' },
      { symptom: 'High Transaminases / Acute Viral Hepatitis', severity: 'critical' as const, category: 'Hepatic' },
      { symptom: 'Severe Hyperglycemia & Ketosis', severity: 'high' as const, category: 'Metabolic' },
      { symptom: 'Leukocytosis / Bacterial Pneumonia', severity: 'high' as const, category: 'Hematology' },
    ];
    const randomItem = randomSymptoms[Math.floor(Math.random() * randomSymptoms.length)];

    const newReport: SymptomReportItem = {
      pincode: picked.pincode,
      symptom: randomItem.symptom,
      category: randomItem.category,
      severity: randomItem.severity,
      lat: loc.lat,
      lng: loc.lng,
      regionName: `${picked.city}, ${picked.state}`,
      confidenceScore: 0.96,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveSymptomReportToFirestore(newReport);
      setReports((prev) => [newReport, ...prev]);
      handleFlyToPincode(picked.pincode);
    } catch (err) {
      console.warn('Simulation write fallback:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Pincode', 'Symptom', 'Category', 'Severity', 'Region', 'Latitude', 'Longitude', 'Timestamp'];
    const rows = filteredReports.map((r) => [
      r.pincode,
      `"${r.symptom.replace(/"/g, '""')}"`,
      r.category || 'General',
      r.severity || 'low',
      `"${(r.regionName || '').replace(/"/g, '""')}"`,
      r.lat || 0,
      r.lng || 0,
      r.createdAt || '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sentinel_surveillance_signals_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden ${
        isHighContrast ? 'bg-black text-white' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Left Main Map Stage with explicit min-height for LCP/CLS optimization */}
      <div className="flex-1 flex flex-col relative h-[55vh] lg:h-full border-b lg:border-b-0 lg:border-r border-slate-800 min-h-[420px] w-full">
        {/* Top Surveillance KPI Ribbon */}
        <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="text-xs font-black tracking-wider text-slate-200 uppercase">
                Epidemiological Radar
              </span>
            </div>
            {isLiveCached && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-teal-950 text-teal-400 border border-teal-800 px-2 py-0.5 rounded-full">
                <Zap className="w-3 h-3 text-teal-400" />
                In-Memory Cache (Sub-Millisecond)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="bg-slate-800/80 px-2 py-1 rounded-md text-slate-300">
              Clusters: <strong className="text-white">{stats.activeClusters}</strong>
            </span>
            <span className="bg-rose-950/60 border border-rose-900 text-rose-300 px-2 py-1 rounded-md">
              Critical: <strong className="text-rose-400">{stats.criticalCount}</strong>
            </span>
            <span className="bg-orange-950/60 border border-orange-900 text-orange-300 px-2 py-1 rounded-md hidden md:inline-block">
              High: <strong className="text-orange-400">{stats.highCount}</strong>
            </span>
          </div>
        </div>

        {/* Heatmap Pulsing Intensity & Hotspot Controls Overlay */}
        <div className="absolute top-14 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
          {/* Pulsing Heatmap Intensity Slider */}
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-2xl space-y-1.5 w-48 hidden sm:block">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                Pulse Intensity
              </span>
              <span className="text-teal-400">{intensityMultiplier.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.6}
              max={2.0}
              step={0.1}
              value={intensityMultiplier}
              onChange={(e) => setIntensityMultiplier(parseFloat(e.target.value))}
              aria-label="Adjust surveillance heatmap pulse intensity"
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
          </div>

          {/* Quick Metro Jumps */}
          <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-2 shadow-2xl flex flex-wrap gap-1 max-w-[280px]">
            <span className="text-[10px] font-bold text-slate-400 w-full mb-1">
              Surveillance Hotspots:
            </span>
            {[
              { label: 'BLR', pin: '560001' },
              { label: 'HYD', pin: '500001' },
              { label: 'MAA', pin: '600001' },
              { label: 'DEL', pin: '110001' },
              { label: 'BOM', pin: '400001' },
            ].map((m) => (
              <button
                key={m.pin}
                type="button"
                onClick={() => handleFlyToPincode(m.pin)}
                aria-label={`Jump to ${m.label} hotspot PIN ${m.pin}`}
                className="text-[10px] font-extrabold px-2 py-1 rounded bg-slate-800 hover:bg-teal-600 text-slate-200 hover:text-white transition focus-visible:ring-2 focus-visible:ring-teal-400"
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Leaflet Map Area with Suspense and Zero-CLS Skeleton Loader */}
        <div
          className="w-full h-full relative z-0 min-h-[420px]"
          style={{ minHeight: '420px', width: '100%', height: '100%' }}
        >
          <Suspense fallback={<MapSkeletonLoader isHighContrast={isHighContrast} />}>
            <SurveillanceMap
              clusters={pincodeClusters}
              intensityMultiplier={intensityMultiplier}
              focusTarget={focusTarget}
              onClusterSelect={(pin) => handleFlyToPincode(pin)}
              isHighContrast={isHighContrast}
            />
          </Suspense>
        </div>
      </div>

      {/* Right Sidebar: Real-Time Epidemiological Symptom Feed */}
      <div className="w-full lg:w-96 flex flex-col h-[45vh] lg:h-full bg-slate-900 border-l border-slate-800">
        {/* Sidebar Header & Filters */}
        <div className="p-4 border-b border-slate-800 space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              Live Symptom Stream
            </h3>
            <span className="text-xs font-mono font-bold bg-slate-800 text-teal-400 px-2 py-0.5 rounded-full">
              {filteredReports.length} signals
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search symptoms, pincodes, cities..."
              aria-label="Filter surveillance symptoms"
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Severity & Category Filters */}
          <div className="flex items-center gap-2">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              aria-label="Filter by Severity"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-300 focus:ring-2 focus:ring-teal-500"
            >
              <option value="All">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="moderate">Moderate</option>
              <option value="low">Low</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter by Category"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-slate-300 focus:ring-2 focus:ring-teal-500"
            >
              <option value="All">All Categories</option>
              <option value="Metabolic">Metabolic</option>
              <option value="Hematology">Hematology</option>
              <option value="Hepatic">Hepatic</option>
              <option value="Renal">Renal</option>
              <option value="Cardiology">Cardiology</option>
              <option value="General">General</option>
            </select>
          </div>

          {/* Action Buttons: Simulate Signal & Export CSV */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSimulateInflux}
              disabled={isSimulating}
              className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-extrabold text-xs py-1.5 px-3 rounded-lg shadow-md transition disabled:opacity-50"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {isSimulating ? 'Injecting...' : 'Inject Signal'}
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-700 transition"
              title="Export Surveillance Data to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        </div>

        {/* Scrollable Feed List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2 space-y-2">
          {filteredReports.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No surveillance reports match your filters.
            </div>
          ) : (
            filteredReports.map((report, idx) => {
              const isSelected = activeReportId === report.id;
              let severityBadge = 'bg-teal-950/70 text-teal-400 border-teal-800';
              if (report.severity === 'critical') {
                severityBadge = 'bg-rose-950/80 text-rose-300 border-rose-900';
              } else if (report.severity === 'high') {
                severityBadge = 'bg-orange-950/80 text-orange-300 border-orange-900';
              } else if (report.severity === 'moderate') {
                severityBadge = 'bg-amber-950/80 text-amber-300 border-amber-900';
              }

              return (
                <div
                  key={report.id || `rep-${idx}`}
                  onClick={() => handleFlyToPincode(report.pincode, report.id)}
                  className={`p-3 rounded-xl cursor-pointer transition border ${
                    isSelected
                      ? 'bg-slate-800/90 border-teal-500 shadow-lg'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-[11px] font-mono font-bold text-teal-400">
                      PIN {report.pincode}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${severityBadge}`}
                    >
                      {report.severity || 'low'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white line-clamp-2 mb-1">
                    {report.symptom}
                  </h4>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate max-w-[160px]">{report.regionName}</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-2.5 h-2.5" />
                      {report.createdAt
                        ? new Date(report.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Live'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

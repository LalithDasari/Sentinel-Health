import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatCirclesLayerRef = useRef<L.LayerGroup | null>(null);

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
  const pincodeClusters = useMemo(() => {
    const clusterMap: Record<
      string,
      {
        pincode: string;
        lat: number;
        lng: number;
        regionName: string;
        reports: SymptomReportItem[];
        dominantSymptom: string;
        highestSeverity: 'low' | 'moderate' | 'high' | 'critical';
        count: number;
      }
    > = {};

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

  // Initialize Leaflet Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if ((container as any)._leaflet_id) {
      (container as any)._leaflet_id = null;
    }

    if (!mapInstanceRef.current) {
      try {
        const map = L.map(container, {
          center: [21.5, 78.9629],
          zoom: 5,
          minZoom: 4,
          maxZoom: 18,
          zoomControl: false,
          preferCanvas: true,
        });

        L.control.zoom({ position: 'bottomleft' }).addTo(map);

        // OpenStreetMap Street View as standard default
        const streetTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        const tileLayer = L.tileLayer(streetTileUrl, {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: 'abc',
          maxZoom: 19,
        });

        tileLayer.addTo(map);
        tileLayerRef.current = tileLayer;

        const heatCirclesGroup = L.layerGroup().addTo(map);
        const markersGroup = L.layerGroup().addTo(map);

        markersLayerRef.current = markersGroup;
        heatCirclesLayerRef.current = heatCirclesGroup;
        mapInstanceRef.current = map;

        requestAnimationFrame(() => map.invalidateSize());
        setTimeout(() => map.invalidateSize(), 200);

        const resizeObserver = new ResizeObserver(() => {
          map.invalidateSize();
        });
        resizeObserver.observe(container);

        return () => {
          resizeObserver.disconnect();
          if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
          }
        };
      } catch (err) {
        console.error('Failed to initialize Leaflet map:', err);
      }
    }
  }, []);

  // Update Dynamic Pulsing Heat Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const heatCirclesGroup = heatCirclesLayerRef.current;

    if (!map || !markersGroup || !heatCirclesGroup) return;

    markersGroup.clearLayers();
    heatCirclesGroup.clearLayers();

    pincodeClusters.forEach((cluster) => {
      const { lat, lng, pincode, regionName, count, highestSeverity, reports } = cluster;

      // Severity-scaled color, pulse animation class, and radius
      let markerColor = '#0d9488'; // teal
      let glowColor = 'rgba(13, 148, 136, 0.4)';
      let heatFill = '#0d9488';
      let pulseClass = 'pulse-moderate';
      let ringRadiusMeters = (18000 + count * 3500) * intensityMultiplier;
      let coreRadiusMeters = ringRadiusMeters * 0.35;
      let opacityScale = 0.25;

      if (highestSeverity === 'critical') {
        markerColor = '#e11d48'; // crimson rose
        glowColor = 'rgba(225, 29, 72, 0.6)';
        heatFill = '#e11d48';
        pulseClass = 'pulse-critical';
        ringRadiusMeters = (38000 + count * 6000) * intensityMultiplier;
        coreRadiusMeters = ringRadiusMeters * 0.45;
        opacityScale = 0.45;
      } else if (highestSeverity === 'high') {
        markerColor = '#ea580c'; // fiery orange
        glowColor = 'rgba(234, 88, 12, 0.5)';
        heatFill = '#ea580c';
        pulseClass = 'pulse-high';
        ringRadiusMeters = (28000 + count * 4500) * intensityMultiplier;
        coreRadiusMeters = ringRadiusMeters * 0.4;
        opacityScale = 0.35;
      } else if (highestSeverity === 'moderate') {
        markerColor = '#d97706'; // amber
        glowColor = 'rgba(217, 119, 6, 0.45)';
        heatFill = '#d97706';
        pulseClass = 'pulse-moderate';
        ringRadiusMeters = (22000 + count * 4000) * intensityMultiplier;
        coreRadiusMeters = ringRadiusMeters * 0.35;
        opacityScale = 0.3;
      }

      // 1. Dynamic Outer Radial Radiation Zone
      L.circle([lat, lng], {
        radius: ringRadiusMeters,
        color: heatFill,
        weight: 1.5,
        opacity: opacityScale * 0.7,
        fillColor: heatFill,
        fillOpacity: opacityScale * 0.3,
      }).addTo(heatCirclesGroup);

      // 2. High-Intensity Core Heat Zone
      L.circle([lat, lng], {
        radius: coreRadiusMeters,
        color: heatFill,
        weight: 2,
        opacity: opacityScale,
        fillColor: heatFill,
        fillOpacity: opacityScale * 0.8,
      }).addTo(heatCirclesGroup);

      // 3. Dynamic Pulsing Radar Beacon DivIcon
      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group" style="width: 36px; height: 36px;">
          <div class="absolute inset-0 rounded-full ${pulseClass}" style="background-color: ${glowColor};"></div>
          <div class="relative w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] text-white border-2 border-slate-900 shadow-xl transition transform group-hover:scale-125" style="background-color: ${markerColor};">
            ${count}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'sentinel-heat-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const recentSymptomList = reports
        .slice(0, 3)
        .map(
          (r) =>
            `<li style="margin-bottom: 4px; display: flex; align-items: baseline; justify-content: space-between; font-size: 11px;">
              <span style="font-weight: 600; color: #f8fafc;">${r.symptom}</span>
              <span style="font-size: 9px; color: #94a3b8; margin-left: 6px; padding: 1px 4px; background: rgba(255,255,255,0.06); border-radius: 4px;">${r.category || ''}</span>
            </li>`
        )
        .join('');

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; min-width: 220px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 800; color: ${markerColor}; letter-spacing: 0.5px;">
              PIN ${pincode}
            </span>
            <span style="font-size: 10px; font-weight: 700; color: #e2e8f0; background: rgba(255,255,255,0.1); padding: 1px 6px; border-radius: 999px;">
              ${count} Report${count > 1 ? 's' : ''}
            </span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #ffffff;">
            ${regionName}
          </h4>
          <div style="font-size: 11px; margin-bottom: 8px; color: #cbd5e1; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px;">
            Surveillance Severity: <strong style="color: ${markerColor}; text-transform: capitalize;">${highestSeverity}</strong>
          </div>
          <p style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin: 0 0 4px 0;">
            Extracted Clinical Findings:
          </p>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${recentSymptomList}
          </ul>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customIcon });
      marker.bindPopup(popupHtml, { className: 'sentinel-dark-popup' });
      marker.addTo(markersGroup);
    });
  }, [pincodeClusters, intensityMultiplier]);

  // Handle initial highlight pincode zoom & focus
  useEffect(() => {
    if (!initialHighlightPincode || !mapInstanceRef.current) return;
    const targetCluster = pincodeClusters.find((c) => c.pincode === initialHighlightPincode);
    if (targetCluster) {
      mapInstanceRef.current.flyTo([targetCluster.lat, targetCluster.lng], 11, {
        duration: 1.2,
      });
    }
  }, [initialHighlightPincode, pincodeClusters]);

  const handleFlyToPincode = (pincode: string, reportId?: string) => {
    const target = pincodeClusters.find((c) => c.pincode === pincode);
    if (target && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([target.lat, target.lng], 11, {
        duration: 1.2,
      });
      if (reportId) {
        setActiveReportId(reportId);
      }
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
      {/* Left Main Map Stage */}
      <div className="flex-1 flex flex-col relative h-[55vh] lg:h-full border-b lg:border-b-0 lg:border-r border-slate-800">
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
                className="text-[10px] font-extrabold px-2 py-1 rounded bg-slate-800 hover:bg-teal-600 text-slate-200 hover:text-white transition"
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Leaflet Map DOM Node */}
        <div ref={mapContainerRef} className="w-full h-full relative z-0" />
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
              <option value="Cardiovascular">Cardiovascular</option>
              <option value="Hepatic">Hepatic</option>
            </select>
          </div>

          {/* Actions: Simulate Influx & Export */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleSimulateInflux}
              disabled={isSimulating}
              className="flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white flex items-center justify-center gap-1.5 transition shadow-xs disabled:opacity-50"
            >
              <PlusCircle className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>Simulate Incident</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="py-1.5 px-3 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Live Scrollable Feed */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 p-2 space-y-1">
          {filteredReports.map((report, idx) => {
            const isCritical = report.severity === 'critical';
            const isHigh = report.severity === 'high';
            const isModerate = report.severity === 'moderate';

            return (
              <div
                key={report.id || idx}
                onClick={() => handleFlyToPincode(report.pincode, report.id)}
                className={`p-3 rounded-xl cursor-pointer transition border ${
                  activeReportId === report.id
                    ? 'bg-slate-800 border-teal-500 shadow-md'
                    : 'bg-slate-950/60 border-slate-800/60 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${
                          isCritical
                            ? 'bg-rose-500 animate-ping'
                            : isHigh
                            ? 'bg-orange-500'
                            : isModerate
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <span className="text-[11px] font-bold text-slate-400">
                        PIN {report.pincode} &bull; {report.regionName}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-white leading-snug line-clamp-2">
                      {report.symptom}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                      isCritical
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : isHigh
                        ? 'bg-orange-950 text-orange-300 border border-orange-800'
                        : isModerate
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-teal-950 text-teal-300 border border-teal-800'
                    }`}
                  >
                    {report.severity || 'low'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                  <span>{report.category || 'General'}</span>
                  <span>
                    {report.createdAt
                      ? new Date(report.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Just now'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

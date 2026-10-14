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
  ChevronRight
} from 'lucide-react';
import { SymptomReportItem, subscribeToSurveillanceReports, saveSymptomReportToFirestore } from '../lib/firebase';
import { getPincodeLocation, SEED_SURVEILLANCE_REPORTS } from '../lib/pincodeData';

interface AdminDashboardProps {
  initialHighlightPincode?: string | null;
  onClearHighlight?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialHighlightPincode,
  onClearHighlight
}) => {
  const [reports, setReports] = useState<SymptomReportItem[]>(SEED_SURVEILLANCE_REPORTS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatCirclesLayerRef = useRef<L.LayerGroup | null>(null);

  // Subscribe to real-time Firestore reports
  useEffect(() => {
    const unsubscribe = subscribeToSurveillanceReports((updatedReports) => {
      setReports(updatedReports);
    });

    return () => {
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

  // Aggregate reports by Pincode for Heat Markers
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
          count: 0
        };
      }

      clusterMap[pin].reports.push(item);
      clusterMap[pin].count += 1;

      // Update highest severity
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
      activeClusters
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
          maxZoom: 17,
          zoomControl: false,
          preferCanvas: true
        });

        L.control.zoom({ position: 'bottomleft' }).addTo(map);

        // OpenStreetMap Street View as default
        const streetTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        const tileLayer = L.tileLayer(streetTileUrl, {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: 'abc',
          maxZoom: 19
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

  // Update Heat Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    const heatCirclesGroup = heatCirclesLayerRef.current;

    if (!map || !markersGroup || !heatCirclesGroup) return;

    markersGroup.clearLayers();
    heatCirclesGroup.clearLayers();

    pincodeClusters.forEach((cluster) => {
      const { lat, lng, pincode, regionName, count, highestSeverity, reports } = cluster;

      let markerColor = '#0d9488'; // teal
      let glowColor = 'rgba(13, 148, 136, 0.35)';
      let heatFill = '#0d9488';
      let ringRadiusMeters = 24000 + count * 4000;

      if (highestSeverity === 'critical') {
        markerColor = '#e11d48'; // rose-600
        glowColor = 'rgba(225, 29, 72, 0.45)';
        heatFill = '#e11d48';
        ringRadiusMeters = 36000 + count * 5000;
      } else if (highestSeverity === 'high') {
        markerColor = '#ea580c'; // orange-600
        glowColor = 'rgba(234, 88, 12, 0.4)';
        heatFill = '#ea580c';
        ringRadiusMeters = 30000 + count * 4000;
      } else if (highestSeverity === 'moderate') {
        markerColor = '#ca8a04'; // yellow-600
        glowColor = 'rgba(202, 138, 4, 0.35)';
        heatFill = '#ca8a04';
        ringRadiusMeters = 26000 + count * 3500;
      }

      // Outer heat circle
      L.circle([lat, lng], {
        radius: ringRadiusMeters,
        color: heatFill,
        weight: 1,
        opacity: 0.3,
        fillColor: heatFill,
        fillOpacity: 0.1
      }).addTo(heatCirclesGroup);

      // Core circle
      L.circle([lat, lng], {
        radius: ringRadiusMeters * 0.4,
        color: heatFill,
        weight: 1.5,
        opacity: 0.5,
        fillColor: heatFill,
        fillOpacity: 0.25
      }).addTo(heatCirclesGroup);

      // Pulse DivIcon
      const markerHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group" style="width: 32px; height: 32px;">
          <div class="absolute w-7 h-7 rounded-full animate-ping opacity-40" style="background-color: ${glowColor};"></div>
          <div class="relative w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] text-white border-2 border-slate-900 shadow-md transition transform group-hover:scale-125" style="background-color: ${markerColor};">
            ${count}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'sentinel-heat-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const recentSymptomList = reports
        .slice(0, 3)
        .map(
          (r) =>
            `<li style="margin-bottom: 3px; display: flex; align-items: baseline; justify-content: space-between; font-size: 11px;">
              <span style="font-weight: 500; color: #f8fafc;">${r.symptom}</span>
              <span style="font-size: 9px; color: #94a3b8; margin-left: 6px;">${r.category || ''}</span>
            </li>`
        )
        .join('');

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; min-width: 210px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="font-size: 10px; font-weight: 700; color: ${markerColor};">
              PIN ${pincode}
            </span>
            <span style="font-size: 10px; color: #94a3b8;">
              ${count} Report${count > 1 ? 's' : ''}
            </span>
          </div>
          <h4 style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #ffffff;">
            ${regionName}
          </h4>
          <div style="font-size: 10px; margin-bottom: 6px; color: #94a3b8; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 4px;">
            Severity: <strong style="color: ${markerColor}; text-transform: capitalize;">${highestSeverity}</strong>
          </div>
          <ul style="list-style: none; padding: 0; margin: 0;">
            ${recentSymptomList}
          </ul>
        </div>
      `;

      const marker = L.marker([lat, lng], { icon: customIcon });
      marker.bindPopup(popupHtml, { className: 'sentinel-dark-popup' });
      marker.addTo(markersGroup);
    });
  }, [pincodeClusters]);

  // Handle initial highlight pincode
  useEffect(() => {
    if (initialHighlightPincode && mapInstanceRef.current) {
      const loc = getPincodeLocation(initialHighlightPincode);
      mapInstanceRef.current.flyTo([loc.lat, loc.lng], 11, { duration: 1.2 });
      setSearchQuery(initialHighlightPincode);
    }
  }, [initialHighlightPincode]);

  const handleFlyToCluster = (lat: number, lng: number, reportId?: string) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 11, { duration: 1.2 });
    }
    if (reportId) {
      setActiveReportId(reportId);
    }
  };

  const handleQuickRegionJump = (city: string) => {
    const coords: Record<string, [number, number, number]> = {
      Bangalore: [12.9716, 77.5946, 11],
      Delhi: [28.6139, 77.209, 11],
      Mumbai: [19.076, 72.8777, 11],
      Hyderabad: [17.385, 78.4867, 11],
      Chennai: [13.0827, 80.2707, 11],
      Kolkata: [22.5726, 88.3639, 11],
      Pune: [18.5204, 73.8567, 11],
      All: [21.5, 78.9629, 5]
    };

    const target = coords[city];
    if (target && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([target[0], target[1]], target[2], { duration: 1.2 });
    }
  };

  const handleSimulateNewIncident = async () => {
    setIsSimulating(true);
    try {
      const samplePincodes = ['560001', '110001', '400001', '500081', '600001', '700001', '411001'];
      const targetPin = samplePincodes[Math.floor(Math.random() * samplePincodes.length)];
      const loc = getPincodeLocation(targetPin);

      const symptomOptions = [
        { sym: 'Hyperglycemia / Type-2 Diabetic Spike', cat: 'Metabolic', sev: 'high' as const },
        { sym: 'Leukocytosis / Bacterial Infection Surge', cat: 'Hematology', sev: 'high' as const },
        { sym: 'Elevated ALT / Acute Hepatotoxicity', cat: 'Hepatic', sev: 'critical' as const },
        { sym: 'Atherogenic Dyslipidemia / High LDL', cat: 'Cardiovascular', sev: 'moderate' as const },
        { sym: 'Thrombocytopenia / Platelet Drop', cat: 'Hematology', sev: 'critical' as const },
        { sym: 'Subclinical Hypothyroidism / TSH Spike', cat: 'Endocrine', sev: 'moderate' as const }
      ];

      const chosen = symptomOptions[Math.floor(Math.random() * symptomOptions.length)];

      const newReport: SymptomReportItem = {
        pincode: targetPin,
        symptom: chosen.sym,
        category: chosen.cat,
        severity: chosen.sev,
        lat: loc.lat,
        lng: loc.lng,
        regionName: `${loc.city}, ${loc.state}`,
        confidenceScore: 0.96,
        createdAt: new Date().toISOString()
      };

      await saveSymptomReportToFirestore(newReport);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([loc.lat, loc.lng], 11, { duration: 1.2 });
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Pincode', 'Symptom', 'Category', 'Severity', 'Latitude', 'Longitude', 'Region', 'Timestamp'];
    const rows = reports.map((r) => [
      r.id || 'N/A',
      r.pincode,
      `"${r.symptom.replace(/"/g, '""')}"`,
      r.category || 'General',
      r.severity || 'moderate',
      r.lat ?? '',
      r.lng ?? '',
      `"${(r.regionName || '').replace(/"/g, '""')}"`,
      r.createdAt
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sentinel_surveillance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Just now';
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const getSeverityDot = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />;
      case 'high':
        return <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />;
      case 'moderate':
        return <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />;
      default:
        return <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 font-sans h-[calc(100vh-65px)] min-h-[600px] overflow-hidden">
      {/* Sleek Minimalist Top Navigation & Metric Bar */}
      <div className="bg-slate-900 border-b border-slate-800/80 px-4 sm:px-6 py-2.5 shrink-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Breadcrumb & Title */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Surveillance</span>
            <span className="text-slate-600 text-xs">/</span>
            <h1 className="text-sm font-semibold text-white tracking-tight">
              Regional Health Operations Dashboard
            </h1>
            <span className="w-2 h-2 rounded-full bg-emerald-500 ml-1" title="Real-time surveillance active" />
          </div>

          {/* Quiet Unboxed Stats Strip */}
          <div className="flex items-center gap-4 sm:gap-6 text-xs text-slate-400">
            <div>
              <span className="text-slate-500 mr-1.5">Total:</span>
              <strong className="text-slate-100 font-semibold">{stats.total}</strong>
            </div>
            <span className="text-slate-700 hidden sm:inline">·</span>
            <div>
              <span className="text-slate-500 mr-1.5">Clusters:</span>
              <strong className="text-teal-400 font-semibold">{stats.activeClusters}</strong>
            </div>
            <span className="text-slate-700 hidden sm:inline">·</span>
            <div className="hidden sm:block">
              <span className="text-slate-500 mr-1.5">Dominant:</span>
              <strong className="text-slate-200 font-semibold truncate max-w-[140px] inline-block align-bottom">
                {stats.topSymptom.split('/')[0]}
              </strong>
            </div>
            <span className="text-slate-700 hidden sm:inline">·</span>
            <div>
              <span className="text-slate-500 mr-1.5">Critical:</span>
              <strong className={stats.criticalCount > 0 ? "text-rose-400 font-semibold" : "text-slate-400 font-semibold"}>
                {stats.criticalCount}
              </strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateNewIncident}
              disabled={isSimulating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-600 hover:bg-teal-500 text-white transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'Adding...' : 'Simulate Influx'}</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace: Left Sidebar + Clean Leaflet Map */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Sidebar: Live Extracted Symptoms */}
        <aside className="w-full lg:w-80 xl:w-96 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-10 max-h-[38vh] lg:max-h-full">
          {/* Search & Filter Header */}
          <div className="p-3 border-b border-slate-800/80 space-y-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by symptom, PIN, or city..."
                className="w-full bg-slate-800/90 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quiet Segmented Severity Filter */}
            <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-lg">
              {['All', 'critical', 'high', 'moderate', 'low'].map((sev) => {
                const isActive = selectedSeverity === sev;
                return (
                  <button
                    key={sev}
                    onClick={() => setSelectedSeverity(sev)}
                    className={`flex-1 py-1 text-[10px] font-medium rounded capitalize transition-colors ${
                      isActive
                        ? 'bg-slate-700 text-white shadow-xs font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sev}
                  </button>
                );
              })}
            </div>

            {/* Category Select */}
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-slate-400 font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-800 text-slate-200 text-[11px] rounded px-2 py-1 border border-slate-700 focus:outline-none"
              >
                <option value="All">All Categories</option>
                <option value="Metabolic">Metabolic (Glucose / HbA1c)</option>
                <option value="Hematology">Hematology (CBC / Platelets)</option>
                <option value="Cardiovascular">Cardiovascular (Lipids / LDL)</option>
                <option value="Hepatic">Hepatic (Liver Transaminases)</option>
                <option value="Immunology">Immunology / Inflammatory</option>
                <option value="Endocrine">Endocrine / Thyroid</option>
                <option value="Renal">Renal / Kidney</option>
              </select>
            </div>
          </div>

          {/* Section Subheader */}
          <div className="px-3 py-2 bg-slate-900 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium text-slate-300">Live Extracted Symptoms</span>
            <span className="text-[11px] text-slate-400">{filteredReports.length} records</span>
          </div>

          {/* Feed List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40 p-2 space-y-1">
            {filteredReports.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No reports match your current filter.
              </div>
            ) : (
              filteredReports.map((item) => {
                const isSelected = activeReportId === item.id;
                const loc = getPincodeLocation(item.pincode);

                return (
                  <div
                    key={item.id || `${item.pincode}-${item.createdAt}`}
                    onClick={() => handleFlyToCluster(item.lat || loc.lat, item.lng || loc.lng, item.id)}
                    className={`p-2.5 rounded-lg cursor-pointer transition-colors text-left ${
                      isSelected
                        ? 'bg-slate-800/90 border border-teal-500/40'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {getSeverityDot(item.severity)}
                        <span className="text-xs font-medium text-slate-100 truncate">
                          {item.symptom}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 capitalize shrink-0">
                        {item.severity}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pl-3">
                      <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                        <span className="font-medium text-slate-300">PIN {item.pincode}</span>
                        <span>·</span>
                        <span className="truncate">{item.regionName || loc.city}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Main Map Canvas */}
        <div className="flex-1 relative flex flex-col h-full overflow-hidden bg-slate-950">
          {/* Quiet Top Floating Control Bar */}
          <div className="absolute top-3 left-3 z-[400] flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-800/90 shadow-md">
            <span className="text-[10px] text-slate-400 font-medium px-2 hidden sm:inline">
              Metro Jump:
            </span>
            {['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Kolkata', 'Chennai', 'Pune', 'All'].map((city) => (
              <button
                key={city}
                onClick={() => handleQuickRegionJump(city)}
                className="px-2 py-1 rounded text-[11px] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {city}
              </button>
            ))}
          </div>

          {/* Leaflet Map Target DOM */}
          <div
            ref={mapContainerRef}
            className="w-full h-full flex-1 bg-slate-950 z-0"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Subtle Bottom-Right Legend */}
          <div className="absolute bottom-4 right-4 z-[400] bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800/90 shadow-lg text-[10px] text-slate-300 flex items-center gap-3">
            <span className="text-slate-400 font-medium">Density:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Critical</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span>High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              <span>Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

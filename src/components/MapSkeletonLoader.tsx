import React from 'react';

interface MapSkeletonLoaderProps {
  isHighContrast?: boolean;
}

/**
 * High-Performance Skeleton Loader for Leaflet Surveillance Map
 * Enforces explicit min-height and width to achieve Cumulative Layout Shift (CLS) = 0.
 * Conforms to WCAG 2.1 accessibility standards with ARIA roles and screen-reader announcements.
 */
export const MapSkeletonLoader: React.FC<MapSkeletonLoaderProps> = ({ isHighContrast = false }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Epidemiological Surveillance Radar"
      className={`w-full h-full min-h-[420px] flex flex-col items-center justify-center relative overflow-hidden select-none transition-colors duration-200 ${
        isHighContrast ? 'bg-black text-white' : 'bg-slate-950 text-slate-100'
      }`}
      style={{ minHeight: '420px', width: '100%', height: '100%', minWidth: '100%' }}
    >
      {/* Blueprint Coordinate Grid Overlay (CLS-stable background) */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #38bdf8 1.2px, transparent 1.2px)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden="true"
      />

      {/* Simulated Concentric Radar Rings */}
      <div
        className="absolute w-[460px] h-[460px] rounded-full border border-teal-500/10 pointer-events-none animate-pulse"
        aria-hidden="true"
      />
      <div
        className="absolute w-[300px] h-[300px] rounded-full border border-teal-500/15 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute w-[160px] h-[160px] rounded-full border border-cyan-500/20 pointer-events-none"
        aria-hidden="true"
      />

      {/* Horizontal & Vertical Crosshair Coordinates */}
      <div
        className="absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-teal-500/20 to-transparent pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent pointer-events-none"
        aria-hidden="true"
      />

      {/* Central Tactical Geospatial Loader Card */}
      <div className="relative z-10 flex flex-col items-center text-center p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md max-w-sm mx-4">
        {/* Pulsing Radar Beacon */}
        <div className="relative w-14 h-14 mb-3.5 flex items-center justify-center" aria-hidden="true">
          <div className="absolute inset-0 rounded-full border-2 border-teal-400/40 animate-ping" />
          <div
            className="absolute inset-1 rounded-full border border-dashed border-teal-300 animate-spin"
            style={{ animationDuration: '8s' }}
          />
          <div className="w-7 h-7 rounded-full bg-teal-500/20 border border-teal-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <div className="w-2.5 h-2.5 rounded-full bg-teal-400 shadow-[0_0_8px_#2dd4bf]" />
          </div>
        </div>

        <h3 className="text-sm font-black text-white tracking-wide uppercase mb-1">
          Loading Geospatial Radar
        </h3>
        <p className="text-xs text-slate-400 mb-4 max-w-[260px]">
          Compiling epidemiological clusters, heatmaps, and street telemetry...
        </p>

        {/* Skeleton Shimmer Placeholders */}
        <div className="w-full space-y-2" aria-hidden="true">
          <div className="h-2 w-48 mx-auto bg-slate-800 rounded-full animate-pulse" />
          <div className="h-1.5 w-32 mx-auto bg-slate-800/60 rounded-full animate-pulse" />
        </div>

        {/* Screen Reader Progress Announcement */}
        <span className="sr-only">
          Please wait while the epidemiological surveillance map and dynamic heatmap markers are being rendered.
        </span>
      </div>

      {/* Bottom Telemetry Status Pill */}
      <div
        className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] font-mono text-slate-400"
        aria-hidden="true"
      >
        <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
        <span>Preloading Leaflet Geospatial Chunks...</span>
      </div>
    </div>
  );
};

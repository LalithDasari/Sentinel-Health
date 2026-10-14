/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Navbar } from './components/Navbar';
import { PatientPortal } from './components/PatientPortal';
import { testConnection, subscribeToSurveillanceReports } from './lib/firebase';
import { SEED_SURVEILLANCE_REPORTS } from './lib/pincodeData';
import { SupportedLanguage } from './lib/i18n';
import { getQueuedReports, subscribeToQueueUpdates } from './lib/offlineQueue';
import { MapSkeletonLoader } from './components/MapSkeletonLoader';

// Route-Based Code Splitting: Dynamically import AdminDashboard only when user visits /dashboard
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));

/**
 * High-Performance Skeleton Loader for /dashboard Route
 * Provides immediate visual feedback with explicit dimensions,
 * eliminating Cumulative Layout Shift (CLS = 0) and speeding up First Contentful Paint.
 */
function DashboardRouteSkeleton({ isHighContrast = false }: { isHighContrast?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Epidemiological Surveillance Dashboard"
      className={`flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden ${
        isHighContrast ? 'bg-black text-white' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Map Area Placeholder */}
      <div className="flex-1 flex flex-col relative h-[55vh] lg:h-full border-b lg:border-b-0 lg:border-r border-slate-800 min-h-[420px] w-full">
        {/* Ribbon Placeholder */}
        <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <div className="h-4 w-36 bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-24 bg-slate-800 rounded animate-pulse" />
            <div className="h-5 w-20 bg-slate-800 rounded animate-pulse" />
          </div>
        </div>

        {/* Map Canvas Skeleton */}
        <div className="w-full h-full min-h-[420px] flex-1">
          <MapSkeletonLoader isHighContrast={isHighContrast} />
        </div>
      </div>

      {/* Right Sidebar Skeleton */}
      <div className="w-full lg:w-96 flex flex-col h-[45vh] lg:h-full bg-slate-900 border-l border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 w-32 bg-slate-800 rounded animate-pulse" />
          <div className="h-4 w-16 bg-slate-800 rounded-full animate-pulse" />
        </div>
        <div className="h-8 w-full bg-slate-950 rounded-lg border border-slate-800 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-7 flex-1 bg-slate-950 rounded-lg border border-slate-800 animate-pulse" />
          <div className="h-7 flex-1 bg-slate-950 rounded-lg border border-slate-800 animate-pulse" />
        </div>
        <div className="flex-1 space-y-2 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-slate-800 rounded" />
                <div className="h-3 w-12 bg-slate-800 rounded-full" />
              </div>
              <div className="h-3.5 w-3/4 bg-slate-800 rounded" />
              <div className="h-2.5 w-1/2 bg-slate-800/60 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'patient' | 'dashboard'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard')) {
      return 'dashboard';
    }
    return 'patient';
  });

  const [highlightPincode, setHighlightPincode] = useState<string | null>(null);
  const [reportCount, setReportCount] = useState<number>(SEED_SURVEILLANCE_REPORTS.length);

  // i18n Language State
  const [language, setLanguage] = useState<SupportedLanguage>(() => {
    try {
      const stored = localStorage.getItem('sentinel_language');
      if (stored && ['en', 'te', 'hi', 'ta'].includes(stored)) {
        return stored as SupportedLanguage;
      }
    } catch {
      // fallback
    }
    return 'en';
  });

  // WCAG 2.1 High Contrast State
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sentinel_high_contrast') === 'true';
    } catch {
      return false;
    }
  });

  // Network Online/Offline state & Queued items
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [queuedReportsCount, setQueuedReportsCount] = useState<number>(() => {
    return getQueuedReports().length;
  });

  const handleLanguageChange = (lang: SupportedLanguage) => {
    setLanguage(lang);
    try {
      localStorage.setItem('sentinel_language', lang);
    } catch {
      // ignore
    }
  };

  const handleToggleHighContrast = () => {
    setIsHighContrast((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sentinel_high_contrast', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Sync high contrast class on document body
  useEffect(() => {
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast-mode');
    } else {
      document.documentElement.classList.remove('high-contrast-mode');
    }
  }, [isHighContrast]);

  // Online / Offline & Queue event listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribeQueue = subscribeToQueueUpdates(() => {
      setQueuedReportsCount(getQueuedReports().length);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeQueue();
    };
  }, []);

  // Validate connection to Firestore on initial boot
  useEffect(() => {
    testConnection().then((ok) => {
      if (ok) {
        console.log('Sentinel Health: Connected to Firebase Firestore successfully.');
      }
    });

    const unsubscribe = subscribeToSurveillanceReports((reports) => {
      setReportCount(reports.length);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Listen to browser popstate for back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname.startsWith('/dashboard')) {
        setCurrentRoute('dashboard');
      } else {
        setCurrentRoute('patient');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleRouteChange = (route: 'patient' | 'dashboard') => {
    setCurrentRoute(route);
  };

  const handleNavigateToDashboard = (pincode?: string) => {
    if (pincode) {
      setHighlightPincode(pincode);
    }
    window.history.pushState({}, '', '/dashboard');
    setCurrentRoute('dashboard');
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isHighContrast ? 'bg-black text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      <Navbar
        currentRoute={currentRoute}
        onRouteChange={handleRouteChange}
        reportCount={reportCount}
        language={language}
        onLanguageChange={handleLanguageChange}
        isHighContrast={isHighContrast}
        onToggleHighContrast={handleToggleHighContrast}
        isOnline={isOnline}
        queuedReportsCount={queuedReportsCount}
      />

      <main className="flex-1 flex flex-col" role="main">
        {currentRoute === 'patient' ? (
          <PatientPortal
            onNavigateToDashboard={handleNavigateToDashboard}
            onReportProcessed={(report) => {
              setHighlightPincode(report.pincode);
            }}
            language={language}
            onLanguageChange={handleLanguageChange}
            isHighContrast={isHighContrast}
          />
        ) : (
          <Suspense fallback={<DashboardRouteSkeleton isHighContrast={isHighContrast} />}>
            <AdminDashboard
              initialHighlightPincode={highlightPincode}
              onClearHighlight={() => setHighlightPincode(null)}
              isHighContrast={isHighContrast}
            />
          </Suspense>
        )}
      </main>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PatientPortal } from './components/PatientPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { testConnection, subscribeToSurveillanceReports } from './lib/firebase';
import { SEED_SURVEILLANCE_REPORTS } from './lib/pincodeData';
import { SupportedLanguage } from './lib/i18n';
import { getQueuedReports, subscribeToQueueUpdates } from './lib/offlineQueue';

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
          <AdminDashboard
            initialHighlightPincode={highlightPincode}
            onClearHighlight={() => setHighlightPincode(null)}
            isHighContrast={isHighContrast}
          />
        )}
      </main>
    </div>
  );
}

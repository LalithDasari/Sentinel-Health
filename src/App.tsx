/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PatientPortal } from './components/PatientPortal';
import { AdminDashboard } from './components/AdminDashboard';
import { testConnection, subscribeToSurveillanceReports, SymptomReportItem } from './lib/firebase';
import { SEED_SURVEILLANCE_REPORTS } from './lib/pincodeData';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'patient' | 'dashboard'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard')) {
      return 'dashboard';
    }
    return 'patient';
  });

  const [highlightPincode, setHighlightPincode] = useState<string | null>(null);
  const [reportCount, setReportCount] = useState<number>(SEED_SURVEILLANCE_REPORTS.length);

  // Validate connection to Firestore on initial boot as required by Firebase skill
  useEffect(() => {
    testConnection().then((ok) => {
      if (ok) {
        console.log('Sentinel Health: Connected to Firebase Firestore successfully.');
      }
    });

    // Realtime report count synchronization
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
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900">
      <Navbar
        currentRoute={currentRoute}
        onRouteChange={handleRouteChange}
        reportCount={reportCount}
      />

      <main className="flex-1 flex flex-col">
        {currentRoute === 'patient' ? (
          <PatientPortal
            onNavigateToDashboard={handleNavigateToDashboard}
            onReportProcessed={(report) => {
              setHighlightPincode(report.pincode);
            }}
          />
        ) : (
          <AdminDashboard
            initialHighlightPincode={highlightPincode}
            onClearHighlight={() => setHighlightPincode(null)}
          />
        )}
      </main>
    </div>
  );
}

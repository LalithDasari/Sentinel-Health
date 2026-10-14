import React from 'react';
import { Activity, ShieldAlert, FileText, MapPin, Radio } from 'lucide-react';

interface NavbarProps {
  currentRoute: 'patient' | 'dashboard';
  onRouteChange: (route: 'patient' | 'dashboard') => void;
  reportCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, onRouteChange, reportCount = 0 }) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-200 bg-white/90 border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onRouteChange('patient')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 shadow-md shadow-teal-500/20 text-white">
              <Activity className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 font-sans">
                  Sentinel <span className="text-teal-600">Health</span>
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  Surveillance V2
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">AI Lab Translator & Regional Disease Surveillance</p>
            </div>
          </div>

          {/* Navigation Route Switcher */}
          <div className="flex items-center gap-2 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                onRouteChange('patient');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                currentRoute === 'patient'
                  ? 'bg-white text-teal-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Patient Portal</span>
            </button>

            <button
              onClick={() => {
                window.history.pushState({}, '', '/dashboard');
                onRouteChange('dashboard');
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                currentRoute === 'dashboard'
                  ? 'bg-slate-900 text-teal-400 shadow-sm border border-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <MapPin className="w-4 h-4 text-rose-500" />
              <span>Admin Dashboard</span>
              <span className="relative flex h-2 w-2 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            </button>
          </div>

          {/* Right Live Status Badge */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>Firestore Active</span>
              {reportCount > 0 && (
                <span className="bg-teal-100 text-teal-800 font-bold px-1.5 py-0.2 rounded-full">
                  {reportCount} records
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { Activity, FileText, MapPin, Radio, Eye, Wifi, WifiOff } from 'lucide-react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, getTranslation } from '../lib/i18n';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentRoute: 'patient' | 'dashboard';
  onRouteChange: (route: 'patient' | 'dashboard') => void;
  reportCount?: number;
  language?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
  isHighContrast?: boolean;
  onToggleHighContrast?: () => void;
  isOnline?: boolean;
  queuedReportsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onRouteChange,
  reportCount = 0,
  language = 'en',
  onLanguageChange,
  isHighContrast = false,
  onToggleHighContrast,
  isOnline = true,
  queuedReportsCount = 0,
}) => {
  return (
    <header
      role="banner"
      className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-200 ${
        isHighContrast
          ? 'bg-black text-white border-white'
          : 'bg-white/95 border-slate-200/90 text-slate-900'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div
            className="flex items-center gap-2.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-500 rounded-lg p-1"
            onClick={() => onRouteChange('patient')}
            tabIndex={0}
            role="button"
            aria-label="Sentinel Health Homepage"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onRouteChange('patient');
              }
            }}
          >
            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-cyan-500 shadow-md shadow-teal-500/20 text-white">
              <Activity className="w-5 h-5 animate-pulse" aria-hidden="true" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg sm:text-xl tracking-tight font-sans">
                  Sentinel <span className="text-teal-600 dark:text-teal-400">Health</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                  Surveillance V2
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden lg:block leading-none mt-0.5">
                {getTranslation(language, 'appSubtitle')}
              </p>
            </div>
          </div>

          {/* Navigation Route Switcher */}
          <nav
            role="navigation"
            aria-label="Main Navigation"
            className="flex items-center gap-1 sm:gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700"
          >
            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                onRouteChange('patient');
              }}
              aria-current={currentRoute === 'patient' ? 'page' : undefined}
              aria-label={getTranslation(language, 'patientPortal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-150 ${
                currentRoute === 'patient'
                  ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" aria-hidden="true" />
              <span>{getTranslation(language, 'patientPortal')}</span>
            </button>

            <button
              onClick={() => {
                window.history.pushState({}, '', '/dashboard');
                onRouteChange('dashboard');
              }}
              aria-current={currentRoute === 'dashboard' ? 'page' : undefined}
              aria-label={getTranslation(language, 'adminDashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-150 ${
                currentRoute === 'dashboard'
                  ? 'bg-slate-900 text-teal-400 shadow-sm border border-slate-800'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" aria-hidden="true" />
              <span className="hidden xs:inline">{getTranslation(language, 'adminDashboard')}</span>
              <span className="xs:hidden">Map</span>
              <span className="relative flex h-2 w-2 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            </button>
          </nav>

          {/* Right Controls: i18n Dropdown, Contrast Toggle, Network & PWA */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Selector Dropdown */}
            {onLanguageChange && (
              <div className="relative">
                <label htmlFor="nav-lang-select" className="sr-only">
                  Select Language
                </label>
                <select
                  id="nav-lang-select"
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
                  aria-label="Select translation language (English, Telugu, Hindi, Tamil)"
                  className="text-xs font-bold py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs focus:ring-2 focus:ring-teal-500 cursor-pointer"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.nativeName} ({l.label})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* High-Contrast WCAG 2.1 Mode Toggle */}
            {onToggleHighContrast && (
              <button
                onClick={onToggleHighContrast}
                aria-label={
                  isHighContrast
                    ? getTranslation(language, 'highContrastOff')
                    : getTranslation(language, 'highContrastOn')
                }
                title="Toggle WCAG 2.1 High Contrast Mode"
                className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
                  isHighContrast
                    ? 'bg-yellow-400 text-black border-yellow-300 ring-2 ring-yellow-400'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
              >
                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">
                  {isHighContrast ? 'High Contrast' : 'Contrast'}
                </span>
              </button>
            )}

            {/* Network Offline / Sync Status */}
            <div
              role="status"
              aria-live="polite"
              className={`flex items-center gap-1.5 text-xs font-semibold px-2 sm:px-2.5 py-1.5 rounded-full border ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
              }`}
              title={isOnline ? 'Online: Live Firestore Sync' : 'Offline: Local queue active'}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                  <span className="hidden md:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-700" aria-hidden="true" />
                  <span>
                    Offline {queuedReportsCount > 0 ? `(${queuedReportsCount})` : ''}
                  </span>
                </>
              )}
            </div>

            {/* PWA Install Button */}
            <div className="hidden sm:block">
              <PWAInstallButton />
            </div>

            {/* Live Records Count */}
            <div className="hidden xl:flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
              <Radio className="w-3 h-3 text-emerald-500 animate-pulse" aria-hidden="true" />
              <span>{reportCount}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

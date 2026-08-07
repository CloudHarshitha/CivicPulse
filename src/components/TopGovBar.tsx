'use client';

import React from 'react';
import { Building2 } from 'lucide-react';
import { useAccessibility } from '@/lib/accessibility-context';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '@/lib/i18n';

export function TopGovBar() {
  const { fontScale, decreaseFontSize, resetFontSize, increaseFontSize } = useAccessibility();
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    i18n.changeLanguage(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('civicpulse_language', newLang);
    }
  };

  return (
    <div className="gov-top-bar h-9 px-4 lg:px-8 flex items-center justify-between text-xs border-b border-[var(--primary)] bg-[var(--primary)] text-white">
      {/* Left Title */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 font-semibold text-[var(--secondary)]">
          <Building2 size={13} />
          {t('gov_title')}
        </span>
        <span className="hidden md:inline text-[var(--muted-foreground)]">|</span>
        <span className="hidden md:inline text-[#d9d9d9]">{t('gov_mission')}</span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 md:gap-4 text-[10px] sm:text-[11px] text-[#d9d9d9] shrink-0">
        <a 
          href="#main-content" 
          className="hidden xl:inline hover:underline focus:outline-none focus:ring-1 focus:ring-white px-1 py-0.5 rounded-[2px]"
          aria-label="Skip to main content"
        >
          {t('skip_to_content')}
        </a>

        <span className="hidden xl:inline text-[#5c5c5c]">|</span>

        {/* Font Size Controls A-, A, A+ */}
        <div className="flex items-center gap-1.5" aria-label="Font Size Controls">
          <span className="hidden sm:inline text-[#d9d9d9] mr-0.5">{t('font_size')}</span>
          
          <button
            type="button"
            onClick={decreaseFontSize}
            disabled={fontScale <= 80}
            aria-label="Decrease Font Size (Minimum 80%)"
            title="Decrease Font Size (Min 80%)"
            className={`px-1.5 py-0.5 rounded-[2px] font-bold transition-colors ${
              fontScale < 100 
                ? 'bg-white text-[var(--primary)]' 
                : 'hover:bg-[var(--dark-grey)] text-white disabled:opacity-40'
            }`}
          >
            A-
          </button>

          <button
            type="button"
            onClick={resetFontSize}
            aria-label="Reset Font Size to Standard 100%"
            title="Reset Font Size (100%)"
            className={`px-1.5 py-0.5 rounded-[2px] font-bold transition-colors ${
              fontScale === 100 
                ? 'bg-[var(--secondary)] text-white' 
                : 'hover:bg-[var(--dark-grey)] text-white'
            }`}
          >
            A
          </button>

          <button
            type="button"
            onClick={increaseFontSize}
            disabled={fontScale >= 140}
            aria-label="Increase Font Size (Maximum 140%)"
            title="Increase Font Size (Max 140%)"
            className={`px-1.5 py-0.5 rounded-[2px] font-bold transition-colors ${
              fontScale > 100 
                ? 'bg-white text-[var(--primary)]' 
                : 'hover:bg-[var(--dark-grey)] text-white disabled:opacity-40'
            }`}
          >
            A+
          </button>
        </div>

        <span className="text-[#5c5c5c]">|</span>

        {/* Accessible Language Dropdown */}
        <div className="relative flex items-center">
          <select
            value={i18n.language}
            onChange={handleLanguageChange}
            aria-label="Select Portal Language"
            className="bg-[var(--primary)] text-white font-semibold border border-[var(--border)] rounded-[2px] px-1 md:px-2 py-0.5 text-[10px] md:text-[11px] outline-none focus:ring-1 focus:ring-[var(--secondary)] cursor-pointer hover:border-white transition-colors max-w-[120px] md:max-w-none truncate"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code} className="bg-[var(--primary)] text-white">
                {lang.nativeName} ({lang.label})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

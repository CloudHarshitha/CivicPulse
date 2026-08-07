'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AccessibilityContextType {
  fontScale: number; // 80 to 140
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  increaseFontSize: () => void;
  setFontScale: (scale: number) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const FONT_SCALE_KEY = 'civicpulse_font_scale';
const MIN_SCALE = 80;
const MAX_SCALE = 140;
const STEP_SCALE = 10;

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [fontScale, setFontScaleState] = useState<number>(100);

  useEffect(() => {
    // Load persisted font scale preference
    const savedScale = localStorage.getItem(FONT_SCALE_KEY);
    if (savedScale) {
      const parsed = parseInt(savedScale, 10);
      if (!isNaN(parsed) && parsed >= MIN_SCALE && parsed <= MAX_SCALE) {
        setFontScaleState(parsed);
        applyFontScale(parsed);
      }
    }
  }, []);

  const applyFontScale = (scale: number) => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = `${scale}%`;
    }
  };

  const updateFontScale = (newScale: number) => {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
    setFontScaleState(clamped);
    applyFontScale(clamped);
    localStorage.setItem(FONT_SCALE_KEY, clamped.toString());
  };

  const decreaseFontSize = () => updateFontScale(fontScale - STEP_SCALE);
  const resetFontSize = () => updateFontScale(100);
  const increaseFontSize = () => updateFontScale(fontScale + STEP_SCALE);

  return (
    <AccessibilityContext.Provider
      value={{
        fontScale,
        decreaseFontSize,
        resetFontSize,
        increaseFontSize,
        setFontScale: updateFontScale,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

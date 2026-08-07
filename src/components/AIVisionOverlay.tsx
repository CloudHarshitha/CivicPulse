'use client';

import React, { useState, useEffect } from 'react';
import { AIVisionAnalysisResult } from '@/lib/ai/types';
import { Loader2, AlertCircle, ShieldAlert, Cpu, CheckCircle2 } from 'lucide-react';

interface AIVisionOverlayProps {
  photoUrl: string;
  isAnalyzing: boolean;
  result: AIVisionAnalysisResult | null;
  error: string | null;
  onRetake: () => void;
}

export function AIVisionOverlay({ photoUrl, isAnalyzing, result, error, onRetake }: AIVisionOverlayProps) {
  const [loadingStep, setLoadingStep] = useState<number>(1);

  useEffect(() => {
    if (!isAnalyzing) {
      setLoadingStep(1);
      return;
    }
    const t1 = setTimeout(() => setLoadingStep(2), 250);
    const t2 = setTimeout(() => setLoadingStep(3), 500);
    const t3 = setTimeout(() => setLoadingStep(4), 750);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isAnalyzing]);

  return (
    <div className="space-y-3 font-sans">
      <div className="relative rounded-[2px] overflow-hidden h-60 border border-[var(--border)] bg-black flex items-center justify-center">
        <img src={photoUrl} alt="Captured civic evidence" className="w-full h-full object-cover" />

        {/* Bounding Box Overlays */}
        {!isAnalyzing && result && result.detectedObjects && result.detectedObjects.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {result.detectedObjects.map((obj, idx) => {
              const isRejectedBox = result.policyStatus === 'rejected';
              const borderColor = isRejectedBox ? 'border-[#b91c1c] bg-red-500/20' : 'border-white bg-white/20';
              const badgeBg = isRejectedBox ? 'bg-[var(--destructive)] text-white' : 'bg-[var(--primary)] text-white';

              return (
                <div
                  key={obj.id || idx}
                  className={`absolute border-2 ${borderColor} rounded-[2px] flex flex-col justify-between p-1`}
                  style={{
                    left: `${obj.xMin}%`,
                    top: `${obj.yMin}%`,
                    width: `${obj.xMax - obj.xMin}%`,
                    height: `${obj.yMax - obj.yMin}%`,
                  }}
                >
                  <div className="self-start">
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1 py-0.5 ${badgeBg}`}>
                      {obj.label} ({obj.confidence}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Loading Overlay */}
        {isAnalyzing && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center text-white space-y-2 z-20">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
            <p className="text-xs font-mono font-bold uppercase text-white flex items-center gap-1">
              <Cpu className="w-4 h-4" /> AI Computer Vision Analysis...
            </p>
            <span className="text-[10px] text-[#d9d9d9] font-mono">
              Evaluating photographic evidence against municipal defect patterns...
            </span>
          </div>
        )}
      </div>

      {/* Results Box */}
      {!isAnalyzing && result && (
        <div className="p-3 bg-[var(--card)] border border-[var(--border)] rounded-[2px] space-y-2 text-xs font-sans">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[var(--foreground)] uppercase text-[11px]">Computer Vision Inspection Result</span>
            <span className={`gov-badge ${result.isValidCivicIssue ? 'gov-badge-verified' : 'gov-badge-rejected'}`}>
              {result.policyStatus.toUpperCase()}
            </span>
          </div>

          <p className="text-xs text-[var(--muted-foreground)] font-medium leading-relaxed">
            {result.reason}
          </p>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onRetake}
              className="text-[11px] font-bold text-[var(--foreground)] underline hover:text-[var(--muted-foreground)]"
            >
              Retake / Replace Photo
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#fee2e2] border border-[#b91c1c] text-[#991b1b] text-xs font-bold flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={onRetake} className="underline text-[11px]">Retake Photo</button>
        </div>
      )}
    </div>
  );
}

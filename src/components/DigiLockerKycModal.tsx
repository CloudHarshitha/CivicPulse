'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, CheckCircle2, AlertCircle, Loader2, X, 
  KeyRound, Building2, ArrowRight 
} from 'lucide-react';
import { validateAadhaar, maskAadhaar } from '@/lib/aadhaar-verifier';

interface DigiLockerKycModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialAadhaar?: string;
  onSuccess: (data: {
    masked_aadhaar: string;
    last_four: string;
    verification_ref_id: string;
    digilocker_doc_id: string;
    verified_at: string;
    kyc_provider: string;
  }) => void;
}

export default function DigiLockerKycModal({
  isOpen,
  onClose,
  initialAadhaar = '',
  onSuccess
}: DigiLockerKycModalProps) {
  const [step, setStep] = useState<'consent' | 'otp' | 'verifying' | 'success'>('consent');
  const [aadhaarInput, setAadhaarInput] = useState(initialAadhaar);
  const [consentGiven, setConsentGiven] = useState(true);
  const [otpInput, setOtpInput] = useState('');
  const [txnId, setTxnId] = useState('');
  const [demoOtp, setDemoOtp] = useState('894723');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  if (!isOpen) return null;

  const aadhaarVal = validateAadhaar(aadhaarInput);

  const handleRequestOtp = async () => {
    if (!aadhaarVal.isValid) {
      setErrorMsg(aadhaarVal.error || 'Please enter a valid 12-digit Aadhaar number');
      return;
    }
    if (!consentGiven) {
      setErrorMsg('You must agree to the DigiLocker e-KYC consent terms');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/digilocker-kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_otp',
          aadhaar_number: aadhaarInput
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to send UIDAI OTP');
      }

      setTxnId(data.txn_id);
      if (data.demo_otp) setDemoOtp(data.demo_otp);
      setOtpInput(data.demo_otp || '894723');
      setStep('otp');
    } catch (err: any) {
      setErrorMsg(err.message || 'DigiLocker Gateway request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpInput || otpInput.length !== 6) {
      setErrorMsg('Please enter a 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setStep('verifying');

    try {
      await new Promise(r => setTimeout(r, 600));

      const res = await fetch('/api/digilocker-kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_otp',
          aadhaar_number: aadhaarInput,
          otp: otpInput,
          txn_id: txnId
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'DigiLocker verification failed');
      }

      setSuccessData(data);
      setStep('success');
      onSuccess(data);

    } catch (err: any) {
      setErrorMsg(err.message || 'OTP verification failed');
      setStep('otp');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-lg rounded-[4px] border border-[var(--border)] shadow-md overflow-hidden">
        
        {/* DigiLocker Header */}
        <div className="bg-[var(--primary)] text-white p-4 flex items-center justify-between border-b border-[var(--primary)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white text-[var(--primary)] font-black flex items-center justify-center text-xs">DL</div>
            <div>
              <h3 className="font-bold text-xs tracking-wider uppercase">Government of India &bull; DigiLocker</h3>
              <p className="text-[10px] text-[#d9d9d9] font-mono">Official MeitY &amp; UIDAI e-KYC Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-[#cfcfcf] p-1"
            aria-label="Close Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Security Bar */}
        <div className="bg-[var(--card)] px-4 py-2 border-b border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1 font-bold">
            <Lock size={12} className="text-[var(--success)]" /> 256-Bit SSL Encrypted Session
          </span>
          <span className="font-mono text-[10px]">DPDP Act 2023 Compliant</span>
        </div>

        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-[#fee2e2] border border-[#b91c1c] text-[#991b1b] text-xs font-bold flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'consent' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-[var(--foreground)] text-sm uppercase">Aadhaar e-KYC Verification</h4>
                <p className="text-xs text-[var(--muted-foreground)]">
                  Authenticate your identity directly via MeitY DigiLocker API pipeline.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-[var(--foreground)] uppercase">12-Digit Aadhaar Number</label>
                <div className="relative">
                  <ShieldCheck size={16} className="text-[var(--muted-foreground)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={12}
                    value={aadhaarInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 12) setAadhaarInput(val);
                    }}
                    placeholder="Enter 12-digit Aadhaar Number"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[var(--border)] rounded-[2px] text-xs font-mono font-bold text-[var(--foreground)] outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-[var(--card)] border border-[var(--border)] rounded-[2px] text-[11px] text-[var(--muted-foreground)]">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    I consent to CivicPulse fetching my verified e-KYC token from DigiLocker. Raw Aadhaar is never stored.
                  </span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleRequestOtp}
                disabled={isLoading || !aadhaarVal.isValid || !consentGiven}
                className="gov-btn-primary w-full text-xs font-bold uppercase py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Request UIDAI OTP'}
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-[var(--foreground)] text-sm uppercase">Enter UIDAI Verification OTP</h4>
                <p className="text-xs text-[var(--muted-foreground)]">
                  OTP sent to mobile linked with Aadhaar <strong className="font-mono text-[var(--foreground)]">{maskAadhaar(aadhaarInput)}</strong>.
                </p>
              </div>

              <div className="p-2.5 bg-[var(--card)] border border-[var(--border)] text-xs text-[var(--foreground)] flex items-center justify-between font-mono">
                <span>Demo OTP: <strong>{demoOtp}</strong></span>
                <button type="button" className="underline font-bold text-[11px]" onClick={() => setOtpInput(demoOtp)}>Auto-Fill</button>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[var(--foreground)] uppercase">6-Digit OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-2 bg-white border border-[var(--border)] rounded-[2px] text-xs font-mono font-bold text-center tracking-widest outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('consent')}
                  className="gov-btn-secondary flex-1 text-xs font-bold uppercase py-2"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otpInput.length !== 6}
                  className="gov-btn-primary flex-[2] text-xs font-bold uppercase py-2 disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={14} className="animate-spin" /> : 'Verify OTP & Exchange Token'}
                </button>
              </div>
            </div>
          )}

          {step === 'verifying' && (
            <div className="py-6 flex flex-col items-center justify-center space-y-3 font-mono text-xs font-bold text-[var(--foreground)]">
              <Loader2 size={24} className="animate-spin" />
              <span>Verifying DigiLocker Digital Signature...</span>
            </div>
          )}

          {step === 'success' && successData && (
            <div className="space-y-4 text-center">
              <div className="w-10 h-10 bg-[var(--success)] text-white flex items-center justify-center rounded-[2px] mx-auto">
                <CheckCircle2 size={24} />
              </div>

              <h4 className="font-extrabold text-[var(--foreground)] text-sm uppercase">DigiLocker Verification Complete</h4>

              <div className="p-3 bg-[var(--card)] border border-[var(--border)] rounded-[2px] text-left text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Provider:</span>
                  <span className="font-bold text-[var(--foreground)]">{successData.kyc_provider}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Masked Aadhaar:</span>
                  <span className="font-bold text-[var(--foreground)]">{successData.masked_aadhaar}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted-foreground)]">Verification Ref:</span>
                  <span className="font-bold text-[var(--foreground)]">{successData.verification_ref_id}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="gov-btn-primary w-full text-xs font-bold uppercase py-2.5"
              >
                Return to Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

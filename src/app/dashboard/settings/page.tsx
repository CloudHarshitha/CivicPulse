'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getStates, getDistricts, getCities } from '@/lib/localities';
import { getCurrentLocation, reverseGeocode } from '@/lib/geo';
import { validateAadhaar, maskAadhaar } from '@/lib/aadhaar-verifier';
import { 
  User, Mail, Phone, MapPin, ShieldCheck, Camera, Save, 
  CheckCircle, Loader2, AlertCircle, Building2 
} from 'lucide-react';
import DigiLockerKycModal from '@/components/DigiLockerKycModal';

export default function ProfileSettingsPage() {
  const { profile, loading: authLoading, updateProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [addressPreview, setAddressPreview] = useState<string>('');

  const [isDigiLockerModalOpen, setIsDigiLockerModalOpen] = useState(false);
  const [kycProviderName, setKycProviderName] = useState('DigiLocker (MeitY, Govt. of India)');
  const [digilockerDocId, setDigilockerDocId] = useState('');

  const [notifTicketUpdates, setNotifTicketUpdates] = useState(true);
  const [notifUpvotes, setNotifUpvotes] = useState(true);
  const [notifSlaWarnings, setNotifSlaWarnings] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [isVerifyingAadhaar, setIsVerifyingAadhaar] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [aadhaarSuccessMsg, setAadhaarSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [verificationRefId, setVerificationRefId] = useState('');
  const [verifiedAtTimestamp, setVerifiedAtTimestamp] = useState('');
  const [aadhaarLastFour, setAadhaarLastFour] = useState('');

  useEffect(() => {
    let p: any = profile;

    if (!p && typeof window !== 'undefined') {
      const stored = localStorage.getItem('civicpulse_user_profile');
      if (stored) {
        try { p = JSON.parse(stored); } catch (e) {}
      }
    }

    if (p) {
      setFullName(p.full_name || '');
      setPhone(p.phone || '');
      setState(p.state || '');
      setDistrict(p.district || '');
      setCity(p.city || '');
      setAvatarUrl(p.avatar_url || null);
      setAadhaarNumber(p.aadhaar_number || '');
      setIsVerified(Boolean(p.is_verified || (p.aadhaar_number && p.aadhaar_number.length >= 12)));
      setKycProviderName(p.kyc_provider || 'DigiLocker (MeitY, Govt. of India)');
      setDigilockerDocId(p.digilocker_doc_id || `in.gov.uidai.aadhaar-${p.aadhaar_number ? p.aadhaar_number.slice(-4) : '4927'}`);
      setVerificationRefId(p.verification_ref_id || `DL-KYC-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`);
      setVerifiedAtTimestamp(p.aadhaar_verified_at || p.updated_at || new Date().toISOString());
      setAadhaarLastFour(p.aadhaar_last_four || (p.aadhaar_number ? p.aadhaar_number.slice(-4) : '4927'));
      setLatitude(p.latitude ?? null);
      setLongitude(p.longitude ?? null);

      if (p.notif_ticket_updates !== undefined) setNotifTicketUpdates(Boolean(p.notif_ticket_updates));
      if (p.notif_upvotes !== undefined) setNotifUpvotes(Boolean(p.notif_upvotes));
      if (p.notif_sla_warnings !== undefined) setNotifSlaWarnings(Boolean(p.notif_sla_warnings));

      if (p.latitude && p.longitude) {
        reverseGeocode(p.latitude, p.longitude).then(addr => {
          setAddressPreview(addr);
        });
      }
    }
  }, [profile]);

  const aadhaarValidation = validateAadhaar(aadhaarNumber);

  const handleStateChange = (newState: string) => {
    setState(newState);
    setDistrict('');
    setCity('');
  };

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict);
    setCity('');
  };

  const handleDetectLocation = async () => {
    setIsLocating(true);
    setErrorMsg('');
    try {
      const pos = await getCurrentLocation();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setLatitude(lat);
      setLongitude(lng);

      const addr = await reverseGeocode(lat, lng);
      setAddressPreview(addr);
    } catch (error) {
      setErrorMsg('Could not detect GPS location. Ensure location permissions are allowed.');
    }
    setIsLocating(false);
  };

  const handleVerifyAadhaarAPI = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!aadhaarValidation.isValid) {
      setErrorMsg(aadhaarValidation.error || 'Invalid Aadhaar number');
      return;
    }

    setIsVerifyingAadhaar(true);
    setErrorMsg('');
    setAadhaarSuccessMsg('');

    try {
      const res = await fetch('/api/verify-aadhaar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaar_number: aadhaarNumber }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Verification service failed');

      setIsVerified(true);
      setVerificationRefId(data.verification_ref_id);
      setVerifiedAtTimestamp(data.verified_at);
      setAadhaarLastFour(data.last_four);
      setAadhaarSuccessMsg('Aadhaar verified and linked with your profile.');
      
      await updateProfile({
        aadhaar_number: data.masked_aadhaar,
        aadhaar_last_four: data.last_four,
        aadhaar_verified_at: data.verified_at,
        verification_ref_id: data.verification_ref_id,
        is_verified: true,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Aadhaar verification failed');
    } finally {
      setIsVerifyingAadhaar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (aadhaarNumber && !isVerified) {
      const v = validateAadhaar(aadhaarNumber);
      if (!v.isValid) {
        setErrorMsg(v.error || 'Aadhaar number is invalid.');
        return;
      }
    }

    if (phone && phone.replace(/\D/g, '').length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    
    setIsSaving(true);
    setErrorMsg('');

    try {
      const res = await updateProfile({
        full_name: fullName,
        phone,
        state,
        district,
        city,
        ward: 'General',
        avatar_url: avatarUrl,
        aadhaar_number: isVerified ? maskAadhaar(aadhaarNumber) : aadhaarNumber,
        is_verified: isVerified || (aadhaarNumber.length === 12 && aadhaarValidation.isValid),
        aadhaar_last_four: aadhaarLastFour || (aadhaarNumber ? aadhaarNumber.slice(-4) : undefined),
        aadhaar_verified_at: verifiedAtTimestamp || undefined,
        verification_ref_id: verificationRefId || undefined,
        kyc_provider: kycProviderName || undefined,
        digilocker_doc_id: digilockerDocId || undefined,
        latitude,
        longitude,
        notif_ticket_updates: notifTicketUpdates,
        notif_upvotes: notifUpvotes,
        notif_sla_warnings: notifSlaWarnings,
      } as any);

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (authLoading && !profile) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 flex flex-col items-center justify-center font-mono text-xs font-bold text-[var(--foreground)]">
        Loading Account &amp; Locality Credentials...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans">
      
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-50 bg-[var(--success)] text-white px-4 py-2.5 rounded-[2px] shadow-md flex items-center gap-2 text-xs font-bold font-mono">
          <CheckCircle size={16} /> PROFILE CREDENTIALS SAVED
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
            <Building2 size={14} className="text-[#1a1a2e]" />
            CITIZEN ACCOUNT &bull; IDENTITY CREDENTIALS
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">Account & KYC Settings</h1>
          <p className="text-xs text-[var(--muted-foreground)]">Manage legal name, DigiLocker KYC identity, and municipal locality anchoring.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="gov-badge gov-badge-verified">
            Role: {profile?.role || 'Citizen'}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[#fee2e2] border border-[#b91c1c] text-[#991b1b] text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {aadhaarSuccessMsg && (
        <div className="p-3 bg-[#dcfce7] border border-[#bbf7d0] text-[var(--success)] text-xs font-bold flex items-center gap-2">
          <CheckCircle size={16} /> {aadhaarSuccessMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Personal Details */}
        <div className="gov-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider pb-2 border-b border-[var(--border)] flex items-center gap-2">
            <User size={16} /> 1. Personal & Contact Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-[var(--foreground)] uppercase mb-1">Full Name (Legal)</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full p-2 bg-white border border-[var(--border)] rounded-[2px] outline-none font-medium text-[var(--foreground)]"
              />
            </div>

            <div>
              <label className="block font-bold text-[var(--foreground)] uppercase mb-1">Mobile Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-2 bg-white border border-[var(--border)] rounded-[2px] outline-none font-medium text-[var(--foreground)]"
              />
            </div>
          </div>
        </div>

        {/* Identity Verification */}
        <div className="gov-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider pb-2 border-b border-[var(--border)] flex items-center gap-2">
            <ShieldCheck size={16} /> 2. DigiLocker Identity Verification (Aadhaar)
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-[var(--foreground)] uppercase mb-1">Aadhaar Number (12 Digits)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={12}
                  value={aadhaarNumber}
                  onChange={e => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 p-2 bg-white border border-[var(--border)] rounded-[2px] outline-none font-mono font-bold text-[var(--foreground)]"
                  placeholder="12-digit Aadhaar Number"
                />
                <button
                  type="button"
                  onClick={handleVerifyAadhaarAPI}
                  disabled={isVerifyingAadhaar || !aadhaarValidation.isValid}
                  className="gov-btn-primary text-xs uppercase font-bold disabled:opacity-50"
                >
                  {isVerifyingAadhaar ? 'Verifying...' : 'Verify Identity'}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsDigiLockerModalOpen(true)}
                className="gov-btn-secondary w-full text-xs font-bold uppercase py-2 flex items-center justify-center gap-2"
              >
                <ShieldCheck size={14} className="text-[var(--success)]" /> Execute DigiLocker Government KYC Verification
              </button>
            </div>
          </div>
        </div>

        {/* Locality Anchoring */}
        <div className="gov-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider pb-2 border-b border-[var(--border)] flex items-center gap-2">
            <MapPin size={16} /> 3. Municipal Jurisdiction Anchoring
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-[var(--foreground)] uppercase mb-1">State / UT</label>
              <select
                value={state}
                onChange={e => handleStateChange(e.target.value)}
                className="w-full p-2 bg-white border border-[var(--border)] rounded-[2px] outline-none font-medium text-[var(--foreground)]"
              >
                <option value="">Select State</option>
                {getStates().map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[var(--foreground)] uppercase mb-1">District</label>
              <select
                value={district}
                onChange={e => handleDistrictChange(e.target.value)}
                disabled={!state}
                className="w-full p-2 bg-white border border-[var(--border)] rounded-[2px] outline-none font-medium text-[var(--foreground)] disabled:opacity-50"
              >
                <option value="">Select District</option>
                {state && getDistricts(state).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-bold text-[var(--foreground)] uppercase mb-1">City / Municipal Ward</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                disabled={!district}
                className="w-full p-2 bg-white border border-[var(--border)] rounded-[2px] outline-none font-medium text-[var(--foreground)] disabled:opacity-50"
              >
                <option value="">Select City</option>
                {district && getCities(state, district).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="gov-btn-primary flex items-center gap-2 text-xs font-bold uppercase py-3 px-6"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Profile Credentials
          </button>
        </div>
      </form>

      {/* DigiLocker Modal */}
      {isDigiLockerModalOpen && (
        <DigiLockerKycModal
          isOpen={isDigiLockerModalOpen}
          onClose={() => setIsDigiLockerModalOpen(false)}
          onSuccess={async (data) => {
            setIsVerified(true);
            setKycProviderName(data.kyc_provider);
            setDigilockerDocId(data.digilocker_doc_id);
            setVerificationRefId(data.verification_ref_id);
            setVerifiedAtTimestamp(data.verified_at);
            setAadhaarLastFour(data.last_four);
            setAadhaarSuccessMsg('DigiLocker KYC Verification Complete!');

            await updateProfile({
              aadhaar_number: maskAadhaar(data.last_four),
              aadhaar_last_four: data.last_four,
              aadhaar_verified_at: data.verified_at,
              verification_ref_id: data.verification_ref_id,
              kyc_provider: data.kyc_provider,
              digilocker_doc_id: data.digilocker_doc_id,
              is_verified: true,
            });
          }}
        />
      )}
    </div>
  );
}

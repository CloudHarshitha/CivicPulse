'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useSupabaseData } from '@/lib/supabase-data';
import { reverseGeocode, validateGeofence } from '@/lib/geo';
import { getSLAConfig, getDepartmentForCategory } from '@/lib/sla';
import { IssueCategory, IssuePriority } from '@/types';
import { 
  Camera, MapPin, CheckCircle, AlertTriangle, ArrowRight, ArrowLeft, 
  Navigation, Loader2, Building2, ShieldCheck, FileCheck, AlertCircle 
} from 'lucide-react';
import { getCategoryInfo } from '@/lib/scoring';
import { useGeolocation } from '@/hooks/useGeolocation';
import { AIVisionOverlay } from '@/components/AIVisionOverlay';
import { AIVisionAnalysisResult } from '@/lib/ai/types';

const categories: IssueCategory[] = ['roads', 'sanitation', 'electricity', 'water_sewage', 'other'];
const priorities: IssuePriority[] = ['low', 'medium', 'critical'];

export default function ReportIssuePage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { addIssue } = useSupabaseData();
  const { coordinates, isLoading: isLocating, error: locError, getLocation } = useGeolocation();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Form State
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string>('');
  const [geofenceValid, setGeofenceValid] = useState<boolean | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('roads');
  const [priority, setPriority] = useState<IssuePriority>('medium');
  
  // AI Vision Detection State
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [aiResult, setAiResult] = useState<AIVisionAnalysisResult | null>(null);
  const [aiError, setAiError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/bmp'];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.match(/\.(jpg|jpeg|png|webp|heic)$/i)) {
      setAiError('Unsupported file format. Upload JPG, PNG, or WEBP photo.');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPhotoUrl(localUrl);
    setIsAnalyzingImage(true);
    setAiError('');
    setAiResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      try {
        const res = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            fileName: file.name,
            fileType: file.type
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'AI analysis service error');

        setAiResult(data);
        if (data.isValidCivicIssue && data.category && categories.includes(data.category as IssueCategory)) {
          setCategory(data.category as IssueCategory);
        }
      } catch (err: any) {
        setAiError(err.message || 'Image validation failed');
      } finally {
        setIsAnalyzingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const captureLiveLocation = async () => {
    getLocation();
  };

  React.useEffect(() => {
    if (coordinates) {
      setLocation(coordinates);
      reverseGeocode(coordinates.lat, coordinates.lng).then(addr => {
        setAddress(addr);
      });
      if (profile?.latitude != null && profile?.longitude != null) {
        const validRes = validateGeofence(coordinates.lat, coordinates.lng, profile.latitude, profile.longitude, 50);
        setGeofenceValid(validRes.valid);
      } else {
        setGeofenceValid(true);
      }
    }
  }, [coordinates, profile]);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSubmitError('');

    if (!location) {
      setSubmitError('Location coordinates are required in Step 1.');
      return;
    }

    if (!title || !title.trim()) {
      setSubmitError('Grievance title is required in Step 2.');
      return;
    }

    setIsSubmitting(true);
    const reporterId = user?.id || profile?.id || 'demo-user';

    try {
      const newIssueData = {
        reporter_id: reporterId,
        title: title.trim(),
        description,
        category,
        priority,
        status: 'open' as const,
        latitude: location.lat,
        longitude: location.lng,
        address: address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
        photo_url: photoUrl || '/demo/pothole1.jpg',
        photo_timestamp: new Date().toISOString(),
        city: profile?.city || '',
        district: profile?.district || '',
        state: profile?.state || '',
        ward: 'General',
        sla_deadline: null,
        assigned_department: getDepartmentForCategory(category),
        assigned_to: null,
        resolved_at: null,
        verified_at: null,
      };

      const result = await addIssue(newIssueData);
      if (!result) {
        setSubmitError('Failed to log grievance. Please check connection.');
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/feed');
      }, 1500);
      
    } catch (error: any) {
      setSubmitError(error?.message || 'Submission error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center font-sans">
        <div className="gov-card p-8 flex flex-col items-center">
          <div className="w-12 h-12 bg-[var(--success)] text-white flex items-center justify-center rounded-[2px] mb-4">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-[var(--foreground)] mb-2">Grievance Docket Successfully Registered!</h2>
          <p className="text-xs text-[var(--muted-foreground)] mb-6">
            Your complaint has been assigned an official GTN tracking number and dispatched to the concerned municipal department.
          </p>
          <div className="text-xs font-mono font-bold text-[var(--foreground)] bg-[var(--background)] px-4 py-2 border border-[var(--border)]">
            Redirecting to Public Registry Feed...
          </div>
        </div>
      </div>
    );
  }

  const slaConfig = getSLAConfig(priority, category);

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 pb-24 lg:pb-6 font-sans">
      
      {/* Official Form Header */}
      <div className="mb-6 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider mb-1">
          <Building2 size={14} className="text-[#1a1a2e]" />
          FORM-A &bull; PUBLIC GRIEVANCE REGISTRATION
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--foreground)]">Lodge Official Civic Grievance</h1>
        <p className="text-xs text-[var(--muted-foreground)] font-medium mt-1">
          Mandatory filing system for infrastructure defects, sanitation hazards, and public safety issues.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#cfcfcf] -z-10 -translate-y-1/2" />
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-8 h-8 rounded-[2px] flex items-center justify-center text-xs font-bold font-mono ${
              step >= i
                ? 'bg-[var(--primary)] text-white'
                : 'bg-white text-[var(--muted-foreground)] border border-[var(--border)]'
            }`}
          >
            {i}
          </div>
        ))}
      </div>

      <div className="gov-card p-6">
        {/* Step 1: Photo & GPS */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-extrabold text-[var(--foreground)] uppercase tracking-wider mb-1">
                Step 1: Photographic Evidence & Geotagging
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">Upload evidence photo and lock in verified GPS coordinates.</p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wide block mb-1">
                  Photo Evidence <span className="text-[var(--destructive)]">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handlePhotoCapture}
                  className="hidden"
                />

                {!photoUrl ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-[var(--border)] hover:border-[var(--primary)] rounded-[4px] flex flex-col items-center justify-center gap-2 bg-[var(--card)] transition-colors"
                  >
                    <div className="w-10 h-10 bg-[var(--primary)] text-white flex items-center justify-center rounded-[2px]">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <span className="text-xs font-bold text-[var(--foreground)] block">Click to Upload / Capture Photo</span>
                      <span className="text-[10px] text-[var(--muted-foreground)]">AI Vision Engine will inspect image for civic defects</span>
                    </div>
                  </button>
                ) : (
                  <AIVisionOverlay
                    photoUrl={photoUrl}
                    isAnalyzing={isAnalyzingImage}
                    result={aiResult}
                    error={aiError}
                    onRetake={() => {
                      setPhotoUrl(null);
                      setAiResult(null);
                      setAiError('');
                    }}
                  />
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wide block mb-1">
                  GPS Coordinates <span className="text-[var(--destructive)]">*</span>
                </label>
                {!location ? (
                  <button
                    type="button"
                    onClick={captureLiveLocation}
                    disabled={isLocating}
                    className="gov-btn-primary w-full flex items-center justify-center gap-2 text-xs uppercase font-bold py-2.5 disabled:opacity-50"
                  >
                    {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    {isLocating ? 'Locking Satellite Position...' : 'Detect GPS Position'}
                  </button>
                ) : (
                  <div className="p-3 bg-[var(--card)] border border-[var(--border)] rounded-[2px] space-y-1 text-xs">
                    <div className="flex items-center justify-between font-mono font-bold text-[var(--foreground)]">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>Lat/Lng: {location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
                      </div>
                      <button onClick={captureLiveLocation} className="underline text-[var(--foreground)]">Refresh</button>
                    </div>
                    {address && <p className="text-[var(--muted-foreground)] font-medium text-[11px]">{address}</p>}
                  </div>
                )}
                {locError && <p className="text-[var(--destructive)] text-xs font-bold mt-1">{locError}</p>}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={handleNext}
                disabled={!photoUrl || !location || isAnalyzingImage || Boolean(aiResult && !aiResult.isValidCivicIssue)}
                className="gov-btn-primary flex items-center gap-2 text-xs uppercase font-bold disabled:opacity-50"
              >
                Proceed to Step 2 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Category & Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-extrabold text-[var(--foreground)] uppercase tracking-wider mb-1">
                Step 2: Department Classification & Statement
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">Classify category, urgency index, and describe defect.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wide block mb-2">Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categories.map(cat => {
                    const info = getCategoryInfo(cat);
                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`p-3 rounded-[2px] border text-left flex flex-col gap-1 transition-colors ${
                          isSelected
                            ? 'bg-[var(--primary)] text-white border-[var(--primary)] font-bold'
                            : 'bg-white border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--background)]'
                        }`}
                      >
                        <span className="text-xs">{info.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wide block mb-2">Urgency Priority</label>
                <div className="flex gap-2">
                  {priorities.map(p => {
                    const isSelected = priority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-2 rounded-[2px] border text-xs font-bold uppercase transition-colors ${
                          isSelected
                            ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                            : 'bg-white border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--background)]'
                        }`}
                      >
                        {p} Urgency
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wide block mb-1">Grievance Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Major pothole causing traffic obstruction"
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-[2px] text-xs text-[var(--foreground)] placeholder-[#777777] focus:ring-1 focus:ring-[var(--primary)] outline-none font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-wide block mb-1">Detailed Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe landmarks, hazards, and duration of defect..."
                  className="w-full px-3 py-2 bg-white border border-[var(--border)] rounded-[2px] text-xs text-[var(--foreground)] placeholder-[#777777] focus:ring-1 focus:ring-[var(--primary)] outline-none font-medium resize-none"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={handleBack}
                className="gov-btn-secondary flex items-center gap-1.5 text-xs font-bold uppercase"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!title.trim()}
                className="gov-btn-primary flex items-center gap-2 text-xs uppercase font-bold disabled:opacity-50"
              >
                Review Filing <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-extrabold text-[var(--foreground)] uppercase tracking-wider mb-1">
                Step 3: Final Verification & Docket Authorization
              </h2>
              <p className="text-xs text-[var(--muted-foreground)]">Review all details before committing to official municipal queue.</p>
            </div>

            <div className="bg-[var(--card)] border border-[var(--border)] p-4 rounded-[2px] space-y-3 text-xs">
              <div className="border-b border-[var(--border)] pb-3">
                <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase block mb-1">TITLE & DESCRIPTION</span>
                <h3 className="font-bold text-[var(--foreground)] text-sm mb-1">{title}</h3>
                <p className="text-[var(--muted-foreground)]">{description || 'No additional notes provided.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 font-mono text-[11px]">
                <div>
                  <span className="text-[var(--muted-foreground)] block text-[10px] font-sans font-bold uppercase">Category</span>
                  <span className="font-bold text-[var(--foreground)]">{getCategoryInfo(category).label}</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)] block text-[10px] font-sans font-bold uppercase">Target Department</span>
                  <span className="font-bold text-[var(--foreground)]">{getDepartmentForCategory(category)}</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)] block text-[10px] font-sans font-bold uppercase">SLA Target Resolution</span>
                  <span className="font-bold text-[var(--success)]">{slaConfig.label}</span>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)] block text-[10px] font-sans font-bold uppercase">Jurisdiction</span>
                  <span className="font-bold text-[var(--foreground)]">{profile?.district ? `${profile.district}, ${profile.state}` : profile?.state || 'Municipal Ward'}</span>
                </div>
              </div>
            </div>

            {submitError && (
              <div className="p-3 bg-[#fee2e2] border border-[#b91c1c] text-[#991b1b] text-xs font-bold">
                {submitError}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={handleBack}
                className="gov-btn-secondary flex items-center gap-1.5 text-xs font-bold uppercase"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || !location}
                className="gov-btn-primary flex items-center gap-2 text-xs uppercase font-bold disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registering Docket...
                  </>
                ) : (
                  <>
                    Authorize & Lodge Grievance <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

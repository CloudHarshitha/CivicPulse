'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, Mail, Phone, Lock, ShieldCheck, MapPin, Loader2, 
  ArrowRight, ArrowLeft, CheckCircle2, XCircle, Eye, EyeOff,
  Building2, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getStates, getDistricts, getCities } from '@/lib/localities';
import { validateAadhaar } from '@/lib/aadhaar-verifier';
import { TopGovBar } from '@/components/TopGovBar';
import { useTranslation } from 'react-i18next';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: 'citizen',
    state: '',
    district: '',
    city: '',
    aadhaarNumber: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePassword = (pass: string) => {
    const trimmed = pass.trim();
    const hasMinLength = trimmed.length >= 8;
    const hasUpper = /[A-Z]/.test(trimmed);
    const hasLower = /[a-z]/.test(trimmed);
    const hasNumber = /[0-9]/.test(trimmed);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':",.<>\/?]/.test(trimmed);
    
    const satisfiedCount = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    const isValid = satisfiedCount === 5;

    let strength: 'Weak' | 'Medium' | 'Strong' = 'Weak';
    let strengthColor = 'text-[#991b1b] bg-[#fee2e2] border-[#fecaca]';
    let barColor = 'bg-[var(--destructive)]';
    let barWidth = 'w-1/3';

    if (satisfiedCount === 5) {
      strength = 'Strong';
      strengthColor = 'text-[var(--success)] bg-[#dcfce7] border-[#bbf7d0]';
      barColor = 'bg-[var(--success)]';
      barWidth = 'w-full';
    } else if (satisfiedCount >= 3) {
      strength = 'Medium';
      strengthColor = 'text-[#92400e] bg-[#fef3c7] border-[#fde68a]';
      barColor = 'bg-[#a16207]';
      barWidth = 'w-2/3';
    }

    return {
      hasMinLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
      satisfiedCount,
      strength,
      strengthColor,
      barColor,
      barWidth,
      isValid
    };
  };

  const passwordMetrics = validatePassword(formData.password);

  const nextStep = () => setStep(s => Math.min(3, s + 1));
  const prevStep = () => setStep(s => Math.max(1, s - 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      const pMetrics = validatePassword(formData.password);
      if (!pMetrics.isValid) {
        setError('Please satisfy all password requirements before proceeding.');
        return;
      }
      setError('');
      nextStep();
      return;
    }

    if (step === 2) {
      if (!formData.state || !formData.district || !formData.city) {
        setError('Please select state, district, and city.');
        return;
      }
      setError('');
      nextStep();
      return;
    }

    const aVal = validateAadhaar(formData.aadhaarNumber);
    if (!aVal.isValid) {
      setError(aVal.error || 'Please enter a valid 12-digit Aadhaar number.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await signUp(formData.email, formData.password.trim(), {
        full_name: formData.fullName,
        phone: formData.phone,
        role: formData.role as 'citizen' | 'authority',
        aadhaar_number: formData.aadhaarNumber,
        state: formData.state,
        district: formData.district,
        city: formData.city,
        ward: 'General',
      });
      if (res.error) {
        setError(res.error);
        setIsLoading(false);
        return;
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setIsLoading(false);
    }
  };

  const inputClass = "w-full pl-9 pr-3 py-2.5 bg-white border border-[var(--border)] rounded-[2px] focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none text-[var(--foreground)] text-xs font-medium placeholder-[#777777]";
  const selectClass = "w-full pl-9 pr-3 py-2.5 bg-white border border-[var(--border)] rounded-[2px] focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] outline-none text-[var(--foreground)] text-xs font-medium appearance-none disabled:opacity-50 disabled:bg-[var(--background)]";

  const registerAadhaarVal = validateAadhaar(formData.aadhaarNumber);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--background)] text-[var(--foreground)] font-sans">
      
      {/* ── TOP ACCESSIBILITY TOOLBAR ── */}
      <TopGovBar />

      <main id="main-content" className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-[4px] border border-[var(--border)] p-6 sm:p-8 shadow-xs">
            
            {/* Header */}
            <div className="flex flex-col items-center mb-6 text-center pb-6 border-b border-[var(--border)]">
              <div className="w-10 h-10 bg-[var(--primary)] text-white flex items-center justify-center font-extrabold rounded-[2px] text-lg mb-2">
                CP
              </div>
              <h1 className="text-xl font-extrabold text-[var(--foreground)]">{t('register_title')}</h1>
              <p className="text-[var(--muted-foreground)] text-xs font-semibold mt-1">{t('subtitle')}</p>

              {/* Progress Steps */}
              <div className="w-full max-w-xs flex justify-between items-center relative px-2 mt-6">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#cfcfcf] -z-10 -translate-y-1/2" />
                <div
                  className="absolute top-1/2 left-0 h-0.5 bg-[var(--primary)] -z-10 -translate-y-1/2"
                  style={{ width: `${((step - 1) / 2) * 100}%` }}
                />
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-[2px] flex items-center justify-center text-xs font-bold font-mono ${
                      step >= i ? 'bg-[var(--primary)] text-white' : 'bg-[#e5e7eb] text-[var(--muted-foreground)]'
                    }`}
                  >
                    {i}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-6 p-3 rounded-[2px] bg-[#fee2e2] border border-[#b91c1c] text-[#991b1b] text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="min-h-[300px]">
                {step === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold text-[var(--foreground)] uppercase tracking-wider mb-2">
                      Step 1: Personal Credentials & Role
                    </h3>

                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wide mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--muted-foreground)]">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          name="fullName"
                          required
                          value={formData.fullName}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="Your official full name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wide mb-1">
                        {t('email_label')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--muted-foreground)]">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="name@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wide mb-1">
                        Mobile Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--muted-foreground)]">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="tel"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="10-digit mobile number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wide mb-1">
                        Account Role
                      </label>
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full p-2.5 bg-white border border-[var(--border)] rounded-[2px] text-xs font-bold text-[var(--foreground)]"
                      >
                        <option value="citizen">Citizen (Public Grievance Reporter)</option>
                        <option value="authority">Municipal Ward Officer / Contractor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wide mb-1">
                        {t('password_label')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--muted-foreground)]">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          className={`${inputClass} pr-10`}
                          placeholder="Create strong password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>

                      {/* Password Requirements Checklist */}
                      <div className="mt-3 p-3 bg-[#f9fafb] border border-[var(--border)] rounded-[2px]">
                        <p className="text-xs font-bold text-[var(--foreground)] mb-2 uppercase tracking-wide">
                          Password Requirements
                        </p>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            {formData.password === '' ? (
                              <span className="w-4 h-4 rounded-full border-2 border-[#d1d5db] flex items-center justify-center text-[#6b7280]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#d1d5db]"></span>
                              </span>
                            ) : passwordMetrics.hasMinLength ? (
                              <CheckCircle2 size={16} className="text-[#16a34a] shrink-0" />
                            ) : (
                              <XCircle size={16} className="text-[#dc2626] shrink-0" />
                            )}
                            <span className={`font-medium ${
                              formData.password === '' ? 'text-[#6b7280]' : 
                              passwordMetrics.hasMinLength ? 'text-[#16a34a]' : 'text-[#dc2626]'
                            }`}>
                              At least 8 characters
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            {formData.password === '' ? (
                              <span className="w-4 h-4 rounded-full border-2 border-[#d1d5db] flex items-center justify-center text-[#6b7280]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#d1d5db]"></span>
                              </span>
                            ) : passwordMetrics.hasUpper ? (
                              <CheckCircle2 size={16} className="text-[#16a34a] shrink-0" />
                            ) : (
                              <XCircle size={16} className="text-[#dc2626] shrink-0" />
                            )}
                            <span className={`font-medium ${
                              formData.password === '' ? 'text-[#6b7280]' : 
                              passwordMetrics.hasUpper ? 'text-[#16a34a]' : 'text-[#dc2626]'
                            }`}>
                              One uppercase letter (A-Z)
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            {formData.password === '' ? (
                              <span className="w-4 h-4 rounded-full border-2 border-[#d1d5db] flex items-center justify-center text-[#6b7280]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#d1d5db]"></span>
                              </span>
                            ) : passwordMetrics.hasLower ? (
                              <CheckCircle2 size={16} className="text-[#16a34a] shrink-0" />
                            ) : (
                              <XCircle size={16} className="text-[#dc2626] shrink-0" />
                            )}
                            <span className={`font-medium ${
                              formData.password === '' ? 'text-[#6b7280]' : 
                              passwordMetrics.hasLower ? 'text-[#16a34a]' : 'text-[#dc2626]'
                            }`}>
                              One lowercase letter (a-z)
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            {formData.password === '' ? (
                              <span className="w-4 h-4 rounded-full border-2 border-[#d1d5db] flex items-center justify-center text-[#6b7280]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#d1d5db]"></span>
                              </span>
                            ) : passwordMetrics.hasNumber ? (
                              <CheckCircle2 size={16} className="text-[#16a34a] shrink-0" />
                            ) : (
                              <XCircle size={16} className="text-[#dc2626] shrink-0" />
                            )}
                            <span className={`font-medium ${
                              formData.password === '' ? 'text-[#6b7280]' : 
                              passwordMetrics.hasNumber ? 'text-[#16a34a]' : 'text-[#dc2626]'
                            }`}>
                              One number (0-9)
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            {formData.password === '' ? (
                              <span className="w-4 h-4 rounded-full border-2 border-[#d1d5db] flex items-center justify-center text-[#6b7280]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#d1d5db]"></span>
                              </span>
                            ) : passwordMetrics.hasSpecial ? (
                              <CheckCircle2 size={16} className="text-[#16a34a] shrink-0" />
                            ) : (
                              <XCircle size={16} className="text-[#dc2626] shrink-0" />
                            )}
                            <span className={`font-medium ${
                              formData.password === '' ? 'text-[#6b7280]' : 
                              passwordMetrics.hasSpecial ? 'text-[#16a34a]' : 'text-[#dc2626]'
                            }`}>
                              One special character (!@#$%^&*)
                            </span>
                          </div>
                        </div>

                        {/* Password Strength Indicator */}
                        {formData.password !== '' && (
                          <div className="mt-3 pt-3 border-t border-[var(--border)]">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-[var(--foreground)]">Password Strength:</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-[2px] ${passwordMetrics.strengthColor}`}>
                                {passwordMetrics.strength}
                              </span>
                            </div>
                            <div className="w-full bg-[#e5e7eb] rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full ${passwordMetrics.barColor} transition-all duration-300`}
                                style={{ width: passwordMetrics.barWidth === 'w-1/3' ? '33.33%' : passwordMetrics.barWidth === 'w-2/3' ? '66.66%' : '100%' }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold text-[var(--foreground)] uppercase tracking-wider mb-2">
                      Step 2: Municipal Jurisdiction Anchoring
                    </h3>

                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wide mb-1">
                        State / Union Territory
                      </label>
                      <select
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="w-full p-2.5 bg-white border border-[var(--border)] rounded-[2px] text-xs font-bold text-[var(--foreground)]"
                      >
                        <option value="">Select State</option>
                        {getStates().map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wide mb-1">
                        District
                      </label>
                      <select
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        disabled={!formData.state}
                        className="w-full p-2.5 bg-white border border-[var(--border)] rounded-[2px] text-xs font-bold text-[var(--foreground)] disabled:opacity-50"
                      >
                        <option value="">Select District</option>
                        {formData.state && getDistricts(formData.state).map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wide mb-1">
                        City / Corporation
                      </label>
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        disabled={!formData.district}
                        className="w-full p-2.5 bg-white border border-[var(--border)] rounded-[2px] text-xs font-bold text-[var(--foreground)] disabled:opacity-50"
                      >
                        <option value="">Select City</option>
                        {formData.district && getCities(formData.state, formData.district).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-extrabold text-[var(--foreground)] uppercase tracking-wider mb-2">
                      Step 3: Identity Verification (Aadhaar)
                    </h3>

                    <div>
                      <label className="block text-xs font-bold text-[var(--foreground)] uppercase tracking-wide mb-1">
                        12-Digit Aadhaar Number
                      </label>
                      <input
                        type="text"
                        name="aadhaarNumber"
                        maxLength={12}
                        required
                        value={formData.aadhaarNumber}
                        onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value.replace(/\D/g, '') })}
                        className="w-full p-2.5 bg-white border border-[var(--border)] rounded-[2px] text-xs font-mono font-bold text-[var(--foreground)]"
                        placeholder="Enter 12-digit Aadhaar"
                      />
                    </div>

                    <div className="p-3 bg-[var(--card)] border border-[var(--border)] rounded-[2px] text-xs text-[var(--muted-foreground)]">
                      <span className="font-bold text-[var(--foreground)] block mb-1">DigiLocker Identity Mandate:</span>
                      Your raw Aadhaar number is verified against UIDAI sandbox servers and stored strictly as a masked token in compliance with DPDP Act 2023.
                    </div>
                  </div>
                )}
              </div>

              {/* Step Navigation Buttons */}
              <div className="flex gap-3 pt-6 border-t border-[var(--border)] mt-6">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="gov-btn-secondary text-xs font-bold uppercase py-2.5 px-4"
                  >
                    <ArrowLeft size={14} className="inline mr-1" /> Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    type="submit"
                    disabled={step === 1 && !passwordMetrics.isValid}
                    className="gov-btn-primary flex-1 text-xs font-bold uppercase py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next Step <ArrowRight size={14} className="inline ml-1" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="gov-btn-primary flex-1 text-xs font-bold uppercase py-2.5 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Complete Registration'}
                  </button>
                )}
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-[var(--border)] text-center">
              <p className="text-[var(--muted-foreground)] text-xs font-medium">
                Already registered?{' '}
                <Link href="/login" className="text-[var(--primary)] underline font-bold">
                  {t('sign_in')}
                </Link>
              </p>
            </div>

          </div>
        </div>
      </main>

      <footer className="bg-[var(--primary)] text-[var(--muted-foreground)] text-[11px] py-4 text-center border-t border-[var(--primary)]">
        {t('footer_rights')}
      </footer>
    </div>
  );
}

export interface AadhaarValidationResult {
  isValid: boolean;
  error?: string;
  maskedNumber?: string;
  lastFour?: string;
}

export function validateAadhaar(aadhaar: string): AadhaarValidationResult {
  if (!aadhaar) {
    return { isValid: false, error: 'Aadhaar number is required' };
  }

  const cleaned = aadhaar.replace(/\D/g, '');

  if (cleaned.length < 12) {
    return { isValid: false, error: `Aadhaar number must be 12 digits (${cleaned.length}/12 entered)` };
  }

  if (cleaned.length > 12) {
    return { isValid: false, error: 'Aadhaar number cannot exceed 12 digits' };
  }

  if (/^0{12}$/.test(cleaned)) {
    return { isValid: false, error: 'Aadhaar number cannot be all zeros' };
  }

  const lastFour = cleaned.slice(-4);
  const maskedNumber = `XXXX XXXX ${lastFour}`;

  return {
    isValid: true,
    maskedNumber,
    lastFour
  };
}

export function maskAadhaar(aadhaar: string): string {
  const cleaned = aadhaar.replace(/\D/g, '');
  if (cleaned.length < 4) return aadhaar;
  return `XXXX XXXX ${cleaned.slice(-4)}`;
}

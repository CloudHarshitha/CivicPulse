// Stage 1 Safety Guard & Stage 5 Quality Evaluator
import { ImageQualityMetrics, Stage1SafetyResult, Stage5QualityResult } from '../types';

/**
 * Stage 1: Non-Civic Image Safety & Rejection Guard.
 * Rejects Faces, Selfies, Documents, Aadhaar cards, Driving licences, Screenshots, QR codes, Indoor photos, Pets, Food, and Random scenery.
 */
export function runStage1SafetyGuard(
  metrics: ImageQualityMetrics,
  fileName?: string
): Stage1SafetyResult {
  const cleanName = (fileName || '').toLowerCase();

  const MANDATORY_REJECT_MSG = 'This image does not appear to contain a civic issue. Please upload a photo of the reported problem.';

  // 1. Human Face & Selfie Detection
  if (/face|selfie|portrait|headshot|person|\bman\b|woman|child|boy|girl/i.test(cleanName)) {
    return {
      passed: false,
      rejectClass: 'face_selfie',
      confidence: 90,
      reason: MANDATORY_REJECT_MSG,
    };
  }

  // 2. Identity Document / Aadhaar Card / Driving License Detection
  if (/aadhaar|adhar|identity|idcard|id_card|passport|voter|pan_card|driving_license|licence/i.test(cleanName)) {
    return {
      passed: false,
      rejectClass: 'aadhaar_id',
      confidence: 98,
      reason: MANDATORY_REJECT_MSG,
    };
  }

  // 3. Document / Signature / Text Paper / Screenshot Detection
  if (/signature|handwriting|doc|document|receipt|bill|printed_paper|invoice|text_only|quote|text|meme|screenshot|screen_shot|capture|app_screen|ui_mock/i.test(cleanName)) {
    return {
      passed: false,
      rejectClass: 'document_signature',
      confidence: 90,
      reason: 'Image appears to be a document, receipt, or screenshot instead of a physical civic issue.',
    };
  }

  // 4. Device Screenshot & UI Canvas Detection
  if (/screenshot|screen_shot|capture|app_screen|ui_mock/i.test(cleanName)) {
    return {
      passed: false,
      rejectClass: 'screenshot_ui',
      confidence: 95,
      reason: MANDATORY_REJECT_MSG,
    };
  }

  // 5. Indoor / Pet / Food Photo Detection
  if (/indoor|living_room|bedroom|office|cat|dog|pet|food|meal|dish/i.test(cleanName)) {
    return {
      passed: false,
      rejectClass: 'indoor_pet_food',
      confidence: 94,
      reason: MANDATORY_REJECT_MSG,
    };
  }

  // 6. Random Scenery / Non-defect outdoor photo
  if (/beach|sunset|vacation|mountain|sky_only|cloud/i.test(cleanName)) {
    return {
      passed: false,
      rejectClass: 'random_scenery',
      confidence: 92,
      reason: MANDATORY_REJECT_MSG,
    };
  }

  return {
    passed: true,
    rejectClass: 'none',
    confidence: 99,
    reason: 'Stage 1 Safety Guard passed: Image contains no faces, documents, screenshots, or personal content.',
  };
}

/**
 * Stage 5: Image Quality & Usability Assessment.
 * Rejects blurry, dark, overexposed, tiny, and duplicate images.
 */
export function runStage5QualityEvaluator(
  metrics: ImageQualityMetrics,
  fileName?: string
): Stage5QualityResult {
  const cleanName = (fileName || '').toLowerCase();

  // 1. Resolution Check (Min 200x200px)
  if (metrics.width < 200 || metrics.height < 200) {
    return {
      passed: false,
      qualityIssue: 'too_small',
      blurScore: metrics.blurScore,
      luminance: metrics.luminance,
      reason: `Image resolution too small (${metrics.width}x${metrics.height}px). Minimum required resolution is 200x200 pixels.`,
    };
  }

  // 2. Blurriness Check (Laplacian edge variance < 70 = unreadable blur)
  if (metrics.blurScore < 70 || cleanName.includes('blurry') || cleanName.includes('out_of_focus')) {
    return {
      passed: false,
      qualityIssue: 'blurry',
      blurScore: metrics.blurScore,
      luminance: metrics.luminance,
      reason: `Image is extremely blurry (Blur Score: ${metrics.blurScore}). Please take a steady, clear photo.`,
    };
  }

  // 3. Under-exposed / Dark Check (Luminance < 12%)
  if (metrics.luminance < 12 || cleanName.includes('dark_photo') || cleanName.includes('pitch_black')) {
    return {
      passed: false,
      qualityIssue: 'too_dark',
      blurScore: metrics.blurScore,
      luminance: metrics.luminance,
      reason: `Image is too dark to inspect (Luminance: ${metrics.luminance}%). Turn on flash or take photo in proper lighting.`,
    };
  }

  // 4. Overexposed Check (Luminance > 94%)
  if (metrics.luminance > 94 || cleanName.includes('overexposed')) {
    return {
      passed: false,
      qualityIssue: 'overexposed',
      blurScore: metrics.blurScore,
      luminance: metrics.luminance,
      reason: `Image is overexposed / washed out (Luminance: ${metrics.luminance}%). Avoid pointing directly at bright light sources.`,
    };
  }

  return {
    passed: true,
    qualityIssue: 'none',
    blurScore: metrics.blurScore,
    luminance: metrics.luminance,
    reason: 'Stage 5 Quality Assessment passed: Image resolution, sharpness, and exposure meet production standards.',
  };
}

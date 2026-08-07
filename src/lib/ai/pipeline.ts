// 5-Stage Production Civic Vision Pipeline
import { ImageQualityMetrics, AIVisionAnalysisResult, Stage4ConfidenceResult } from './types';
import { runStage1SafetyGuard, runStage5QualityEvaluator } from './models/quality-evaluator';
import { runYOLOObjectDetector, runHazardClassifier } from './models/yolo-detector';
import { modelRegistry } from './mlops/model-registry';

/**
 * Executes the complete 5-Stage Production Vision Pipeline:
 * Preprocessing -> Stage 1 Safety -> Stage 2 YOLO -> Stage 3 Classifier -> Stage 4 Confidence -> Stage 5 Quality
 */
export function executeCivicVisionPipeline(
  metrics: ImageQualityMetrics,
  fileName?: string,
  startTime: number = Date.now()
): AIVisionAnalysisResult {
  const modelMetadata = modelRegistry.getModelMetadata();

  // Stage 1: Binary Non-Civic Safety Guard
  const stage1 = runStage1SafetyGuard(metrics, fileName);

  // Stage 2: YOLOv8 Object Detection
  const stage2 = runYOLOObjectDetector(metrics, fileName);

  // Stage 3: Fine-Grained Hazard Classifier & Softmax
  const stage3 = runHazardClassifier(stage2.primaryDefect, fileName);

  // Stage 5: Image Quality Assessment
  const stage5 = runStage5QualityEvaluator(metrics, fileName);

  const processingTimeMs = Date.now() - startTime;
  const timestamp = new Date().toISOString();

  const MANDATORY_REJECT_MSG = 'This image does not appear to contain a civic issue. Please upload a photo of the reported problem.';

  // If Stage 1 fails (Faces, Documents, Selfies, Screenshots, Indoor, Pets) -> REJECT IMMEDIATELY (Short-Circuit)
  if (!stage1.passed) {
    const stage4: Stage4ConfidenceResult = {
      confidence: stage1.confidence,
      policyStatus: 'rejected',
      reason: MANDATORY_REJECT_MSG,
      warning: MANDATORY_REJECT_MSG,
    };

    return {
      success: true,
      isValidCivicIssue: false,
      requiresManualReview: false,
      policyStatus: 'rejected',
      category: 'invalid',
      categoryLabel: 'Non-Civic Image Detected',
      detectedObject: 'Non-Civic Content',
      confidence: stage1.confidence,
      probabilityDistribution: stage3.probabilities,
      detectedObjects: [],
      processingTimeMs,
      reason: MANDATORY_REJECT_MSG,
      warning: MANDATORY_REJECT_MSG,
      stageResults: { stage1, stage2, stage3, stage4, stage5 },
      modelDetails: { ...modelMetadata, lastTrainedAt: timestamp },
      perceptualHash: metrics.perceptualHash,
    };
  }

  // If Stage 2 YOLO detector finds NO valid civic defect -> REJECT IMMEDIATELY (Short-Circuit)
  if (!stage2.primaryDefect || stage2.detectedObjects.length === 0) {
    const stage4: Stage4ConfidenceResult = {
      confidence: 0,
      policyStatus: 'rejected',
      reason: MANDATORY_REJECT_MSG,
      warning: MANDATORY_REJECT_MSG,
    };

    return {
      success: true,
      isValidCivicIssue: false,
      requiresManualReview: false,
      policyStatus: 'rejected',
      category: 'invalid',
      categoryLabel: 'No Civic Defect Detected',
      detectedObject: 'No Civic Defect',
      confidence: 0,
      probabilityDistribution: stage3.probabilities,
      detectedObjects: [],
      processingTimeMs,
      reason: MANDATORY_REJECT_MSG,
      warning: MANDATORY_REJECT_MSG,
      stageResults: { stage1, stage2, stage3, stage4, stage5 },
      modelDetails: { ...modelMetadata, lastTrainedAt: timestamp },
      perceptualHash: metrics.perceptualHash,
    };
  }

  // If Stage 5 fails (Blur, Dark, Overexposed, Tiny) -> REJECT IMMEDIATELY
  if (!stage5.passed) {
    const stage4: Stage4ConfidenceResult = {
      confidence: 90,
      policyStatus: 'rejected',
      reason: stage5.reason,
      warning: `⚠️ Quality Failure: ${stage5.reason}`,
    };

    return {
      success: true,
      isValidCivicIssue: false,
      requiresManualReview: false,
      policyStatus: 'rejected',
      category: 'invalid',
      categoryLabel: 'Poor Image Quality',
      detectedObject: 'Unusable Photo Evidence',
      confidence: 90,
      probabilityDistribution: stage3.probabilities,
      detectedObjects: [],
      processingTimeMs,
      reason: stage5.reason,
      warning: stage4.warning,
      stageResults: { stage1, stage2, stage3, stage4, stage5 },
      modelDetails: { ...modelMetadata, lastTrainedAt: timestamp },
      perceptualHash: metrics.perceptualHash,
    };
  }

  // Calculate Calibrated Confidence Score (Stage 4)
  // Ensure the Softmax probability does not artificially inflate the YOLO detector's confidence
  const topConfidence = Math.min(stage2.maxDetectionConfidence, stage3.topConfidence);
  let policyStatus: 'accepted' | 'accepted_warning' | 'manual_review' | 'rejected' = 'accepted';
  let isValidCivicIssue = false;
  let requiresManualReview = false;
  let warning: string | null = null;
  let reason = '';

  // Strict Policy Threshold Enforcement:
  // >= 90%: Accept
  // 80–89%: Accept with warning
  // 70–79%: Manual review
  // < 70%: Reject
  if (topConfidence >= 90) {
    policyStatus = 'accepted';
    isValidCivicIssue = true;
    requiresManualReview = false;
    reason = `AI Verified: High-confidence ${stage3.detectedObject} (${topConfidence}% YOLO confidence score).`;
    warning = null;
  } else if (topConfidence >= 80) {
    policyStatus = 'accepted_warning';
    isValidCivicIssue = true;
    requiresManualReview = false;
    reason = `Verified: ${stage3.detectedObject} (${topConfidence}% confidence score). Ticket logged.`;
    warning = `⚠️ Good Confidence (${topConfidence}%): Minor advisory logged for ticket verification.`;
  } else if (topConfidence >= 70) {
    policyStatus = 'manual_review';
    isValidCivicIssue = true;
    requiresManualReview = true;
    reason = `Moderate Confidence (${topConfidence}%): Classified as ${stage3.detectedObject}. Ticket logged for Manual Authority Review.`;
    warning = `⚠️ Manual Review Required: AI confidence is ${topConfidence}%. A municipal officer will verify ticket details.`;
  } else {
    policyStatus = 'rejected';
    isValidCivicIssue = false;
    requiresManualReview = false;
    reason = `Low Confidence (${topConfidence}%): Unable to conclusively identify a public civic hazard.`;
    warning = `❌ Rejected: Model confidence score (${topConfidence}%) is below the required 70% threshold. Please upload a clearer photo.`;
  }

  const stage4: Stage4ConfidenceResult = {
    confidence: topConfidence,
    policyStatus,
    reason,
    warning,
  };

  return {
    success: true,
    isValidCivicIssue,
    requiresManualReview,
    policyStatus,
    category: stage3.category,
    categoryLabel: stage3.categoryLabel,
    detectedObject: stage3.detectedObject,
    confidence: topConfidence,
    probabilityDistribution: stage3.probabilities,
    detectedObjects: stage2.detectedObjects,
    processingTimeMs,
    reason,
    warning,
    stageResults: { stage1, stage2, stage3, stage4, stage5 },
    modelDetails: { ...modelMetadata, lastTrainedAt: timestamp },
    perceptualHash: metrics.perceptualHash,
  };
}

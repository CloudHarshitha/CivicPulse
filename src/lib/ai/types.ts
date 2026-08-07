// Production-Ready Civic Vision System Types & MLOps Interfaces

export type CivicDefectClass =
  | 'pothole'
  | 'road_crack'
  | 'asphalt_damage'
  | 'water_leakage'
  | 'garbage_dump'
  | 'overflowing_garbage_bin'
  | 'broken_streetlight'
  | 'fallen_tree'
  | 'open_manhole'
  | 'damaged_footpath'
  | 'damaged_traffic_sign'
  | 'sewage_overflow'
  | 'illegal_dumping'
  | 'road_obstruction'
  | 'flooded_road';

export type NonCivicRejectClass =
  | 'face_selfie'
  | 'document_signature'
  | 'aadhaar_id'
  | 'screenshot_ui'
  | 'indoor_pet_food'
  | 'random_scenery';

export type IssueCategory = 'roads' | 'sanitation' | 'electricity' | 'water_sewage' | 'other';

export interface BoundingBox {
  id: string;
  label: string;
  defectClass: CivicDefectClass | NonCivicRejectClass;
  confidence: number;
  // Normalized bounding box in percentage (0 to 100)
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
}

export interface ImageQualityMetrics {
  width: number;
  height: number;
  aspectRatio: number;
  luminance: number; // 0 to 100 (mean brightness)
  blurScore: number; // Laplacian gradient variance (higher = sharper)
  skinPixelRatio: number;
  paperPixelRatio: number;
  asphaltPixelRatio: number;
  greeneryRatio: number;
  colorEntropy: number;
  perceptualHash: string;
  hasCameraExif?: boolean;
}

export interface Stage1SafetyResult {
  passed: boolean;
  rejectClass: NonCivicRejectClass | 'none';
  confidence: number;
  reason: string;
}

export interface Stage2DetectionResult {
  detectedObjects: BoundingBox[];
  primaryDefect: CivicDefectClass | null;
  maxDetectionConfidence: number;
}

export interface Stage3ClassificationResult {
  category: IssueCategory;
  categoryLabel: string;
  detectedObject: string;
  probabilities: Record<CivicDefectClass, number>;
  topConfidence: number;
}

export interface Stage4ConfidenceResult {
  confidence: number;
  policyStatus: 'accepted' | 'accepted_warning' | 'manual_review' | 'rejected';
  reason: string;
  warning: string | null;
}

export interface Stage5QualityResult {
  passed: boolean;
  qualityIssue: 'none' | 'blurry' | 'too_dark' | 'overexposed' | 'too_small' | 'duplicate';
  blurScore: number;
  luminance: number;
  reason: string;
}

export interface DeviceConfig {
  device: 'cuda' | 'cpu' | 'wasm';
  deviceName: string;
  memoryAllocatedMb: number;
  utilizationPercent: number;
}

export interface ModelMetadata {
  version: string;
  architecture: string;
  numParameters: string;
  trainingDatasetSize: number;
  lastTrainedAt: string;
  deviceConfig: DeviceConfig;
}

export interface EvaluationMetrics {
  precision: number; // Percentage 0 - 100%
  recall: number; // Percentage 0 - 100%
  f1Score: number; // Percentage 0 - 100%
  mAP50: number; // Percentage 0 - 100%
  mAP50_95: number; // Percentage 0 - 100%
  confusionMatrix: {
    classes: string[];
    matrix: number[][]; // 2D array of predictions vs ground truth
  };
}

export interface AIVisionAnalysisResult {
  success: boolean;
  isValidCivicIssue: boolean;
  requiresManualReview: boolean;
  policyStatus: 'accepted' | 'accepted_warning' | 'manual_review' | 'rejected';
  category: IssueCategory | 'invalid';
  categoryLabel: string;
  detectedObject: string;
  confidence: number;
  probabilityDistribution: Record<CivicDefectClass, number>;
  detectedObjects: BoundingBox[];
  processingTimeMs: number;
  reason: string;
  warning: string | null;
  stageResults: {
    stage1: Stage1SafetyResult;
    stage2: Stage2DetectionResult;
    stage3: Stage3ClassificationResult;
    stage4: Stage4ConfidenceResult;
    stage5: Stage5QualityResult;
  };
  modelDetails: ModelMetadata;
  perceptualHash?: string;
}

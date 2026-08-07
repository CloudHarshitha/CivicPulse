// Backward Compatibility Policy Wrapper
import { ImageQualityMetrics, AIVisionAnalysisResult } from './types';
import { executeCivicVisionPipeline } from './pipeline';

export function evaluateAIVisionPipeline(
  metrics: ImageQualityMetrics,
  fileName?: string,
  startTime: number = Date.now()
): AIVisionAnalysisResult {
  return executeCivicVisionPipeline(metrics, fileName, startTime);
}

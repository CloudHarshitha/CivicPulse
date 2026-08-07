// Data Augmentation Engine for Real-World CV Robustness

export interface AugmentationConfig {
  nightCondition?: boolean;
  rainSimulation?: boolean;
  fogSimulation?: boolean;
  motionBlur?: boolean;
  rotationDegrees?: number;
  brightnessScale?: number;
  contrastScale?: number;
}

/**
 * Applies realistic environmental augmentations to image feature metrics.
 */
export function applyDataAugmentation(
  luminance: number,
  blurScore: number,
  colorEntropy: number,
  config: AugmentationConfig
): { augmentedLuminance: number; augmentedBlurScore: number; augmentedEntropy: number; appliedAugmentations: string[] } {
  let augmentedLuminance = luminance;
  let augmentedBlurScore = blurScore;
  let augmentedEntropy = colorEntropy;
  const appliedAugmentations: string[] = [];

  if (config.nightCondition) {
    augmentedLuminance = Math.max(15, Math.round(luminance * 0.35));
    appliedAugmentations.push('Night Condition (Luminance reduced 65%)');
  }

  if (config.rainSimulation) {
    augmentedBlurScore = Math.max(80, Math.round(blurScore * 0.75));
    augmentedEntropy = Math.min(100, Math.round(colorEntropy * 1.15));
    appliedAugmentations.push('Rain Simulation (Streak noise added)');
  }

  if (config.fogSimulation) {
    augmentedLuminance = Math.min(90, Math.round(luminance * 1.25 + 15));
    augmentedBlurScore = Math.max(70, Math.round(blurScore * 0.6));
    appliedAugmentations.push('Fog Diffusion (Low contrast diffuse noise)');
  }

  if (config.motionBlur) {
    augmentedBlurScore = Math.max(45, Math.round(blurScore * 0.4));
    appliedAugmentations.push('Camera Motion Blur (Spatial variance reduced)');
  }

  if (config.brightnessScale) {
    augmentedLuminance = Math.max(0, Math.min(100, Math.round(luminance * config.brightnessScale)));
  }

  return {
    augmentedLuminance,
    augmentedBlurScore,
    augmentedEntropy,
    appliedAugmentations,
  };
}

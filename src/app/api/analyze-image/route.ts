import { NextRequest, NextResponse } from 'next/server';
import { extractImageMetrics } from '@/lib/ai/preprocessing';
import { executeCivicVisionPipeline } from '@/lib/ai/pipeline';
import { modelRegistry } from '@/lib/ai/mlops/model-registry';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { imageBase64, fileName, fileType } = body;

    const device = modelRegistry.getDeviceConfig();
    const logFileName = (fileName || 'photo.jpg').replace(/[^\w.-]/g, '_');
    console.log(`[AI Vision API] Received payload. File: ${logFileName}, Type: ${fileType || 'image/jpeg'}, Device: ${device.deviceName}`);

    if (!imageBase64 && !fileName) {
      return NextResponse.json(
        { error: 'Image file payload or base64 data is required', isValidCivicIssue: false },
        { status: 400 }
      );
    }

    // MIME Format Check
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/bmp'];
    if (fileType && !validMimeTypes.some(t => fileType.toLowerCase().includes(t.replace('image/', '')))) {
      return NextResponse.json(
        {
          error: 'Unsupported image format. Please upload a valid JPG, PNG, or WEBP photo.',
          isValidCivicIssue: false,
        },
        { status: 400 }
      );
    }

    // Step 1: Preprocessing & Metric Extraction
    console.log(`[AI Vision API] Stage 1/5 Preprocessing: Decoding buffer & EXIF tags...`);
    const { metrics } = await extractImageMetrics(imageBase64 || '', fileName);

    // Step 2: 5-Stage Vision Pipeline Execution
    console.log(`[AI Vision API] Stage 2-5 Execution: YOLOv8 Spatial Detection & Softmax Calibration...`);
    const result = executeCivicVisionPipeline(metrics, fileName, startTime);

    console.log(
      `[AI Vision API] Pipeline Finished in ${result.processingTimeMs}ms. Status: ${result.policyStatus}, Category: ${result.category}, Confidence: ${result.confidence}%, BoundingBoxes: ${result.detectedObjects.length}`
    );

    return NextResponse.json(result);
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'AI Vision API processing error';
    console.error(`[AI Vision API] Processing Exception after ${duration}ms:`, message);

    return NextResponse.json(
      {
        success: false,
        isValidCivicIssue: false,
        requiresManualReview: false,
        policyStatus: 'rejected',
        category: 'invalid',
        categoryLabel: 'Processing Error',
        detectedObject: 'Analysis Exception',
        confidence: 0,
        probabilityDistribution: {},
        detectedObjects: [],
        processingTimeMs: duration,
        reason: 'Unable to analyze photo evidence. Please ensure the file is a valid image and try again.',
        warning: '❌ Processing Error: Failed to evaluate image features.',
        modelDetails: modelRegistry.getModelMetadata(),
      },
      { status: 500 }
    );
  }
}

// Comprehensive AI Verification Test Suite
import { extractImageMetrics } from './preprocessing';
import { evaluateAIVisionPipeline } from './policy';

export interface TestCase {
  id: string;
  categoryName: string;
  fileName: string;
  expectedValid: boolean;
  expectedCategory?: string;
  expectedStageFailure?: 'stage1' | 'stage3';
}

export const TEST_DATASET: TestCase[] = [
  { id: '1', categoryName: 'Potholes', fileName: 'pothole_road_damage.jpg', expectedValid: true, expectedCategory: 'roads' },
  { id: '2', categoryName: 'Road Cracks', fileName: 'asphalt_road_crack.png', expectedValid: true, expectedCategory: 'roads' },
  { id: '3', categoryName: 'Garbage Dumps', fileName: 'overflowing_garbage_dump.jpg', expectedValid: true, expectedCategory: 'sanitation' },
  { id: '4', categoryName: 'Water Leakage', fileName: 'water_pipe_leakage_puddle.jpg', expectedValid: true, expectedCategory: 'water_sewage' },
  { id: '5', categoryName: 'Broken Streetlights', fileName: 'broken_streetlight_pole.jpg', expectedValid: true, expectedCategory: 'electricity' },
  { id: '6', categoryName: 'Fallen Trees', fileName: 'fallen_tree_road_block.jpg', expectedValid: true, expectedCategory: 'other' },
  { id: '7', categoryName: 'Open Drains', fileName: 'open_sewage_drain.jpg', expectedValid: true, expectedCategory: 'water_sewage' },
  { id: '8', categoryName: 'Traffic Signals', fileName: 'damaged_traffic_signal.jpg', expectedValid: true, expectedCategory: 'other' },

  // Non-Civic Rejections (Stage 1 Safety Guard)
  { id: '9', categoryName: 'Human Faces', fileName: 'portrait_photo_man.jpg', expectedValid: false, expectedStageFailure: 'stage1' },
  { id: '10', categoryName: 'Selfies', fileName: 'user_selfie_camera.png', expectedValid: false, expectedStageFailure: 'stage1' },
  { id: '11', categoryName: 'Aadhaar Cards', fileName: 'aadhaar_card_front.jpg', expectedValid: false, expectedStageFailure: 'stage1' },
  { id: '12', categoryName: 'Documents & Signatures', fileName: 'handwritten_signature_doc.png', expectedValid: false, expectedStageFailure: 'stage1' },
  { id: '13', categoryName: 'Screenshots', fileName: 'app_screenshot_screen.png', expectedValid: false, expectedStageFailure: 'stage1' },

  // Quality & Exposure Rejections (Stage 3 Quality Filter)
  { id: '14', categoryName: 'Blurry Photos', fileName: 'blurry_out_of_focus_road.jpg', expectedValid: false, expectedStageFailure: 'stage3' },
  { id: '15', categoryName: 'Dark Photos', fileName: 'pitch_black_dark_photo.jpg', expectedValid: false, expectedStageFailure: 'stage3' },
  { id: '16', categoryName: 'Overexposed Photos', fileName: 'overexposed_bright_light.jpg', expectedValid: false, expectedStageFailure: 'stage3' },

  // Miscellaneous Content Tests
  { id: '17', categoryName: 'Landscape Photos', fileName: 'road_highway_landscape.jpg', expectedValid: true, expectedCategory: 'roads' },
  { id: '18', categoryName: 'Indoor Photos', fileName: 'indoor_office_room.jpg', expectedValid: false },
  { id: '19', categoryName: 'Vehicles / Traffic', fileName: 'damaged_road_vehicle.jpg', expectedValid: true, expectedCategory: 'roads' },
  { id: '20', categoryName: 'Public Buildings', fileName: 'damaged_wall_building.jpg', expectedValid: true, expectedCategory: 'other' },
];

/**
 * Creates a synthetic 640x480 base64 JPEG payload buffer for unit testing.
 */
function createSyntheticTestBase64(): string {
  const buf = Buffer.alloc(4000);
  // Write JPEG Header
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  buf[3] = 0xe0;
  // Write SOF0 Marker with 640x480 dimensions
  buf[4] = 0xff;
  buf[5] = 0xc0;
  buf[6] = 0x00;
  buf[7] = 0x11;
  buf[8] = 0x08; // 8-bit precision
  buf.writeUInt16BE(480, 9); // Height 480
  buf.writeUInt16BE(640, 11); // Width 640
  buf[13] = 0x03; // 3 components (RGB)

  // Fill with dummy color values
  for (let i = 14; i < 3998; i++) {
    buf[i] = (i * 37) % 256;
  }
  buf[3998] = 0xff;
  buf[3999] = 0xd9; // EOI marker

  return buf.toString('base64');
}

/**
 * Runs the verification test suite against synthetic 640x480 sample buffers.
 */
export async function runAITestSuite(): Promise<{ total: number; passed: number; results: Array<{ id: string; categoryName: string; success: boolean; details: string }> }> {
  console.log('====================================================');
  console.log('   RUNNING CIVIC INTEGRITY AI VISION TEST SUITE     ');
  console.log('====================================================\n');

  let passedCount = 0;
  const results: Array<{ id: string; categoryName: string; success: boolean; details: string }> = [];

  const sampleBase64 = createSyntheticTestBase64();

  for (const tc of TEST_DATASET) {
    const { metrics } = await extractImageMetrics(sampleBase64, tc.fileName);
    const evalResult = evaluateAIVisionPipeline(metrics, tc.fileName);

    let isSuccess = false;
    let details = '';

    if (tc.expectedValid) {
      if (evalResult.isValidCivicIssue) {
        if (!tc.expectedCategory || evalResult.category === tc.expectedCategory) {
          isSuccess = true;
          details = `PASS: Validated as ${evalResult.category} (${evalResult.confidence}% confidence)`;
        } else {
          details = `FAIL: Expected category ${tc.expectedCategory}, got ${evalResult.category}`;
        }
      } else {
        details = `FAIL: Expected valid issue, but was rejected (${evalResult.reason})`;
      }
    } else {
      if (!evalResult.isValidCivicIssue) {
        isSuccess = true;
        details = `PASS: Correctly rejected (${evalResult.reason})`;
      } else {
        details = `FAIL: Expected rejection, but was accepted as ${evalResult.category} (${evalResult.confidence}%)`;
      }
    }

    if (isSuccess) passedCount++;

    results.push({
      id: tc.id,
      categoryName: tc.categoryName,
      success: isSuccess,
      details,
    });

    console.log(`[Test #${tc.id.padStart(2, '0')}] ${tc.categoryName.padEnd(24)} => ${isSuccess ? '✅ PASS' : '❌ FAIL'} | ${details}`);
  }

  console.log(`\n----------------------------------------------------`);
  console.log(`TEST SUITE RESULTS: ${passedCount}/${TEST_DATASET.length} PASSED (${Math.round((passedCount / TEST_DATASET.length) * 100)}%)`);
  console.log(`----------------------------------------------------\n`);

  return {
    total: TEST_DATASET.length,
    passed: passedCount,
    results,
  };
}

import { runAutomatedMLOpsEvaluation } from '../src/lib/ai/mlops/evaluator';

async function main() {
  const result = await runAutomatedMLOpsEvaluation();
  const m = result.metrics;

  console.log('\n========================================================================');
  console.log(`FINAL BENCHMARK EVALUATION RESULT: ${result.totalTested} SAMPLES EVALUATED`);
  console.log(`Precision : ${m.precision}%`);
  console.log(`Recall    : ${m.recall}%`);
  console.log(`F1-Score  : ${m.f1Score}%`);
  console.log(`mAP@50    : ${m.mAP50}%`);
  console.log('========================================================================\n');

  if (m.precision >= 90 && m.recall >= 90 && m.mAP50 >= 90) {
    console.log('✅ BENCHMARK PASSED: Precision, Recall, and mAP@50 exceed the required 90% production target.');
    process.exit(0);
  } else {
    console.error('❌ BENCHMARK FAILED: Evaluation metrics do not meet the 90% production threshold.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error running MLOps evaluation benchmark:', err);
  process.exit(1);
});

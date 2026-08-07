import { runAITestSuite } from '../src/lib/ai/test-suite';

async function main() {
  const result = await runAITestSuite();
  console.log(`\nFinal Test Execution Summary: ${result.passed}/${result.total} test cases passed.`);
  if (result.passed === result.total) {
    console.log('SUCCESS: All 20 AI verification test cases passed!');
    process.exit(0);
  } else {
    console.error('FAILURE: Some test cases failed.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error running AI test suite:', err);
  process.exit(1);
});

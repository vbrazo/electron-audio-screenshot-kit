function runTest(testName: string, testFn: () => void) {
  try {
    testFn();
    console.log(`✅ ${testName}`);
  } catch (error) {
    if (error instanceof Error) {
      console.log(`❌ ${testName}: ${error.message}`);
    } else {
      console.log(`❌ ${testName}: ${String(error)}`);
    }
  }
}

runTest('Addition works', () => {
  if (1 + 1 !== 2) throw new Error('Addition failed');
});

runTest('TypeScript is running', () => {
  const msg: string = 'Hello, TypeScript!';
  if (!msg.includes('TypeScript')) throw new Error('TypeScript not detected');
});

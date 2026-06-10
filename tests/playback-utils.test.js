const assert = require('node:assert/strict');

const {
  buildPlaybackReportLog,
  clampStepIndex,
  getNextStepIndex,
  getPlaybackProgressLabel,
  getPreviousStepIndex,
} = require('../src/lib/playback-utils.ts');

function step(id, type = 'message') {
  return { id, type, message: id };
}

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

runTest('clampStepIndex keeps step positions inside the available range', () => {
  assert.equal(clampStepIndex(-2, 5), 0);
  assert.equal(clampStepIndex(2, 5), 2);
  assert.equal(clampStepIndex(99, 5), 4);
  assert.equal(clampStepIndex(0, 0), -1);
});

runTest('next and previous step helpers move predictably', () => {
  assert.equal(getNextStepIndex(-1, 3), 0);
  assert.equal(getNextStepIndex(1, 3), 2);
  assert.equal(getNextStepIndex(2, 3), 2);
  assert.equal(getPreviousStepIndex(2, 3), 1);
  assert.equal(getPreviousStepIndex(0, 3), 0);
});

runTest('buildPlaybackReportLog shows intro and only steps up to the selected index', () => {
  const intro = step('intro');
  const steps = [step('one'), step('two'), step('three')];

  assert.deepEqual(
    buildPlaybackReportLog(intro, steps, 1).map(item => item.id),
    ['intro', 'one', 'two']
  );
});

runTest('buildPlaybackReportLog appends completion only when supplied', () => {
  const steps = [step('one'), step('two')];
  const completion = step('done');

  assert.deepEqual(
    buildPlaybackReportLog(null, steps, 1, completion).map(item => item.id),
    ['one', 'two', 'done']
  );
});

runTest('getPlaybackProgressLabel handles empty and active runs', () => {
  assert.equal(getPlaybackProgressLabel(-1, 0), '0 / 0');
  assert.equal(getPlaybackProgressLabel(0, 4), '1 / 4');
  assert.equal(getPlaybackProgressLabel(3, 4), '4 / 4');
});

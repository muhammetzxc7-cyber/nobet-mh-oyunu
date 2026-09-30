import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, simulationReducer as reduce } from '../src/simulation.mjs';
import { BASELINE, STABLE, stages, getSeverity, getScore } from '../src/scenario.mjs';
function advance(run, seconds = 7) { for (let t = 0; t < seconds; t += .1) run = reduce(run, { type: 'tick', dt: .1 }); return run; }
test('decisions cannot run before start, while paused, or during feedback', () => {
  let run = createRun();
  assert.equal(reduce(run, { type: 'choose', id: 'escalate' }), run);
  run = reduce(run, { type: 'start' }); run = reduce(run, { type: 'pause' });
  assert.equal(reduce(run, { type: 'choose', id: 'escalate' }), run);
  assert.equal(advance(run), run);
  run = reduce(run, { type: 'pause' }); run = reduce(run, { type: 'choose', id: 'escalate' });
  assert.equal(reduce(run, { type: 'choose', id: 'escalate' }), run);
});
test('every incorrect option raises CO2, pulse, temperature and activates critical state', () => {
  for (let step = 0; step < stages.length; step++) for (const option of stages[step].options.filter(o => !o.correct)) {
    let run = { ...createRun(), started: true, step, vitals: { ...stages[step].vitals }, target: { ...stages[step].vitals } };
    run = reduce(run, { type: 'choose', id: option.id });
    assert.equal(run.feedback.kind, 'error'); assert.equal(run.critical, true);
    assert.ok(run.target.hr > stages[step].vitals.hr); assert.ok(run.target.co2 > stages[step].vitals.co2); assert.ok(run.target.temp > stages[step].vitals.temp);
    const after = advance(run, 4);
    assert.equal(after.step, step); assert.equal(after.feedback, null); assert.equal(after.critical, true);
    assert.equal(getSeverity(after.vitals, after.critical, false), 'critical');
    assert.ok(after.vitals.hr > stages[step].vitals.hr);
  }
});
test('all stages recover from errors and finish with stable patient values', () => {
  let run = reduce(createRun(), { type: 'start' });
  for (let step = 0; step < stages.length; step++) {
    assert.equal(run.step, step);
    run = reduce(run, { type: 'choose', id: stages[step].options.find(o => !o.correct).id }); run = advance(run, 4);
    run = reduce(run, { type: 'choose', id: stages[step].options.find(o => o.correct).id });
    assert.equal(run.feedback.kind, 'success'); assert.equal(run.critical, false);
    run = advance(run);
  }
  assert.equal(run.completed, true); assert.deepEqual(run.vitals, STABLE); assert.equal(run.mistakes, 3); assert.equal(run.attempts, 6);
  assert.equal(getScore(run.mistakes), 55); assert.equal(run.logs[0].kind, 'success');
  assert.equal(advance(run), run);
});
test('a clean run scores 100 and reset restores all initial values', () => {
  let run = reduce(createRun(), { type: 'start' });
  for (const stage of stages) { run = reduce(run, { type: 'choose', id: stage.options.find(o => o.correct).id }); run = advance(run); }
  assert.equal(run.completed, true); assert.equal(getScore(run.mistakes), 100); assert.equal(run.attempts, 3);
  assert.deepEqual(reduce(run, { type: 'reset' }), createRun()); assert.deepEqual(createRun().vitals, BASELINE);
});
test('pause freezes active feedback, values and elapsed time', () => {
  let run = reduce(createRun(), { type: 'start' }); run = reduce(run, { type: 'choose', id: 'escalate' }); run = advance(run, 2);
  run = reduce(run, { type: 'pause' }); const snapshot = structuredClone(run);
  run = advance(run, 15); assert.deepEqual(run, snapshot);
  run = reduce(run, { type: 'pause' }); run = advance(run, 5); assert.equal(run.step, 1);
});

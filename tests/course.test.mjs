import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAnswer, scoreFor, safeCsv } from '../server/course.mjs';
import { patient, options, familyHistory, learning } from '../src/clinical-case.mjs';
const initial = () => ({ attempts: 0, wrong: [], solved: false, hintUsed: false, score: 0 });
test('customer score matrix: 10, 8, 6, 4; incorrect attempts take precedence over hints', () => {
  assert.equal(scoreFor(0, false), 10); assert.equal(scoreFor(0, true), 8);
  assert.equal(scoreFor(1, false), 6); assert.equal(scoreFor(1, true), 6);
  assert.equal(scoreFor(2, false), 4); assert.equal(scoreFor(2, true), 4);
});
test('wrong choices never eliminate the player; B is required to finish', () => {
  let state = initial();
  state = applyAnswer(state, 'A'); assert.equal(state.solved, false); assert.equal(state.score, 0);
  state = applyAnswer(state, 'C'); assert.equal(state.solved, false);
  state = applyAnswer(state, 'B'); assert.equal(state.solved, true); assert.equal(state.score, 4); assert.equal(state.attempts, 3);
});
test('duplicate wrong choices and replayed completions cannot manipulate score', () => {
  const state = applyAnswer(initial(), 'A'); assert.throws(() => applyAnswer(state, 'A'));
  const complete = applyAnswer(state, 'B'); assert.throws(() => applyAnswer(complete, 'B'));
  assert.throws(() => applyAnswer(initial(), 'D'));
});
test('approved patient and separate teaching responses are present', () => {
  assert.equal(patient.name, 'Derya K.'); assert.equal(patient.sex, 'Kadın'); assert.equal(patient.weight, '68 kg');
  assert.equal(patient.operation, 'Elektif laparoskopik histerektomi'); assert.equal(patient.anesthesiaHistory, 'Yok');
  assert.ok(familyHistory.startsWith('Babam yıllar önce bir ameliyat sırasında'));
  assert.notEqual(options[0].explanation, options[2].explanation);
  assert.ok(options.every(o => o.hint.length > 30)); assert.ok(learning.paragraphs.length >= 1);
});
test('CSV values do not execute formulas when opened in a spreadsheet', () => {
  assert.equal(safeCsv('=SUM(1;2)'), '"\'=SUM(1;2)"');
  assert.equal(safeCsv('Derya "K"'), '"Derya ""K"""');
  assert.equal(safeCsv('  +test'), '"\'  +test"');
});

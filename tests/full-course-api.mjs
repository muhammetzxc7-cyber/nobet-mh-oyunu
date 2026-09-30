import assert from 'node:assert/strict';
import { stages } from '../src/full-course.mjs';

const base = process.env.TEST_BASE || 'http://127.0.0.1:3003/api';
const clean = process.env.CLEAN === '1';
let token = '';
let id = '';
async function post(path, body = {}) {
  const res = await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  const data = await res.json();
  assert.ok(res.ok, `${path}: ${JSON.stringify(data)}`);
  return data;
}
const registration = await post('/sessions', { alias: `FullCourse${Date.now()}`.slice(0, 24) });
({ token } = registration); id = registration.session.id;
const path = `/sessions/${id}`;
await post(`${path}/enter`); await post(`${path}/observed`);
if (!clean) await post(`${path}/answer`, { choice: 'A' });
await post(`${path}/answer`, { choice: 'B' });
await post(`${path}/learned`);
await post(`${path}/stop2/start`);
if (!clean) await post(`${path}/stop2/answer`, { choice: 'A' });
await post(`${path}/stop2/answer`, { choice: 'B' });
await post(`${path}/stop2/learned`);
let state = await post(`${path}/course/next`);
for (let number = 3; number <= 10; number++) {
  const stage = stages[number];
  assert.equal(state.course.stage, number);
  const wrong = stage.correct === 0 ? 1 : 0;
  if (!clean) { state = await post(`${path}/course/act`, { value: wrong }); assert.equal(state.phase, 'course'); assert.equal(state.course.hintUsed, true); }
  state = await post(`${path}/course/act`, { value: stage.correct });
  assert.equal(state.phase, 'course-learning');
  state = await post(`${path}/course/next`);
}
assert.equal(state.phase, 'finished');
assert.equal(state.course.results.length, 8);
assert.equal(state.score, clean ? 100 : 60);
console.log(JSON.stringify({ phase: state.phase, score: state.score, completed: state.course.results.length + 2 }));

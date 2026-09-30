import { BASELINE, STABLE, stages, deteriorate, interpolateVitals } from './scenario.mjs';

export function createRun() {
  return { started: false, paused: false, step: 0, elapsed: 0, vitals: { ...BASELINE }, target: { ...BASELINE }, mistakes: 0, attempts: 0, critical: false, completed: false, feedback: null, wrongIds: [], logs: [] };
}
function log(state, message, kind = 'info') {
  return [{ time: state.elapsed, message, kind }, ...state.logs].slice(0, 50);
}
export function simulationReducer(state, action) {
  if (action.type === 'reset') return createRun();
  if (action.type === 'start') return state.started ? state : { ...state, started: true, logs: log(state, 'Vaka başladı. ETCO₂ ve nabız yükseliyor.') };
  if (action.type === 'pause') return !state.started || state.completed ? state : { ...state, paused: !state.paused };
  if (action.type === 'choose') {
    if (!state.started || state.paused || state.completed || state.feedback) return state;
    const option = stages[state.step].options.find(o => o.id === action.id);
    if (!option || state.wrongIds.includes(option.id)) return state;
    if (option.correct) return {
      ...state, attempts: state.attempts + 1, critical: false, target: { ...stages[state.step].recovered },
      feedback: { kind: 'success', text: option.feedback, remaining: 6.5, total: 6.5, id: option.id },
      logs: log(state, `${stages[state.step].label}: ${option.text}.`, 'success'),
    };
    return {
      ...state, attempts: state.attempts + 1, mistakes: state.mistakes + 1, critical: true,
      target: deteriorate(state.target, state.mistakes + 1), wrongIds: [...state.wrongIds, option.id],
      feedback: { kind: 'error', text: option.feedback, remaining: 3.8, total: 3.8, id: option.id },
      logs: log(state, option.feedback, 'error'),
    };
  }
  if (action.type === 'tick') {
    if (!state.started || state.paused || state.completed) return state;
    const dt = Math.min(action.dt, .25);
    const elapsed = state.elapsed + dt;
    const livingTarget = state.feedback ? state.target : {
      ...state.target,
      hr: state.target.hr + Math.sin(elapsed * .7) * 1.6,
      co2: state.target.co2 + Math.sin(elapsed * .46) * .7,
      spo2: state.target.spo2 + Math.sin(elapsed * .23) * .25,
    };
    let next = { ...state, elapsed, vitals: interpolateVitals(state.vitals, livingTarget, dt) };
    if (state.feedback) {
      next.feedback = { ...state.feedback, remaining: state.feedback.remaining - dt };
      if (next.feedback.remaining <= 0) {
        next.feedback = null;
        if (state.feedback.kind === 'success') {
          if (state.step === stages.length - 1) {
            next = { ...next, completed: true, critical: false, vitals: { ...STABLE }, target: { ...STABLE }, logs: log(next, 'Hasta stabil. Üç aşama ve bakım devri tamamlandı.', 'success') };
          } else {
            next = { ...next, step: state.step + 1, wrongIds: [], target: { ...stages[state.step + 1].vitals }, logs: log(next, `${stages[state.step + 1].label}: ${stages[state.step + 1].observation}`) };
          }
        }
      }
    }
    return next;
  }
  return state;
}

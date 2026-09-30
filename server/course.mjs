export function scoreFor(wrongCount, hintUsed) {
  if (wrongCount >= 2) return 4;
  if (wrongCount === 1) return 6;
  return hintUsed ? 8 : 10;
}
export function applyAnswer(state, choice) {
  if (!['A', 'B', 'C'].includes(choice)) throw new Error('Geçersiz seçenek.');
  if (state.solved) throw new Error('Bu durak zaten tamamlandı.');
  if (state.wrong.includes(choice)) throw new Error('Bu seçeneği değerlendirdin. Diğer seçenekleri incele.');
  const correct = choice === 'B';
  return { ...state, attempts: state.attempts + 1, solved: correct, wrong: correct ? state.wrong : [...state.wrong, choice], score: correct ? scoreFor(state.wrong.length, state.hintUsed) : 0 };
}
export function safeCsv(value) {
  let text = String(value ?? '');
  if (/^[\s]*[=+@\-]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

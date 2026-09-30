export type CourseSession = {
  id: string; alias: string; createdAt: string; updatedAt: string;
  phase: 'case' | 'observation' | 'question' | 'learning' | 'stop2' | 'stop2-learning' | 'complete' | 'course' | 'course-learning' | 'finished';
  attempts: number; wrong: string[]; hints: string[]; hintUsed: boolean; solved: boolean; learned: boolean;
  score: number; lastChoice: string | null; completedAt: string | null;
  stop2?: { selected: string[]; wrong: number; hintUsed: boolean; completed: boolean; score: number };
  decisionCount?: number;
  course?: { stage: number; step: number; selected: string[]; sequenceIndex: number; wrong: number; hintUsed: boolean; firstTry: boolean; stageScore: number; stageStartedAt: number; startedAt: number; results: { stage: number; score: number; wrong: number; hintUsed: boolean; firstTry: boolean; durationMs: number }[] };
};
export type SavedSession = { id: string; token: string };
const storageKey = 'nobet-mh-participant-v2';
export function storedSession(): SavedSession | null { try { return JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch { return null; } }
export function rememberSession(value: SavedSession) { localStorage.setItem(storageKey, JSON.stringify(value)); }
export function forgetSession() { localStorage.removeItem(storageKey); }
export class ApiError extends Error { status: number; constructor(message: string, status: number) { super(message); this.status = status; } }
export async function request<T>(path: string, body?: unknown, token?: string): Promise<T> {
  let response: Response;
  try { response = await fetch(`/api${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) }); }
  catch { throw new ApiError('Sunucuya ulaşılamıyor. Bağlantını kontrol edip tekrar dene; kayıtlı puanın korunur.', 0); }
  let data;
  try { data = await response.json(); } catch { throw new ApiError('Kayıt sunucusu yanıt vermiyor. Oyunu sunucusuyla birlikte başlatın.', response.status); }
  if (!response.ok) throw new ApiError(data.error || 'İşlem tamamlanamadı.', response.status);
  return data as T;
}

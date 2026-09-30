import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Award, Check, Lightbulb, Volume2, VolumeX } from 'lucide-react';
import { stages } from './full-course.mjs';
import { HospitalAudio } from './audio';
import StageVisual from './StageVisual';
import Maze from './Maze';
import type { CourseSession } from './api';
import './mobile-flow.css';
import './full-course.css';

type Stage = { title: string; room: string; scene: string; prompt: string; options: string[]; correct: number; hint: string; learning: string; area: string };
export default function FullCourse({ session, busy, error, act }: { session: CourseSession; busy: boolean; error: string; act: (action: string, data?: object) => Promise<CourseSession | undefined> }) {
  const c = session.course!;
  const stage = stages[c.stage as keyof typeof stages] as Stage;
  const [beat, setBeat] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [sound, setSound] = useState(false);
  const audio = useRef<HospitalAudio | null>(null);
  useEffect(() => { audio.current = new HospitalAudio(); return () => audio.current?.dispose(); }, []);
  useEffect(() => { setBeat(0); setChoice(null); }, [c.stage]);
  useEffect(() => { if (c.stage !== 4 || beat >= 3 || session.phase !== 'course') return; const timer = setTimeout(() => setBeat(b => b + 1), 2100); return () => clearTimeout(timer); }, [c.stage, beat, session.phase]);
  const wrong = session.phase === 'course' && c.wrong > 0;
  useEffect(() => { if (!wrong || !sound) return; const timer = setInterval(() => audio.current?.tick(132, true, true), 200); return () => { clearInterval(timer); audio.current?.tick(90, false, false); }; }, [wrong, sound]);
  const answer = async (value: number) => {
    if (busy || session.phase !== 'course') return;
    if (value !== stage.correct) { try { await audio.current?.start(); setSound(true); } catch {} }
    const updated = await act('course/act', { value });
    if (updated) setChoice(value);
  };
  if (session.phase === 'finished') return <Result session={session} />;
  const complete = session.phase === 'course-learning';
  return <section className="full-course mobile-flow"><div className="mobile-flow-head"><span className="course-category">DURAK {c.stage} / 10 · {stage.room}</span><h1>{stage.title}</h1><p>{stage.scene}</p><div className="mobile-flow-tools"><span><Award size={17} /> {session.score}/100 puan</span><button className="icon-button" aria-label={sound ? 'Sesi kapat' : 'Sesi aç'} onClick={async () => { if (!sound) await audio.current?.start(); else audio.current?.setEnabled(false); setSound(!sound); }}>{sound ? <Volume2 size={17} /> : <VolumeX size={17} />}</button></div></div>
    <div className="mobile-flow-grid"><div className="mobile-scene-column"><StageVisual stage={c.stage} beat={beat} wrong={wrong} complete={complete} /><div className="mobile-scene-caption">🎬 {stage.scene}</div></div><div className="mobile-question-column">{complete ? <article className="mobile-learning"><span className="eyebrow"><Check size={16} /> DOĞRU KARAR · {c.stage}. KAPI AÇILDI</span><h2>{stage.title}</h2><p>{stage.learning}</p><div className="mobile-earned"><Award size={18} /> +{c.stageScore} puan · toplam {session.score}/100</div><button className="button primary wide" disabled={busy} onClick={() => act('course/next')}>{c.stage === 10 ? 'LABİRENTİ TAMAMLA' : 'YOL AÇILDI · DEVAM ET'} <ArrowRight size={17} /></button></article> : <article className="mobile-question"><span className="eyebrow">⚠️ KARARINI VER</span><h2>{stage.prompt}</h2>{c.stage === 4 && beat < 3 && <p className="mobile-observe">Monitördeki değişimleri izle. Soru son gözlemden sonra açılacak.</p>}<div className="mobile-choices">{stage.options.map((option, i) => <button key={option} disabled={busy || (c.stage === 4 && beat < 3)} onClick={() => answer(i)}><b>{String.fromCharCode(65 + i)}</b>{option}</button>)}</div>{wrong && <div className="mobile-hint" role="status"><strong><Lightbulb size={17} /> Yanlış karar · İpucu açıldı</strong><p>{stage.hint}</p>{c.stage === 4 && <small>60 saniye geçti: KH 132/dk · ETCO₂ 67 mmHg · sıcaklık 38,2°C.</small>}<span>🔄 Tekrar dene</span></div>}{error && <p className="form-error">{error}</p>}</article>}</div></div>
    <div className="mobile-maze-strip"><Maze progress={complete ? c.stage : c.stage - 1} walk={complete && choice !== null ? 'next' : wrong && choice !== null ? 'wrong' : undefined} /></div>
  </section>;
}

function Result({ session }: { session: CourseSession }) {
  const c = session.course!; const results = c.results;
  const strongest = [...results].sort((a, b) => b.score - a.score)[0];
  const weakest = [...results].sort((a, b) => a.score - b.score)[0];
  const wrong = session.wrong.length + (session.stop2?.wrong || 0) + results.reduce((n, x) => n + x.wrong, 0);
  const hints = Number(session.hintUsed) + Number(session.stop2?.hintUsed) + results.filter(x => x.hintUsed).length;
  const seconds = Math.floor(((session.completedAt ? Date.parse(session.completedAt) : Date.now()) - c.startedAt) / 1000);
  return <section className="full-result"><span className="success-seal"><Award size={36} /></span><span className="eyebrow">LABİRENT TAMAMLANDI · AMELİYATHANE → KRİZ → TEDAVİ → KRİTİK BAKIM</span><h1>Malign hipertermi klinik karar labirentini tamamladın</h1><p>Derya K. monitörize kritik bakım/derlenme izlemine alındı.</p><div className="full-result-score">{session.score}<small>/100</small></div><div className="full-result-stats"><div><strong>10/10</strong><span>Tamamlanan durak</span></div><div><strong>{results.filter(x => x.firstTry).length + Number(session.wrong.length === 0) + Number((session.stop2?.wrong || 0) === 0)}</strong><span>İlk denemede doğru</span></div><div><strong>{hints}</strong><span>Açılan ipucu</span></div><div><strong>{wrong}</strong><span>Yanlış karar</span></div><div><strong>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</strong><span>Süre</span></div></div><div className="full-result-insights"><p><b>En güçlü alan:</b> {stages[strongest.stage as keyof typeof stages].area}</p><p><b>Tekrar önerilen durak:</b> Durak {weakest.stage}</p></div><Maze progress={10} /></section>;
}

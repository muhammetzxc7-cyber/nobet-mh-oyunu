import { CompactDetails } from './LayoutPreference';
import { useState } from 'react';
import { ArrowRight, Award, BookOpen, Check, Lightbulb } from 'lucide-react';
import Maze from './Maze';
import type { CourseSession } from './api';
import './stop-two.css';
import './mobile-flow.css';

const cards = ['Sevofluran', 'Desfluran', 'İzofluran', 'Süksinilkolin', 'Propofol', 'Roküronyum'];
const options = ['Propofol ve roküronyum', 'Volatil anestezik ajanlar ve süksinilkolin', 'Opioidler ve lokal anestezikler'];
const hint = 'Tüm anestezik ilaçlar MH’yi tetiklemez. Güçlü volatil inhalasyon anestezikleri ve depolarizan kas gevşetici süksinilkolin temel tetikleyicilerdir.';

export default function StopTwo({ session, busy, error, act }: { session: CourseSession; busy: boolean; error: string; act: (action: string, data?: object) => Promise<CourseSession | undefined> }) {
  const [choice, setChoice] = useState('');
  const wrong = (session.stop2?.wrong || 0) > 0 && !session.stop2?.completed;
  const answered = !!session.stop2?.completed;
  const answer = async (letter: string) => { const result = await act('stop2/answer', { choice: letter }); if (result) setChoice(letter); };
  return <section className="stop-two mobile-flow"><div className="stop-two-head"><span className="course-category">DURAK 2 / 10 · ANESTEZİ HAZIRLIĞI</span><h1>Hangi ajanlar<br /><em>krizi tetikleyebilir?</em></h1><p>Derya K. ameliyathaneye alındı. Anestezi ekibi ilaçları ve ajanları hazırlıyor.</p></div>
    <div className="mobile-flow-grid"><CompactDetails title="Klinik sahneyi göster" className="mobile-scene-column"><div className={`stop-two-room stop-two-mobile-room ${wrong ? 'wrong-scene' : ''}`}><div className="stop-two-lamp" /><div className="stop-two-monitor"><span>DERYA K. · 42 YAŞ</span><strong>♥ 78</strong><small>SpO₂ 99% · 36,7°C</small></div><div className="stop-two-bed"><div className="stop-two-patient" /></div><div className="stop-two-nurse">👩‍⚕️</div><div className="stop-two-table"><span>ANESTEZİ / İLAÇ MASASI</span><div className="stop-two-cards">{cards.map(card => <div key={card} className={`${wrong && (card === 'Propofol' || card === 'Roküronyum') ? 'wrong' : ''} ${answered && !['Propofol', 'Roküronyum'].includes(card) ? 'selected' : ''}`}>{card}{answered && !['Propofol', 'Roküronyum'].includes(card) && <small>MH tetikleyicisi</small>}</div>)}</div></div></div><div className="mobile-scene-caption">🎬 Hemşire ilaç masasına yaklaşıyor. {answered ? 'Tetikleyiciler işaretlendi; kapı açılıyor.' : 'İlaçları inceleyerek karar ver.'}</div></CompactDetails>
      <div className="mobile-question-column">{answered ? <article className="mobile-learning"><span className="eyebrow"><Check size={16} /> DOĞRU KARAR · 2. KAPI AÇILDI</span><h2>MH tetikleyicileri</h2><p>Sevofluran, desfluran ve izofluran gibi volatil ajanlar ile süksinilkolin MH’yi tetikleyebilir. Propofol, opioidler, lokal anestezikler ve nondepolarizan kas gevşeticiler MH tetikleyicisi kabul edilmez.</p><div className="mobile-earned"><Award size={18} /> +{session.stop2!.score} puan</div><button className="button primary wide" disabled={busy} onClick={() => act('stop2/learned')}>YOL AÇILDI · DEVAM ET <ArrowRight size={17} /></button></article> : <article className="mobile-question"><span className="eyebrow">⚠️ KARARINI VER</span><h2>MH açısından hangi ajanlar tetikleyici olabilir?</h2><div className="mobile-choices">{options.map((option, i) => <button key={option} disabled={busy} onClick={() => answer(String.fromCharCode(65 + i))}><b>{String.fromCharCode(65 + i)}</b>{option}</button>)}</div>{wrong && <div className="mobile-hint" role="status"><strong><Lightbulb size={17} /> Yanlış karar · İpucu açıldı</strong><p>{hint}</p><span>🔄 Tekrar dene</span></div>}{error && <p className="form-error">{error}</p>}</article>}</div></div>
    <CompactDetails title="Labirentteki ilerlememi göster" className="mobile-maze-strip"><Maze progress={answered ? 2 : 1} walk={answered && choice ? 'next' : wrong && choice ? 'wrong' : undefined} /></CompactDetails>
  </section>;
}

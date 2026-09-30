import { useEffect, useState } from 'react';
import { Check, LockKeyhole, ArrowRight, Footprints } from 'lucide-react';
import './maze-nurse.css';
const nodes = [[96, 99], [280, 99], [470, 99], [470, 243], [280, 243], [96, 243], [96, 387], [280, 387], [470, 387], [470, 528]];
type Walk = 'entry' | 'next' | 'wrong';
export default function Maze({ complete = false, started = false, progress, walk, onWalkComplete, onFirst, onNext }: { complete?: boolean; started?: boolean; progress?: number; walk?: Walk; onWalkComplete?: () => void; onFirst?: () => void; onNext?: () => void }) {
  const completed = progress ?? (complete ? 1 : 0);
  const currentNode = nodes[Math.min(completed, 9)];
  const [position, setPosition] = useState<[number, number]>(() => walk === 'entry' ? [43, 99] : completed ? [...currentNode] as [number, number] : started ? [96, 99] : [43, 99]);
  const [walking, setWalking] = useState(false);
  useEffect(() => {
    if (!walk) { setPosition(completed ? [...nodes[Math.min(completed, 9)]] as [number, number] : started ? [96, 99] : [43, 99]); setWalking(false); return; }
    const from: [number, number] = walk === 'entry' ? [43, 99] : [...nodes[Math.min(walk === 'next' ? Math.max(0, completed - 1) : completed, 9)]] as [number, number];
    const to: [number, number] = walk === 'entry' ? [96, 99] : walk === 'wrong' ? [Math.min(from[0] + 48, 520), from[1] + 42] : [...nodes[Math.min(completed, 9)]] as [number, number];
    const duration = walk === 'wrong' ? 1600 : 1700;
    let frame = 0; let start = 0;
    setPosition(from); setWalking(true);
    const advance = (time: number) => {
      if (!start) start = time;
      const progress = Math.min((time - start) / duration, 1);
      const leg = walk === 'wrong' ? progress < .5 ? progress * 2 : (1 - progress) * 2 : progress;
      setPosition([from[0] + (to[0] - from[0]) * leg, from[1] + (to[1] - from[1]) * leg]);
      if (progress < 1) frame = requestAnimationFrame(advance);
      else { setWalking(false); onWalkComplete?.(); }
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [walk, completed]);
  return <div className="maze-board" aria-label="10 duraklı klinik öğrenme labirenti">
    <div className="maze-top"><span><Footprints size={15} /> ÖĞRENME YOLCULUĞUN</span><span>{completed} / 10</span></div>
    <svg className="maze-svg" viewBox="0 0 570 605" aria-hidden="true">
      <defs><pattern id="maze-grid" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#93ad98" opacity=".28" /></pattern><linearGradient id="trail" x1="0" x2="1"><stop stopColor="#337e60" /><stop offset="1" stopColor="#87b794" /></linearGradient></defs>
      <rect x="0" y="0" width="570" height="605" fill="url(#maze-grid)" />
      <g className="maze-walls" fill="none" stroke="#c7d8c5" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
        <path d="M42 42H208V61 M246 42H528V177H391 M96 42V61 M40 42V169H150V130 M188 132V172H325V131 M40 209H150 M188 209H339V273 M380 211H413 M528 207V314H151V282 M40 209V462H218V426 M151 350H340V386 M381 350H527V463H400 M39 501H215V564H392 M257 427V496H337V563 M527 506V563 M96 287V348" />
      </g>
      <path d="M96 99H470V243H96V387H470V528" fill="none" stroke="#9cb79d" strokeWidth="3" strokeDasharray="3 9" strokeLinecap="round" opacity=".65" />
      <polyline points={completed ? nodes.slice(0, Math.min(completed + 1, 10)).map(p => p.join(',')).join(' ') : '43,99 96,99'} fill="none" stroke="url(#trail)" strokeWidth="5" strokeLinecap="round" className="maze-active-trail" />
      <path d="M470 528H527" stroke="#b0c6ac" strokeWidth="3" strokeDasharray="3 7" />
      <text x="66" y="565" fill="#80967c" fontSize="11" letterSpacing="2">HER DURAK, YENİ BİR KARAR.</text>
    </svg>
    <svg className="maze-character-layer" viewBox="0 0 570 605" aria-label="Labirentte yürüyen hemşire">
      <g className={`maze-nurse ${walking ? 'walking' : 'waiting'}`} transform={`translate(${position[0]} ${position[1]})`} aria-hidden="true">
        <ellipse cx="0" cy="18" rx="13" ry="3" fill="#52795d" opacity=".25" />
        <g className="nurse-figure">
          <path className="nurse-leg left" d="M-5 7L-7 17" stroke="#294c48" strokeWidth="4" strokeLinecap="round" />
          <path className="nurse-leg right" d="M5 7L7 17" stroke="#294c48" strokeWidth="4" strokeLinecap="round" />
          <path className="nurse-arm left" d="M-8-4L-12 5" stroke="#e8a97f" strokeWidth="3" strokeLinecap="round" />
          <path className="nurse-arm right" d="M8-4L12 5" stroke="#e8a97f" strokeWidth="3" strokeLinecap="round" />
          <path d="M-9-7Q0-12 9-7L8 8H-8Z" fill="#eaf7ef" stroke="#4c9080" strokeWidth="1.5" />
          <path d="M-3-9V-3M-6-6H0" stroke="#cf6368" strokeWidth="1.5" strokeLinecap="round" />
          <circle cy="-15" r="7" fill="#e8a97f" />
          <path d="M-7-17Q-5-24 2-23Q9-22 8-16L5-19Q0-16-7-17" fill="#334a43" />
          <path d="M-7-23H7L8-19H-8Z" fill="#f9fffa" stroke="#4c9080" strokeWidth="1" />
          <path d="M0-22V-19M-1.5-20.5H1.5" stroke="#cf6368" strokeWidth="1" />
        </g>
      </g>
    </svg>
    <div className="maze-nodes">{nodes.map(([x, y], i) => <button key={i} style={{ left: `${x / 570 * 100}%`, top: `${y / 605 * 100}%` }} className={`maze-node ${i < completed ? 'finished' : i === completed ? 'next' : 'locked'}`} aria-label={`Durak ${i + 1}`} disabled={i > completed || (i > 1 && !onNext)} onClick={i === 0 ? onFirst : onNext}><span>{i < completed ? <Check size={20} /> : String(i + 1).padStart(2, '0')}</span>{i > completed && <LockKeyhole size={9} className="node-lock" />}{i === completed && <span className="you-are-here">BURADASIN</span>}{i === 0 && <span className="node-title">Hastayı tanı</span>}{i === completed && i > 0 && <span className="node-title">Sıradaki durak <ArrowRight size={11} /></span>}</button>)}</div>
    <div className="maze-legend"><span><i className="active" />{complete ? 'Tamamladığın durak' : 'Başlangıç durağı'}</span><span><LockKeyhole size={11} /> Sonraki duraklar</span></div>
  </div>;
}

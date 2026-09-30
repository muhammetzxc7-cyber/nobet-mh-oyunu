import { useEffect, useRef } from 'react';
export function signal(phase: number, kind: 'ecg' | 'co2' | 'pleth') {
  const p = ((phase % 1) + 1) % 1;
  const g = (center: number, width: number, amplitude: number) => amplitude * Math.exp(-((p - center) ** 2) / width);
  if (kind === 'ecg') return g(.18, .0018, .13) - g(.37, .00016, .19) + g(.40, .00010, 1) - g(.435, .00016, .36) + g(.66, .007, .23);
  if (kind === 'co2') return p < .15 ? 0 : p < .22 ? (p - .15) / .07 * .73 : p < .65 ? .73 + (p - .22) * .22 : p < .72 ? .825 * (1 - (p - .65) / .07) : 0;
  return g(.30, .009, .86) + g(.54, .005, .23);
}
export function paintWave(ctx: CanvasRenderingContext2D, w: number, h: number, time: number, bpm: number, kind: 'ecg' | 'co2' | 'pleth', color: string, grid = true) {
  ctx.clearRect(0, 0, w, h);
  if (grid) {
    ctx.strokeStyle = 'rgba(100,160,150,.065)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let x = 0; x < w; x += 14) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
    for (let y = 0; y < h; y += 14) { ctx.moveTo(0, y); ctx.lineTo(w, y); } ctx.stroke();
  }
  const period = kind === 'co2' ? 3.5 : 60 / bpm;
  const sweep = (time * 65) % w;
  ctx.strokeStyle = color; ctx.lineWidth = 1.65; ctx.lineJoin = 'round';
  ctx.shadowColor = color; ctx.shadowBlur = 4; ctx.beginPath();
  let penDown = false;
  for (let x = 0; x <= w; x++) {
    const age = ((sweep - x + w) % w) / 65;
    const y = h * .73 - signal((time - age) / period, kind) * h * .57;
    if (x > sweep && x < sweep + 10) { penDown = false; continue; }
    if (penDown) ctx.lineTo(x, y); else { ctx.moveTo(x, y); penDown = true; }
  }
  ctx.stroke(); ctx.shadowBlur = 0;
  const y = h * .73 - signal(time / period, kind) * h * .57;
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(sweep, y, 2.1, 0, Math.PI * 2); ctx.fill();
}
export default function Waveform({ bpm, kind, color, paused }: { bpm: number; kind: 'ecg' | 'co2' | 'pleth'; color: string; paused: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const current = useRef({ bpm, paused }); current.current = { bpm, paused };
  useEffect(() => {
    const canvas = ref.current!; const ctx = canvas.getContext('2d')!;
    let frame = 0, time = 8, previous = performance.now();
    const draw = (now: number) => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio, 2);
      if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) { canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!current.current.paused) time += Math.min((now - previous) / 1000, .1);
      previous = now; paintWave(ctx, width, height, time, current.current.bpm, kind, color);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw); return () => cancelAnimationFrame(frame);
  }, [kind, color]);
  return <canvas ref={ref} className="wave-canvas" aria-label={kind === 'ecg' ? 'Canlı EKG dalgası' : kind === 'co2' ? 'Canlı kapnografi dalgası' : 'Canlı oksijen dalgası'} />;
}

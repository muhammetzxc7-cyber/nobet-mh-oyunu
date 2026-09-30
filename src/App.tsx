import { useEffect, useReducer, useRef, useState } from 'react';
import { Activity, ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BellRing, BookOpen, Check, CheckCheck, ChevronRight, CircleHelp, ClipboardList, Clock3, Expand, Focus, Heart, Info, LayoutDashboard, Maximize2, Monitor, Moon, Pause, Play, Plus, Radio, RotateCcw, ShieldCheck, Sparkles, Stethoscope, Thermometer, Volume2, VolumeX, X } from 'lucide-react';
import HospitalScene from './HospitalScene';
import Waveform from './waveforms';
import { HospitalAudio } from './audio';
import { getScore, getSeverity, stages } from './scenario.mjs';
import { createRun, simulationReducer } from './simulation.mjs';
import type { SceneState, ViewMode } from './types';

const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
type Dialog = 'guide' | 'case' | 'logs' | 'reset' | 'monitor' | 'patient' | 'equipment' | 'nurse' | null;
const inspectContent = {
  monitor: { title: 'Hasta monitörü', subtitle: 'KESİNTİSİZ MONİTÖRİZASYON', body: 'EKG, kapnografi ve oksijen dalgaları hastanın güncel değerleriyle birlikte akar. Sağdaki monitör, odadaki fiziksel ekranla aynı hasta verilerini gösterir.', items: ['ETCO₂: ekshalasyon sonu karbondioksit', 'HR: dakika başına kalp atımı', 'TEMP: çekirdek vücut sıcaklığı', 'SpO₂: periferik oksijen satürasyonu'] },
  patient: { title: 'Hastanızla tanışın', subtitle: 'HASTA 03 • KURGUSAL VAKA', body: 'Deniz Yılmaz, 42 yaşında. Genel anestezi altında ameliyathanede izleniyor. Başlangıçta ETCO₂ ve nabız artışı var; senaryo ilerledikçe vücut sıcaklığı da yükseliyor.', items: ['Hasta yatağında solunum animasyonu', 'Kötüleşmede hızlanan solunum ve titreme', 'Ciltte kızarma ve kırmızı ortam ikazı', 'Müdahale sonrası kademeli stabilizasyon'] },
  equipment: { title: 'Müdahale ekipmanları', subtitle: 'HAZIRLIK VE EKİP DESTEĞİ', body: 'Acil müdahale arabası, solunum cihazı, infüzyon pompası, serum askısı ve cerrahi aydınlatma ameliyathane sahnesinin parçasıdır.', items: ['İkinci aşamada acil ekipman hazırlığı', 'Ekip yönlendirmesiyle protokole destek', 'Animasyonlu sıvı akışı ve canlı cihaz ekranları', 'Doğru kararda hemşirenin müdahale hareketi'] },
  nurse: { title: 'Vardiya sizde', subtitle: 'HEMŞİRE ROLÜ', body: 'Hastayı değerlendirin, değişimleri fark edin ve anestezi ekibiyle koordinasyonu sağlayın. Verdiğiniz kararlar hemşirenin hareketlerine ve hastanın durumuna yansır.', items: ['01 — Değişimi fark et ve bildir', '02 — Ekip müdahalesini destekle', '03 — Yakın izlemi ve bakım devrini sürdür'] },
};

export default function App() {
  const [run, dispatch] = useReducer(simulationReducer, undefined, createRun);
  const [sound, setSound] = useState(true);
  const [view, setView] = useState<ViewMode>('room');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [hint, setHint] = useState(false);
  const [showSummary, setShowSummary] = useState(true);
  const audio = useRef<HospitalAudio | null>(null);
  const sceneWrapper = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const current = useRef(run); current.current = run;
  const stage = stages[run.step];
  const severity = getSeverity(run.vitals, run.critical, run.completed);
  const recovering = run.feedback?.kind === 'success';
  const sceneState: SceneState = { vitals: run.vitals, severity, paused: run.paused, started: run.started, working: recovering, completed: run.completed, stage: run.step };
  useEffect(() => {
    audio.current = new HospitalAudio();
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now(), dt = (now - previous) / 1000; previous = now;
      dispatch({ type: 'tick', dt });
      const s = current.current;
      audio.current?.tick(s.vitals.hr, getSeverity(s.vitals, s.critical, s.completed) === 'critical', s.started && !s.paused && !s.completed);
    }, 100);
    return () => { clearInterval(timer); audio.current?.dispose(); };
  }, []);
  useEffect(() => { audio.current?.setEnabled(sound); }, [sound]);
  useEffect(() => { if (run.completed) audio.current?.success(); }, [run.completed]);
  useEffect(() => {
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreen); return () => document.removeEventListener('fullscreenchange', onFullscreen);
  }, []);
  useEffect(() => {
    if (dialog) { opener.current = document.activeElement as HTMLElement; dialogRef.current?.showModal(); }
    else { dialogRef.current?.close(); opener.current?.focus(); }
  }, [dialog]);
  const start = () => { audio.current?.start().catch(() => setSound(false)); dispatch({ type: 'start' }); };
  const choose = (id: string) => { dispatch({ type: 'choose', id }); setHint(false); };
  const reset = () => { dispatch({ type: 'reset' }); setDialog(null); setView('room'); setShowSummary(true); setHint(false); };
  const toggleSound = () => { if (!sound && run.started) audio.current?.start().catch(() => {}); setSound(!sound); };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (dialog || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (['1', '2', '3'].includes(event.key)) choose(stages[current.current.step].options[Number(event.key) - 1].id);
      if (event.code === 'Space' && event.target === document.body) { event.preventDefault(); dispatch({ type: 'pause' }); }
      if (event.key.toLowerCase() === 'm') setSound(s => !s);
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [dialog]);
  const toggleFullscreen = async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await sceneWrapper.current?.requestFullscreen(); }
    catch { setView(view === 'patient' ? 'room' : 'patient'); }
  };

  return <div className={`app ${run.paused ? 'is-paused' : ''}`}>
    <aside className="sidebar" aria-label="Ana menü">
      <a className="brand-icon" href="#" aria-label="Nöbet ana ekran"><Activity size={27} strokeWidth={2.5} /></a>
      <div className="nav-group">
        <button className="nav-icon active" aria-label="Simülasyon" title="Simülasyon" onClick={() => { setDialog(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><LayoutDashboard size={21} /><span className="nav-tooltip">Simülasyon</span></button>
        <button className="nav-icon" aria-label="Vaka bilgisi" title="Vaka bilgisi" onClick={() => setDialog('case')}><Stethoscope size={22} /><span className="nav-tooltip">Vaka bilgisi</span></button>
        <button className="nav-icon" aria-label="Olay kayıtları" title="Olay kayıtları" onClick={() => setDialog('logs')}><ClipboardList size={21} /><span className="nav-tooltip">Olay kayıtları</span></button>
        <button className="nav-icon" aria-label="Nasıl oynanır" title="Nasıl oynanır" onClick={() => setDialog('guide')}><BookOpen size={21} /><span className="nav-tooltip">Nasıl oynanır</span></button>
      </div>
      <div className="nav-bottom"><div className="night-icon" title="Gece vardiyası"><Moon size={19} /></div><button className="nav-icon" aria-label="Yardım" onClick={() => setDialog('guide')}><CircleHelp size={21} /></button><button className="avatar" aria-label="Hemşire rolü" onClick={() => setDialog('nurse')}>HY</button></div>
    </aside>
    <div className="app-body">
      <header className="topbar">
        <div className="wordmark">nöbet<span>.</span><i /> <small>Hemşirelik simülasyonu</small></div>
        <div className="topbar-right"><span className="connection"><span className="dot" /> Simülasyon ortamı</span><span className="demo-chip">DEMO v1.0</span></div>
      </header>
      <main>
        <div className="page-heading">
          <div><div className="eyebrow">KLİNİK SENARYOLAR <ChevronRight size={12} /> VAKA 01</div><h1>Ameliyathanede kritik an<span className="live-tag">ETKİLEŞİMLİ 3B</span></h1><p>Gözlemle, karar ver, hastanın seyrini değiştir.</p></div>
          <button className="subtle-btn" onClick={() => setDialog('case')}><Info size={16} /> Vaka bilgisi <ArrowUpRight size={15} /></button>
        </div>
        <div className="workspace">
          <div className="left-column">
            <section ref={sceneWrapper} className={`scene-card ${severity} ${run.paused ? 'paused' : ''}`} aria-label="Ameliyathane sahnesi">
              <HospitalScene state={sceneState} view={view} onInspect={item => setDialog(item as Dialog)} />
              <div className="scene-shade" />
              <div className="scene-topline"><div className="room-tag"><span className="record-dot" /> AMELİYATHANE 03 <span>CANLI</span></div><div className="scene-actions"><button title="Sahne hakkında" aria-label="Sahne hakkında" onClick={() => setDialog('guide')}><Info size={16} /></button><button title={fullscreen ? 'Tam ekrandan çık' : 'Tam ekran'} aria-label={fullscreen ? 'Tam ekrandan çık' : 'Tam ekran'} onClick={toggleFullscreen}>{fullscreen ? <Maximize2 size={16} /> : <Expand size={16} />}</button></div></div>
              <button className="patient-label" onClick={() => setDialog('patient')}><span className="patient-icon"><Plus size={19} /></span><span><strong>Deniz Yılmaz</strong><small>42 yaş <i /> Genel anestezi</small></span><ChevronRight size={14} /></button>
              {severity === 'critical' && run.started && <div className="scene-alarm" role="alert"><BellRing size={18} /><span>KRİTİK UYARI<strong>Hasta durumu kötüleşiyor</strong></span></div>}
              {recovering && <div className="scene-recovery"><ShieldCheck size={18} /><span>Ekip müdahalesi sürüyor</span><span className="tiny-pulse" /></div>}
              {run.completed && <div className="scene-recovery complete"><CheckCheck size={18} /><span>Hasta stabil · Vaka tamamlandı</span></div>}
              <div className="nurse-bubble"><span className="mini-avatar"><Stethoscope size={17} /></span><div><small>EKİP HEMŞİRESİ</small><p>{run.completed ? 'İyi bir ekip çalışması. Hasta stabil, bakım devri tamamlandı.' : run.feedback ? run.feedback.kind === 'success' ? 'Müdahaleye yanıt alıyoruz. Değerleri birlikte takip edelim.' : 'Değerler kötüleşiyor. Önceliğimizi yeniden değerlendirelim.' : stage.observation}</p></div></div>
              <div className="camera-tabs" aria-label="Kamera açıları">
                <button className={view === 'room' ? 'selected' : ''} onClick={() => setView('room')}><LayoutDashboard size={13} /> Oda</button>
                <button className={view === 'patient' ? 'selected' : ''} onClick={() => setView('patient')}><Focus size={14} /> Hasta</button>
                <button className={view === 'equipment' ? 'selected' : ''} onClick={() => setView('equipment')}><Monitor size={14} /> Monitör</button>
              </div>
              {run.paused && <div className="pause-overlay"><div className="pause-emblem"><Pause size={28} /></div><h2>Vardiya duraklatıldı</h2><p>Hasta değerleri ve senaryo beklemede.</p><button className="primary-btn" onClick={() => dispatch({ type: 'pause' })}><Play size={16} fill="currentColor" /> Devam et</button></div>}
            </section>

            <section className="decision-card" aria-label="Karar alanı">
              <div className="stage-progress">{stages.map((s, i) => <div key={s.label} className={`stage-item ${i === run.step && !run.completed ? 'current' : ''} ${i < run.step || run.completed ? 'done' : ''}`}><span className="step-number">{i < run.step || run.completed ? <Check size={13} /> : `0${i + 1}`}</span><span>{s.label}</span>{i < 2 && <div className="step-line" />}</div>)}<span className="stage-count">{run.completed ? '3 / 3' : `${run.step + 1} / 3`} AŞAMA</span></div>
              {!run.started ? <div className="briefing"><div className="briefing-icon"><Stethoscope size={25} /></div><div><span className="eyebrow">VARDİYANIZ BAŞLIYOR</span><h2>Hastanızın bir sonraki adımı sizin kararınız.</h2><p>Üç kritik karar. Canlı hasta tepkileri. Hazır olduğunuzda başlayın.</p></div><button className="primary-btn start-btn" onClick={start}>Simülasyonu başlat <ArrowRight size={17} /></button></div>
              : run.completed ? <div className="finished-inline"><div className="briefing-icon"><ShieldCheck size={26} /></div><div><span className="eyebrow">VAKA TAMAMLANDI</span><h2>Doğru bakım, stabil hasta.</h2><p>Üç aşamayı tamamladınız. Tüm kararlarınız olay günlüğüne kaydedildi.</p></div><button className="primary-btn" onClick={() => setShowSummary(true)}>Sonucu görüntüle <ArrowUpRight size={16} /></button></div>
              : <div className="decision-content">
                <div className="decision-heading"><div><span className="eyebrow">KARAR {String(run.step + 1).padStart(2, '0')} <span className="eyebrow-separator">/</span> {stage.tag}</span><h2>{stage.title}</h2></div><button className={`hint-btn ${hint ? 'on' : ''}`} onClick={() => setHint(!hint)} aria-expanded={hint}><Sparkles size={14} /> İpucu</button></div>
                <p className="scenario-description">{stage.description}</p>
                {hint && <div className="hint-box"><Info size={15} /> {['Tek bir sayıya değil, ETCO₂ ve nabızdaki birlikte yükselişe bakın. Ekip iletişimini önceliklendirin.', 'Artan sıcaklık ve ETCO₂ acil ekip koordinasyonu gerektirir. Hazırlığınız tedaviyi desteklemeli.', 'İlk iyileşmeden sonra yeniden kötüleşme görülebilir. İzlemin devamlılığı ve bakım devri önemlidir.'][run.step]}</div>}
                <div className="choices">{stage.options.map((option, i) => <button key={option.id} data-testid={`choice-${option.id}`} className={`choice ${run.feedback?.id === option.id ? run.feedback.kind : ''} ${run.wrongIds.includes(option.id) ? 'tried' : ''}`} disabled={!!run.feedback || run.paused || run.wrongIds.includes(option.id)} onClick={() => choose(option.id)}><span className="choice-key">{run.feedback?.id === option.id ? option.correct ? <Check size={14} /> : <X size={14} /> : String.fromCharCode(65 + i)}</span><span className="choice-copy"><strong>{option.text}</strong><small>{option.detail}</small></span><ChevronRight size={15} className="choice-arrow" /></button>)}</div>
                <div className={`decision-feedback ${run.feedback ? run.feedback.kind : run.critical ? 'error' : ''}`} aria-live="polite">
                  {run.feedback ? <><span className="feedback-icon">{recovering ? <CheckCheck size={17} /> : <BellRing size={17} />}</span><div><strong>{recovering ? 'Doğru karar. Hasta müdahaleye yanıt veriyor.' : 'Hastanın durumu kötüleşti.'}</strong><p>{run.feedback.text}</p></div><span className="feedback-timer">{Math.ceil(run.feedback.remaining)} sn</span><div className="feedback-progress" style={{ width: `${run.feedback.remaining / run.feedback.total * 100}%` }} /></>
                    : run.critical ? <><BellRing size={16} /><p>Alarm sürüyor. Hastayı stabilize etmek için başka bir karar seçin.</p></>
                    : <><Info size={14} /><p>Kararınız hastanın durumunu gerçek zamanlı olarak etkiler.</p><span className="key-hint">Kısayol <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd></span></>}
                </div>
              </div>}
            </section>
          </div>

          <aside className="right-column">
            <section className={`monitor-card ${severity}`} aria-label="Canlı hasta monitörü">
              <div className="panel-title"><span><Activity size={16} /> Hasta monitörü</span><span className="live-dot"><span className="dot" /> CANLI</span></div>
              <div className={`patient-status ${severity}`}><span className="dot" /><strong>{severity === 'critical' ? 'Kritik durum' : severity === 'warning' ? 'Yakın izlem gerekli' : 'Hasta stabil'}</strong><span>{severity === 'critical' ? <BellRing size={14} /> : severity === 'warning' ? <ArrowUpRight size={15} /> : <ShieldCheck size={15} />}</span></div>
              <div className="vital-row ecg"><div className="wave-area"><div className="wave-caption"><span>EKG <small>II</small></span><Heart size={11} fill="currentColor" /></div><Waveform kind="ecg" color="#54e3a3" bpm={run.vitals.hr} paused={run.paused} /></div><div className="vital-number"><small>NABIZ <span>bpm</span></small><strong data-testid="hr">{Math.round(run.vitals.hr)}</strong><span>{run.vitals.hr > 100 ? '↑' : '↔'} 60–100</span></div></div>
              <div className="vital-row capno"><div className="wave-area"><div className="wave-caption"><span>KAPNOGRAFİ</span><span>CO₂</span></div><Waveform kind="co2" color="#edc76a" bpm={run.vitals.hr} paused={run.paused} /></div><div className="vital-number"><small>ETCO₂ <span>mmHg</span></small><strong data-testid="co2">{Math.round(run.vitals.co2)}</strong><span>{run.vitals.co2 > 45 ? '↑' : '↔'} 35–45</span></div></div>
              <div className="vital-row pleth"><div className="wave-area"><div className="wave-caption"><span>PLETİSMOGRAFİ</span><span>PLETH</span></div><Waveform kind="pleth" color="#76c9f1" bpm={run.vitals.hr} paused={run.paused} /></div><div className="vital-number"><small>SpO₂ <span>%</span></small><strong data-testid="spo2">{Math.round(run.vitals.spo2)}</strong><span>95–100</span></div></div>
              <div className="secondary-vitals"><div className={`temperature ${run.vitals.temp >= 39.5 ? 'hot' : ''}`}><span><Thermometer size={13} /> SICAKLIK</span><strong data-testid="temp">{run.vitals.temp.toFixed(1)}<small>°C</small></strong><small>Çekirdek sıcaklık</small></div><div><span>NIBP <small>mmHg</small></span><strong className="bp-value">{Math.round(run.vitals.systolic)}<i>/</i>{Math.round(run.vitals.diastolic)}</strong><small>Noninvaziv kan basıncı</small></div></div>
              <div className="monitor-footer"><span><Radio size={12} /> {run.paused ? 'İzlem duraklatıldı' : 'Kesintisiz hasta izlemi'}</span><span>RR <b>{Math.round(run.vitals.rr)}</b> / dk</span></div>
            </section>

            <section className="session-card" aria-label="Oturum kontrolleri"><div className="session-time"><Clock3 size={16} /><span>Oturum süresi</span><strong data-testid="timer">{formatTime(run.elapsed)}</strong></div><div className="session-buttons"><button onClick={() => dispatch({ type: 'pause' })} disabled={!run.started || run.completed} aria-label={run.paused ? 'Devam et' : 'Duraklat'}>{run.paused ? <Play size={15} /> : <Pause size={15} />}<span>{run.paused ? 'Devam et' : 'Duraklat'}</span></button><button onClick={toggleSound} aria-label={sound ? 'Sesi kapat' : 'Sesi aç'} aria-pressed={sound}>{sound ? <Volume2 size={16} /> : <VolumeX size={16} />}<span>Ses {sound ? 'açık' : 'kapalı'}</span></button><button className="reset-btn" title="Yeniden başlat" aria-label="Yeniden başlat" onClick={() => run.started ? setDialog('reset') : reset()}><RotateCcw size={15} /></button></div></section>

            <section className="event-card" aria-label="Olay günlüğü"><div className="panel-title"><span><ClipboardList size={15} /> Olay günlüğü</span><button onClick={() => setDialog('logs')}>Tümü <ArrowUpRight size={13} /></button></div><div className="event-list">{run.logs.length ? run.logs.slice(0, 3).map((entry: { time: number; message: string; kind: string }, i: number) => <div className={`event ${entry.kind}`} key={`${entry.time}-${i}`}><span className="event-marker" /><div><time>{formatTime(entry.time)}</time><p>{entry.message}</p></div></div>) : <><div className="event info"><span className="event-marker" /><div><time>HAZIR</time><p>Hasta monitöre bağlı. Ameliyathane ekibi hazır.</p></div></div><p className="empty-log">Kararlarınız ve hasta tepkileri burada görünecek.</p></>}</div></section>
            <div className="learning-note"><ShieldCheck size={18} /><p><strong>Her karar bir öğrenme fırsatı.</strong><br />Yanlış seçimden sonra yeniden değerlendirin ve hastayı stabilize edin.</p></div>
          </aside>
        </div>
        <footer className="page-footer"><span><span className="dot" /> Kurgusal klinik senaryo <i /> Tanıtım demosu</span><button onClick={() => setDialog('guide')}>Simülasyon rehberi <ArrowUpRight size={12} /></button></footer>
      </main>
    </div>

    {run.completed && showSummary && <div className="summary-backdrop"><section className="summary-card" role="dialog" aria-modal="true" aria-labelledby="summary-title"><button className="close-btn" aria-label="Sonuç panelini kapat" onClick={() => setShowSummary(false)}><X size={18} /></button><div className="summary-medal"><ShieldCheck size={38} /><span className="spark s1" /><span className="spark s2" /><span className="spark s3" /></div><span className="eyebrow">VARDİYA BAŞARIYLA TAMAMLANDI</span><h2 id="summary-title">Bir karar. Bir fark.</h2><p>Hastayı stabilize ettiniz ve bakım devrini tamamladınız.</p><div className="summary-stats"><div><strong>{getScore(run.mistakes)}<small>/100</small></strong><span>Senaryo puanı</span></div><div><strong>{formatTime(run.elapsed)}</strong><span>Toplam süre</span></div><div><strong>{run.mistakes}</strong><span>Hatalı karar</span></div></div><div className="summary-vitals"><span><Heart size={14} /> {Math.round(run.vitals.hr)} bpm</span><span>ETCO₂ {Math.round(run.vitals.co2)} mmHg</span><span><Thermometer size={14} /> {run.vitals.temp.toFixed(1)} °C</span></div><div className="summary-lessons">{stages.map(s => <span key={s.label}><CheckCheck size={17} /> {s.label}</span>)}</div><p className="summary-note">{run.mistakes ? 'Yeniden değerlendirdiniz, uygun müdahaleyi seçtiniz. Bir sonraki vardiyada erken farkındalığınızı geliştirin.' : 'Tüm öncelikleri ilk seferde doğru belirlediniz. Erken farkındalık ve ekip koordinasyonu fark yarattı.'}</p><button className="primary-btn" onClick={reset}><RotateCcw size={16} /> Yeni vardiya başlat</button><button className="summary-secondary" onClick={() => { setShowSummary(false); setDialog('logs'); }}>Kararlarımı incele <ArrowRight size={14} /></button></section></div>}

    <dialog ref={dialogRef} className="info-dialog" onCancel={() => setDialog(null)} onClick={e => { if (e.target === e.currentTarget) setDialog(null); }}>
      <div className="dialog-content"><button className="close-btn" aria-label="Kapat" onClick={() => setDialog(null)}><X size={20} /></button>
        {dialog === 'reset' ? <><div className="dialog-icon"><RotateCcw size={24} /></div><span className="eyebrow">YENİ VARDİYA</span><h2>Simülasyon yeniden başlasın mı?</h2><p>Bu oturumun süresi, kararları ve hasta değerleri sıfırlanacak.</p><div className="dialog-actions"><button className="subtle-btn" onClick={() => setDialog(null)}>Vardiyaya dön</button><button className="primary-btn" onClick={reset}>Yeniden başlat <RotateCcw size={15} /></button></div></>
        : dialog === 'logs' ? <><div className="dialog-icon"><ClipboardList size={24} /></div><span className="eyebrow">OTURUM KAYDI</span><h2>Kararlar ve hasta tepkileri</h2><p>{run.attempts} karar · {run.mistakes} hatalı seçim · {formatTime(run.elapsed)} süre</p><div className="full-logs">{run.logs.length ? [...run.logs].reverse().map((entry, i) => <div className={`event ${entry.kind}`} key={i}><span className="event-marker" /><div><time>{formatTime(entry.time)}</time><p>{entry.message}</p></div></div>) : <div className="empty-state"><Clock3 size={24} /><p>Simülasyonu başlattığınızda olaylar buraya kaydedilir.</p></div>}</div></>
        : dialog === 'guide' ? <><div className="dialog-icon"><BookOpen size={24} /></div><span className="eyebrow">SİMÜLASYON REHBERİ</span><h2>Vardiya sizin kontrolünüzde.</h2><p>Simülasyonu başlatın, hasta monitörünü gözlemleyin ve her aşamada bir karar seçin.</p><div className="guide-steps"><div><span>01</span><p><strong>Gözlemleyin</strong>Fareyle sürükleyerek odayı döndürün, kaydırarak yaklaşın. Hasta, hemşire, monitör ve arabaya tıklayıp bilgi alın.</p></div><div><span>02</span><p><strong>Karar verin</strong>A, B veya C seçeneklerinden birini seçin. Yanlış kararda hasta kötüleşir; alarm ve kırmızı ikaz devreye girer.</p></div><div><span>03</span><p><strong>Yanıtı izleyin</strong>Doğru kararda ekip müdahale eder, değerler düzelir ve bir sonraki aşama otomatik açılır.</p></div></div><div className="shortcuts"><span><kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> Karar seç</span><span><kbd>M</kbd> Ses aç / kapat</span><span><kbd>Space</kbd> Duraklat</span></div><p className="fine-print">Sesler, “Simülasyonu başlat” düğmesine bastıktan sonra etkinleşir. Bu tanıtım demosunda klinik süreçlerin süresi görsel anlatım için hızlandırılmıştır.</p></>
        : dialog === 'case' ? <><div className="dialog-icon"><Stethoscope size={24} /></div><span className="eyebrow">VAKA 01 • AMELİYATHANE</span><h2>Beklenmeyen yükseliş</h2><p>Genel anestezi altındaki kurgusal hastada artan ETCO₂ ve nabza sıcaklık yükselişi eşlik eder. Malign hipertermi şüphesi üzerinden erken farkındalık, ekip iletişimi ve yakın izlem canlandırılır.</p><div className="case-data"><div><span>Hasta</span><strong>Deniz Yılmaz · 42 yaş</strong></div><div><span>Rolünüz</span><strong>Ameliyathane hemşiresi</strong></div><div><span>Karar aşaması</span><strong>3 aşama · Yaklaşık 2–3 dakika</strong></div><div><span>Hedef</span><strong>Fark et → Müdahaleyi destekle → İzle</strong></div></div><p className="fine-print">Kurgusal değerler ve hızlandırılmış yanıtlar oyun demosuna aittir; klinik uygulama protokolü değildir. Tıbbi çerçeve: <a href="https://www.mhaus.org/faqs/how-is-mh-treated/" target="_blank" rel="noreferrer">MHAUS — izlem ve ekip yaklaşımı <ArrowUpRight size={12} /></a>.</p></>
        : dialog && dialog in inspectContent ? (() => { const content = inspectContent[dialog as keyof typeof inspectContent]; return <><div className="dialog-icon">{dialog === 'monitor' ? <Activity size={24} /> : <Stethoscope size={24} />}</div><span className="eyebrow">{content.subtitle}</span><h2>{content.title}</h2><p>{content.body}</p><ul className="inspect-list">{content.items.map(item => <li key={item}><Check size={16} />{item}</li>)}</ul><button className="primary-btn" onClick={() => setDialog(null)}><ArrowLeft size={15} /> Simülasyona dön</button></>; })() : null}
      </div>
    </dialog>
  </div>;
}

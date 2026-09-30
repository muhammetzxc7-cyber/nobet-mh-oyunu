import { Activity, Clock3, FlaskConical, HeartPulse, Hospital, Pill, Syringe, Thermometer, Droplets, ClipboardList } from 'lucide-react';
import './stage-visual.css';

export default function StageVisual({ stage, beat, wrong, complete }: { stage: number; beat: number; wrong: boolean; complete: boolean }) {
  const hr = stage === 4 ? wrong ? 132 : [76, 91, 105, 121][beat] : stage === 7 ? complete ? 96 : wrong ? 132 : 118 : stage === 10 ? 90 : stage >= 5 ? 132 : 78;
  const co2 = stage === 4 ? wrong ? 67 : [35, 42, 49, 58][beat] : stage === 7 ? complete ? 44 : wrong ? 67 : 57 : stage === 10 ? 39 : stage >= 5 ? 67 : 35;
  const temp = stage === 4 ? wrong ? 38.2 : 36.5 + beat * .27 : stage === 10 ? 38 : stage >= 5 ? 38.5 : 36.7;
  return <div className={`stage-visual stage-visual-${stage} ${wrong ? 'stage-wrong' : ''} ${complete ? 'stage-complete' : ''}`} aria-label={`${stage}. durak klinik sahnesi`}>
    <div className="stage-ceiling"><i /><i /><i /></div>
    <div className="stage-wall-label">{stage === 3 ? 'KLİNİK ORTAMLAR' : stage === 10 ? 'KRİTİK BAKIM / DERLENME' : 'AMELİYATHANE 03'}</div>
    {stage === 3 ? <div className="stage-split"><div><Hospital size={25} /><b>AMELİYATHANE</b><small>Volatil anestezi</small><div className="stage-mini-bed"><span>👤</span><i /></div><span>Hasta · anestezi cihazı</span></div><div><Activity size={25} /><b>YOĞUN BAKIM</b><small>İnhalasyon sedasyonu</small><div className="stage-mini-bed icu"><span>👤</span><i /></div><span>Hasta · monitör</span></div><div className="stage-time"><Clock3 size={17} /> AMELİYAT → ERKEN POSTOPERATİF DÖNEM</div></div> : <div className="stage-main-scene"><div className="stage-nurse">👩‍⚕️</div><div className="stage-bed"><span className="stage-patient">👤</span><i /></div><div className="stage-machine"><Activity size={19} /><span>ANESTEZİ CİHAZI</span></div></div>}
    {[4, 7, 10].includes(stage) && <div className="stage-vital-monitor"><span><Activity size={13} /> HASTA MONİTÖRÜ</span><div><b><HeartPulse size={16} /> {hr}</b><b>ETCO₂ {co2}</b><b><Thermometer size={15} /> {temp.toFixed(1)}°C</b></div><div className="stage-wave">〰〰〰⌁〰〰⌁〰〰〰</div></div>}
    {stage === 4 && <div className="stage-timeline"><Clock3 size={16} /><span>{wrong ? '60 SANİYE GEÇTİ' : ['BAŞLANGIÇ', 'KH 91 · ETCO₂ 42', 'KH 105 · ETCO₂ 49', 'KH 121 · ETCO₂ 58 · KAS TONUSU ↑'][beat]}</span></div>}
    {stage === 5 && <div className="stage-cart"><b>🚨 MH ACİL ARABASI</b><span>DANTROLEN · IV · LABORATUVAR</span></div>}
    {stage === 6 && <div className="stage-dose"><div><b>DERYA K.</b><span>68 kg · BİLEKLİK</span></div><div><Syringe size={20} /><b>2,5 mg/kg IV</b></div><strong>68 × 2,5 = {complete ? '170 mg ✓' : '? mg'}</strong><small>Gerçek preparatın ürün bilgisi ayrıca doğrulanır.</small></div>}
    {stage === 7 && <div className="stage-response"><Pill size={18} /><span>DANTROLEN UYGULANDI</span><b>KH 132 → 118</b><b>ETCO₂ 67 → 57</b><small>Kas rijiditesi sürüyor</small></div>}
    {stage === 8 && <div className="stage-lab"><div><FlaskConical size={18} /> CK 9.800 ↑</div><div>Miyoglobin ↑</div><div>K⁺ 6,2 ↑</div><div>pH 7,18 ↓</div><div className="stage-bag">🩸 İDRAR: KOYU KAHVERENGİ</div></div>}
    {stage === 9 && <div className="stage-urine"><Droplets size={23} /><b>SAATLİK İDRAR TAKİBİ</b><span>Hasta 68 kg · hedef ≥2 mL/kg/saat</span><strong>{complete ? '136 mL/saat ✓' : '? mL/saat'}</strong><small>Ölçüm çizelgesi</small></div>}
    {stage === 10 && <div className="stage-recovery"><ClipboardList size={20} /><span>{complete ? 'KRİZ KONTROL ALTINDA' : 'KRİTİK BAKIM İZLEMİ'}</span><b><Clock3 size={17} /> EN AZ 24 SAAT</b></div>}
    {complete && stage === 3 && <div className="stage-action-note">İki ortamda da tetikleyici maruziyetine dikkat!</div>}
    {complete && stage === 4 && <div className="stage-action-note">👩‍⚕️ Anestezi ekibi hemen bilgilendirildi</div>}
    {complete && stage === 7 && <div className="stage-action-note">👩‍⚕️ MH arabasında tekrar doz hazırlığı</div>}
    {complete && stage === 8 && <div className="stage-action-note">Kas hasarı → miyoglobin → böbrek izlemi</div>}
    {complete && stage === 9 && <div className="stage-action-note">✓ 136 mL/saat takip çizelgesine kaydedildi</div>}
    {wrong && <div className="stage-alarm" role="alert">🚨 {stage === 4 ? 'HASTANIN DURUMU KÖTÜLEŞİYOR' : 'YANLIŞ KARAR · ÇIKMAZ YOL'}</div>}
    {complete && <div className="stage-success">✓ DOĞRU KARAR · YOL AÇILDI</div>}
  </div>;
}

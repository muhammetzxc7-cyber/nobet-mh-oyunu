import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, QrCode, Wifi } from 'lucide-react';
import { request } from './api';
export default function SharePanel() {
  const [url, setUrl] = useState(''); const [qr, setQr] = useState(''); const [local, setLocal] = useState(false); const [error, setError] = useState(''); const [copied, setCopied] = useState(false);
  useEffect(() => { request<{ url: string; local: boolean }>('/share').then(data => { setUrl(data.url); setLocal(data.local); }).catch(e => setError(e.message)); }, []);
  useEffect(() => { if (url) QRCode.toDataURL(url, { width: 720, margin: 3, color: { dark: '#234a3d', light: '#ffffff' }, errorCorrectionLevel: 'M' }).then(setQr).catch(() => setError('QR kodu oluşturulamadı.')); }, [url]);
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); } catch { setError('Bağlantıyı aşağıdaki kutudan seçip kopyalayabilirsin.'); } };
  return <div className="share-panel"><span className="eyebrow"><QrCode size={15} /> OYUNA DAVET</span><h2>Bir tarama ile<br />yolculuk başlasın.</h2><p>Hemşireler bu QR kodu okuttuğunda rumuz ve labirent ekranı açılır.</p>{qr && <a href={url} className="qr-image" target="_blank" rel="noreferrer"><img src={qr} alt="Klinik labirent oyununu açan QR kod" /></a>}{local && <div className="inline-note"><Wifi size={17} /><span>Bu adres aynı Wi-Fi / yerel ağ içindir. Bilgisayar ve sunucu açık olmalı. İnternet üzerinden paylaşım için kalıcı sunucu yayını gerekir.</span></div>}<label className="field-label" htmlFor="share-link">Oyun bağlantısı</label><input id="share-link" value={url} readOnly onFocus={e => e.target.select()} /><div className="share-actions"><button className="button secondary" disabled={!url} onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? 'Kopyalandı' : 'Bağlantıyı kopyala'}</button>{qr && <a className="button primary" href={qr} download="nobet-klinik-labirent-qr.png"><Download size={16} /> QR indir</a>}</div>{error && <p className="form-error" role="alert">{error}</p>}</div>;
}

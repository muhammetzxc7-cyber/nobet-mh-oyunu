export const BASELINE = { hr: 108, co2: 52, temp: 37.6, spo2: 98, systolic: 128, diastolic: 78, rr: 18 };
export const STABLE = { hr: 82, co2: 38, temp: 37.2, spo2: 99, systolic: 118, diastolic: 74, rr: 14 };

export const stages = [
  {
    label: 'Fark et', title: 'Monitör size ne söylüyor?', tag: 'ERKEN FARKINDALIK',
    description: 'Genel anestezi sırasında ETCO₂ ve nabız yükseliyor. Hemşire olarak ilk önceliğiniz ne olmalı?',
    observation: 'ETCO₂ yükseliyor. Hastayı ve solunum devresini birlikte değerlendirelim.',
    vitals: BASELINE, recovered: { ...BASELINE, hr: 96, co2: 44, temp: 37.5 },
    options: [
      { id: 'observe', text: 'Bir süre daha gözlemle', detail: 'Müdahale etmeden trendi izle.', correct: false, feedback: 'Bildirim gecikti. ETCO₂ ve nabız artıyor; hastanın solunumu hızlandı.' },
      { id: 'escalate', text: 'Anestezi ekibini bilgilendir', detail: 'Hasta ve solunum devresinin değerlendirilmesini başlat.', correct: true, feedback: 'Erken bildirim yapıldı. Anestezi ekibi değerlendirmeye başladı; ilk destekle değerler geriliyor.' },
      { id: 'silence', text: 'Alarmı kapat ve devam et', detail: 'Uyarıyı geçici bir değişim olarak değerlendir.', correct: false, feedback: 'Alarmın nedenine müdahale edilmedi. Yükselen ETCO₂ ve nabızla hastanın durumu kötüleşiyor.' },
    ],
  },
  {
    label: 'Müdahale et', title: 'Ekip müdahalesini destekleyin', tag: 'KOORDİNELİ MÜDAHALE',
    description: 'İlk yanıt geçici kaldı. Sıcaklık da yükseliyor; ekip malign hipertermi şüphesini değerlendiriyor. Nasıl destek olursunuz?',
    observation: 'Sıcaklık yükseliyor. Acil müdahale ekipmanını hazırlamalıyız.',
    vitals: { hr: 124, co2: 60, temp: 39.1, spo2: 97, systolic: 140, diastolic: 86, rr: 24 },
    recovered: { hr: 94, co2: 43, temp: 38.2, spo2: 99, systolic: 124, diastolic: 76, rr: 17 },
    options: [
      { id: 'prepare', text: 'Acil müdahale hazırlığını başlat', detail: 'Ekip yönlendirmesiyle protokol ve soğutma ekipmanını hazırla.', correct: true, feedback: 'Acil ekipman hazır. Anestezi ekibinin protokol kapsamındaki tedavisiyle ETCO₂, nabız ve sıcaklık düşmeye başladı.' },
      { id: 'warm', text: 'Aktif ısıtmayı artır', detail: 'Isı değişimini ısıtıcı battaniyeyle dengele.', correct: false, feedback: 'Ek ısı yükü tabloyu ağırlaştırdı. Sıcaklık ve nabız daha da yükseldi; acil destek gerekiyor.' },
      { id: 'wait', text: 'Rutin bakım sırasını bekle', detail: 'Ekipman hazırlığını sonraki kontrole bırak.', correct: false, feedback: 'Acil hazırlık gecikti. Yükselen sıcaklığa ETCO₂ artışı ve taşikardi eşlik ediyor.' },
    ],
  },
  {
    label: 'Stabilize et', title: 'İyileşmeyi güvenceye alın', tag: 'YAKIN İZLEM',
    description: 'Tedaviye yanıt alınıyor. Değerler düşüş eğiliminde. Bakımın devamında hangi yaklaşımı seçersiniz?',
    observation: 'Değerler düzeliyor. Yakın izleme ve eksiksiz bir devre devam edelim.',
    vitals: { hr: 96, co2: 44, temp: 38.1, spo2: 99, systolic: 124, diastolic: 76, rr: 17 },
    recovered: STABLE,
    options: [
      { id: 'disconnect', text: 'Monitörizasyonu sonlandır', detail: 'İlk iyileşmeyi yeterli kabul et.', correct: false, feedback: 'İzlem erken bırakıldı. Yeniden yükselen değerler geç fark edildi; yakın takip hâlâ gerekli.' },
      { id: 'leave', text: 'Hastayı gözetimsiz bırak', detail: 'Devir yapmadan rutin işlere dön.', correct: false, feedback: 'Gözetim kesildi. Tekrar kötüleşen hasta değerleri acil yeniden değerlendirme gerektiriyor.' },
      { id: 'monitor', text: 'Yakın izlemi ve devri sürdür', detail: 'Trendleri kaydet; ekiple planlanan izlem ve devri tamamla.', correct: true, feedback: 'Yakın izlem sürdürüldü, değişimler kaydedildi ve devir tamamlandı. Hasta simülasyonda stabil.' },
    ],
  },
];

export function deteriorate(vitals, count = 1) {
  return {
    hr: Math.min(168, vitals.hr + 22 + count * 3),
    co2: Math.min(85, vitals.co2 + 12 + count * 2),
    temp: Math.min(40.8, vitals.temp + 0.6 + count * 0.1),
    spo2: Math.max(92, vitals.spo2 - 1),
    systolic: Math.min(170, vitals.systolic + 15), diastolic: Math.min(102, vitals.diastolic + 8),
    rr: Math.min(34, vitals.rr + 6),
  };
}

export function interpolateVitals(current, target, dt) {
  const amount = 1 - Math.exp(-dt * 1.05);
  return Object.fromEntries(Object.entries(current).map(([key, val]) => [key, val + (target[key] - val) * amount]));
}

export function getSeverity(vitals, critical, completed) {
  if (completed) return 'stable';
  if (critical || vitals.hr > 135 || vitals.co2 > 65 || vitals.temp >= 39.5) return 'critical';
  if (vitals.hr > 100 || vitals.co2 > 45 || vitals.temp > 38) return 'warning';
  return 'stable';
}

export function getScore(mistakes) { return Math.max(25, 100 - mistakes * 15); }

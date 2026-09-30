# Arşiv — Eski üç aşamalı kriz demosu

Bu belge ilk demoya aittir. Güncel müşteri kapsamı için kökteki README.md dosyasını okuyun.

Tarayıcıda çalışan, Türkçe arayüzlü ve gerçek zamanlı 3B ameliyathane demosu. React, TypeScript, Three.js ve Web Audio kullanır. Model, doku ve sesler uygulama içinde üretilir; harici 3B dosyaya veya ücretli servise ihtiyaç duymaz.

## Çalıştırma

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini açın. **Simülasyonu başlat** düğmesi hasta senaryosunu ve sesi etkinleştirir.

```bash
npm run build
npm run preview
npm test
```

Tarayıcı doğrulaması: `npx playwright install chromium` ardından `node tests/browser-check.mjs`. Görseller `test-results/` altına yazılır.

## Demo kapsamı

- Gerçek zamanlı 3B ameliyathane: hareketli hemşire, solunum yapan hasta, yatak ve korkulukları, cerrahi lamba, canlı monitör, ventilatör, serum askısı, sıvı damlası, infüzyon pompası, medikal gaz paneli, sarf dolabı ve acil müdahale arabası.
- EKG, kapnografi ve pletismografi dalgaları; ETCO₂, nabız, sıcaklık, SpO₂, kan basıncı ve solunum sayısı. Odadaki monitör ve arayüz aynı hasta durumundan beslenir.
- Üç karar aşaması: değişimi fark etme, ekip müdahalesini destekleme, yakın izlem ve bakım devri.
- Hatalı kararda artan ETCO₂/nabız/sıcaklık, hızlanan solunum, titreme, ciltte kızarma, kırmızı ışık ve ekran uyarısı, sesli alarm. Yanlış karar aşamayı atlatmaz; kullanıcı yeniden seçim yapar.
- Doğru kararda hemşirenin müdahale animasyonu ve değerlerin kademeli düzelmesi; 6,5 saniyelik hızlandırılmış yanıt sonrası otomatik sonraki aşama.
- Tamamlama paneli, puan, süre, hata sayısı, olay günlüğü ve sıfırlama.
- Duraklatma/devam, ses açma/kapatma, üç kamera açısı, sürükleyerek döndürme, kaydırarak yaklaşma, tam ekran ve sahne nesnelerini inceleme.
- Mobil uyum, klavye ile 1/2/3 karar seçimi, M ile ses, sayfa gövdesi odaktayken boşluk ile duraklatma.

## Klinik çerçeve

Senaryo kurgusaldır. Malign hipertermi şüphesinde yükselen ETCO₂/nabız/sıcaklık, ekip koordinasyonu ve kesintisiz izlem temalarını kullanır. Hastanın birkaç saniye içindeki yanıtları tanıtım için hızlandırılmıştır; klinik uygulama protokolü veya doğrulanmış eğitim ürünü değildir. İlaç/doz öğretimi içermez. Gerçek eğitim kullanımı için klinik uzman incelemesi gerekir.

Çerçeve kaynakları:
- [MHAUS — How Is MH Treated?](https://www.mhaus.org/faqs/how-is-mh-treated/)
- [GeneReviews — Malign hipertermi klinik değerlendirme ölçütleri](https://www.ncbi.nlm.nih.gov/books/NBK1146/table/mhs.T.criteria_used_in_the_clinical_grad/)

## Yapı

- `src/HospitalScene.tsx`: modeller, ışıklar, kamera, animasyonlar ve fiziksel monitör ekranı.
- `src/simulation.mjs`: kararlar, geri bildirim, duraklatma, süre ve geçişler.
- `src/scenario.mjs`: üç aşama, seçenekler, hedef hasta değerleri.
- `src/audio.ts`: nabız sesi ve çok tonlu kritik alarm.
- `src/App.tsx`, `src/styles.css`: arayüz, kontroller, sonuç ve bilgi panelleri.

Modern, WebGL destekli bir tarayıcı gerekir. Ses otomatik oynatma kuralları nedeniyle ilk kullanıcı etkileşiminden sonra başlar. Oturumlar bellekte tutulur; yenilemede sıfırlanır. Arayüz yazı tipleri Google Fonts üzerinden yüklenir; bağlantı yoksa sistem yazı tipine geçilir.

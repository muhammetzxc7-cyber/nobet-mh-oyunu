# Güncel yayın: ücretsiz Render + Turso

Oyun: https://nobet-mh-oyunu.onrender.com/?view=auto
Eğitmen: https://nobet-mh-oyunu.onrender.com/#egitmen

Telefonlarda mobil, bilgisayarlarda bilgisayar görünümü otomatik açılır. Görünüm menüsü elle seçim ve otomatiğe dönüş sağlar. QR bağlantısı her katılımcıda cihaz seçimini otomatik başlatır.

Render servisi Free planındadır; ücretli disk kullanılmaz. Katılımcı ilerlemesi, puanlar ve olaylar TURSO_DATABASE_URL / TURSO_AUTH_TOKEN ile ayrı Turso veritabanında saklanır. ADMIN_PASSWORD sunucu ortamında sabit tutulur. Anahtarları kaynak koduna veya katılımcılara vermeyin. Render üzerinde Turso ayarı yoksa uygulama veri kaybını önlemek için başlatılmaz.

Ücretsiz Render kullanılmayınca uyur; sonraki ilk açılış bekletebilir. Ücretsiz kota ve sağlayıcı koşulları geçerlidir. Sabit adres bilgisayardan bağımsızdır; hizmet hesabı ve ücretsiz servisler korunmalıdır. Ücretli özellik açılmamıştır.

Kontroller: npm run build, npm test. tests/cloud-storage.test.mjs hem yerel SQLite hem libSQL adaptöründe on durağı, eşzamanlı cevap korumasını, yeniden başlatmada kayıtları, eğitmen erişimini ve CSV çıktısını doğrular. LibSQL adaptör testi yerel libSQL dosyasıyla çalışır; gerçek Turso bağlantısı yayın doğrulamasında ayrıca sınanır.

Aşağıdaki eski teslim notları önceki sürümün tarihsel açıklamasıdır. Yayın, kalıcı disk ve geçici bağlantı bilgileri için yukarıdaki güncel kurulum geçerlidir.

---

# Nöbet — Klinik Labirent

Hemşireler için malign hipertermi eğitimi oyunu. Derya K. vakası başlangıçtan 10. durağın sonuna kadar oynanır; labirent kapıları klinik görevlerle açılır. İlaç sulandırma sayıları kullanılacak gerçek preparat kesinleşince ürün bilgisine göre eklenmelidir.

## Çalıştırma

Node.js 24 veya üstü gerekir (`node:sqlite` kullanılır).

```bash
npm install
npm run dev
```

- Oyun: **http://localhost:5173**
- Eğitmen: **http://localhost:5173/#egitmen**
- Eğitmen giriş kodu: **`.data/egitmen-giris.txt`**

İlk sunucu açılışında rastgele giriş kodu oluşturulur. `ADMIN_PASSWORD` ortam değişkeni varsa o değer kullanılır. Bu dosya katılımcılarla paylaşılmaz; Git ve Docker kapsamı dışındadır.

`npm run dev` web uygulamasını ve kayıt sunucusunu birlikte başlatır. Yalnız Vite/statik dosya sunmak katılımcı ve puan kayıtlarını çalıştırmaz.

## Katılımcı akışı

1. QR veya bağlantı → 10 duraklı labirent + rumuz.
2. Rumuzla kayıt → Derya K.’nın hasta dosyası ve görüşme notu.
3. Dosyayı incelediğini işaretle → **AMELİYATHANEYE GİR**.
4. 3B sahnede üç gözlem: hasta, monitör, aile öyküsü. Kendiliğinden ilerleme veya **Sonraki gözlem**.
5. Karar noktası 1 → üç seçenek; ilk yanlış kararda soruya özgü ipucu kendiliğinden açılır.
6. A/C → ayrı öğretici açıklama; **TEKRAR DEĞERLENDİR** ile tekrar seçim.
7. B → doğru karar, kazanılan puan ve Öğrenme Kartı 1.
8. **ÖĞRENDİM — DEVAM ET** → ilk durak tamamlanır ve 2. durak geçişi açılır.
9. Durak 2 → ilaç masasını gör, üç seçenekten tetikleyici ajanları seç.
10. Durak 3–10 → her durakta konuya özgü animasyonlu sahne, üç şıklı klinik karar, ilk yanlışta otomatik ipucu, doğru cevapta kısa bilgi ve labirent kapısı.
11. Sonuç ekranı → 100 puanlık performans, süre, yanlış karar, ipucu ve önerilen tekrar durağı.

Hasta bilgileri, aile öyküsü alıntısı, soru, seçenekler, ipuçları, yanlış açıklamaları ve öğrenme kartı `src/clinical-case.mjs` içinde müşterinin metniyle tutulur.

## Puanlama

| Doğru karara ulaşma şekli | Puan |
|---|---:|
| İlk deneme, ipucusuz | 10 |
| Eski oturumda yanlış olmadan açılmış ipucuyla | 8 |
| Bir yanlış sonrası | 6 |
| İki yanlış sonrası | 4 |

Yanlış varsa 6/4 kuralı önceliklidir; ipucu ek ceza getirmez. Birden fazla ipucu ek puan düşürmez. Değerlendirilmiş yanlış seçenek tekrar puan kaybettiremez. Tamamlanmış yanıt tekrar gönderilerek ek puan kazanılamaz. Doğru yanıt ve öğrenme kartı tamamlanmadan sonraki durağa geçilmez.

## Eğitmen paneli

- Rumuz, 10 durak ilerlemesi, 100 üzerinden puan, deneme, yanlış, ipucu ve süre.
- Katılımcı detayında 10 ayrı durak puanı ve zaman damgalı karar geçmişi.
- Rumuz araması, tamamlanma filtresi, elle/15 saniyede bir yenileme.
- Katılımcı başına zaman damgalı karar ve ipucu geçmişi.
- Türkçe karakter destekli CSV indirme.
- HTTP-only çerezle eğitmen erişimi; katılımcılar için özel erişim tokeni.
- Puanlar sunucuda hesaplanır; SQLite veritabanında kalıcı saklanır.

Müşteriyle paylaşılacak panel bağlantısı ve giriş kodu `.data/musteri-egitmen-paylasim.txt` dosyasında tutulur. Bu dosya Git kapsamı dışındadır. Eğitmen panelinin doğrudan yolu `/#egitmen` şeklindedir; oyun bağlantısı ayrı paylaşılır.

Veritabanı `.data/nobet.sqlite` içindedir. Tarayıcı ve sunucu yeniden başlatmalarında kayıtlar korunur. Tarayıcı yalnız oturum kimliği ve erişim anahtarı tutar. Aynı tarayıcıda yenileme kayıtlı aşamaya döner. Başka cihazdan devam/hesap kurtarma bu prototipte yoktur. Rumuzlar benzersizdir.

## QR ve yayın

**QR ile katıl** ve **Katılımcı davet et**, oyun girişine QR üretir. QR görseline tıklanabilir, PNG indirilebilir ve bağlantı kopyalanabilir.

Geliştirmede QR, bulunabiliyorsa bilgisayarın yerel ağ IP’sini kullanır. Öğrencinin aynı ağda olması, sunucunun açık olması ve güvenlik duvarının ilgili porta izin vermesi gerekir. Ağ keşfi otomatik bağlantı garantisi değildir.

İnternet paylaşımı için uygulama **kalıcı diskli bir Node.js sunucusuna** yayınlanmalıdır. Yalnız `dist` klasörünü statik Vercel yayınına yüklemek puanları çalıştırmaz. Önceki 60 dakikalık geçici Vercel bağlantısı bu sürümün yayın adresi değildir.

Üretimde `.env.example` örneğindeki `PUBLIC_URL`, `ADMIN_PASSWORD`, `DATA_DIR`, `PORT` değerlerini ayarlayın. `PUBLIC_URL` gerçek HTTPS oyun adresidir. `DATA_DIR` kalıcı diskte olmalıdır. Yedekleme SQLite veritabanı ve WAL dosyalarını tutarlı biçimde kapsamalıdır.

```bash
npm run build
npm start
```

Üretim sunucusu varsayılan `http://localhost:3001` adresinde uygulamayı ve API’yi birlikte sunar. `npm run preview` API’ye vekillik yapar; kayıt sunucusu ayrıca açık olmalıdır.

Docker için `Dockerfile` ve `compose.yaml` sağlanmıştır. `/data` yoluna kalıcı volume bağlanmalı; gerçek `PUBLIC_URL` ve güçlü `ADMIN_PASSWORD` verilmelidir. Render üzerinde kalıcı yayın için `render.yaml` eklidir; Blueprint kurulumu sırasında `ADMIN_PASSWORD` ve `PUBLIC_URL` girilir. Konteyner tanımı teslim edilmiştir; bu ortamda Docker çalıştırma testi yapılmamıştır. Müşteri devri ve bilinen sınırlar için `TESLIM.md` dosyasına bakın.

## Klinik sahne

Derya K. henüz anestezi indüksiyonu öncesindedir. Hasta uyanık, ventilatör beklemede ve hasta değerleri normal aralıkta hafif değişkendir. ETCO₂ ölçümü başlamadığı için hem fiziksel monitörde hem arayüzde `— / Ölçüm başlatılmadı` gösterilir. Bu soruda hatalı bir yorum otomatik MH krizi üretmez; geri bildirim aile öyküsünün değerlendirilmesine odaklanır.

Sahnede hemşire, hasta yatağı, monitör, cerrahi lamba, ventilatör, serum askısı, pompa ve ekipmanlar bulunur. Kamera döndürme/yakınlaştırma, üç kamera açısı, duraklatma ve isteğe bağlı monitör sesi çalışır. WebGL destekli tarayıcı gerekir.

## Doğrulama

```bash
npm run build
npm test
npx playwright install chromium
npm run test:browser
```

Tarayıcı testleri derlenmiş sürümü ayrı sunucu/veritabanıyla açar; gerçek eğitmen listesine test katılımcısı eklemez. Dört puan yolu, ayrı yanlış açıklamaları, yenileme, yetkilendirme, QR çözümleme, CSV, sunucu yeniden başlatma ve mobil oynanış kontrol edilir. Görseller `test-results/learning/` içindedir.

`npm run dev` açıkken `npm run test:dev`, geliştirme adresinden rumuz ve eğitmen giriş isteklerinin API tarafından kabul edildiğini doğrular. Bu test geçersiz kısa rumuz gönderir; gerçek katılımcı oluşturmaz. Ayrıca farklı bir internet kaynağından gelen isteğin engellendiğini denetler.

## Dosyalar

- `src/LearningApp.tsx`: güncel katılımcı ekranları ve akış.
- `src/Maze.tsx`: 10 duraklı ilerleme görselleştirmesi.
- `src/clinical-case.mjs`: müşterinin metinleri.
- `src/Educator.tsx`: eğitmen paneli.
- `src/SharePanel.tsx`: QR ve paylaşım.
- `src/HospitalScene.tsx`: gerçek zamanlı 3B sahne, preoperatif mod.
- `server/index.mjs`: erişim kontrollü API, kayıtlar, CSV.
- `server/course.mjs`: puanlama ve deneme kuralları.
- `docs/TASARIM-VE-AKIS.md`: ekranlar, renkler ve etkileşim kararları.

Eski kriz demosunun `src/App.tsx`, `src/scenario.mjs`, `src/simulation.mjs`, `src/styles.css` ve testleri referans olarak korunur; güncel giriş noktası bu ekranları çalıştırmaz. Eski belgeleme `docs/ESKI-DEMO.md` içindedir.

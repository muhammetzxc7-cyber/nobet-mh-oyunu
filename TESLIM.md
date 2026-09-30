# Nobet MH Oyunu - Nihai Teslim

Bu paket, Derya K. vakasi uzerinden ilerleyen 10 durakli malign hipertermi klinik karar oyununu ve egitmen panelini icerir.

## Mueşteriye Gonderilecek Linkler

Gecici inceleme linki:

- Oyun: `https://partner-assistant-studying-pockets.trycloudflare.com/`
- Egitmen paneli: `https://partner-assistant-studying-pockets.trycloudflare.com/#egitmen`
- Egitmen giris kodu: `teslim/EGITMEN-GIRISI-GIZLI.txt`

Bu linkler demo bilgisayari ve Cloudflare tuneli acik kaldigi surece calisir. Mueşterinin surekli kullanacagi son link icin uygulama Render/Railway/VPS gibi Node.js ve kalici disk destekleyen bir hesaba yayinlanmalidir.

## Teslim Paketi

- `teslim/nobet-musteri-teslim-FINAL.zip`
  Kaynak kod, build dosyalari, sunucu, Docker, Render Blueprint, testler ve dokumanlar.
- `teslim/EGITMEN-GIRISI-GIZLI.txt`
  Gecici panel linki ve egitmen giris kodu. Bunu yalnizca egitmene gonderin.
- `README.md`
  Teknik calistirma ve gelistirme notlari.
- `render.yaml`
  Render hesabinda kalici yayin icin hazir altyapi dosyasi.
- `compose.yaml`
  Docker ile VPS veya baska bir sunucuda calistirma dosyasi.

## Uygulamada Tamamlananlar

- 10 durakli tek hasta vakasi.
- Mobil oncelikli gorunum.
- Her durakta sahne, soru, 3 secenek, ilk yanlista otomatik ipucu, dogru cevapta kisa bilgi.
- Labirentte hemsire hareketi, dogru kararda yeni yol/kapi acilmasi, yanlis kararda cikmaz yol hissi.
- Duraklara uygun gorsel sahneler: anamnez, anestezi hazirligi, ameliyathane/yogun bakim ayrimi, monitor alarmi, MH arabasi, dantrolen dozu, tedavi yaniti, laboratuvar/idrar, organ izlemi, kritik bakim.
- Durak 4'te KH, ETCO2 ve sicaklik animasyonla degisir; yanlis cevapta alarm, kirmizi uyari ve kotulesen monitor degerleri gosterilir.
- 100 puanlik skor sistemi, yanlis sayisi, ipucu sayisi, sure ve tekrar onerisi.
- Egitmen paneli: katilimci ilerlemesi, puanlar, yanlislar, ipuclari, sure, karar gecmisi ve CSV indirme.
- Sunucu tarafinda SQLite kayit sistemi.

## Kalici Yayin Secenekleri

### En kolay yol: Render

1. Zip dosyasini GitHub reposuna yukleyin veya repo olarak aktarın.
2. Render Dashboard'da "New Blueprint" secip bu repoyu baglayin.
3. Render `render.yaml` dosyasini okuyacak.
4. `ADMIN_PASSWORD` icin egitmene verilecek guclu bir kod girin.
5. `PUBLIC_URL` icin Render'in verdigi HTTPS adresini girin. Ilk deploydan sonra adres netlesirse bu degeri guncelleyip tekrar deploy edin.
6. Deploy tamamlaninca `/api/health`, oyun linki ve `/#egitmen` panelini kontrol edin.

### Docker/VPS yolu

Sunucuda:

```bash
PUBLIC_URL=https://oyun.ornek.com ADMIN_PASSWORD=guclu-bir-egitmen-kodu docker compose up -d --build
```

Uygulama 3001 portunda calisir. HTTPS ve alan adi icin Nginx/Caddy/Cloudflare gibi bir ters vekil kullanin. SQLite verisi Docker volume icinde kalir.

## Klinik Not

Bu urun egitim simulasyonudur. Dantrolen dozu senaryoda 68 kg x 2,5 mg/kg = 170 mg olarak hesaplanir. Dantrolen flakon tipi ve sulandirma hacmi kurumun kullanacagi gercek preparat kesinlesince sabitlenmelidir. Bu nedenle ilac sulandirma ekrani urun bilgisi olmadan kesin doz/hacim ogretmez.

Klinik icerik yayina alinmadan once kurumun anestezi/egitim sorumlusu tarafindan kontrol edilmelidir. MH kriz yonetimi icin MHAUS ve EMHG yaklasimlari temel alinmistir:

- https://www.mhaus.org/healthcare-professionals/managing-a-crisis/
- https://www.emhg.org/recommendations-1/mh-crisis-management

## Yapilan Kontroller

- `npm run build`: basarili.
- `npm test`: basarili.
- 320 px mobil akista durak gecisi, ipucu ve yatay tasma kontrolu: basarili.
- 390 px mobilde monitor kotulesme/dogru karar akisi: basarili.
- Egitmen paneli, giris, CSV ve cikis testi: basarili.
- Gecici Cloudflare linkinde `/api/health`: basarili.

## WhatsApp Mesaji

Merhaba, hemşirelik eğitim oyununun 10 duraklı mobil demosunu ve eğitmen panelini teslim ediyoruz.

Oyun linki:
https://partner-assistant-studying-pockets.trycloudflare.com/

Eğitmen paneli:
https://partner-assistant-studying-pockets.trycloudflare.com/#egitmen

Eğitmen giriş kodunu ayrı mesaj olarak iletiyoruz.

Bu sürümde Derya K. vakası baştan sona oynanabiliyor; her durakta sahne, 3 seçenekli karar, yanlışta ipucu, doğru cevapta kısa bilgi, puanlama ve eğitmen panelinde kayıt takibi var. Mobil kullanım için düzenlendi.

Kalıcı kullanım için uygulama size ait hosting hesabına taşınacak şekilde Docker ve Render dosyalarıyla birlikte teslim edildi.

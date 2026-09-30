# Nöbet · Giriş ve 1. Durak

## Görsel yaklaşım

Sade klinik öğrenme ortamı. Kırık beyaz zemin, koyu orman yeşili başlıklar, yumuşak adaçayı labirenti. Manrope başlıklar, DM Sans açıklamalar. Hasta öyküsü ve yanlış açıklamaları sıcak krem/kehribar kutularla ayrılır. Ana klinik metinler 13–15 px; başlıklar ekrana göre 30–56 px. Ana etkileşimler klavye ve dokunmayla kullanılabilir.

| Rol | Renk |
|---|---|
| Zemin | `#f6f7f2` |
| Kart | `#fffefb` |
| Ana metin | `#23483b` |
| Ana eylem | `#285b46` |
| Labirent zemini | `#eaf0e1` |
| Labirent duvarları | `#c7d8c5` |
| Öğretici uyarı | `#f7f3e6` / `#756239` |

## 1 — Karşılama ve rumuz

Masaüstünde solda davet ve rumuz kartı, sağda 10 düğümlü labirent. İlk durak koyu yeşildir; kalanlar kilitlidir. Labirent öğrenme ilerlemesini gösterir. Mobilde önce kompakt labirent, ardından rumuz bölümü görünür.

Rumuz 3–24 karakterdir; gerçek isim istenmez. Eğitmenin sonuçları bu rumuzla izleyeceği belirtilir. Benzersiz rumuzla kayıt bir katılımcı oturumu oluşturur.

## 2 — Hasta dosyası

“Hastayı tanı. Öyküyü dinle.” Hasta kartında Derya K.’nın tüm bilgileri ve müşterinin aile öyküsü alıntısı eksiksizdir. Görüşme notu sıcak krem kutudadır. “Dosyayı inceledim” işaretlenince “AMELİYATHANEYE GİR” belirir.

## 3 — Ameliyathane ve gözlemler

Labirent yerini gerçek zamanlı 3B odaya bırakır. Hasta, hemşire, yatak ve ekipmanlar görünür. Altta aynı veriyi gösteren canlı izlem paneli bulunur. Anestezi öncesinde normal aralıkta hafif değişken nabız/SpO₂, 36,7 °C ve henüz ölçülmeyen ETCO₂ gösterilir.

Gözlemler sırayla görünür: hastayı karşıla, monitörü gözlemle, aile öyküsünü hatırla. Her adım 5,5 saniye sonra ilerler; kullanıcı düğmeyle kendi hızını da belirleyebilir. Duraklatma sahneyi, değerleri ve süreyi dondurur. Son gözlemden karar noktasına geçilir.

## 4 — Karar noktası 1

Başlık ve A/B/C metinleri müşteri kaynağıyla aynıdır. Her seçenekte isteğe bağlı ipucu vardır. İpucu açılmadan puan etkisi belirtilir. Hasta dosyası tekrar incelenebilir.

A ve C farklı öğretici modallar açar. “TEKRAR DEĞERLENDİR” soruya döner; görülen yanlış seçenek pasifleşir. Oyuncu elenmez. Tetikleyici ajan verilmemiş hastada yanlış yorum nedeniyle yapay kriz başlatılmaz.

## 5 — Doğru karar ve öğrenme kartı

B seçilince “DOĞRU KARAR”, müşterinin olumlu cümlesi ve kazanılan puan görünür. Aynı ekranda Öğrenme Kartı 1 açılır. Tanım, ikinci paragraf ve “AKLINDA TUT” cümlesi aynen sunulur. “ÖĞRENDİM — DEVAM ET” kartı tamamlar.

## 6 — Labirent / 2. durak geçişi

Durak 1 onay işareti alır; 2. durak çerçevelenerek geçişe açılır. Puan, deneme ve ipucu özeti gösterilir. “2. basamağa geç”, sonraki içeriğin henüz hazırlanmadığını açıklayan paneli açar. 2–10. duraklara soru eklenmemiştir.

## 7 — Eğitmen görünümü

Giriş koduyla açılan tabloda katılımcılar birlikte görünür. Rumuz, durum, puan, deneme, yanlış, ipucu ve zamanlar izlenir. “İncele” olay geçmişini açar. Arama, durum filtresi, yenileme ve CSV çalışır. Test katılımcıları gerçek tabloya eklenmez.

## 8 — QR daveti

Standart QR oyun URL’sini açar. Görsele tıklanabilir, PNG indirilebilir ve bağlantı kopyalanabilir. Üretimde `PUBLIC_URL` kullanılır; geliştirmede yerel ağ gerekliliği açıklanır.

## Puan ve kalıcılık

10: ilk deneme, ipucusuz. 8: yanlış olmadan ipucu. 6: bir yanlış sonrası doğru. 4: iki yanlış sonrası doğru. Yanlış ve ipucu birlikteyse 6/4 önceliklidir; bu karar arayüzde açıklanır.

Sunucu puanı hesaplar. Tarayıcı yalnız oturum anahtarı taşır. Sunucu yeniden başlasa da SQLite kayıtları korunur. Eğitmen erişimi ve katılımcı erişimi ayrıdır.

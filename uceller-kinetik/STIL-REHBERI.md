# Üçeller – Onaylı video stili ("5 Hata" v2)

Kullanıcı bu tarzı "tam istediğim animasyon" diye onayladı. Yeni videolar aynı çizgide yapılacak.

## Stil kuralları
- 9:16, 1080×1920, 30 fps, 35–40 sn. Hook ilk 3 saniyede.
- Düz yazı yetmez: her sahnede ikon/illüstrasyon, parçacık, parlama (glow) ve renk olmalı.
- Her sahnede **parlak turuncu imleç noktası** (kuyruklu), tıklamada halka dalgası; sahne geçişleri noktanın olduğu yerden açılan daire.
- Yanlış cümlenin üstünü imleç çizer (kırmızı çizgi), ardından beyaz "DOĞRUSU" kartı.
- Her bölüm kendi renginde: turuncu, mavi, yeşil, sarı, mor (koyu zemin, renkli ışık geçişleri).
- Marka: Üçeller Nakliyat, turuncu (253,125,14) + yeşil (5,143,57). Logo yalnızca kapanışta, beyaz kart içinde.
- Sahneler **seslendirmenin saniyelerine** göre kurulur (sessizlik analizi: ffmpeg silencedetect).
- Ses: kullanıcının kendi ses kaydı + müzik + ses efektleri; konuşmada müzik otomatik kısılır (sidechaincompress).
- Metin kısa, slogan gibi; yorum çağrısı ("Sen hangisini yaptın?") ve WhatsApp CTA ile biter.

## Teknik
- `kaynak/kin2.py`: sahneler, ikonlar, imleç, geçişler (PIL + ffmpeg, `python3 kin2.py video`).
- `kaynak/audio2.py`: ses efektleri ve müzik (`kin.py` fonksiyonlarını kullanır).
- Birleştirme: `ffmpeg ... sidechaincompress ... amix` (komut konuşma geçmişinde; ses + bed + sessiz video).
- Ses kaydı boşlukları: ffmpeg `silencedetect` ile kesip birleştirme (≈0,07 sn pay bırak).

## Bilinen eksikler
- Nakliyat sitesi ve Instagram adresi bilinmiyor (ağ erişimi yok); kullanıcı verirse kapanışa eklenecek.
- Depolama işi (ucellerdepolama.com) ayrı bir marka/iş kolu; videolar ona göre ayrı yapılmalı.

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

## Tipografi kuralları (v3'te kullanıcı revizesiyle kesinleşti)
- Metinlerde **gölge yok**.
- Normal metin: **Inter Regular**. Önemli/vurgulu metin: **Inter Black**. İnce font yok.
- Harf aralığı Inter'de hafif sıkı (≈ -1,4%; harfler birbirine değmeyecek kadar). El yazısında aralık değiştirilmez.
- 3 satırlı metin bloklarında **son satır el yazısı** (Amatic SC, `pip install font-amatic-sc`), üst satıra yakın, hafif eğik.
- Küçük etiketler (HATA 05, DOĞRUSU) Inter Black, harf aralığı açık.

## Onaylı referans video
- `uceller-5-hata-kinetik-v3.mp4` ("Taşınırken 5 hata", 39,6 sn) kullanıcının beğendiği, **referans alınacak** son sürümdür.
- Eski sürümler (v1, v2) referans değildir.

## Bekleyen revize notları (kullanıcı: "şimdi revize yapma, aklında tut")
Bunlar sonraki videolarda ve v3 yeniden yapılırken uygulanacak:
1. El yazısı fontu Amatic SC **değil**, başka bir el yazısı font olacak (Caveat benzeri, daha yumuşak/modern). Ortamda indirilemediği için kullanıcıdan `.ttf` istenebilir.
2. El yazısı metinlerde **cümle düzeni**: yalnızca ilk harf büyük, diğerleri küçük ("Her şey yerini bulur.", "Yoruma yaz"). Hepsi büyük harf olmayacak.
3. El yazısı **alt metinlerde kullanılmaz**; yalnızca **slogan / önemli vurgu** metinlerinde kullanılır. Alt metinler Inter Regular kalır.
   - Yani v3'teki "çizilme, ezilme, toz yok." ve "fiyat teklifi için hemen yaz" gibi alt metinler Inter Regular olmalı.
   - El yazısı adayları: "Yoruma yaz", "Her şey yerini bulur" gibi slogan/vurgu satırları.

# Haftalık bildirimler: kurulum

Kod hazır. Aşağıdaki adımlar yapılana kadar bildirim düğmesi uygulamada **görünmez**, yani yayınlamak hiçbir şeyi bozmaz.

## 1. Supabase'te tablo
Supabase → **SQL Editor** → `supabase/push.sql` dosyasının içeriğini yapıştırıp **Run**.
(Hesap sistemi gerekmez; bu sadece cihaz adreslerinin saklanacağı tablo.)

## 2. VAPID anahtarları üret
Bilgisayarında bir terminalde (Node kurulu olmalı):
```
npx web-push generate-vapid-keys
```
İki değer verir: **Public Key** ve **Private Key**. Private Key'i kimseyle paylaşma, sohbete yazma.

## 3. Vercel ortam değişkenleri
Vercel → `satir-arasi` → **Settings → Environment Variables** (Production):

| Ad | Değer |
|---|---|
| `VAPID_PUBLIC_KEY` | Public Key |
| `VAPID_PRIVATE_KEY` | Private Key |
| `VAPID_SUBJECT` | `mailto:senin-e-postan@gmail.com` |
| `SUPABASE_URL` | `https://ukykuerufyppufkadcao.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API → **service_role** anahtarı (gizli, sadece Vercel'e yaz) |
| `ADMIN_SECRET` | Yönetim sayfası için seçtiğin uzun bir şifre |

Sonra **Redeploy**.

## 4. Public anahtarı uygulamaya ver
`kitaplik/config.js` içinde `push: { publicKey: "" }` alanına **Public Key**'i yaz (herkese açık olabilir). Public Key'i bana yazarsan ben de yapabilirim.

## 5. Kullanım
- Kullanıcılar: **Rafım → Ayarlar → Bildirimler → Bildirimleri aç**. iPhone'da önce Ana Ekrana eklemek gerekir.
- Mesaj göndermek için: `https://SITE-ADRESIN/yonetim.html` → şifre, başlık, mesaj → **Herkese gönder**. Kaç kişiye gideceğini önce sorar.
- Artık kullanılmayan cihazlar (uygulama silinmiş, izin kapatılmış) gönderimde otomatik temizlenir.

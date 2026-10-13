# Hesap sistemi kurulumu (Supabase + Google + Facebook)

Kod hazır ama **hesap sistemi, aşağıdaki adımlar yapılana kadar kapalıdır**. `kitaplik/config.js` içindeki `supabase.url` ve `supabase.anonKey` boşken uygulama eskisi gibi, girişsiz çalışır. Yani bu kodu yayınlamak hiçbir şeyi bozmaz.

Eski haline dönmek için: GitHub'da `yedek/hesapsiz-surum-21` dalı, hesaplardan önceki sürümün birebir yedeğidir.

## 1. Supabase projesi
1. https://supabase.com adresinde hesap aç, **New project** de (ücretsiz katman yeterli).
2. Sol menüden **SQL Editor** → **New query** aç, `supabase/schema.sql` dosyasının tamamını yapıştırıp **Run** de.
3. **Project Settings → API** sayfasından iki değeri al: **Project URL** ve **anon public** anahtarı.
   (`service_role` anahtarını hiçbir yere yazma, ona ihtiyacımız yok.)

## 2. Giriş yöntemleri
**Authentication → Providers** bölümünde:

### Google
1. https://console.cloud.google.com → yeni proje → **APIs & Services → OAuth consent screen** (External) doldur: uygulama adı, e-posta, gizlilik politikası bağlantısı (`https://SITENIN-ADRESI/gizlilik.html`).
2. **Credentials → Create credentials → OAuth client ID → Web application**.
3. **Authorized redirect URIs** kısmına Supabase'in Google sayfasında yazan **Callback URL**'yi (`https://XXXX.supabase.co/auth/v1/callback`) yapıştır.
4. Çıkan **Client ID** ve **Client secret**'ı Supabase'de Google'ı açıp oraya gir.
5. Consent screen "Testing" durumundaysa sadece eklediğin test kullanıcıları girebilir. Herkes girsin diye **Publish app** de.

### Facebook
1. https://developers.facebook.com → **My Apps → Create App** (tür: Consumer / Authenticate and request data from users).
2. **Facebook Login** ürününü ekle. **Valid OAuth Redirect URIs** kısmına yine Supabase'in Facebook sayfasındaki **Callback URL**'yi yapıştır.
3. **Settings → Basic**: App ID ve App Secret'ı Supabase'de Facebook'u açıp oraya gir. Gizlilik politikası URL'si olarak `https://SITENIN-ADRESI/gizlilik.html` yaz, Data Deletion için aynı adresi ya da e-postanı ver.
4. Uygulamayı **Live** moda al. (Development modunda sadece uygulamaya eklediğin kişiler girebilir.) Sadece `email` ve `public_profile` izinleri yeterli, ek inceleme gerekmez.

### Adresler
**Authentication → URL Configuration**:
- **Site URL**: sitenin adresi (ör. `https://finish.vercel.app`)
- **Redirect URLs**: aynı adres (ve istersen `http://localhost:3000`).

## 3. Projeye anahtarları ver
1. `kitaplik/config.js` içinde doldur:
   ```js
   supabase: { url: "https://XXXX.supabase.co", anonKey: "eyJ..." },
   ```
2. Vercel → Project → Settings → Environment Variables (sunucunun üyeleri doğrulaması için):
   - `SUPABASE_URL` = aynı Project URL
   - `SUPABASE_ANON_KEY` = aynı anon public anahtar
   - `DAILY_LIMIT` = (isteğe bağlı) kişi başı günlük yapay zekâ isteği, varsayılan 60
3. Yeniden yayınla (redeploy).

## 4. Ücretsiz kalacak kişi
SQL Editor'de kendi kodunu üret:
```sql
insert into public.invite_codes(code, note) values ('KITAPKURDU-2026', 'ücretsiz arkadaş');
```
Arkadaşına bu kodu ver. Giriş yaptıktan sonra **Rafım → Ayarlar → Hesap → Davet kodu** alanına yazınca hesabı ömür boyu ücretsiz olur. Kod tek kullanımlıktır. Elle de verebilirsin:
```sql
update public.profiles set free = true where email = 'arkadas@gmail.com';
```

## 5. Abonelik zorunluluğu
Şimdilik **herkes giriş yapınca kullanabilir** (açık erişim). Ödeme sistemi bağlanınca şunu çalıştır:
```sql
update public.app_settings set value = 'true' where key = 'billing_enabled';
```
Bundan sonra davet kodu olmayan ya da aktif aboneliği bulunmayan kullanıcılar uygulamayı kullanamaz. **Ödeme bağlantısı henüz yok**, o yüzden bunu ödeme eklenmeden açma. Ödeme eklenince `profiles.plan = 'active'` ve `paid_until` alanları güncellenecek.

## Veriler nasıl saklanıyor?
- Raf, favoriler, notlar, hedef, kayıtlı tasarımlar ve alıntı önbelleği kullanıcıya özel tablolarda tutulur. Satır düzeyi güvenlik (RLS) sayesinde bir kullanıcı başkasının satırını okuyamaz ya da yazamaz.
- Telefonda aynı veriler önbellek olarak durur. Çıkış yapınca ve başka biri giriş yapınca cihazdaki kişisel veri silinir.
- Eşitleme son yazan kazanır mantığıyla çalışır. İki cihazdan aynı anda düzenleme yaparsan sonradan kaydeden kazanır.

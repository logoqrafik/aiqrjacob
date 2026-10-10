// Kişiselleştirme burada. Sadece bu dosyayı düzenlemen yeterli.
window.CONFIG = {
  friend: "Kitap Kurdu",        // Arkadaşının adı (ekranda "Merhaba ..." olarak görünür)
  giver: "Senin Adın",          // Hediyeyi veren (mektup imzası ve alt bilgi)
  perMonth: 4,                  // Aylık kitap hedefi

  greetings: [
    "Bugün kaç sayfa borcun var?",
    "Raf konuşuyor: yeni misafir istiyor.",
    "Telefon bırak, kitap al. (Önce burayı güncelle.)",
    "Bir bölüm daha. Biliyoruz, bir bölüm kalmaz.",
    "Okuma saati, hoş geldin."
  ],

  // Kaç kitap bitince hangi not açılsın. İstediğin gibi değiştir.
  milestones: {
    1:   "İlk kitap bitti. Kitaplardan anlamam ama \"bitti\" kelimesinden anlarım. Tebrikler.",
    10:  "10 kitap. Ben ömrümde bu kadar kitabın kapağını bile görmedim. Sen hepsini okudun. Saygılar.",
    25:  "25 kitap. Artık senden kitap tavsiyesi istemek benim için riskli bir hamle. Yine de bir gün isteyeceğim.",
    50:  "50 kitap. Yarım yüz. Bunu yapan birinin arkadaşı olmak biraz da benim başarım sayılır, değil mi?",
    100: "100 kitap. Bu uygulamayı yaparken buraya geleceğini biliyordum. Kahve benden."
  },

  footer: "Kitaplardan hiç anlamayan biri tarafından, kitaplardan çok anlayan biri için yapıldı."
};

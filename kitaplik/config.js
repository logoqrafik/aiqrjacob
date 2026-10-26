// Kişiselleştirme: sadece bu dosya.
window.CONFIG = {
  version: "22 · bildirimler",
  // Haftalık bildirimler (VAPID public anahtarı). Boşsa bildirim düğmesi görünmez. Kurulum: docs/BILDIRIM-KURULUMU.md
  push: { publicKey: "" },
  friend: "Kitap Kurdu",   // Arkadaşının adı
  giver: "Panda 🐼",       // İmza (en altta)
  // Rafım sekmesindeki sürpriz kartlar: kaç kitap bitirince hangi not çıksın (istediğini değiştir)
  surprises: {
    1: "İlk kitap rafta! Bundan sonrası kolay. 📚",
    5: "5 kitap! Ben hâlâ bir tanesini bitirmedim, sen beşini bitirdin. 🐼",
    10: "10 kitap! Ben hâlâ birini bitirmedim 🐼",
    25: "25 kitap. Bu artık bir alışkanlık değil, bir karakter özelliği. ✨",
    50: "50 kitap! Raf sana şapka çıkarıyor. 🎩",
    100: "100 kitap!! Sana bir kitaplık değil, bir kütüphane lazım. 🏛️"
  },
  goalMsg: "Bu ayki hedefine ulaştın! Kendine bir çay ısmarla, ben de alkışlıyorum. 👏🐼",
  // Panda'nın önerileri (Rafım sekmesi). t: kitap, a: yazar, n: kısa not (isteğe bağlı)
  picks: [
    { t: "Tutunamayanlar", a: "Oğuz Atay", n: "Kalın ama değer." },
    { t: "Kürk Mantolu Madonna", a: "Sabahattin Ali", n: "Bir oturuşta biter, uzun süre akılda kalır." },
    { t: "Küçük Prens", a: "Antoine de Saint-Exupéry", n: "Küçük kitap, büyük cümleler." },
    { t: "Simyacı", a: "Paulo Coelho" },
    { t: "Suç ve Ceza", a: "Fyodor Dostoyevski" },
    { t: "Yabancı", a: "Albert Camus" },
    { t: "1984", a: "George Orwell" },
    { t: "Sefiller", a: "Victor Hugo" }
  ],
  footer: "Kitaplardan hiç anlamayan biri tarafından, kitaplardan çok anlayan biri için yapıldı."
};

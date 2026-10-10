// Günün alıntısı ve günün kitabı: her gün sırayla bir sonrakine geçer. İstediğin satırı ekle/çıkar.
window.DAILY = {
  quotes: [
    { t: 'Bir kitap, içimizdeki donmuş denizi parçalayan balta olmalıdır.', a: 'Franz Kafka', s: 'Oskar Pollak\'a mektup' },
    { t: 'Cenneti hep bir tür kütüphane olarak hayal ettim.', a: 'Jorge Luis Borges', s: 'Bir Okuyucunun Şiiri' },
    { t: 'Okuyan insan ölmeden önce bin hayat yaşar. Hiç okumayan ise yalnızca bir hayat.', a: 'George R. R. Martin', s: 'Ejderhaların Dansı' },
    { t: 'Bir kadının kurgu yazabilmesi için para ve kendine ait bir odası olmalıdır.', a: 'Virginia Woolf', s: 'Kendine Ait Bir Oda' },
    { t: 'Asıl önemli olan gözle görülmez; yalnızca yürekle görülür.', a: 'Antoine de Saint-Exupéry', s: 'Küçük Prens' },
    { t: 'Yaşamak için bir nedeni olan, hemen her nasıla katlanabilir.', a: 'Friedrich Nietzsche', s: 'Putların Alacakaranlığı' },
    { t: 'Bütün mutlu aileler birbirine benzer; her mutsuz ailenin mutsuzluğu kendine özgüdür.', a: 'Lev Tolstoy', s: 'Anna Karenina' },
    { t: 'Sisifos\'u mutlu hayal etmeliyiz.', a: 'Albert Camus', s: 'Sisifos Efsanesi' },
    { t: 'Özgürlük, iki kere ikinin dört ettiğini söyleyebilme özgürlüğüdür.', a: 'George Orwell', s: '1984' },
    { t: 'Yaşamak bir ağaç gibi tek ve hür, ve bir orman gibi kardeşçesine.', a: 'Nâzım Hikmet', s: 'Davet' },
    { t: 'Hayat, yaşanan değil, hatırlanan ve anlatmak için hatırlandığı gibi bir şeydir.', a: 'Gabriel García Márquez', s: 'Anlatmak İçin Yaşamak' },
    { t: 'Güzellik dünyayı kurtaracak.', a: 'Fyodor Dostoyevski', s: 'Budala' },
    { t: 'Bedava yaşıyoruz bedava; hava bedava, bulut bedava.', a: 'Orhan Veli Kanık', s: 'Bedava Yaşıyoruz' }
  ],
  books: [
    { t: 'Kürk Mantolu Madonna', a: 'Sabahattin Ali', d: 'Bir portre karşısında başlayan sessiz bir hayranlık, bir ömre sığmayan aşka dönüşür.' },
    { t: 'Tutunamayanlar', a: 'Oğuz Atay', d: 'Kendine bir yer arayan bir adamın kahkahalı ve hüzünlü yolculuğu.' },
    { t: 'Küçük Prens', a: 'Antoine de Saint-Exupéry', d: 'Çocuklara yazılmış gibi görünen, büyüdükçe daha çok şey söyleyen bir masal.' },
    { t: '1984', a: 'George Orwell', d: 'Her şeyin izlendiği bir dünyada düşünmeye çalışan bir adamın hikâyesi.' },
    { t: 'Suç ve Ceza', a: 'Fyodor Dostoyevski', d: 'Bir cinayetin ardından vicdanın verdiği uzun ve ağır hesap.' },
    { t: 'Yüzyıllık Yalnızlık', a: 'Gabriel García Márquez', d: 'Bir ailenin yedi kuşağı, bir kasabanın büyüsü ve unutulmayan bir yalnızlık.' },
    { t: 'Saatleri Ayarlama Enstitüsü', a: 'Ahmet Hamdi Tanpınar', d: 'Zamanla dalga geçen, Doğu ile Batı arasında kalmış zarif bir roman.' },
    { t: 'Dönüşüm', a: 'Franz Kafka', d: 'Bir sabah kendini böceğe dönüşmüş bulan bir adam ve ailesinin değişen bakışı.' },
    { t: 'Yabancı', a: 'Albert Camus', d: 'Duygusuz görünen bir adamın yargılandığı, dünyayla uyumsuzluk üzerine kısa bir roman.' },
    { t: 'Satranç', a: 'Stefan Zweig', d: 'Bir gemi yolculuğunda iki satranç ustasının gergin karşılaşması.' },
    { t: 'Çalıkuşu', a: 'Reşat Nuri Güntekin', d: 'Anadolu\'ya öğretmen giden cesur, neşeli ve inatçı bir genç kadın.' },
    { t: 'Fahrenheit 451', a: 'Ray Bradbury', d: 'Kitapların yasak olduğu bir dünyada kitap yakmakla görevli bir itfaiyeci.' },
    { t: 'Sofie\'nin Dünyası', a: 'Jostein Gaarder', d: 'Bir kızın mektuplarla başlayan felsefe tarihine yolculuğu.' },
    { t: 'Martin Eden', a: 'Jack London', d: 'Okumayı ve yazmayı tutkuyla öğrenen bir denizcinin yükselişi ve bedeli.' },
    { t: 'Beyaz Zambaklar Ülkesinde', a: 'Grigori Petrov', d: 'Finlandiya\'nın doğasında geçen, huzurlu ve ilham veren kısa bir anlatı.' },
    { t: 'İnce Memed', a: 'Yaşar Kemal', d: 'Toros dağlarında zulme karşı çıkan genç bir eşkıyanın destansı hikâyesi.' },
    { t: 'Simyacı', a: 'Paulo Coelho', d: 'Bir çobanın hayalinin peşinden piramitlere uzanan yolculuğu.' },
    { t: 'Körlük', a: 'José Saramago', d: 'Bir kentte herkesin sırayla görme yetisini yitirdiği sarsıcı bir kıyamet romanı.' }
  ]
};

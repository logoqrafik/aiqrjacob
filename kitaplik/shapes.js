// Ortak çizimler: lotus filigranı (çizgisel) ve ayraç. Hem Hikâye hem Tasarım sekmesi kullanır.
// Hepsi (0,0) merkezli çizilir; genişlik w piksel.
window.SH = {
  RATIO: { ribbon: 214 / 68, lotus: 0.8 },
  ribbon(c, w, color) {
    const k = w / 68; c.save(); c.scale(k, k); c.translate(-34, -107); c.fillStyle = color;
    c.beginPath(); c.moveTo(0, 0); c.lineTo(68, 0); c.lineTo(68, 214); c.lineTo(34, 178); c.lineTo(0, 214); c.closePath(); c.fill(); c.restore();
  },
  // Minimal çizgisel lotus: orta taç yaprak, iki iç, iki dış yaprak ve alt çizgi
  lotus(c, w, color, lw) {
    const k = w / 100; c.save(); c.scale(k, k); c.translate(-50, -40);
    c.strokeStyle = color; c.lineWidth = (lw || 2.4) / k * 1; c.lineJoin = 'round'; c.lineCap = 'round';
    const P = d => { c.stroke(new Path2D(d)); };
    P('M50 4 Q69 30 50 62 Q31 30 50 4 Z');                       // orta yaprak
    P('M45 62 Q13 57 21 19 Q43 29 45 62 Z');                     // sol iç yaprak
    P('M55 62 Q87 57 79 19 Q57 29 55 62 Z');                     // sağ iç yaprak
    P('M41 65 Q6 68 1 41 Q27 40 41 65 Z');                       // sol dış yaprak
    P('M59 65 Q94 68 99 41 Q73 40 59 65 Z');                     // sağ dış yaprak
    P('M30 72 Q50 78 70 72');                                    // alt çizgi
    c.restore();
  }
};

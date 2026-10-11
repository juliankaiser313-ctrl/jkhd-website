// ---------- Die Bilder der System-Seite (system.html / en/system.html) ----------
// Gezeichnet vom Motor js/bildlauf.js. Julian, 11.10.2026: "Kannst du bei System
// auch sowas machen? Dort eher weniger Text und eher mehr Animation." Inhalt sind
// die acht Grundarten automatischer Handelssysteme mit ihrem Haken und "Und bei uns?"
// von der Seite vom 23.09.2026, nur gekuerzt -- jedes Bild zeigt den Mechanismus
// und laesst den Haken passieren. Keine Anleitung, nur die Idee dahinter.
// Die Bilder:
//   00 die Ueberschrift der Seite, dazu acht kleine Zeichen, eines je Grundart
//   01 Arbitrage: dieselbe Sache an zwei Boersen; die Luecke oeffnet sich fuer einen
//      Augenblick -- unsere Leitung ist laenger als die Luecke: zu spaet
//   02 Marktmachen: Kauf- und Verkaufsangebot um die Mitte, Trades treffen beide
//      Seiten; dann rennen alle in dieselbe Richtung, und der Bestand bleibt uns
//   03 Trend: in die laufende Richtung; viele kleine Fehlstarts, wenige grosse Treffer
//   04 Rueckkehr zum Mittel: gegen den Ausschlag; einmal ist der Ausschlag der Anfang,
//      und mit jedem Nachlegen waechst der Verlust
//   05 Paarhandel: zwei, die zusammenlaufen, laufen auseinander und wieder zusammen --
//      bis eines fuer immer weglaeuft
//   06 Haltepraemie: Treppe nach oben, lange; dann der seltene Tag
//   07 Ereignisse: der Sprung, ein Teil steht schon im Kurs; wer liest, kommt zur
//      zweiten Welle
//   08 Orderbuch: Kauf- und Verkaufsauftraege auf der Leiter, ein grosser Auftrag
//      erscheint und verschwindet; das Lesen gilt fuer Sekunden
//   09 Und bei uns: Muster im Kursverlauf -- Bewegung, die weiterlaeuft, Ausschlaege,
//      die zurueckkommen; Arbitrage und Hochfrequenz nicht
window.JKHDBilder = window.JKHDBilder || {};
window.JKHDBilder.system = function (k) {
  const { ctx, F, T, text, haken, kreuz, linieRund, reiheRund, wert, mono, stueck, clamp, misch, dreieck, zufall } = k;
  const REIHE = reiheRund(21, 320);

  // Kleine Hilfen
  function pfeil(x0, y0, x1, y1, farbe) {
    ctx.save();
    ctx.strokeStyle = farbe; ctx.fillStyle = farbe; ctx.lineWidth = 1.4; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    const w = Math.atan2(y1 - y0, x1 - x0);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - 7 * Math.cos(w - 0.4), y1 - 7 * Math.sin(w - 0.4));
    ctx.lineTo(x1 - 7 * Math.cos(w + 0.4), y1 - 7 * Math.sin(w + 0.4));
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function rahmen(x, y, b, h, farbe, strich) {
    ctx.strokeStyle = farbe; ctx.lineWidth = strich || 1;
    ctx.strokeRect(x + 0.5, y + 0.5, b - 1, h - 1);
  }
  // Eine Reihe aus n Werten (0..1) als Linie ueber die Breite b, von Index `ab` (rund)
  function reiheLinie(w, ab, anzahl, x0, y0, b, h, anteil, farbe, staerke) {
    linieRund(w, ab, anzahl, x0, y0, b, h, anteil, farbe, staerke);
  }
  // x einer Stelle i der laufenden Reihe (rund), null wenn ausserhalb des Fensters
  function stelleX(i, lauf, n, fenster, x0, b) {
    const d = (((i - lauf) % n) + n) % n;
    return d < fenster ? x0 + (d / (fenster - 1)) * b : null;
  }

  // Reihen fuer die Bilder (feste Saat, rund)
  function reiheMit(saat, n, form) {   // Rauschen plus eine Form, am Ende normiert
    const z = zufall(saat);
    const w = [];
    let r = 0;
    for (let i = 0; i < n; i++) { r += (z() - 0.5) * 0.12; r *= 0.96; w.push(0.5 + r + form(i)); }
    let lo = Infinity, hi = -Infinity;
    for (const v of w) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    return w.map((v) => 0.1 + ((v - lo) / (hi - lo || 1)) * 0.8);
  }
  const N = 400;
  // Trend: zwei Laeufe (ein grosser hinauf, ein kuerzerer hinab), dazwischen Rauschen
  const TREND = reiheMit(41, N, (i) => 0.6 * Math.exp(-Math.pow((i - 230) / 70, 2)) * (i < 230 ? 1 : 1) - 0.3 * Math.exp(-Math.pow((i - 350) / 30, 2)));
  const TREND_EPISODEN = [
    [22, 30, false], [48, 55, false], [80, 88, false], [110, 116, false], [140, 149, false],
    [168, 240, true], [262, 268, false], [290, 297, false], [318, 324, false], [338, 362, true],
  ];
  // Rueckkehr zum Mittel: Schwingung um die Mitte; ab 300 laeuft der Ausschlag weg
  const MITTEL = reiheMit(43, N, (i) => (i < 300 ? 0.22 * Math.sin(i * 0.22) : i < 370 ? 0.22 * Math.sin(300 * 0.22) + (i - 300) * 0.011 : 0.22 * Math.sin(300 * 0.22) + 70 * 0.011 - (i - 370) * 0.026));
  // Paarhandel: A und B laufen zusammen; B weicht kurz ab (120-170) und am Ende fuer immer (280-385)
  const PAAR_A = reiheRund(29, N);
  const PAAR_ABSTAND = [];
  for (let i = 0; i < N; i++) {
    let o = 0;
    if (i >= 120 && i < 170) o = 0.16 * Math.sin(((i - 120) / 50) * Math.PI);
    if (i >= 280) o = 0.3 * clamp((i - 280) / 50, 0, 1) * (i < 385 ? 1 : 1 - (i - 385) / 15);
    PAAR_ABSTAND.push(o);
  }

  // Acht kleine Zeichen, eines je Grundart, leise bewegt
  function artGlyph(i, cx, cy, gr, zeit) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = F.tinte; ctx.fillStyle = F.tinte; ctx.lineWidth = 1.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
    const r = gr / 2;
    ctx.beginPath();
    if (i === 0) {            // Arbitrage: zwei Linien, zwischen denen kurz eine Luecke aufgeht
      const l = 0.3 * dreieck(zeit * 0.5) * r;
      ctx.moveTo(-r, -3 - l); ctx.lineTo(r, -3 - l); ctx.moveTo(-r, 3 + l); ctx.lineTo(r, 3 + l);
    } else if (i === 1) {     // Marktmachen: Leiter mit zwei Angeboten um die Mitte
      for (let j = -2; j <= 2; j++) { ctx.moveTo(-r * 0.5, j * r * 0.4); ctx.lineTo(r * 0.5, j * r * 0.4); }
      const s = 0.6 + 0.3 * Math.sin(zeit * 2);
      ctx.moveTo(-r, -r * 0.4 * s); ctx.lineTo(-r * 0.6, -r * 0.4 * s); ctx.moveTo(r * 0.6, r * 0.4 * s); ctx.lineTo(r, r * 0.4 * s);
    } else if (i === 2) {     // Trend: eine steigende Zickzacklinie, die weiterlaeuft
      const ph = (zeit * 0.4) % 1;
      for (let j = 0; j <= 6; j++) { const x = -r + (j / 6) * 2 * r, y = r * 0.6 - (j / 6) * 1.2 * r + (j % 2 ? -r * 0.18 : r * 0.18) * Math.cos(ph * Math.PI * 2 + j); if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    } else if (i === 3) {     // Rueckkehr: eine Schwingung um die Mitte
      ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
      ctx.moveTo(-r, 0);
      for (let j = 0; j <= 20; j++) { const x = -r + (j / 20) * 2 * r; ctx.lineTo(x, Math.sin(j * 0.9 + zeit * 2) * r * 0.5); }
    } else if (i === 4) {     // Paarhandel: zwei Linien, die auseinander- und zusammenlaufen
      const o = 0.35 * dreieck(zeit * 0.3) * r;
      ctx.moveTo(-r, -2); ctx.lineTo(0, -2 - o); ctx.lineTo(r, -2);
      ctx.moveTo(-r, 2); ctx.lineTo(0, 2 + o); ctx.lineTo(r, 2);
    } else if (i === 5) {     // Haltepraemie: eine Treppe, die einmal faellt
      const ph = (zeit * 0.35) % 1;
      let y = r * 0.6;
      ctx.moveTo(-r, y);
      for (let j = 1; j <= 6; j++) { const x = -r + (j / 6) * 2 * r; if (j === 5 && ph > 0.5) y = r * 0.6; else y -= r * 0.18; ctx.lineTo(x - 2 * r / 6, y); ctx.lineTo(x, y); }
    } else if (i === 6) {     // Ereignisse: flach, dann ein Sprung
      const s = 0.5 + 0.5 * Math.sin(zeit * 1.5);
      ctx.moveTo(-r, r * 0.3); ctx.lineTo(-r * 0.1, r * 0.3); ctx.lineTo(-r * 0.1, r * 0.3 - r * 0.9 * s); ctx.lineTo(r, r * 0.3 - r * 0.9 * s);
    } else {                  // Orderbuch: Balken links und rechts, die atmen
      for (let j = 0; j < 4; j++) {
        const y = -r * 0.75 + j * r * 0.5;
        const bl = r * (0.3 + 0.5 * (0.5 + 0.5 * Math.sin(zeit * 1.7 + j))), br = r * (0.3 + 0.5 * (0.5 + 0.5 * Math.cos(zeit * 1.3 + j)));
        ctx.moveTo(-4, y); ctx.lineTo(-4 - bl, y); ctx.moveTo(4, y); ctx.lineTo(4 + br, y);
      }
    }
    ctx.stroke();
    ctx.restore();
  }
  const ARTEN = [T("Arbitrage", "arbitrage"), T("Marktmachen", "market making"), T("Trend", "trend"), T("Rückkehr", "reversion"), T("Paarhandel", "pairs"), T("Halteprämie", "carry"), T("Ereignisse", "events"), T("Orderbuch", "order book")];

  // 00 Die Ueberschrift: acht Zeichen in einer Reihe
  function s0(t, zeit, A) {
    const klein = k.klein;
    const n = 8;
    const spalten = klein ? 4 : 8;
    const w = Math.min(120, (A.b - 20) / spalten);
    const x0 = A.x + (A.b - w * spalten) / 2;
    const gr = Math.min(40, w * 0.5);
    const seit = Math.max(t, Math.min(1, zeit * 0.6));
    for (let i = 0; i < n; i++) {
      const a = stueck(seit, i * 0.08, i * 0.08 + 0.12) * 0.6;
      if (a <= 0) continue;
      ctx.globalAlpha *= a;
      const cx = x0 + (i % spalten) * w + w / 2;
      const cy = A.y + A.h * (klein ? (i < 4 ? 0.3 : 0.65) : 0.5) - 8;
      artGlyph(i, cx, cy, gr, zeit);
      text(ARTEN[i], cx, cy + gr * 0.75 + 14, mono(10), F.matt, "center");
      ctx.globalAlpha /= a;
    }
  }

  // 01 Arbitrage: dieselbe Sache an zwei Boersen, die Luecke, die Leitung
  function s1(t, zeit, A) {
    const klein = k.klein;
    const hK = Math.min((A.h - 90) / 2, 130);
    const y1 = A.y + 16, y2 = y1 + hK + 36;
    const x0 = A.x, b = A.b;
    const lauf = zeit * 8;
    const P = 4, tz = zeit % P;
    const luecke = stueck(tz, 1.0, 1.15) * (1 - stueck(tz, 1.4, 1.55));   // nur einen Augenblick offen
    text(T("Börse A", "exchange A"), x0, y1 - 4, mono(11), F.matt);
    reiheLinie(REIHE, lauf, 120, x0, y1, b, hK, stueck(t, 0, 0.3), F.tinte, 1.5);
    text(T("Börse B — dieselbe Sache", "exchange B — the same thing"), x0, y2 - 4, mono(11), F.matt);
    const hub = luecke * hK * 0.22;   // B steht kurz hoeher: dort teurer
    ctx.save();
    ctx.translate(0, -hub);
    reiheLinie(REIHE, lauf, 120, x0, y2, b, hK, stueck(t, 0.1, 0.4), F.tinte, 1.5);
    ctx.restore();
    if (luecke > 0.4 && t > 0.4) {
      const yA = y1 + hK - wert(REIHE, lauf + 119) * hK, yB = y2 + hK - wert(REIHE, lauf + 119) * hK - hub;
      const xj = x0 + b - 4;
      ctx.globalAlpha *= luecke;
      text(T("hier billig kaufen", "buy cheaply here"), xj, yA - 10, mono(11), F.gruen, "right");
      text(T("dort teuer verkaufen", "sell dearly there"), xj, yB - 10, mono(11), F.gruen, "right");
      ctx.setLineDash([3, 3]); ctx.strokeStyle = F.gruen; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xj, yA); ctx.lineTo(xj, yB); ctx.stroke(); ctx.setLineDash([]);
      ctx.globalAlpha /= luecke;
    }
    // die Leitung: die Luecke dauert einen Augenblick, unser Weg zur Boerse laenger
    const aL = stueck(t, 0.5, 0.75);
    if (aL > 0) {
      ctx.globalAlpha *= aL;
      const yL = y2 + hK + 28, bL = Math.min(b, 420), xL = x0;
      ctx.strokeStyle = F.rand2; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(xL, yL); ctx.lineTo(xL + bL, yL); ctx.stroke();
      // die Luecke auf der Zeitachse (1,0-1,55 s von 4 s) und unsere Ankunft bei 2,2 s
      ctx.fillStyle = F.gruen;
      ctx.fillRect(xL + bL * (1.0 / P), yL - 4, bL * (0.55 / P), 8);
      const uns = clamp(tz / 2.2, 0, 1);
      const xU = xL + bL * ((2.2 * uns) / P);
      ctx.fillStyle = tz > 1.55 ? F.rot : F.tinte;
      ctx.beginPath(); ctx.arc(xU, yL, 4, 0, Math.PI * 2); ctx.fill();
      text(T("Lücke: Millisekunden", "the gap: milliseconds"), xL + bL * (1.27 / P), yL - 10, mono(10), F.gruen, "center");
      text(klein ? T("unsere Leitung: zu spät", "our line: too late") : T("unsere Leitung kommt an: die Lücke ist weg — zu spät", "our line arrives: the gap is gone — too late"), xL + bL * (2.2 / P) + 8, yL + 4, mono(10), F.rot);
      ctx.globalAlpha /= aL;
    }
  }

  // 02 Marktmachen: Angebote um die Mitte, Trades treffen beide Seiten, dann die Welle
  function s2(t, zeit, A) {
    const klein = k.klein;
    const hL = Math.min(A.h - 40, 220);
    const yT = A.y + 20;
    const xM = A.x + A.b * (klein ? 0.28 : 0.32);
    const P = 12, tz = zeit % P;
    const welle = stueck(tz, 7, 8.5) * (1 - stueck(tz, 11.2, 12));
    const mitte = yT + hL * (0.5 + 0.04 * Math.sin(zeit * 0.9)) - welle * hL * 0.32;
    const spanne = hL * 0.09;
    // die Leiter
    const aL = stueck(t, 0, 0.3);
    ctx.globalAlpha *= aL;
    for (let j = 0; j <= 8; j++) { const y = yT + (j * hL) / 8; ctx.strokeStyle = F.rand; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xM - 56, y); ctx.lineTo(xM + 56, y); ctx.stroke(); }
    ctx.strokeStyle = F.rand2; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(xM - 70, mitte); ctx.lineTo(xM + 70, mitte); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = F.tinte;
    ctx.fillRect(xM - 50, mitte - spanne - 3, 100, 6);
    ctx.fillRect(xM - 50, mitte + spanne - 3, 100, 6);
    text(T("Verkauf", "sell"), xM - 60, mitte - spanne + 4, mono(11), F.matt, "right");
    text(T("Kauf", "buy"), xM - 60, mitte + spanne + 4, mono(11), F.matt, "right");
    text(T("Spanne", "spread"), xM + 62, mitte + 4, mono(10), F.matt);
    ctx.globalAlpha /= aL;
    // die Trades: kommen von rechts; normal treffen sie beide Seiten, in der Welle nur noch unser Verkaufsangebot
    const aT = stueck(t, 0.3, 0.5);
    ctx.globalAlpha *= aT;
    const xVon = xM + (klein ? 120 : 170);
    let verdient = 0;
    for (let i = 0; i < 6; i++) {
      const u = ((zeit * 0.55 + i / 6) % 1);
      const seite = welle > 0.5 ? -1 : i % 2 ? 1 : -1;
      const x = xVon - u * (xVon - xM - 52);
      const y = mitte + seite * spanne;
      ctx.fillStyle = F.tinte;
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      if (u > 0.9) { if (welle > 0.5) verdient--; else verdient++; }
    }
    const umsatz = welle > 0.5 ? T("alle rennen in dieselbe Richtung", "everyone runs the same way") : T("Umsatz: an jeder Seite die Spanne", "turnover: the spread on each side");
    if (klein) text(umsatz, A.x, yT + hL + 18, mono(10), welle > 0.5 ? F.rot : F.matt);
    else text(umsatz, xVon + 6, mitte + 4, mono(10), welle > 0.5 ? F.rot : F.matt);
    // der Bestand: klein im Normalfall, in der Welle bleibt uns die Position, die keiner will
    const xB = A.x + A.b - (klein ? 26 : 60), bB = 18;
    const bestand = 0.08 + welle * 0.7;
    ctx.fillStyle = welle > 0.3 ? F.rot : F.tinte;
    ctx.fillRect(xB, yT + hL - bestand * hL, bB, bestand * hL);
    rahmen(xB, yT, bB, hL, F.rand2);
    text(T("Bestand", "inventory"), xB + bB / 2, yT - 8, mono(10), F.matt, "center");
    if (welle > 0.3) text(klein ? T("die Position, die keiner will", "the position nobody wants") : T("man sitzt auf der Position, die keiner will", "left holding the position nobody wants"), xB - 8, yT + hL - bestand * hL - 8, mono(10), F.rot, "right");
    ctx.globalAlpha /= aT;
  }

  // 03 Trend: in die laufende Richtung; Fehlstarts und Treffer
  function s3(t, zeit, A) {
    const hK = Math.min(A.h - 50, 240);
    const y0 = A.y + 16, x0 = A.x, b = A.b;
    const lauf = zeit * 7, fenster = 160;
    reiheLinie(TREND, lauf, fenster, x0, y0, b, hK, stueck(t, 0, 0.3), F.tinte, 1.5);
    // die Einstiege: Baender unter der Linie -- rot die Fehlstarts, gruen die Treffer
    const aE = stueck(t, 0.3, 0.55);
    ctx.globalAlpha *= aE;
    let fehl = 0, treffer = 0;
    for (const [von, bis, gut] of TREND_EPISODEN) {
      const xa = stelleX(von, lauf, N, fenster, x0, b), xb = stelleX(bis, lauf, N, fenster, x0, b);
      if (xa === null && xb === null) continue;
      const xs = xa === null ? x0 : xa, xe = xb === null ? x0 + b : xb;
      if (xe < xs) continue;
      ctx.fillStyle = gut ? F.gruen : F.rot;
      ctx.globalAlpha *= 0.18;
      ctx.fillRect(xs, y0, xe - xs, hK);
      ctx.globalAlpha /= 0.18;
      const ya = y0 + hK - wert(TREND, von) * hK;
      pfeil(xs, ya + 26, xs, ya + 8, gut ? F.gruen : F.rot);
      if (gut) treffer++; else fehl++;
    }
    text(T("Einstieg in die laufende Richtung, Stop dahinter", "enter in the running direction, stop behind it"), x0, y0 + hK + 16, mono(10), F.matt);
    ctx.globalAlpha /= aE;
    const aZ = stueck(t, 0.6, 0.85);
    ctx.globalAlpha *= aZ;
    text(T("im Bild: ", "in view: ") + fehl + T(" Fehlstarts · ", " false starts · ") + treffer + T(" Treffer", " hits"), x0 + b, y0 + hK + (k.klein ? 32 : 16), mono(10), F.matt, "right");
    ctx.globalAlpha /= aZ;
  }

  // 04 Rueckkehr zum Mittel: gegen den Ausschlag -- bis der Ausschlag der Anfang ist
  function s4(t, zeit, A) {
    const klein = k.klein;
    const hK = Math.min(A.h - 50, 240);
    const y0 = A.y + 16, x0 = A.x, b = A.b;
    const lauf = zeit * 7, fenster = 160;
    const yM = y0 + hK * 0.5;
    ctx.strokeStyle = F.rand2; ctx.lineWidth = 1; ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(x0, yM); ctx.lineTo(x0 + b, yM); ctx.stroke(); ctx.setLineDash([]);
    text(T("das Mittel", "the mean"), x0 + b, yM - 6, mono(10), F.matt, "right");
    reiheLinie(MITTEL, lauf, fenster, x0, y0, b, hK, stueck(t, 0, 0.3), F.tinte, 1.5);
    const aE = stueck(t, 0.3, 0.55);
    ctx.globalAlpha *= aE;
    // Einstiege gegen die Ausschlaege (Pfeile zur Mitte) und der Ausstieg am Mittel
    for (let i = 10; i < 300; i += 14) {
      const v = MITTEL[i] - 0.5;
      if (Math.abs(v) < 0.2) continue;
      const x = stelleX(i, lauf, N, fenster, x0, b);
      if (x === null) continue;
      const y = y0 + hK - MITTEL[i] * hK;
      pfeil(x, y + (v > 0 ? -22 : 22), x, y + (v > 0 ? -6 : 6), F.gruen);
    }
    // der Ausschlag, der nicht zurueckkommt: nachgelegt, nachgelegt -- der Verlust waechst
    let verlust = 0;
    for (const i of [306, 318, 330, 342]) {
      const x = stelleX(i, lauf, N, fenster, x0, b);
      if (x === null) continue;
      const y = y0 + hK - MITTEL[i] * hK;
      pfeil(x, y - 24, x, y - 8, F.rot);
      verlust++;
    }
    const xV = stelleX(344, lauf, N, fenster, x0, b);
    if (xV !== null && verlust > 0) {
      ctx.globalAlpha *= 0.9;
      text(T("nachgelegt ×", "added ×") + verlust + T(" — der Verlust wächst mit jedem Schritt", " — the loss grows with every step"), Math.min(xV, x0 + b - (klein ? 170 : 300)), y0 + 12, mono(10), F.rot);
      ctx.globalAlpha /= 0.9;
    }
    text(T("gegen die Übertreibung, Ausstieg am Mittel", "against the exaggeration, exit at the mean"), x0, y0 + hK + 16, mono(10), F.matt);
    ctx.globalAlpha /= aE;
  }

  // 05 Paarhandel: zwei, die zusammenlaufen
  function s5(t, zeit, A) {
    const klein = k.klein;
    const hK = Math.min(A.h - 50, 240);
    const y0 = A.y + 16, x0 = A.x, b = A.b;
    const lauf = zeit * 6, fenster = 160;
    // A und B als Linien; B = A + Abstand
    const aL = stueck(t, 0, 0.3);
    ctx.globalAlpha *= aL;
    ctx.strokeStyle = F.tinte; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let j = 0; j < fenster; j++) { const x = x0 + (j / (fenster - 1)) * b, y = y0 + hK - wert(PAAR_A, lauf + j) * hK * 0.7 - hK * 0.1; if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
    ctx.strokeStyle = F.matt; ctx.lineWidth = 1.3; ctx.beginPath();
    for (let j = 0; j < fenster; j++) { const i = lauf + j; const x = x0 + (j / (fenster - 1)) * b, y = y0 + hK - (wert(PAAR_A, i) * 0.7 + 0.1 + wert(PAAR_ABSTAND, i)) * hK; if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
    text("A", x0 + b + 4 - 14, y0 + hK - wert(PAAR_A, lauf + 159) * hK * 0.7 - hK * 0.1 + 4, mono(11), F.tinte);
    text("B", x0 + b + 4 - 14, y0 + hK - (wert(PAAR_A, lauf + 159) * 0.7 + 0.1 + wert(PAAR_ABSTAND, lauf + 159)) * hK - 6, mono(11), F.matt);
    ctx.globalAlpha /= aL;
    // der Handel: beim Auseinanderlaufen B verkaufen, A kaufen; beim Zusammenlaufen der Haken
    const aH = stueck(t, 0.3, 0.55);
    ctx.globalAlpha *= aH;
    const xT = stelleX(140, lauf, N, fenster, x0, b);
    if (xT !== null) {
      const yA = y0 + hK - wert(PAAR_A, 140) * hK * 0.7 - hK * 0.1, yB = y0 + hK - (wert(PAAR_A, 140) * 0.7 + 0.1 + PAAR_ABSTAND[140]) * hK;
      pfeil(xT, yB - 24, xT, yB - 8, F.gruen); text(T("B verkaufen", "sell B"), xT + 6, yB - 14, mono(10), F.gruen);
      pfeil(xT, yA + 24, xT, yA + 8, F.gruen); text(T("A kaufen", "buy A"), xT + 6, yA + 20, mono(10), F.gruen);
    }
    const xZ = stelleX(172, lauf, N, fenster, x0, b);
    if (xZ !== null) { const y = y0 + hK - wert(PAAR_A, 172) * hK * 0.7 - hK * 0.1; haken(xZ, y - 16, 14, F.gruen, 1); text(T("wieder zusammen", "together again"), xZ + 10, y - 14, mono(10), F.gruen); }
    const xW = stelleX(330, lauf, N, fenster, x0, b);
    if (xW !== null) {
      const y = y0 + hK - (wert(PAAR_A, 330) * 0.7 + 0.1 + PAAR_ABSTAND[330]) * hK;
      kreuz(xW, y - 14, 14, F.rot, 1);
      text(klein ? T("kommt nie mehr zusammen", "never comes back") : T("das Unternehmen hat sich geändert: das Paar kommt nie mehr zusammen", "the company really changed: the pair never comes back together"), Math.min(xW + 10, x0 + b - (klein ? 150 : 380)), y - 12, mono(10), F.rot);
    }
    text(T("„sonst“ ist eine Annahme über die Vergangenheit", "“normally” is an assumption about the past"), x0, y0 + hK + 16, mono(10), F.matt);
    ctx.globalAlpha /= aH;
  }

  // 06 Haltepraemie: die Treppe, lange -- und der seltene Tag. Die Spur laeuft ohne
  // Ende nach links; damit sie im Bild bleibt, wird der Nettozuwachs je Runde als
  // Steigung abgezogen (die Treppe steigt, faellt, steigt -- und kommt auf dieselbe
  // Hoehe zurueck, ohne Sprung)
  function s6(t, zeit, A) {
    const hK = Math.min(A.h - 50, 240);
    const y0 = A.y + 16, x0 = A.x, b = A.b;
    const P = Math.max(640, b * 1.1);          // eine Runde in Bildpunkten
    const stufe = 24;                          // alle 24 px eine Praemie
    const proRunde = Math.floor(P / stufe);
    const fall = P * 0.78;                     // dort kommt der seltene Tag
    const hub = (hK * 0.8) / (0.7 * proRunde); // so hoch eine Stufe: der Fall nimmt 70 % einer Runde und bleibt im Bild
    const D = 0.7 * proRunde * hub;
    const steigung = (proRunde * hub - D) / P;
    const schub = zeit * 30;
    const sichtbar = x0 + b * clamp(t / 0.5, 0, 1);
    const stand = (s) => {
      const faelle = s < fall ? 0 : Math.floor((s - fall) / P) + 1;
      return Math.floor(s / stufe) * hub - faelle * D - steigung * s;
    };
    const basis = y0 + hK * 0.75;
    ctx.strokeStyle = F.tinte; ctx.lineWidth = 1.6; ctx.lineJoin = "round";
    ctx.beginPath();
    for (let x = x0; x <= sichtbar; x += 2) {
      const y = basis - stand(x - x0 + schub);
      if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // wo der Fall im Bild liegt
    const kk = Math.floor((schub + fall) / P);
    for (let r = kk - 1; r <= kk + 1; r++) {
      const sf = r * P + fall;
      const xf = x0 + sf - schub;
      if (xf < x0 || xf > sichtbar || sf < 0) continue;
      const oben = basis - stand(sf - 1), unten = basis - stand(sf + 1);
      ctx.strokeStyle = F.rot; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(xf, oben); ctx.lineTo(xf, unten); ctx.stroke();
      if (xf > x0 + b * 0.7) text(T("das seltene Mal", "the rare once"), xf - 6, (oben + unten) / 2 + 4, mono(10), F.rot, "right");
      else text(T("das seltene Mal", "the rare once"), xf + 6, (oben + unten) / 2 + 4, mono(10), F.rot);
    }
    const aZ = stueck(t, 0.5, 0.75);
    ctx.globalAlpha *= aZ;
    text(T("jede Stufe eine Prämie fürs Halten", "every step a premium for holding"), x0, y0 + hK + 16, mono(10), F.matt);
    text(T("die Prämie ist die Bezahlung für genau dieses Mal", "the premium is the payment for exactly that once"), x0 + b, y0 + hK + (k.klein ? 32 : 16), mono(10), F.matt, "right");
    ctx.globalAlpha /= aZ;
  }

  // 07 Ereignisse: der Sprung, und was schon vorher im Kurs steht
  function s7(t, zeit, A) {
    const klein = k.klein;
    const hK = Math.min(A.h - 60, 220);
    const y0 = A.y + 16, x0 = A.x, b = A.b;
    const xE = x0 + b * 0.55;                  // der Termin
    const P = 8, tz = zeit % P;
    const jetzt = x0 + b * clamp(tz / P, 0, 1);   // der Zeitzeiger
    // der Kurs: flach mit etwas Rauschen, vor dem Termin schon ein Stueck hinauf, am Termin der Sprung, danach die zweite Welle
    const z = zufall(53);
    const kurs = (x) => {
      const u = (x - x0) / b;
      let y = 0.42;
      if (u > 0.42) y += (u - 0.42) * 0.5;                           // ein Teil steht schon im Kurs
      if (u > 0.55) y += 0.25;                                       // der Sprung
      if (u > 0.55 && u < 0.62) y += 0.06 * Math.sin(((u - 0.55) / 0.07) * Math.PI);   // die Reaktion
      if (u > 0.62) y += 0.04 * Math.sin(((u - 0.62) / 0.12) * Math.PI);                 // die zweite Welle
      return y;
    };
    ctx.strokeStyle = F.tinte; ctx.lineWidth = 1.5; ctx.beginPath();
    let n = 0;
    for (let x = x0; x <= jetzt; x += 2) { const y = y0 + hK - (kurs(x) + (z() - 0.5) * 0.02) * hK; if (n++ === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
    // der Termin
    const aT = stueck(t, 0.1, 0.3);
    ctx.globalAlpha *= aT;
    ctx.strokeStyle = F.rand2; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(xE, y0); ctx.lineTo(xE, y0 + hK); ctx.stroke(); ctx.setLineDash([]);
    rahmen(xE - 9, y0 - 2, 18, 14, F.tinte); ctx.fillStyle = F.tinte; ctx.fillRect(xE - 9, y0 - 2, 18, 4);
    text(T("Zahlen, Beschluss, Termin", "figures, decision, date"), xE, y0 - 8, mono(10), F.matt, "center");
    ctx.globalAlpha /= aT;
    // die Beschriftungen kommen, wenn der Zeiger vorbei ist
    if (jetzt > x0 + b * 0.5) text(T("ein Teil steht schon im Kurs", "part of it is already in the price"), x0 + b * 0.47, y0 + hK - 0.46 * hK + 24, mono(10), F.matt, "right");
    if (jetzt > x0 + b * 0.6) {
      ctx.fillStyle = F.gruen; ctx.fillRect(xE, y0 + hK - 2, b * 0.07, 4);
      text(T("Reaktion: Millisekunden", "reaction: milliseconds"), xE, y0 + hK + 14, mono(10), F.gruen);
    }
    if (jetzt > x0 + b * 0.66) {
      const xL = x0 + b * 0.66;
      ctx.fillStyle = F.rot; ctx.beginPath(); ctx.arc(xL, y0 + hK - kurs(xL) * hK, 4, 0, Math.PI * 2); ctx.fill();
      text(klein ? T("gelesen: die zweite Welle", "read it: the second wave") : T("wer die Nachricht erst liest, handelt die zweite Welle", "whoever reads the news first trades the second wave"), Math.min(xL + 8, x0 + b - (klein ? 160 : 330)), y0 + hK - kurs(xL) * hK - 12, mono(10), F.rot);
    }
  }

  // 08 Orderbuch: Auftraege auf der Leiter, einer erscheint und verschwindet
  function s8(t, zeit, A) {
    const hL = Math.min(A.h - 40, 230);
    const yT = A.y + 18;
    const xM = A.x + A.b * 0.5;
    const stufen = 6, sh = hL / (2 * stufen + 1);
    const bMax = Math.min(A.b * 0.42, 220);
    const P = 6, tz = zeit % P;
    const falsch = tz >= 2 && tz < 3.5;        // der grosse Auftrag, der nur gesehen werden will
    const aL = stueck(t, 0, 0.3);
    ctx.globalAlpha *= aL;
    let kauf = 0, verkauf = 0;
    for (let j = 0; j < stufen; j++) {
      const yV = yT + j * sh, yK = yT + (stufen + 1 + j) * sh;
      const gV = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(zeit * 1.1 + j * 1.7)), gK = 0.25 + 0.6 * (0.5 + 0.5 * Math.cos(zeit * 0.9 + j * 1.3));
      ctx.fillStyle = F.matt;
      ctx.globalAlpha *= 0.5;
      ctx.fillRect(xM + 6, yV + 2, bMax * gV, sh - 4);        // Verkaufsauftraege rechts
      ctx.fillRect(xM - 6 - bMax * gK, yK + 2, bMax * gK, sh - 4);   // Kaufauftraege links
      ctx.globalAlpha /= 0.5;
      verkauf += gV; kauf += gK;
      if (j === 1 && falsch) {
        const a = stueck(tz, 2, 2.3) * (1 - stueck(tz, 3.2, 3.5));
        ctx.globalAlpha *= a;
        ctx.fillStyle = F.tinte; ctx.fillRect(xM + 6 + bMax * gV, yV + 2, bMax * 0.9, sh - 4);
        // Beschriftung links der Mitte (dort ist oberhalb der Linie frei), auf Hoehe des Auftrags
        const zeilen = [T("ein großer Auftrag,", "a large order,"), T("um gesehen zu werden,", "placed to be seen,"), T("gleich wieder weg", "withdrawn right away")];
        for (let z = 0; z < zeilen.length; z++) text(zeilen[z], xM - 12, yV + sh / 2 - 8 + z * 12, mono(10), F.rot, "right");
        ctx.globalAlpha /= a;
        verkauf += 0.9 * a;
      }
    }
    // die Mitte und der naechste kleine Schritt, aus dem Draengeln gelesen
    const yMitte = yT + stufen * sh + sh / 2;
    ctx.strokeStyle = F.tinte; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xM - bMax - 10, yMitte); ctx.lineTo(xM + bMax + 10, yMitte); ctx.stroke();
    const druck = kauf - verkauf;
    pfeil(xM, yMitte + (druck > 0 ? 14 : -14), xM, yMitte + (druck > 0 ? -10 : 10), druck > 0 ? F.gruen : F.rot);
    text(T("Verkaufsaufträge", "sell orders"), xM + 6, yT - 6, mono(10), F.matt);
    text(T("Kaufaufträge", "buy orders"), xM - 6, yT + hL + 14, mono(10), F.matt, "right");
    text(T("nächster Schritt?", "next step?"), xM + 20, yMitte + 16, mono(10), F.matt);
    ctx.globalAlpha /= aL;
    const aZ = stueck(t, 0.5, 0.75);
    ctx.globalAlpha *= aZ;
    text(T("gilt für Sekunden, nicht für Tage: ", "holds for seconds, not days: ") + String(Math.floor(tz) + 1) + " s", A.x, A.y + A.h - 4, mono(10), F.matt);
    ctx.globalAlpha /= aZ;
  }

  // 09 Und bei uns: Muster im Kursverlauf -- nicht Arbitrage, nicht Hochfrequenz
  function s9(t, zeit, A) {
    const klein = k.klein;
    const bK = Math.min(A.b * 0.42, 300), hK = Math.min(A.h * 0.45, 150);
    const y0 = A.y + 24;
    const xL = A.x + (klein ? 0 : A.b * 0.05), xR = A.x + A.b - bK - (klein ? 0 : A.b * 0.05);
    const lauf = zeit * 7;
    const aA = stueck(t, 0, 0.3);
    ctx.globalAlpha *= aA;
    reiheLinie(TREND, lauf, 160, xL, y0, bK, hK, 1, F.tinte, 1.5);
    text(T("Bewegung, die weiterläuft", "movement that keeps running"), xL, y0 + hK + 16, mono(11), F.tinte);
    ctx.globalAlpha /= aA;
    const aB = stueck(t, 0.2, 0.5);
    ctx.globalAlpha *= aB;
    reiheLinie(MITTEL, lauf + 100, 160, klein ? xL : xR, klein ? y0 + hK + 40 : y0, bK, hK, 1, F.tinte, 1.5);
    text(T("Ausschläge, die zurückkommen", "spikes that come back"), klein ? xL : xR, (klein ? y0 + hK + 40 : y0) + hK + 16, mono(11), F.tinte);
    ctx.globalAlpha /= aB;
    // nicht bei uns: Arbitrage und Hochfrequenz -- Leitungen und Standorte
    const aN = stueck(t, 0.5, 0.8);
    if (aN > 0) {
      ctx.globalAlpha *= aN;
      const yN = A.y + A.h - 26, xN = A.x + A.b / 2;
      ctx.strokeStyle = F.rand2; ctx.lineWidth = 1.5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(xN - 90, yN); ctx.lineTo(xN + 90, yN); ctx.stroke();
      rahmen(xN - 104, yN - 12, 14, 24, F.rand2); rahmen(xN + 90, yN - 12, 14, 24, F.rand2);
      kreuz(xN, yN, 18, F.rot, 1);
      text(klein ? T("Arbitrage, Hochfrequenz: nicht bei uns", "arbitrage, high frequency: not here") : T("Arbitrage und Hochfrequenzhandel nicht: Leitungen und Standorte, die sich eine kleine Firma nicht kauft", "not arbitrage and high-frequency trading: lines and locations a small firm does not buy"), xN, yN - 20, mono(10), F.matt, "center");
      ctx.globalAlpha /= aN;
    }
  }

  return { laengen: [2.0, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75, 2.75], zeichner: [s0, s1, s2, s3, s4, s5, s6, s7, s8, s9] };
};

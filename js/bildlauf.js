// ---------- Bildlauf: eine Seite als Folge lebender Bilder beim Scrollen ----------
// Der Motor fuer pruefung.html (js/bilder-pruefung.js) und sicherheit.html
// (js/bilder-sicherheit.js). Julian, 11.10.2026, zur Pruefungen-Seite: "alles
// wegmachen und stattdessen eine Animation, die beim Runterscrollen erklaert, was
// genau geprueft wird, wie usw. -- wenig Text, mehr Animation; ganz am Ende soll
// alles in Form des JKHD-Logos plus Spruch fliessen"; dann: "pro Thema zehnmal
// laenger zum Scrollen, wenn alles aufgetaucht ist; die Uebergaenge schoener,
// nach oben weiterscrollen"; dann: "die Diagramme sollen sich bis zum Ende
// bewegen; den ersten Text auch als Animation; beim Firmenlogo am Ende das
// nehmen, was ganz oben auf der Startseite steht; die Punkte sollen von unten
// kommen"; und: "dasselbe bei Sicherheit".
//
// Aufbau: ein Abschnitt <section class="bildlauf" id="bildlauf" data-bilder="...">
// mit einer klebenden Buehne (.bildlauf-buehne), darin die Leinwand und je Bild
// ein Text (.bildlauf-text, der erste mit der Ueberschrift der Seite). Die Bilder
// selbst stehen in js/bilder-<name>.js und melden sich als Fabrik unter
// window.JKHDBilder.<name> an; sie bekommen von hier einen Werkzeugkasten `k`
// (Leinwand, Farben, Zeichenhilfen) und liefern je Bild eine Zeichenfunktion
// (t, zeit, A): t ist der Aufbau 0..1 mit dem Scrollen, zeit die Uhr in Sekunden
// (die Bilder bewegen sich auch, wenn niemand scrollt), A die Flaeche ueber dem
// Text. Ohne JavaScript stehen die Texte als Liste untereinander, bei
// "reduzierter Bewegung" ebenso, mit dem Schlussbild still darueber.
//
// Der Scrollweg ist in Einheiten von je etwa einer Bildschirmhoehe geteilt (die
// Fabrik nennt je Bild seine Laenge). Jedes Bild schiebt sich von unten herein
// (SCHUB), baut sich auf (AUFBAU) und steht dann still, bis das naechste es nach
// oben hinausschiebt -- Text und Zeichnung als ein Block. (Julian, 11.10.2026
// abends: die Haltezeit wieder halbiert -- je Bild 2,75 Einheiten, der Titel 2.) Am Ende (ENDE Einheiten)
// steigen Punkte von unterhalb der Buehne auf und werden zum Zeichen der
// Startseite (Balken, JKHD, Strich, Quant Systems, Just Know How to Dominate.);
// danach steht es eine Bildschirmhoehe lang (zugabe).
(function () {
  const abschnitt = document.querySelector(".bildlauf[data-bilder]");
  if (!abschnitt) return;
  const fabrik = (window.JKHDBilder || {})[abschnitt.dataset.bilder];
  if (!fabrik) return;
  const buehne = abschnitt.querySelector(".bildlauf-buehne");
  const leinwand = abschnitt.querySelector(".bildlauf-leinwand");
  const ctx = leinwand.getContext("2d");
  if (!ctx) return;
  const texte = Array.from(abschnitt.querySelectorAll(".bildlauf-text"));
  const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)");
  const EN = (document.documentElement.lang || "").toLowerCase().startsWith("en");
  const T = (de, en) => (EN ? en : de);

  // ---- Hilfen ----
  function zufall(saat) {
    let a = saat >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const glatt = (t) => t * t * (3 - 2 * t);
  const stueck = (p, von, bis) => glatt(clamp((p - von) / (bis - von), 0, 1));
  const misch = (a, b, t) => a + (b - a) * t;
  const dreieck = (u) => { const f = u - Math.floor(u); return f < 0.5 ? f * 2 : 2 - f * 2; };   // 0..1..0

  // ---- Farben und Schriften aus dem Stil der Seite (hell oder dunkel) ----
  // F wird an Ort und Stelle aktualisiert, damit die Bilder es festhalten koennen
  const F = {};
  function farbenLesen() {
    const cs = getComputedStyle(document.documentElement);
    const v = (name, sonst) => (cs.getPropertyValue(name) || "").trim() || sonst;
    Object.assign(F, {
      grund: v("--bg", "#f7f6f3"),
      tinte: v("--text", "#101012"),
      matt: v("--muted", "#605f5b"),
      rand: v("--border", "#e2dfd8"),
      rand2: v("--border-2", "#bdbab2"),
      rot: v("--vip", "#b3261e"),
      gruen: v("--ok", "#2e7d4f"),
      mono: v("--mono", "Consolas, monospace"),
      sans: v("--sans", "system-ui, sans-serif"),
    });
  }
  const mono = (px, gewicht) => `${gewicht || 500} ${px}px ${F.mono}`;
  const sans = (px, gewicht) => `${gewicht || 600} ${px}px ${F.sans}`;
  // Die Beschriftungen der Bilder (k.mono) wachsen mit der Breite der Buehne: Die Bilder
  // sind mit 10-12 px gezeichnet, auf einem Laptop mit 1366 px war das winzig (Loop
  // 29.10.2026, Punkt 1.2). Ab 1100 px x1,2, ab 700 px x1,1, am Handy wie gezeichnet; das
  // Zeichen am Ende (lockupZeichnen) nimmt die rohe mono().
  const schriftSkala = () => (klein ? 1 : B >= 1100 ? 1.2 : 1.1);
  // ... und rastet auf die Skala der Seite ein (Label 11, Caption 13, Klein 15, Text 17): vorher standen
  // 12 und 14 px (Laptop) bzw. 10, 12 und 14 px (Handy) zwischen den Stufen (Loop 2, A8/3.3)
  const SCHRIFT_REIHE = [11, 13, 15, 17];
  const einrasten = (px) => SCHRIFT_REIHE.reduce((best, s) => {
    const d = Math.abs(s - px), db = Math.abs(best - px);
    return d < db || (d === db && s > best) ? s : best;   // bei Gleichstand die groessere Stufe
  }, SCHRIFT_REIHE[0]);
  const monoBild = (px, gewicht) => mono(einrasten(px * schriftSkala()), gewicht);

  // ---- Groesse ----
  let B = 0, H = 0, dpr = 1, klein = false;
  let textHoehen = [];
  function groesseAnpassen() {
    const r = leinwand.getBoundingClientRect();
    B = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    klein = B < 700;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    leinwand.width = Math.round(B * dpr);
    leinwand.height = Math.round(H * dpr);
    // Abstand des Textblocks vom unteren Rand aus dem Stil (56 px, unter 900 px 84 px
    // wegen des Fragen-Knopfs) plus Luft zur Zeichnung
    const box = texte[0] && texte[0].parentElement;
    const unten = (box && parseFloat(getComputedStyle(box).bottom)) || 56;
    textHoehen = texte.map((el) => (el.offsetHeight || 160) + unten + 28);
    teilchen = null;
    k.B = B; k.H = H; k.klein = klein;
    zugabeMessen();
  }
  // Die Flaeche fuer die Zeichnung eines Bildes: ueber seinem Text, mit Rand
  function flaeche(i) {
    const rand = klein ? 20 : 48;
    const oben = klein ? 20 : 32;
    const unten = textHoehen[i] || 200;
    return { x: rand, y: oben, b: B - 2 * rand, h: Math.max(120, H - unten - oben) };
  }

  // ---- Zeichenhilfen fuer die Bilder ----
  function text(s, x, y, font, farbe, lage, basis) {
    ctx.font = font;
    ctx.fillStyle = farbe;
    ctx.textAlign = lage || "left";
    ctx.textBaseline = basis || "alphabetic";
    ctx.fillText(s, x, y);
  }
  // Wie text(), aber der Text bleibt im Bild: an den Seitenrand gedrueckt, wenn er
  // sonst hinausliefe (am Handy liefen Beschriftungen ueber den Rand, Vollpruefung 11.10.2026)
  function textHalten(s, x, y, font, farbe, lage, basis) {
    ctx.font = font;
    const w = ctx.measureText(s).width, rand = klein ? 10 : 16;
    const l = lage || "left";
    let links = l === "right" ? x - w : l === "center" ? x - w / 2 : x;
    links = Math.max(rand, Math.min(B - rand - w, links));
    text(s, links, y, font, farbe, "left", basis);
  }
  // Wie text(), aber mit einem Kasten in Seitenfarbe dahinter: Linien, die durch die
  // Beschriftung liefen, sind dort verdeckt
  function textFrei(s, x, y, font, farbe, lage, basis) {
    ctx.font = font;
    const m = ctx.measureText(s);
    const w = m.width, oben = m.actualBoundingBoxAscent || 8, unten = m.actualBoundingBoxDescent || 3;
    const l = lage || "left";
    const links = l === "right" ? x - w : l === "center" ? x - w / 2 : x;
    ctx.fillStyle = F.grund;
    ctx.fillRect(links - 4, y - oben - 3, w + 8, oben + unten + 6);
    text(s, x, y, font, farbe, lage, basis);
  }
  function haken(x, y, gr, farbe, a) {
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.strokeStyle = farbe;
    ctx.lineWidth = Math.max(1.5, gr * 0.14);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x - gr * 0.45, y + gr * 0.02);
    ctx.lineTo(x - gr * 0.12, y + gr * 0.36);
    ctx.lineTo(x + gr * 0.48, y - gr * 0.36);
    ctx.stroke();
    ctx.restore();
  }
  function kreuz(x, y, gr, farbe, a) {
    ctx.save();
    ctx.globalAlpha *= a;
    ctx.strokeStyle = farbe;
    ctx.lineWidth = Math.max(1.5, gr * 0.14);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x - gr * 0.4, y - gr * 0.4);
    ctx.lineTo(x + gr * 0.4, y + gr * 0.4);
    ctx.moveTo(x + gr * 0.4, y - gr * 0.4);
    ctx.lineTo(x - gr * 0.4, y + gr * 0.4);
    ctx.stroke();
    ctx.restore();
  }
  // Eine Kursreihe aus Zufall (feste Saat), die sich ohne Sprung wiederholt: der
  // Gang endet, wo er begann -- so kann sie endlos durchs Bild laufen
  function reiheRund(saat, n) {
    const z = zufall(saat);
    const w = [0];
    for (let i = 1; i < n; i++) w.push(w[i - 1] + (z() - 0.5));
    const ende = w[n - 1];
    for (let i = 0; i < n; i++) w[i] -= (ende * i) / (n - 1);
    return normiert(w);
  }
  function normiert(w) {
    let lo = Infinity, hi = -Infinity;
    for (const v of w) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
    return w.map((v) => 0.12 + ((v - lo) / (hi - lo || 1)) * 0.76);
  }
  // Dieselben Schritte in zerstoerter Reihenfolge: kein Zusammenhang mehr, aber
  // ebenfalls rund (die Summe der Schritte bleibt null)
  function zerstoertRund(w, saat) {
    const z = zufall(saat);
    const schritte = [];
    for (let i = 1; i < w.length; i++) schritte.push(w[i] - w[i - 1]);
    for (let i = schritte.length - 1; i > 0; i--) { const j = Math.floor(z() * (i + 1)); const t = schritte[i]; schritte[i] = schritte[j]; schritte[j] = t; }
    const aus = [w[0]];
    for (const s of schritte) aus.push(aus[aus.length - 1] + s);
    return normiert(aus);
  }
  // Eine Reihe mit Drift (eingebauter Effekt), nicht rund
  function reiheDrift(saat, n, drift) {
    const z = zufall(saat);
    const w = [0];
    for (let i = 1; i < n; i++) w.push(w[i - 1] + (z() - 0.5) + drift);
    return normiert(w);
  }
  // Wert einer runden Reihe an einer Bruchstelle (linear dazwischen)
  function wert(w, s) {
    const n = w.length;
    let i = Math.floor(s);
    const f = s - i;
    i = ((i % n) + n) % n;
    return w[i] + (w[(i + 1) % n] - w[i]) * f;
  }
  // Eine Linie aus `anzahl` Werten einer runden Reihe ab Stelle `ab`, ueber die Breite b;
  // `anteil` (0..1) zeichnet nur den Anfang (fuer den Aufbau)
  function linieRund(w, ab, anzahl, x0, y0, b, h, anteil, farbe, staerke) {
    const n = Math.max(2, Math.floor(anzahl * anteil));
    ctx.strokeStyle = farbe;
    ctx.lineWidth = staerke || 1.5;   /* Rolle Kurve/Linie (Loop 2, A8/3.3) */
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = x0 + (i / (anzahl - 1)) * b, y = y0 + h - wert(w, ab + i) * h;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  function linie(w, x0, y0, b, h, anteil, farbe, staerke) {
    const n = Math.max(2, Math.min(w.length, Math.floor(w.length * anteil)));
    ctx.strokeStyle = farbe;
    ctx.lineWidth = staerke || 1.5;   /* Rolle Kurve/Linie (Loop 2, A8/3.3) */
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = x0 + (i / (w.length - 1)) * b, y = y0 + h - w[i] * h;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // Die Form eines Herzschlags ueber eine Periode (ph 0..1): Hoehe -1..0,25
  function puls(ph) {
    if (ph < 0.12) return -(ph / 0.12);
    if (ph < 0.24) return -(1 - (ph - 0.12) / 0.12);
    if (ph < 0.3) return 0.25 * ((ph - 0.24) / 0.06);
    if (ph < 0.36) return 0.25 * (1 - (ph - 0.3) / 0.06);
    return 0;
  }
  // Ein Vorhaengeschloss, `offen` 0..1 hebt den Buegel
  function schloss(cx, cy, gr, offen, farbe) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = farbe; ctx.fillStyle = farbe; ctx.lineWidth = Math.max(1.5, gr * 0.09); ctx.lineCap = "round";
    const r = gr / 2;
    ctx.fillRect(-r * 0.8, -r * 0.1, r * 1.6, r * 1.1);
    const hub = -offen * r * 0.45;
    ctx.beginPath();
    ctx.moveTo(-r * 0.45, -r * 0.1 + hub);
    ctx.lineTo(-r * 0.45, -r * 0.5 + hub);
    ctx.arc(0, -r * 0.5 + hub, r * 0.45, Math.PI, 0);
    ctx.lineTo(r * 0.45, -r * 0.1 + (offen > 0.02 ? hub + r * 0.2 : 0));
    ctx.stroke();
    ctx.restore();
  }

  // Der Werkzeugkasten fuer die Bilder (B, H, klein werden bei jeder Groesse neu gesetzt)
  const k = { ctx, F, T, text, textHalten, textFrei, haken, kreuz, linie, linieRund, reiheRund, zerstoertRund, reiheDrift, wert, puls, schloss, mono: monoBild, sans, stueck, clamp, glatt, misch, dreieck, zufall, B: 0, H: 0, klein: false };

  // ---- Das Ende: Punkte steigen von unten auf und werden zum Zeichen der Startseite ----
  // Das Zeichen, wie es ganz oben auf der Startseite steht: die Balken, JKHD, ein
  // Strich, "Quant Systems" und darunter "Just Know How to Dominate." -- hier
  // groesser, in der Mitte der Buehne
  function wortBreite(c, s, abst) {
    let w = 0;
    for (const ch of s) w += c.measureText(ch).width + abst;
    return w - abst;
  }
  function gesperrt(c, s, x, y, abst) {
    for (const ch of s) { c.fillText(ch, x, y); x += c.measureText(ch).width + abst; }
  }
  // Die Anfangsbuchstaben J, K, H, D in der Tinte, der Rest matt -- wie `.brand-line2 b` im CSS (31.10.2026)
  function gesperrtInitialen(c, s, x, y, abst, tinte, matt) {
    for (const ch of s) { c.fillStyle = /[A-Z]/.test(ch) ? tinte : matt; c.fillText(ch, x, y); x += c.measureText(ch).width + abst; }
  }
  function lockupMasse(c) {
    const kf = klein ? 1.0 : B < 1100 ? 1.7 : 2.1;   // Vergroesserung gegen den Hero (38 px Balken)
    const bal = 38 * kf, luecke = 16 * kf;
    const wort = 19.2 * kf, strich = 40 * kf, zeile1 = 16 * kf, zeile2 = 11.5 * kf;
    c.save();
    c.font = sans(wort, 800);
    const wortB = wortBreite(c, "JKHD", wort * 0.34);
    c.font = sans(zeile1, 700);
    const z1B = wortBreite(c, "Quant Systems", zeile1 * 0.05);
    c.font = mono(zeile2);
    const z2B = wortBreite(c, "Just Know How to Dominate.", zeile2 * 0.03);
    c.restore();
    const tagB = Math.max(z1B, z2B);
    const gesamt = bal + luecke + wortB + luecke + 1 + luecke + tagB;
    return { kf, bal, luecke, wort, strich, zeile1, zeile2, wortB, x0: B / 2 - gesamt / 2, cy: H * 0.46 };
  }
  function lockupZeichnen(a, g, farbe) {
    const c = g || ctx;
    const m = lockupMasse(c);
    c.save();
    c.globalAlpha *= a;
    c.textAlign = "left";
    c.textBaseline = "middle";
    // die Balken (viewBox 100: Rechtecke 10/22/20/56, 40/8/20/84, 70/22/20/56)
    c.fillStyle = farbe || F.tinte;
    const s = m.bal / 100, bx = m.x0, by = m.cy - m.bal / 2;
    c.fillRect(bx + 10 * s, by + 22 * s, 20 * s, 56 * s);
    c.fillRect(bx + 40 * s, by + 8 * s, 20 * s, 84 * s);
    c.fillRect(bx + 70 * s, by + 22 * s, 20 * s, 56 * s);
    let x = bx + m.bal + m.luecke;
    c.font = sans(m.wort, 800);
    gesperrt(c, "JKHD", x, m.cy + m.wort * 0.04, m.wort * 0.34);
    x += m.wortB + m.luecke;
    c.fillStyle = farbe || F.rand2;
    c.fillRect(x, m.cy - m.strich / 2, Math.max(1, m.kf * 0.6), m.strich);
    x += 1 + m.luecke;
    c.fillStyle = farbe || F.tinte;
    c.font = sans(m.zeile1, 700);
    gesperrt(c, "Quant Systems", x, m.cy - m.zeile1 * 0.55, m.zeile1 * 0.05);
    c.font = mono(m.zeile2);
    gesperrtInitialen(c, "Just Know How to Dominate.", x, m.cy + m.zeile2 * 0.85, m.zeile2 * 0.03, farbe || F.tinte, farbe || F.matt);
    c.restore();
  }
  let teilchen = null;
  function teilchenBauen() {
    // das Zeichen abtasten (weiss auf schwarz auf einer Hilfsleinwand)
    const c = document.createElement("canvas");
    c.width = B; c.height = H;
    const g = c.getContext("2d");
    g.fillStyle = "#000"; g.fillRect(0, 0, B, H);
    lockupZeichnen(1, g, "#fff");
    const d = g.getImageData(0, 0, B, H).data;
    const ziele = [];
    const hoechstens = klein ? 2000 : 3400;
    let schritt = 2;
    for (;;) {
      ziele.length = 0;
      for (let y = 0; y < H; y += schritt) for (let x = 0; x < B; x += schritt) { if (d[(y * B + x) * 4] > 110) ziele.push([x, y]); }
      if (ziele.length <= hoechstens || schritt >= 5) break;
      schritt++;
    }
    if (!ziele.length) return null;
    // jeder Zielpunkt bekommt einen Punkt, der unten ausserhalb der Buehne beginnt und
    // auf einem Bogen aufsteigt; die linken etwas frueher als die rechten
    const z = zufall(23);
    const punkte = [];
    let xl = Infinity, xr = -Infinity;
    for (const zi of ziele) { xl = Math.min(xl, zi[0]); xr = Math.max(xr, zi[0]); }
    for (const zi of ziele) {
      const x0 = misch(xl, xr, z()) + (z() - 0.5) * B * 0.3;
      const y0 = H + 10 + z() * H * 0.45;
      punkte.push({
        x0, y0,
        x1: zi[0] + (z() - 0.5) * 0.8, y1: zi[1] + (z() - 0.5) * 0.8,
        kx: (x0 + zi[0]) / 2 + (z() - 0.5) * B * 0.25,
        ky: (y0 + zi[1]) / 2 + (z() - 0.3) * H * 0.3,
        start: ((zi[0] - xl) / Math.max(1, xr - xl)) * 0.14 + z() * 0.16,
        gr: 1.4 + z() * 1.2,
      });
    }
    return { punkte };
  }
  function ende(t) {
    if (t >= 1) { lockupZeichnen(1); return; }
    if (!teilchen) teilchen = teilchenBauen();
    if (!teilchen) { lockupZeichnen(stueck(t, 0, 0.3)); return; }
    const DAUER = 0.6;
    ctx.fillStyle = F.tinte;
    ctx.globalAlpha = 0.9 * (1 - stueck(t, 0.9, 1) * 0.85);
    for (const pt of teilchen.punkte) {
      // schnell herein, langsam ankommen
      const e = 1 - Math.pow(1 - clamp((t - pt.start) / DAUER, 0, 1), 2.2);
      const u = 1 - e;
      const x = u * u * pt.x0 + 2 * u * e * pt.kx + e * e * pt.x1;
      const y = u * u * pt.y0 + 2 * u * e * pt.ky + e * e * pt.y1;
      const gr = misch(pt.gr, 1.6, e);
      ctx.fillRect(x - gr / 2, y - gr / 2, gr, gr);
    }
    ctx.globalAlpha = 1;
    lockupZeichnen(stueck(t, 0.86, 1));
  }

  // ---- Die Bilder: aus der Fabrik der Seite ----
  const satz = fabrik(k);
  const ZEICHNER = satz.zeichner;
  const LAENGEN = satz.laengen;
  const ENDE = satz.ende || 2.0;
  const GESAMT = LAENGEN.reduce((a, b) => a + b, 0) + ENDE;
  const SCHUB = 0.6 / GESAMT;     // so lange schiebt sich ein Bild herein (und das vorige hinaus)
  const AUFBAU = 1.0 / GESAMT;    // so lange baut sich ein Bild auf, vom Beginn des Schubs an
  const ANFANG = [];
  { let s = 0; for (const l of LAENGEN) { ANFANG.push(s / GESAMT); s += l; } }
  const ENDE_VON = (GESAMT - ENDE) / GESAMT;   // hier ist das letzte Bild hinaus; die Punkte steigen schon einen Schub frueher auf
  // null, wenn das Bild nicht im Blick ist; sonst der Versatz dy (nach unten positiv)
  // und der Aufbau t (0..1). Das erste Bild schiebt sich nicht herein.
  function lage(i, p) {
    const von = ANFANG[i], bis = i + 1 < ANFANG.length ? ANFANG[i + 1] : ENDE_VON;
    const erstes = i === 0;
    const ab = erstes ? 0 : von - SCHUB;
    if (p < ab || p >= bis) return null;
    let dy = 0;
    if (!erstes) dy += (1 - stueck(p, von - SCHUB, von)) * H;
    dy -= stueck(p, bis - SCHUB, bis) * H;
    return { dy, t: clamp((p - ab) / AUFBAU, 0, 1) };
  }

  // ---- Ein Bild ----
  function bild(p, still, zeit) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = F.grund;
    ctx.fillRect(0, 0, B, H);
    if (still) { lockupZeichnen(1); return; }
    for (let i = 0; i < ZEICHNER.length; i++) {
      const l = lage(i, p);
      if (!l) continue;
      ctx.save();
      ctx.translate(0, l.dy);
      ZEICHNER[i](l.t, zeit, flaeche(i));
      ctx.restore();
    }
    if (p >= ENDE_VON - SCHUB) ende(clamp((p - (ENDE_VON - SCHUB)) / (1 - ENDE_VON + SCHUB), 0, 1));
  }

  // ---- Die Texte: Text i gehoert zu Bild i und bewegt sich mit ihm ----
  function texteZeigen(p) {
    for (let i = 0; i < texte.length; i++) {
      const el = texte[i];
      const l = i < ZEICHNER.length ? lage(i, p) : null;
      const a = l ? 1 : 0, dy = l ? l.dy : 0;
      el.style.opacity = a.toFixed(3);
      el.style.transform = Math.abs(dy) > 0.5 ? `translateY(${dy.toFixed(1)}px)` : "none";
      el.classList.toggle("ist-weg", a <= 0);
    }
  }

  // ---- Fortschritt, Schleife ----
  let kleben = 0, zugabe = 0;
  function zugabeMessen() {
    const weg = abschnitt.offsetHeight - buehne.offsetHeight;
    zugabe = weg > 0 && !reduziert.matches ? clamp(H / weg, 0, 0.3) : 0;
  }
  function zielFortschritt() {
    const r = abschnitt.getBoundingClientRect();
    const weg = abschnitt.offsetHeight - buehne.offsetHeight;
    if (weg <= 0) return 1;
    const p = clamp((kleben - r.top) / weg, 0, 1);
    return clamp(p / Math.max(0.01, 1 - zugabe), 0, 1);
  }
  let p = 0, laeuft = false, letzte = 0;
  function schleife(jetzt) {
    if (!laeuft) return;
    const dt = Math.min(0.05, (jetzt - letzte) / 1000 || 0.016);
    letzte = jetzt;
    const zielP = zielFortschritt();
    p += (zielP - p) * (1 - Math.exp(-dt * 7));
    if (Math.abs(zielP - p) < 0.0003) p = zielP;
    // jedes Bild wird gezeichnet: die Bilder bewegen sich auch, wenn niemand scrollt
    bild(p, false, jetzt / 1000);
    texteZeigen(p);
    requestAnimationFrame(schleife);
  }
  function starten() {
    if (laeuft || reduziert.matches) return;
    laeuft = true;
    letzte = performance.now();
    p = zielFortschritt();
    requestAnimationFrame(schleife);
  }
  function anhalten() { laeuft = false; }
  function einrichten() {
    farbenLesen();
    abschnitt.classList.toggle("ist-still", reduziert.matches);
    kleben = parseFloat(getComputedStyle(buehne).top) || 0;
    groesseAnpassen();
    if (reduziert.matches) { anhalten(); bild(1, true, 0); for (const el of texte) { el.style.opacity = ""; el.style.transform = ""; el.classList.remove("ist-weg"); } }
  }

  abschnitt.classList.add("ist-aktiv");
  einrichten();
  new IntersectionObserver((eintraege) => { if (eintraege.some((e) => e.isIntersecting)) starten(); else anhalten(); }).observe(abschnitt);
  window.addEventListener("resize", () => { groesseAnpassen(); if (reduziert.matches) bild(1, true, 0); });
  if (reduziert.addEventListener) reduziert.addEventListener("change", einrichten);
  // Farben wechseln mit der Darstellung (hell/dunkel): der Schalter setzt data-theme
  new MutationObserver(() => { farbenLesen(); teilchen = null; if (reduziert.matches) bild(1, true, 0); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { groesseAnpassen(); if (reduziert.matches) bild(1, true, 0); });
})();

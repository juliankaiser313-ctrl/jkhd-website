// ---------- Pruefungen: die Stufen als Animation beim Scrollen ----------
// Julian, 11.10.2026: "bei der Pruefung alles wegmachen und stattdessen eine
// Animation hinmachen, die beim Runterscrollen erklaert, was genau geprueft wird,
// wie usw. -- wenig Text, eher mehr mit Animationen; und ganz am Ende soll dann
// alles in Form des JKHD-Logos plus Spruch fliessen."
//
// Inhalt sind die fuenf Stufen, die Belastungsproben und die Grenze der Seite vom
// 23.09.2026 (damals gegen den Quelltext des Systems geprueft), nur gekuerzt --
// nichts Neues, keine Zahlen, die nicht dort standen. Die Texte je Bild stehen
// als echter Inhalt in der Seite (.pruefung-text); dieses Skript blendet sie
// mit dem Scrollen ein und zeichnet dazu auf die Leinwand. Ohne JavaScript steht
// alles als Liste untereinander, bei "reduzierter Bewegung" ebenso, mit dem
// Schlussbild (Zeichen und Spruch) still darueber.
//
// Der Scrollfortschritt p durch den Abschnitt #pruefung (die Buehne klebt):
//   0,00-0,16  01 Zuerst rot: ein Feld von Tests, jeder wird erst rot, dann gruen;
//              ein paar bleiben leer -- leer ist nichts bewiesen
//   0,16-0,30  02 Eingefrorener Vergleichslauf: zwei Baender werden Zeile fuer Zeile
//              verglichen (bitgleich); eine andere Vorgabe muss anders ausfallen;
//              fehlt die Vergleichsdatei, ist es rot, nicht uebersprungen
//   0,30-0,46  03 Suche gegen den Zufall: Suche vorn, Bestaetigung hinten, die
//              Randzone faellt heraus, das rollende Fenster; dieselbe Suche ueber
//              eine zerstoerte Reihe und eine mit eingebautem Effekt
//   0,46-0,60  04 Schattenbetrieb: Signale laufen ohne Geld durch die Sperren
//              (Regimefilter, Wiederholungs-Stop, eine Position) in die Evidenz
//   0,60-0,72  05 Ueberwachter Dauerbetrieb: das Lebenszeichen, der Prozess steht
//              (steht aber noch in der Liste), der Waechter beendet, der naechste
//              Durchgang startet neu
//   0,72-0,85  Belastungsproben: sechs Ausfaelle treffen das System, je mit dem,
//              was dabei herauskommen muss
//   0,85-0,91  Grenze: die fuenf Stufen als Zeichen in einer Reihe, darunter der
//              Strich, der vor dem echten Broker endet
//   0,91-1,00  Ende: alles auf der Leinwand wird zu Punkten, die zum Zeichen und
//              zum Spruch fliessen; danach steht es eine Bildschirmhoehe lang
(function () {
  const abschnitt = document.getElementById("pruefung");
  if (!abschnitt) return;
  const buehne = abschnitt.querySelector(".pruefung-buehne");
  const leinwand = abschnitt.querySelector(".pruefung-leinwand");
  const ctx = leinwand.getContext("2d");
  if (!ctx) return;
  const texte = Array.from(abschnitt.querySelectorAll(".pruefung-text")).map((el) => ({ el, von: parseFloat(el.dataset.von), bis: parseFloat(el.dataset.bis) }));
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

  // ---- Farben und Schriften aus dem Stil der Seite (hell oder dunkel) ----
  let F = {};
  function farbenLesen() {
    const cs = getComputedStyle(document.documentElement);
    const v = (name, sonst) => (cs.getPropertyValue(name) || "").trim() || sonst;
    F = {
      grund: v("--bg", "#f7f6f3"),
      tinte: v("--text", "#101012"),
      matt: v("--muted", "#605f5b"),
      rand: v("--border", "#e2dfd8"),
      rand2: v("--border-2", "#bdbab2"),
      rot: v("--vip", "#b3261e"),
      gruen: v("--ok", "#2e7d4f"),
      mono: v("--mono", "Consolas, monospace"),
      sans: v("--sans", "system-ui, sans-serif"),
    };
    F.grundRgb = farbeRgb(F.grund);
  }
  // Eine CSS-Farbe als [r, g, b] -- ueber die Leinwand, damit auch #abc oder rgb() gehen
  const farbSonde = document.createElement("canvas");
  farbSonde.width = farbSonde.height = 1;
  function farbeRgb(farbe) {
    const g = farbSonde.getContext("2d");
    g.fillStyle = "#000";
    g.fillStyle = farbe;
    g.fillRect(0, 0, 1, 1);
    const d = g.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2]];
  }
  const mono = (px, gewicht) => `${gewicht || 500} ${px}px ${F.mono}`;
  const sans = (px, gewicht) => `${gewicht || 600} ${px}px ${F.sans}`;

  // ---- Groesse ----
  let B = 0, H = 0, dpr = 1, klein = false, textHoehe = 200;
  function groesseAnpassen() {
    const r = leinwand.getBoundingClientRect();
    B = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    klein = B < 700;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    leinwand.width = Math.round(B * dpr);
    leinwand.height = Math.round(H * dpr);
    textHoehe = 0;
    for (const t of texte) textHoehe = Math.max(textHoehe, t.el.offsetHeight);
    textHoehe = (textHoehe || 160) + (klein ? 60 : 84);
    teilchen = null;
    zugabeMessen();
  }
  // Die Flaeche fuer die Zeichnung: ueber dem Text, mit Rand
  function flaeche() {
    const rand = klein ? 20 : 48;
    const oben = klein ? 20 : 32;
    return { x: rand, y: oben, b: B - 2 * rand, h: Math.max(120, H - textHoehe - oben) };
  }

  // ---- Die Szenen ----
  const SZENEN = [
    ["s1", 0, 0.16], ["s2", 0.16, 0.3], ["s3", 0.3, 0.46], ["s4", 0.46, 0.6],
    ["s5", 0.6, 0.72], ["s6", 0.72, 0.85], ["s7", 0.85, 0.91],
  ];
  const ENDE_VON = 0.91;      // ab hier fliessen die Punkte
  const UEBERGANG = 0.02;     // Ein- und Ausblenden einer Szene, in p

  // Kleine Zeichenhilfen
  function text(s, x, y, font, farbe, lage, basis) {
    ctx.font = font;
    ctx.fillStyle = farbe;
    ctx.textAlign = lage || "left";
    ctx.textBaseline = basis || "alphabetic";
    ctx.fillText(s, x, y);
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
  // Eine Kurslinie aus Zufall (feste Saat): n Punkte zwischen 0 und 1
  function reihe(saat, n, drift, sprung) {
    const z = zufall(saat);
    const w = [];
    let y = 0.5;
    for (let i = 0; i < n; i++) {
      y += (z() - 0.5) * 0.08 + (drift || 0);
      if (sprung && i === sprung) y += 0.18;
      y = clamp(y, 0.06, 0.94);
      w.push(y);
    }
    return w;
  }
  // Dieselben Schritte, aber in zerstoerter Reihenfolge (kein Zusammenhang mehr)
  function zerstoert(w, saat) {
    const z = zufall(saat);
    const schritte = [];
    for (let i = 1; i < w.length; i++) schritte.push(w[i] - w[i - 1]);
    for (let i = schritte.length - 1; i > 0; i--) { const j = Math.floor(z() * (i + 1)); const t = schritte[i]; schritte[i] = schritte[j]; schritte[j] = t; }
    const aus = [w[0]];
    for (const s of schritte) aus.push(clamp(aus[aus.length - 1] + s, 0.06, 0.94));
    return aus;
  }
  function linie(w, x0, y0, b, h, bis, farbe, staerke) {
    const n = Math.max(2, Math.min(w.length, Math.floor(w.length * bis)));
    ctx.strokeStyle = farbe;
    ctx.lineWidth = staerke || 1.6;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const x = x0 + (i / (w.length - 1)) * b, y = y0 + h - w[i] * h;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // 01 Zuerst rot: ein Feld von Tests
  function s1(t) {
    const A = flaeche();
    const z = 26, l = 10, schritt = z + l;
    const spalten = clamp(Math.floor((A.b + l) / schritt), 6, 14);
    const zeilen = clamp(Math.floor((A.h - 40 + l) / schritt), 3, 6);
    const n = spalten * zeilen;
    const bx = A.x + (A.b - (spalten * schritt - l)) / 2;
    const by = A.y + (A.h - 36 - (zeilen * schritt - l)) / 2;
    let rot = 0, gruen = 0, leer = 0;
    for (let i = 0; i < n; i++) {
      const x = bx + (i % spalten) * schritt, y = by + Math.floor(i / spalten) * schritt;
      const istLeer = (i * 7) % 23 === 0 && i > 0;
      const an = (i / n) * 0.78;
      const zustand = istLeer ? "leer" : t < an ? "offen" : t < an + 0.14 ? "rot" : "gruen";
      ctx.lineWidth = 1;
      if (zustand === "leer" || zustand === "offen") {
        ctx.strokeStyle = zustand === "leer" ? F.rand2 : F.rand;
        ctx.strokeRect(x + 0.5, y + 0.5, z - 1, z - 1);
        if (zustand === "leer" && t > an + 0.14) { leer++; }
      } else {
        const f = zustand === "rot" ? F.rot : F.gruen;
        ctx.fillStyle = f;
        ctx.globalAlpha *= zustand === "rot" ? 0.9 : 0.75;
        ctx.fillRect(x, y, z, z);
        ctx.globalAlpha /= zustand === "rot" ? 0.9 : 0.75;
        if (zustand === "rot") rot++; else gruen++;
      }
    }
    const yU = by + zeilen * schritt + 14;
    const satz = T(`${gruen} grün · ${rot} rot · ${leer} leer`, `${gruen} green · ${rot} red · ${leer} empty`);
    text(satz, bx, yU + 12, mono(12), F.matt);
    if (t > 0.9) {
      const a = stueck(t, 0.9, 1);
      ctx.globalAlpha *= a;
      text(T("leer = nichts bewiesen, nur behauptet", "empty = nothing proven, only claimed"), bx + A.b * 0.5, yU + 12, mono(12), F.rot, klein ? "left" : "right");
      ctx.globalAlpha /= a;
    }
  }

  // 02 Eingefrorener Vergleichslauf: zwei Baender, Zeile fuer Zeile
  function s2(t) {
    const A = flaeche();
    const bb = 11, l = 5, schritt = bb + l;
    const n = clamp(Math.floor((A.b - 90 + l) / schritt), 14, 44);
    const breite = n * schritt - l;
    const x0 = A.x + (A.b - breite) / 2;
    const hB = 26;
    const yA = A.y + A.h * 0.28, yB = yA + hB + 44;
    const zA = zufall(31), musterA = [];
    for (let i = 0; i < n; i++) musterA.push(zA() < 0.5);
    // Phasen: 0-0,42 bitgleich; 0,42-0,74 andere Vorgabe; 0,74-1 Datei fehlt
    const phase = t < 0.42 ? 0 : t < 0.74 ? 1 : 2;
    const tp = phase === 0 ? t / 0.42 : phase === 1 ? (t - 0.42) / 0.32 : (t - 0.74) / 0.26;
    const zB = zufall(77), musterB = [];
    for (let i = 0; i < n; i++) {
      const anders = phase === 1 && i >= Math.floor(n * 0.45) ? zB() < 0.5 : null;
      musterB.push(anders === null ? musterA[i] : anders);
    }
    const k = Math.floor(clamp(tp, 0, 1) * n);
    text(T("Lauf A", "run A"), x0, yA - 10, mono(12), F.matt);
    text(T("Lauf B", "run B"), x0, yB - 10, mono(12), F.matt);
    for (let i = 0; i < n; i++) {
      const x = x0 + i * schritt;
      // Band A (fehlt in Phase 2: nur ein gestrichelter Rahmen)
      if (phase < 2) {
        if (musterA[i]) { ctx.fillStyle = F.tinte; ctx.fillRect(x, yA, bb, hB); }
        else { ctx.strokeStyle = F.rand2; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, yA + 0.5, bb - 1, hB - 1); }
      }
      if (musterB[i]) { ctx.fillStyle = F.tinte; ctx.fillRect(x, yB, bb, hB); }
      else { ctx.strokeStyle = F.rand2; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, yB + 0.5, bb - 1, hB - 1); }
      // der Vergleich: ein Strich zwischen den Baendern, wo schon verglichen ist
      if (i < k && phase < 2) {
        const gleich = musterA[i] === musterB[i];
        const soll = phase === 0 ? gleich : !gleich;   // Phase 1 verlangt Unterschiede
        ctx.strokeStyle = phase === 1 && !gleich ? F.gruen : gleich ? F.gruen : F.rot;
        if (phase === 1 && gleich) ctx.strokeStyle = F.rand2;
        ctx.lineWidth = soll ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x + bb / 2, yA + hB + 6);
        ctx.lineTo(x + bb / 2, yB - 6);
        ctx.stroke();
      }
    }
    if (phase === 2) {
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = F.rand2;
      ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 0.5, yA + 0.5, breite - 1, hB - 1);
      ctx.restore();
      text(T("Vergleichsdatei fehlt", "comparison file missing"), x0 + breite / 2, yA + hB / 2, mono(12), F.matt, "center", "middle");
    }
    // der Laufcursor
    if (phase < 2 && k < n) {
      const x = x0 + k * schritt + bb / 2;
      ctx.strokeStyle = F.tinte;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, yA - 4); ctx.lineTo(x, yB + hB + 4); ctx.stroke();
    }
    // das Urteil der Phase
    const yU = yB + hB + 34;
    const urteil = phase === 0 ? T("dieselbe Vorgabe → bitgleich", "same input → bit-identical")
      : phase === 1 ? T("andere Vorgabe → anders, wie verlangt", "different input → different, as demanded")
      : T("Datei fehlt → rot, nicht übersprungen", "file missing → red, not skipped");
    const fertig = phase < 2 ? stueck(tp, 0.95, 1) : stueck(tp, 0.2, 0.4);
    text(urteil, x0, yU, mono(12), F.matt);
    if (fertig > 0) {
      const m = ctx.measureText(urteil).width;
      if (phase < 2) haken(x0 + m + 20, yU - 4, 14, F.gruen, fertig); else kreuz(x0 + m + 20, yU - 4, 14, F.rot, fertig);
    }
  }

  // 03 Suche gegen den Zufall: drei Reihen
  const REIHE = reihe(5, 160, 0.0005);
  const REIHE_ZERSTOERT = zerstoert(REIHE, 9);
  const REIHE_EFFEKT = reihe(11, 160, 0.0028);
  function s3(t) {
    const A = flaeche();
    const abst = 14;
    const hK = (A.h - 2 * abst) / 3;
    const x0 = A.x, b = A.b;
    const grenze = 0.62, rand = 0.54;
    // Reihe 1: Suche und Bestaetigung
    const y1 = A.y;
    const bis1 = stueck(t, 0, 0.22);
    linie(REIHE, x0, y1, b, hK, bis1, F.tinte, 1.6);
    const aGrenze = stueck(t, 0.2, 0.3);
    if (aGrenze > 0) {
      ctx.globalAlpha *= aGrenze;
      ctx.strokeStyle = F.tinte; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0 + b * grenze, y1); ctx.lineTo(x0 + b * grenze, y1 + hK); ctx.stroke();
      text(T("Suche", "search"), x0 + b * grenze - 8, y1 + 12, mono(12), F.matt, "right");
      text(T("Bestätigung", "confirmation"), x0 + b * grenze + 8, y1 + 12, mono(12), F.matt, "left");
      ctx.globalAlpha /= aGrenze;
    }
    const aRand = stueck(t, 0.3, 0.4);
    if (aRand > 0) {
      // die Randzone: schraffiert, faellt heraus
      ctx.save();
      ctx.globalAlpha *= aRand * 0.9;
      ctx.beginPath(); ctx.rect(x0 + b * rand, y1, b * (grenze - rand), hK); ctx.clip();
      ctx.strokeStyle = F.rand2; ctx.lineWidth = 1;
      for (let s = -hK; s < b * (grenze - rand) + hK; s += 7) {
        ctx.beginPath(); ctx.moveTo(x0 + b * rand + s, y1); ctx.lineTo(x0 + b * rand + s + hK, y1 + hK); ctx.stroke();
      }
      ctx.restore();
      ctx.globalAlpha *= aRand;
      text(T("Randzone fällt heraus", "edge zone dropped"), x0 + b * rand - 8, y1 + hK - 6, mono(11), F.matt, "right");
      ctx.globalAlpha /= aRand;
    }
    // das rollende Fenster
    const aFenster = stueck(t, 0.4, 0.46) * (1 - stueck(t, 0.68, 0.74));
    if (aFenster > 0) {
      const lauf = stueck(t, 0.44, 0.7);
      const fb = b * 0.18;
      const fx = x0 + lauf * (b * rand - fb);
      ctx.globalAlpha *= aFenster;
      ctx.fillStyle = F.tinte;
      ctx.globalAlpha *= 0.08;
      ctx.fillRect(fx, y1, fb, hK);
      ctx.globalAlpha /= 0.08;
      ctx.strokeStyle = F.tinte; ctx.lineWidth = 1;
      ctx.strokeRect(fx + 0.5, y1 + 0.5, fb - 1, hK - 1);
      if (klein) text(T("rollend: an jeder Grenze halten", "rolling: hold at every boundary"), x0, y1 + 12, mono(11), F.matt);
      else text(T("rollendes Fenster: die Auswahl muss an jeder Zeitgrenze erneut halten", "rolling window: the selection has to hold again at every time boundary"), x0, y1 - 8, mono(11), F.matt);
      ctx.globalAlpha /= aFenster;
    }
    // Reihe 2: zerstoerter Zusammenhang
    const y2 = y1 + hK + abst;
    const a2 = stueck(t, 0.5, 0.56);
    if (a2 > 0) {
      ctx.globalAlpha *= a2;
      linie(REIHE_ZERSTOERT, x0, y2, b, hK, stueck(t, 0.5, 0.72), F.matt, 1.2);
      text(klein ? T("Reihe ohne Zusammenhang: Treffer auf Rauschen", "no link left: hits on noise")
        : T("dieselbe Suche über eine Reihe ohne Zusammenhang: zählt, wie oft sie auf Rauschen anspringt", "the same search over a series with no link left: counts how often it fires on noise"), x0, y2 + hK - 6, mono(11), F.matt);
      ctx.globalAlpha /= a2;
    }
    // Reihe 3: eingebauter Effekt
    const y3 = y2 + hK + abst;
    const a3 = stueck(t, 0.72, 0.78);
    if (a3 > 0) {
      ctx.globalAlpha *= a3;
      linie(REIHE_EFFEKT, x0, y3, b, hK, stueck(t, 0.72, 0.92), F.tinte, 1.4);
      const satz = klein ? T("eingebauter Effekt: wird er gefunden?", "effect built in: is it found?")
        : T("und über eine mit eingebautem Effekt: findet die Suche überhaupt etwas?", "and over one with an effect built in: does the search find anything at all?");
      text(satz, x0, y3 + hK - 6, mono(11), F.matt);
      const f = stueck(t, 0.92, 1);
      if (f > 0) { ctx.font = mono(11); haken(x0 + ctx.measureText(satz).width + 18, y3 + hK - 10, 13, F.gruen, f); }
      ctx.globalAlpha /= a3;
    }
  }

  // 04 Schattenbetrieb: Signale durch die Sperren
  const SIGNALE = [-1, 0, -1, 1, -1, -1, 2, -1, 0, -1, 1, -1, -1, 2, -1, 0];   // -1 = kommt durch, sonst die Sperre
  function s4(t) {
    const A = flaeche();
    const xChart = A.x, bChart = A.b * (klein ? 0.26 : 0.3);
    const xS = [0.46, 0.6, 0.74].map((f) => A.x + A.b * f);
    const xE = A.x + A.b * 0.92;
    const yM = A.y + A.h * 0.5;
    const hC = Math.min(A.h * 0.5, 180);
    // der Markt: eine Linie, die mit dem Scrollen weiterlaeuft
    const w = REIHE;
    const lauf = t * 0.55;
    ctx.save();
    ctx.beginPath(); ctx.rect(xChart, yM - hC / 2, bChart, hC); ctx.clip();
    ctx.strokeStyle = F.tinte; ctx.lineWidth = 1.4; ctx.beginPath();
    for (let i = 0; i < w.length; i++) {
      const x = xChart + ((i / (w.length - 1)) - lauf) * bChart * 2.2, y = yM + hC / 2 - w[i] * hC;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    text(T("Markt, live", "market, live"), xChart, yM - hC / 2 - 10, mono(12), F.matt);
    if (!klein) text(T("Kandidat: ohne Geld", "candidate: no money"), xChart + bChart, yM - hC / 2 - 10, mono(12), F.matt, "right");
    // die Sperren
    const namen = [T("Regimefilter", "regime filter"), T("Wiederholungs-Stop", "repetition stop"), T("eine Position", "one position")];
    for (let g = 0; g < 3; g++) {
      ctx.strokeStyle = F.tinte; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(xS[g], yM - hC / 2); ctx.lineTo(xS[g], yM - 9);
      ctx.moveTo(xS[g], yM + 9); ctx.lineTo(xS[g], yM + hC / 2);
      ctx.stroke();
      if (!klein || g !== 1) text(namen[g], xS[g], yM + hC / 2 + 18, mono(11), F.matt, "center");
    }
    if (klein) text(namen[1], xS[1], yM + hC / 2 + 32, mono(11), F.matt, "center");
    // die Evidenz
    ctx.strokeStyle = F.rand2; ctx.lineWidth = 1;
    ctx.strokeRect(xE - 12 + 0.5, yM - hC / 2 + 0.5, 24, hC);
    text(T("Evidenz", "evidence"), xE, yM - hC / 2 - 10, mono(12), F.matt, "center");
    // die Signale
    const xStart = xChart + bChart;
    let durch = 0;
    for (let i = 0; i < SIGNALE.length; i++) {
      const geburt = 0.05 + i * 0.05;
      if (t < geburt) continue;
      const alter = (t - geburt) / 0.2;       // 0..1 = von der Kante bis zur Evidenz
      const ziel = SIGNALE[i];
      const xVoll = xStart + alter * (xE - xStart);
      const halt = ziel >= 0 ? xS[ziel] : xE;
      const x = Math.min(xVoll, halt);
      const y = yM + Math.sin(i * 1.7) * 4;
      if (x >= halt - 0.5) {
        if (ziel >= 0) {
          // gesperrt: ein kurzes rotes Aufleuchten an der Sperre, dann weg
          const seit = (xVoll - halt) / (xE - xStart);
          const a = 1 - stueck(seit, 0, 0.12);
          if (a > 0) { ctx.globalAlpha *= a; kreuz(halt, y, 12, F.rot, 1); ctx.globalAlpha /= a; }
        } else {
          durch++;
        }
      } else {
        ctx.fillStyle = F.tinte;
        ctx.beginPath(); ctx.arc(x, y, 3.2, 0, Math.PI * 2); ctx.fill();
      }
    }
    // die Evidenz fuellt sich von unten
    for (let j = 0; j < durch; j++) {
      ctx.fillStyle = F.tinte;
      ctx.fillRect(xE - 7, yM + hC / 2 - 8 - j * 9, 14, 5);
    }
    text(T("0 € im Spiel · dieselben Sperren wie mit Geld", "0 € at stake · the same locks as with money"), A.x, A.y + A.h - 4, mono(11), F.matt);
  }

  // 05 Ueberwachter Dauerbetrieb: das Lebenszeichen
  function s5(t) {
    const A = flaeche();
    const x0 = A.x, b = A.b;
    const yM = A.y + A.h * 0.5;
    const amp = Math.min(44, A.h * 0.2);
    const xStand = x0 + b * 0.5, xNeu = x0 + b * 0.76;
    const bis = x0 + b * clamp(t / 0.9, 0, 1);
    // die Linie: Schlaege alle 28 px bis zum Stillstand, dann flach, ab dem neuen Durchgang wieder Schlaege
    ctx.strokeStyle = F.tinte; ctx.lineWidth = 1.6; ctx.lineJoin = "round";
    ctx.beginPath();
    let zaehler = 0;
    for (let x = x0; x <= bis; x += 2) {
      let y = yM;
      const inStand = x >= xStand && x < xNeu;
      if (!inStand) {
        const ph = ((x - x0) % 28) / 28;
        if (ph < 0.12) y = yM - amp * (ph / 0.12);
        else if (ph < 0.24) y = yM - amp * (1 - (ph - 0.12) / 0.12);
        else if (ph < 0.3) y = yM + amp * 0.25 * ((ph - 0.24) / 0.06);
        else if (ph < 0.36) y = yM + amp * 0.25 * (1 - (ph - 0.3) / 0.06);
      }
      if (x === x0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    zaehler = Math.floor((Math.min(bis, xStand) - x0) / 28) + (bis > xNeu ? Math.floor((bis - xNeu) / 28) : 0);
    // der Zustand, wie die Prozessliste ihn sieht: "laeuft", solange der Prozess
    // in der Liste steht -- auch wenn er laengst nichts mehr tut
    const beendet = stueck(bis, xNeu - 40, xNeu - 10);
    const chip = beendet >= 1 && bis < xNeu ? T("beendet", "ended") : klein ? T("Liste: läuft", "list: running") : T("in der Prozessliste: läuft", "in the process list: running");
    const chipFarbe = beendet >= 1 && bis < xNeu ? F.rot : F.gruen;
    ctx.font = mono(12);
    const cb = ctx.measureText(chip).width + 22;
    const cx = x0 + b - cb, cy = A.y + 4;
    ctx.strokeStyle = chipFarbe; ctx.lineWidth = 1;
    ctx.strokeRect(cx + 0.5, cy + 0.5, cb - 1, 24);
    text(chip, cx + 11, cy + 16, mono(12), chipFarbe);
    text((klein ? T("Lebenszeichen ", "sign of life ") : T("Lebenszeichen: Uhrzeit + Zähler ", "sign of life: wall time + counter ")) + String(zaehler).padStart(4, "0"), x0, A.y + 20, mono(12), F.matt);
    // der Stillstand und der Waechter
    if (bis > xStand) {
      const a = stueck(bis, xStand + 30, xStand + 70);
      ctx.globalAlpha *= a;
      text(T("Prozess läuft, Arbeit steht", "process runs, work stalls"), xStand + 6, yM - amp - 10, mono(11), F.rot);
      ctx.globalAlpha /= a;
    }
    if (bis > xNeu - 40) {
      const a = beendet;
      ctx.globalAlpha *= a;
      ctx.strokeStyle = F.rot; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(xStand, yM + amp * 0.7); ctx.lineTo(xNeu - 8, yM + amp * 0.7); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xStand, yM + amp * 0.5); ctx.lineTo(xStand, yM + amp * 0.9); ctx.moveTo(xNeu - 8, yM + amp * 0.5); ctx.lineTo(xNeu - 8, yM + amp * 0.9); ctx.stroke();
      text(T("Wächter: beendet", "watchdog: ended"), xStand, yM + amp + 16, mono(11), F.rot);
      ctx.globalAlpha /= a;
    }
    if (bis > xNeu) {
      const a = stueck(bis, xNeu, xNeu + 30);
      ctx.globalAlpha *= a;
      if (klein) text(T("nächster Durchgang: neu", "next pass: restarted"), x0 + b, yM + amp + 32, mono(11), F.gruen, "right");
      else text(T("nächster Durchgang: neu, nie zwei zugleich", "next pass: restarted, never two at once"), xNeu + 4, yM - amp - 10, mono(11), F.gruen);
      ctx.globalAlpha /= a;
    }
  }

  // Belastungsproben: sechs Ausfaelle
  const PROBEN = [
    [T("Abriss mitten in der Order", "connection lost mid-order"), T("kein Trade gebucht, der Platz bleibt gesperrt", "no trade booked, the slot stays taken")],
    [T("Neustart mitten am Tag", "restart in mid-session"), T("Kontostand und Tagesverlust überleben", "balance and daily loss survive")],
    [T("zwei Schreiber auf einer Datei", "two writers, one file"), T("kein Eintrag verloren, die Prüfkette heil", "no entry lost, the checksum chain intact")],
    [T("halbe letzte Zeile", "half a final line"), T("weiterschreiben geht, der Rest bleibt Beleg", "writing continues, the rest stays as evidence")],
    [T("Prozess läuft, Arbeit steht", "process runs, work stalls"), T("erst beenden, dann neu starten", "end it first, restart it on the next pass")],
    [T("Wechsel Übung/Ernst bei unklarem Bestand", "mode switch with positions unclear"), T("der Wechsel wird blockiert", "the switch is blocked")],
  ];
  function glyph(art, x, y, gr, farbe) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = farbe; ctx.fillStyle = farbe; ctx.lineWidth = 1.6; ctx.lineCap = "round";
    const r = gr / 2;
    ctx.beginPath();
    if (art === 0) {          // Abriss: eine Leitung mit Luecke
      ctx.moveTo(-r, 0); ctx.lineTo(-r * 0.25, 0); ctx.moveTo(r * 0.25, 0); ctx.lineTo(r, 0);
      ctx.moveTo(-r * 0.25, -r * 0.35); ctx.lineTo(-r * 0.25, r * 0.35); ctx.moveTo(r * 0.25, -r * 0.35); ctx.lineTo(r * 0.25, r * 0.35);
    } else if (art === 1) {   // Neustart: Kreis mit Luecke und Strich
      ctx.arc(0, 0, r * 0.8, -Math.PI * 0.3, Math.PI * 1.3); ctx.moveTo(0, -r); ctx.lineTo(0, -r * 0.2);
    } else if (art === 2) {   // zwei Schreiber: zwei Pfeile in ein Blatt
      ctx.rect(-r * 0.3, -r * 0.8, r * 1.1, r * 1.6);
      ctx.moveTo(-r, -r * 0.4); ctx.lineTo(-r * 0.35, -r * 0.4); ctx.moveTo(-r, r * 0.4); ctx.lineTo(-r * 0.35, r * 0.4);
    } else if (art === 3) {   // halbe Zeile: drei Zeilen, die letzte abgeschnitten
      ctx.moveTo(-r, -r * 0.5); ctx.lineTo(r, -r * 0.5); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(-r, r * 0.5); ctx.lineTo(0, r * 0.5);
    } else if (art === 4) {   // steht: eine flache Linie mit letztem Schlag
      ctx.moveTo(-r, 0); ctx.lineTo(-r * 0.5, 0); ctx.lineTo(-r * 0.3, -r * 0.7); ctx.lineTo(-r * 0.1, 0); ctx.lineTo(r, 0);
    } else {                  // Wechsel: Schalter
      ctx.rect(-r, -r * 0.35, 2 * r, r * 0.7);
      ctx.moveTo(-r * 0.3, -r * 0.35); ctx.lineTo(-r * 0.3, r * 0.35);
    }
    ctx.stroke();
    if (art === 5) { ctx.font = mono(Math.round(gr * 0.5), 700); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("?", r * 0.35, 1); }
    ctx.restore();
  }
  function s6(t) {
    const A = flaeche();
    const n = PROBEN.length;
    const zeile = Math.min(44, (A.h - 10) / n);
    const y0 = A.y + (A.h - zeile * n) / 2;
    const xG = A.x + 22, xN = A.x + 56;
    const xE = klein ? xN : A.x + Math.min(A.b * 0.5, 420);
    for (let i = 0; i < n; i++) {
      const an = (i / n) * 0.84;
      const a = stueck(t, an, an + 0.06);
      if (a <= 0) continue;
      const y = y0 + i * zeile + zeile / 2;
      ctx.globalAlpha *= a;
      // der Schlag: der Glyph kommt von links herein
      const dx = (1 - a) * -30;
      glyph(i, xG + dx, y, 22, F.tinte);
      text(PROBEN[i][0], xN, y + (klein ? -3 : 4), mono(klein ? 11 : 12), F.tinte);
      const e = stueck(t, an + 0.05, an + 0.11);
      if (e > 0) {
        ctx.globalAlpha *= e;
        const erw = (klein ? "" : T("erwartet: ", "expected: ")) + PROBEN[i][1];
        text(erw, xE, y + (klein ? 12 : 4), mono(11), F.matt);
        ctx.font = mono(11);
        haken(xE + ctx.measureText(erw).width + 16, y + (klein ? 8 : 0), 12, F.gruen, 1);
        ctx.globalAlpha /= e;
      }
      ctx.globalAlpha /= a;
    }
  }

  // Grenze: die fuenf Stufen in einer Reihe, darunter der Strich, der vor dem Broker endet
  function s7(t) {
    const A = flaeche();
    const n = 5;
    const w = Math.min(120, (A.b - 40) / n);
    const x0 = A.x + (A.b - w * n) / 2;
    const y = A.y + A.h * 0.36;
    const gr = Math.min(56, w * 0.6);
    for (let i = 0; i < n; i++) {
      const a = stueck(t, i * 0.08, i * 0.08 + 0.1);
      if (a <= 0) continue;
      ctx.globalAlpha *= a;
      const cx = x0 + w * i + w / 2;
      ctx.save();
      ctx.translate(cx, y);
      ctx.strokeStyle = F.tinte; ctx.fillStyle = F.tinte; ctx.lineWidth = 1.5;
      const r = gr / 2;
      if (i === 0) {            // das Feld: 3x3 Kaestchen, eins leer
        const k = gr / 3.4;
        for (let j = 0; j < 9; j++) {
          const kx = -r + (j % 3) * (k + 3), ky = -r + Math.floor(j / 3) * (k + 3);
          if (j === 7) ctx.strokeRect(kx + 0.5, ky + 0.5, k - 1, k - 1); else ctx.fillRect(kx, ky, k, k);
        }
      } else if (i === 1) {     // zwei Baender
        for (let j = 0; j < 6; j++) { const bx = -r + j * (gr / 6); if (j % 2 === 0) { ctx.fillRect(bx, -r, gr / 6 - 3, r * 0.7); ctx.fillRect(bx, r * 0.3, gr / 6 - 3, r * 0.7); } else { ctx.strokeRect(bx + 0.5, -r + 0.5, gr / 6 - 4, r * 0.7 - 1); ctx.strokeRect(bx + 0.5, r * 0.3 + 0.5, gr / 6 - 4, r * 0.7 - 1); } }
      } else if (i === 2) {     // eine Reihe mit der Grenze
        linie(REIHE, -r, -r, gr, gr, 1, F.tinte, 1.4);
        ctx.beginPath(); ctx.moveTo(r * 0.24, -r); ctx.lineTo(r * 0.24, r); ctx.stroke();
      } else if (i === 3) {     // drei Sperren
        for (let j = 0; j < 3; j++) { const sx = -r + (j + 0.5) * (gr / 3); ctx.beginPath(); ctx.moveTo(sx, -r); ctx.lineTo(sx, -4); ctx.moveTo(sx, 4); ctx.lineTo(sx, r); ctx.stroke(); }
        ctx.beginPath(); ctx.arc(-r - 6, 0, 3, 0, Math.PI * 2); ctx.fill();
      } else {                  // das Lebenszeichen
        ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(-r * 0.5, 0); ctx.lineTo(-r * 0.3, -r * 0.8); ctx.lineTo(-r * 0.1, 0); ctx.lineTo(r * 0.3, 0); ctx.lineTo(r * 0.5, -r * 0.8); ctx.lineTo(r * 0.7, 0); ctx.lineTo(r, 0); ctx.stroke();
      }
      ctx.restore();
      text("0" + (i + 1), cx, y + r + 22, mono(12), F.matt, "center");
      ctx.globalAlpha /= a;
    }
    // der Strich: bis zur Grenze, dahinter nichts -- dort wuerde der Broker stehen
    const a = stueck(t, 0.5, 0.7);
    if (a > 0) {
      ctx.globalAlpha *= a;
      const yS = A.y + A.h * 0.8;
      const bis = A.x + A.b * 0.72;
      ctx.strokeStyle = F.tinte; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(A.x, yS); ctx.lineTo(bis, yS); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(bis, yS - 10); ctx.lineTo(bis, yS + 10); ctx.stroke();
      text(T("bis hierher geprüft", "tested up to here"), A.x, yS - 10, mono(11), F.matt);
      text(T("echter Broker: noch keiner", "real broker: none yet"), bis + 10, yS + 4, mono(11), F.matt);
      ctx.globalAlpha /= a;
    }
  }

  // ---- Das Ende: alles wird zu Punkten, die zum Zeichen und zum Spruch fliessen ----
  let teilchen = null;
  function logoMasse() {
    const balken = klein ? 72 : 104;          // Hoehe des Zeichens
    const wort = klein ? 20 : 26;             // JKHD
    const spruch = klein ? 12 : 14;           // Just Know How to Dominate.
    const gesamt = balken + 22 + wort + 14 + spruch;
    const oben = (H - gesamt) / 2 - (klein ? 10 : 20);
    return { balken, wort, spruch, oben, cx: B / 2 };
  }
  // Das Zeichen und der Spruch, klar gezeichnet -- auf die Leinwand oder (zum
  // Abtasten) auf eine Hilfsleinwand `g`, dort in einer Farbe
  function logoZeichnen(a, g, farbe) {
    const c = g || ctx;
    const m = logoMasse();
    c.save();
    c.globalAlpha *= a;
    c.fillStyle = farbe || F.tinte;
    const k = m.balken / 100;
    const bx = m.cx - 50 * k, by = m.oben;
    c.fillRect(bx + 10 * k, by + 22 * k, 20 * k, 56 * k);
    c.fillRect(bx + 40 * k, by + 8 * k, 20 * k, 84 * k);
    c.fillRect(bx + 70 * k, by + 22 * k, 20 * k, 56 * k);
    const yW = by + m.balken + 22 + m.wort * 0.8;
    c.font = sans(m.wort, 800);
    c.textAlign = "center";
    c.textBaseline = "alphabetic";
    if ("letterSpacing" in c) { c.letterSpacing = "0.34em"; c.fillText("JKHD", m.cx + m.wort * 0.17, yW); c.letterSpacing = "0px"; }
    else {
      const abst = m.wort * 0.34;
      c.textAlign = "left";
      let w = 0; for (const ch of "JKHD") w += c.measureText(ch).width + abst;
      let x = m.cx - (w - abst) / 2;
      for (const ch of "JKHD") { c.fillText(ch, x, yW); x += c.measureText(ch).width + abst; }
      c.textAlign = "center";
    }
    c.fillStyle = farbe || F.matt;
    c.font = mono(m.spruch);
    c.fillText("Just Know How to Dominate.", m.cx, yW + 14 + m.spruch);
    c.restore();
  }
  // Die Punkte: Herkunft = was gerade auf der Leinwand steht, Ziel = das Zeichen
  function teilchenBauen() {
    // 1. die Leinwand abtasten (alles, was nicht Grund ist)
    const d = ctx.getImageData(0, 0, leinwand.width, leinwand.height).data;
    const W = leinwand.width, Hh = leinwand.height;
    const [gr, gg, gb] = F.grundRgb;
    const hoechstens = klein ? 2000 : 3200;
    let schritt = Math.max(2, Math.round(2 * dpr)), quellen = [];
    for (;;) {
      quellen = [];
      for (let y = 0; y < Hh; y += schritt) {
        for (let x = 0; x < W; x += schritt) {
          const i = (y * W + x) * 4;
          const abstand = Math.abs(d[i] - gr) + Math.abs(d[i + 1] - gg) + Math.abs(d[i + 2] - gb);
          if (abstand > 90) quellen.push([x / dpr, y / dpr]);
        }
      }
      if (quellen.length <= hoechstens || schritt > 6 * dpr) break;
      schritt++;
    }
    // 2. das Zeichen abtasten (weiss auf schwarz auf einer Hilfsleinwand)
    const c = document.createElement("canvas");
    c.width = B; c.height = H;
    const g = c.getContext("2d");
    g.fillStyle = "#000"; g.fillRect(0, 0, B, H);
    logoZeichnen(1, g, "#fff");
    const ld = g.getImageData(0, 0, B, H).data;
    const ziele = [];
    const s2 = klein ? 2 : 2;
    for (let y = 0; y < H; y += s2) for (let x = 0; x < B; x += s2) { if (ld[(y * B + x) * 4] > 110) ziele.push([x, y]); }
    if (!ziele.length) return null;
    // 3. zuordnen: jeder Zielpunkt bekommt mindestens eine Quelle, Quellen reihum
    const z = zufall(23);
    const punkte = [];
    const anzahl = Math.max(ziele.length, quellen.length);
    for (let i = 0; i < anzahl; i++) {
      const q = quellen.length ? quellen[i % quellen.length] : [B / 2 + (z() - 0.5) * B * 0.6, H * 0.35 + (z() - 0.5) * H * 0.4];
      const zi = ziele[i % ziele.length];
      const dx = zi[0] - q[0], dy = zi[1] - q[1];
      punkte.push({
        x0: q[0] + (z() - 0.5) * 1.5, y0: q[1] + (z() - 0.5) * 1.5,
        x1: zi[0] + (z() - 0.5) * 0.8, y1: zi[1] + (z() - 0.5) * 0.8,
        // Bogen: der Kontrollpunkt liegt seitlich des geraden Wegs -- alles schwingt ein
        kx: (q[0] + zi[0]) / 2 - dy * (0.25 + z() * 0.3) * (z() < 0.5 ? 1 : -1),
        ky: (q[1] + zi[1]) / 2 + dx * (0.25 + z() * 0.3) * (z() < 0.5 ? 1 : -1),
        start: z() * 0.35,
        gr: 1.4 + z() * 1.2,
      });
    }
    return { punkte };
  }
  function ende(t) {
    if (!teilchen) {
      // ohne Herkunft (z. B. nach einem Groessenwechsel): nur das Zeichen
      logoZeichnen(stueck(t, 0, 0.3));
      return;
    }
    if (t >= 1) { logoZeichnen(1); return; }   // angekommen: nur noch das Zeichen
    const DAUER = 0.6;
    ctx.fillStyle = F.tinte;
    ctx.globalAlpha = 0.9 * (1 - stueck(t, 0.9, 1) * 0.85);
    for (const pt of teilchen.punkte) {
      const e = glatt(clamp((t - pt.start) / DAUER, 0, 1));
      const u = 1 - e;
      const x = u * u * pt.x0 + 2 * u * e * pt.kx + e * e * pt.x1;
      const y = u * u * pt.y0 + 2 * u * e * pt.ky + e * e * pt.y1;
      const gr = misch(pt.gr, 1.6, e);
      ctx.fillRect(x - gr / 2, y - gr / 2, gr, gr);
    }
    ctx.globalAlpha = 1;
    // sobald die Punkte da sind, wird das Zeichen klar
    logoZeichnen(stueck(t, 0.86, 1));
  }

  // ---- Ein Bild ----
  function bild(p, still) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = F.grund;
    ctx.fillRect(0, 0, B, H);
    if (still) { logoZeichnen(1); return; }
    const zeichner = { s1, s2, s3, s4, s5, s6, s7 };
    for (const [name, von, bis] of SZENEN) {
      if (p < von || p > bis) continue;
      // ein Bild blendet VOR seiner Grenze aus und das naechste NACH ihr ein: so
      // liegen nie zwei Beschriftungen uebereinander
      const ein = stueck(p, von, von + UEBERGANG);
      // die letzte Szene blendet nicht aus: ihre Zeichnung wird zu den Punkten
      const aus = name === "s7" ? 1 : 1 - stueck(p, bis - UEBERGANG, bis);
      const a = ein * aus;
      if (a <= 0) continue;
      if (name === "s7" && p >= ENDE_VON) continue;
      const t = clamp((p - von) / (bis - von), 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      zeichner[name](t);
      ctx.restore();
    }
    if (p >= ENDE_VON) {
      if (!teilchen && !teilchenVersucht) {
        // die Punkte entstehen aus dem Bild der Grenze: einmal zeichnen, abtasten
        teilchenVersucht = true;
        ctx.save(); ctx.globalAlpha = 1; s7(1); ctx.restore();
        teilchen = teilchenBauen();
        ctx.fillStyle = F.grund; ctx.fillRect(0, 0, B, H);
      }
      ende(clamp((p - ENDE_VON) / (1 - ENDE_VON), 0, 1));
    } else if (teilchenVersucht && p < ENDE_VON - 0.02) {
      teilchenVersucht = false;   // zurueckgescrollt: beim naechsten Mal neu abtasten
      teilchen = null;
    }
  }
  let teilchenVersucht = false;

  // ---- Die Texte: je Bild einer, mit dem Scrollen ein- und ausgeblendet ----
  function texteZeigen(p) {
    for (const t of texte) {
      const a = stueck(p, t.von, t.von + 0.025) * (1 - stueck(p, t.bis - 0.025, t.bis));
      t.el.style.opacity = a.toFixed(3);
      t.el.style.transform = a >= 1 ? "none" : `translateY(${Math.round((1 - a) * 14)}px)`;
      t.el.classList.toggle("ist-weg", a <= 0);
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
  let p = 0, laeuft = false, letzte = 0, bildNr = 0;
  function schleife(jetzt) {
    if (!laeuft) return;
    const dt = Math.min(0.05, (jetzt - letzte) / 1000 || 0.016);
    letzte = jetzt;
    const zielP = zielFortschritt();
    p += (zielP - p) * (1 - Math.exp(-dt * 7));
    if (Math.abs(zielP - p) < 0.0003) p = zielP;
    const ruhig = Math.abs(zielP - p) < 0.00001;
    bildNr++;
    if (!ruhig || bildNr % 3 === 0) { bild(p, false); texteZeigen(p); }
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
    if (reduziert.matches) { anhalten(); bild(1, true); for (const t of texte) { t.el.style.opacity = ""; t.el.style.transform = ""; t.el.classList.remove("ist-weg"); } }
  }

  abschnitt.classList.add("ist-aktiv");
  einrichten();
  new IntersectionObserver((eintraege) => { if (eintraege.some((e) => e.isIntersecting)) starten(); else anhalten(); }).observe(abschnitt);
  window.addEventListener("resize", () => { groesseAnpassen(); if (reduziert.matches) bild(1, true); });
  if (reduziert.addEventListener) reduziert.addEventListener("change", einrichten);
  // Farben wechseln mit der Darstellung (hell/dunkel): der Schalter setzt data-theme
  new MutationObserver(() => { farbenLesen(); if (reduziert.matches) bild(1, true); }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { groesseAnpassen(); if (reduziert.matches) bild(1, true); });
})();

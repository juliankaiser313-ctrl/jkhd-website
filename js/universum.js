// ---------- Startseite: Flug durch ein Netz aus Mathematik ----------
// Julian, 10.10.2026 (nach dem Chart, das ihm nicht gefiel): "Wenn man runterscrollt,
// soll es erst mal schwarz sein, und dann beim Scrollen soll eine fast schon
// universumartige Umgebung erscheinen, wo Mathematik usw. alles wie in einem Netz
// zusammenfliesst, und die Kamera soll dem Netz immer weiter folgen. Irgendwann
// kommt es am Ziel an, und dort erscheint das Logo mit dem Spruch."
//
// Umsetzung ohne Bibliothek: eine Zeichenflaeche (canvas 2D) mit eigener
// Perspektiv-Projektion. Der Scrollfortschritt durch den Abschnitt #universum
// (die Buehne bleibt dabei stehen, sticky) bewegt die Kamera entlang einer Bahn
// durch ein Netz; Knoten tragen Formeln und Zeichen, Lichtimpulse fliessen die
// Kanten entlang nach vorn. Zum Ende laeuft das Netz trichterfoermig zusammen,
// die Impulse sammeln sich zum Zeichen, darunter "JKHD" und der Spruch.
//   0,00-0,06  schwarz
//   0,06-0,16  Sterne und die ersten Knoten tauchen auf
//   0,10-0,84  Flug durch das Netz
//   0,80-0,95  das Netz laeuft zusammen, Lichtstroeme bilden das Zeichen
//   0,92-1,00  das Zeichen steht, darunter Wortmarke, "Quant Systems" und Spruch
// Alles wird hier erzeugt (feste Saat, jedes Mal gleich); nichts wird geladen oder
// gespeichert. Bei "reduzierter Bewegung" steht das Schlussbild still da, ohne
// Scrollweg; ohne JavaScript zeigt der Abschnitt das Zeichen auf Schwarz.
(function () {
  const abschnitt = document.getElementById("universum");
  if (!abschnitt) return;
  const buehne = abschnitt.querySelector(".universum-buehne");
  const leinwand = abschnitt.querySelector(".universum-leinwand");
  const ctx = leinwand.getContext("2d");
  if (!ctx) return;
  const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)");

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
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const kreuz = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

  // ---- Die Bahn: Catmull-Rom durch Stuetzpunkte, die Kamera fliegt nach -z ----
  const LAENGE = 5200;
  const STUETZEN = [];
  for (let i = 0; i <= 10; i++) {
    const z = 300 - i * (LAENGE / 10);
    const ruhe = i >= 9 ? 0 : 1;   // zum Ziel hin gerade
    STUETZEN.push([Math.sin(i * 0.9) * 340 * ruhe, Math.sin(i * 0.7 + 1.2) * 190 * ruhe, z]);
  }
  function bahn(u) {
    const n = STUETZEN.length - 1;
    const f = clamp(u, 0, 1) * n;
    const i = Math.min(n - 1, Math.floor(f));
    const t = f - i;
    const p0 = STUETZEN[Math.max(0, i - 1)], p1 = STUETZEN[i], p2 = STUETZEN[i + 1], p3 = STUETZEN[Math.min(n, i + 2)];
    const t2 = t * t, t3 = t2 * t;
    const r = [0, 0, 0];
    for (let k = 0; k < 3; k++) {
      r[k] = 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
    }
    return r;
  }
  function rahmen(u) {
    const vorn = norm(sub(bahn(Math.min(1, u + 0.004)), bahn(Math.max(0, u - 0.004))));
    const rechts = norm(kreuz(vorn, [0, 1, 0]));
    const oben = kreuz(rechts, vorn);
    return { vorn, rechts, oben };
  }
  const ZIEL_U = 1;          // dort steht das Zeichen
  const KAMERA_ENDE = 0.955; // so weit fliegt die Kamera

  // ---- Inhalt des Netzes ----
  // Formeln als Text mit ^{...} (hoch) und _{...} (tief); Zeichen fuer die kleinen Knoten
  const FORMELN = [
    "e^{iπ} + 1 = 0", "E = mc^{2}", "∇ · E = ρ / ε_{0}", "iħ ∂ψ/∂t = Ĥψ",
    "∫ e^{−x^{2}} dx = √π", "ζ(s) = Σ n^{−s}", "P(A|B) = P(B|A) P(A) / P(B)",
    "dS_{t} = μS_{t} dt + σS_{t} dW_{t}", "σ^{2} = E[(X − μ)^{2}]", "R_{μν} − ½ R g_{μν} = 8πG T_{μν}",
    "∮ F · dr = ∬ (∇ × F) · dA", "f(x) = Σ a_{n} x^{n}", "a^{2} + b^{2} = c^{2}", "lim_{n→∞} (1 + 1/n)^{n} = e",
    "H = − Σ p_{i} log p_{i}", "∂u/∂t = α ∇^{2}u",
  ];
  const ZEICHEN = ["π", "Σ", "∫", "∂", "∞", "λ", "μ", "σ", "∇", "φ", "ε", "Δ", "θ", "Ω", "√", "≈", "∮", "ℏ"];

  let welt = null;
  function weltBauen(klein) {
    const z = zufall(20261010);
    const sterne = [];
    const anzahlSterne = klein ? 700 : 1500;
    for (let i = 0; i < anzahlSterne; i++) {
      sterne.push({
        p: [(z() - 0.5) * 6000, (z() - 0.5) * 4200, 900 - z() * (LAENGE + 2600)],
        g: 0.4 + z() * 1.3,
        phase: z() * Math.PI * 2,
      });
    }
    // Knoten in einer Roehre um die Bahn, die zum Ziel hin enger wird
    const knoten = [];
    const anzahlKnoten = klein ? 150 : 240;
    for (let i = 0; i < anzahlKnoten; i++) {
      const u = 0.03 + (i / anzahlKnoten) * 0.95 + (z() - 0.5) * 0.01;
      const mitte = bahn(u);
      const r = rahmen(u);
      const weite = misch(620, 70, Math.pow(u, 1.6)) * (0.35 + z() * 0.9);
      const winkel = z() * Math.PI * 2;
      const pos = [0, 1, 2].map((k) => mitte[k] + (r.rechts[k] * Math.cos(winkel) + r.oben[k] * Math.sin(winkel)) * weite);
      knoten.push({ p: pos, u, g: 1.2 + z() * 2.2, text: null, formel: false });
    }
    // Formeln auf Knoten nah an der Bahn, gleichmaessig ueber den Weg verteilt
    FORMELN.forEach((f, j) => {
      const u = 0.1 + (j / FORMELN.length) * 0.74;
      const mitte = bahn(u);
      const r = rahmen(u);
      const weite = 150 + z() * 170;
      const winkel = (j * 2.4) % (Math.PI * 2);
      const pos = [0, 1, 2].map((k) => mitte[k] + (r.rechts[k] * Math.cos(winkel) + r.oben[k] * Math.sin(winkel) * 0.7) * weite);
      knoten.push({ p: pos, u, g: 2.6, text: f, formel: true });
    });
    // Einzelne Zeichen auf jedem siebten gewoehnlichen Knoten
    for (let i = 0; i < anzahlKnoten; i += 7) knoten[i].text = ZEICHEN[(i / 7) % ZEICHEN.length];

    // Kanten: jeder Knoten zu den zwei naechsten Knoten weiter vorn -- daran fliesst das Licht
    knoten.sort((a, b) => a.u - b.u);
    const kanten = [];
    knoten.forEach((a, i) => {
      const kandidaten = [];
      for (let j = i + 1; j < Math.min(knoten.length, i + 40); j++) {
        const b = knoten[j];
        const d = Math.hypot(a.p[0] - b.p[0], a.p[1] - b.p[1], a.p[2] - b.p[2]);
        if (d < 900) kandidaten.push({ j, d });
      }
      kandidaten.sort((x, y) => x.d - y.d);
      kandidaten.slice(0, 2).forEach((k) => kanten.push({ a: i, b: k.j, phase: z(), tempo: 0.18 + z() * 0.22 }));
    });

    // Das Zeichen am Ziel: Punkte in den drei Balken (in Bildschirm-Einheiten,
    // spaeter auf die Groesse des Schlussbilds skaliert)
    const BALKEN = [{ x: 10, y: 22, b: 20, h: 56 }, { x: 40, y: 8, b: 20, h: 84 }, { x: 70, y: 22, b: 20, h: 56 }];
    // Lichtstroeme fuer das Schlussbild: kommen von ueberall am Rand her (Bildschirm-
    // Einheiten relativ zur Mitte) und fliessen in die Balken
    const strom = [];
    const anzahlStrom = klein ? 220 : 380;
    for (let i = 0; i < anzahlStrom; i++) {
      const b = BALKEN[i % 3];
      const winkel = z() * Math.PI * 2;
      const weite = 0.55 + z() * 0.45;
      strom.push({
        ziel: [(b.x + z() * b.b) / 100 - 0.5, (b.y + z() * b.h) / 100 - 0.5],
        start: [Math.cos(winkel) * weite, Math.sin(winkel) * weite],
        verzug: z() * 0.5,
      });
    }
    // Nebel: wenige grosse Lichtwolken neben der Bahn, kuehle Grautoene
    const FARBEN = ["170,185,215", "190,180,215", "160,200,215", "205,205,215"];
    const nebel = [];
    for (let i = 0; i < 9; i++) {
      const u = 0.06 + i * 0.105 + (z() - 0.5) * 0.04;
      const mitte = bahn(u);
      const r = rahmen(u);
      const winkel = z() * Math.PI * 2;
      const weite = 700 + z() * 900;
      nebel.push({
        p: [0, 1, 2].map((kk) => mitte[kk] + (r.rechts[kk] * Math.cos(winkel) + r.oben[kk] * Math.sin(winkel)) * weite - r.vorn[kk] * 400),
        r: 900 + z() * 900,
        a: 0.05 + z() * 0.06,
        farbe: FARBEN[i % FARBEN.length],
      });
    }
    return { klein, sterne, knoten, kanten, strom, BALKEN, nebel };
  }

  // ---- Formel mit Hoch- und Tiefstellung zeichnen (zentriert) ----
  function formelTeile(text) {
    const teile = [];
    let i = 0, lauf = "";
    while (i < text.length) {
      const c = text[i];
      if ((c === "^" || c === "_") && text[i + 1] === "{") {
        if (lauf) { teile.push({ t: lauf, art: 0 }); lauf = ""; }
        let tiefe = 1, j = i + 2;
        while (j < text.length && tiefe) { if (text[j] === "{") tiefe++; else if (text[j] === "}") tiefe--; j++; }
        teile.push({ t: text.slice(i + 2, j - 1).replace(/[\^_]\{|\}/g, ""), art: c === "^" ? 1 : -1 });
        i = j;
      } else { lauf += c; i++; }
    }
    if (lauf) teile.push({ t: lauf, art: 0 });
    return teile;
  }
  const FORMEL_TEILE = new Map();
  function formelZeichnen(text, x, y, groesse) {
    let teile = FORMEL_TEILE.get(text);
    if (!teile) { teile = formelTeile(text); FORMEL_TEILE.set(text, teile); }
    const schrift = (g) => `italic 500 ${g.toFixed(1)}px "Playfair Display", "Cambria Math", Georgia, serif`;
    let breite = 0;
    for (const t of teile) { ctx.font = schrift(t.art ? groesse * 0.68 : groesse); breite += ctx.measureText(t.t).width; }
    let lx = x - breite / 2;
    for (const t of teile) {
      const g = t.art ? groesse * 0.68 : groesse;
      ctx.font = schrift(g);
      ctx.fillText(t.t, lx, y - (t.art === 1 ? groesse * 0.42 : t.art === -1 ? -groesse * 0.22 : 0));
      lx += ctx.measureText(t.t).width;
    }
  }

  // ---- Zeichnen ----
  let B = 0, H = 0, dpr = 1;
  function groesseAnpassen() {
    const r = buehne.getBoundingClientRect();
    B = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    dpr = Math.min(window.devicePixelRatio || 1, B < 700 ? 1.5 : 2);
    // grosse Schirme nicht ueber ~3 Mio. Bildpunkte
    while (B * H * dpr * dpr > 3.2e6 && dpr > 1) dpr -= 0.25;
    leinwand.width = Math.round(B * dpr);
    leinwand.height = Math.round(H * dpr);
    const klein = B < 700;
    if (!welt || welt.klein !== klein) welt = weltBauen(klein);
  }

  function kamera(p) {
    // Kamera faehrt von 0,10 bis 0,90 die Bahn entlang und bremst am Ende sanft
    const t = stueck(p, 0.04, 0.9);
    const u = t * KAMERA_ENDE;
    const pos = bahn(u);
    // ein wenig vorausschauen: die Kamera folgt dem Fluss
    const blick = bahn(Math.min(ZIEL_U, u + 0.035));
    const vorn = norm(sub(blick, pos));
    const rechts = norm(kreuz(vorn, [0, 1, 0]));
    const oben = kreuz(rechts, vorn);
    return { pos, vorn, rechts, oben, u };
  }

  function projiziere(k, p, f) {
    const rel = sub(p, k.pos);
    const zc = dot(rel, k.vorn);
    if (zc < 8) return null;
    return { x: B / 2 + (dot(rel, k.rechts) / zc) * f, y: H / 2 - (dot(rel, k.oben) / zc) * f, z: zc };
  }

  // Sichtbarkeit nach Tiefe: nah weich einblenden, fern im Dunst verschwinden
  // (nah erst ab 60 und weich bis 300: was dicht an der Kamera vorbeizieht, wuerde
  // sonst als riesige Linie quer durchs Bild schneiden)
  const tiefe = (z, fern) => clamp((z - 60) / 240, 0, 1) * clamp(1 - (z - 300) / fern, 0, 1);

  function bild(p, zeit) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, B, H);
    if (!welt) return;

    const auftauchen = stueck(p, 0.06, 0.18);
    if (auftauchen <= 0) return;   // 0-6 %: nur Schwarz

    const k = kamera(p);
    const f = Math.min(B, H) * 0.95;
    const ziel = stueck(p, 0.8, 0.93);        // das Netz laeuft zusammen
    const netzSicht = auftauchen * (1 - stueck(p, 0.9, 0.97));
    ctx.globalCompositeOperation = "lighter";

    // Sterne
    ctx.fillStyle = "#ffffff";
    for (const s of welt.sterne) {
      const q = projiziere(k, s.p, f);
      if (!q || q.x < -4 || q.x > B + 4 || q.y < -4 || q.y > H + 4) continue;
      const a = auftauchen * tiefe(q.z, 6500) * (0.55 + 0.45 * Math.sin(zeit * 1.3 + s.phase));
      if (a < 0.02) continue;
      const g = clamp((s.g * 260) / q.z, 0.5, 2.4);
      ctx.globalAlpha = a;
      ctx.fillRect(q.x - g / 2, q.y - g / 2, g, g);
    }

    // Nebel: grosse, sehr leise Lichtwolken in kuehlem Grau -- geben dem Raum Tiefe
    for (const w of welt.nebel) {
      const q = projiziere(k, w.p, f);
      if (!q || q.z < 120) continue;
      const r = (w.r * f) / q.z;
      if (q.x + r < 0 || q.x - r > B || q.y + r < 0 || q.y - r > H) continue;
      const a = auftauchen * w.a * clamp(1 - (q.z - 600) / 5200, 0, 1) * clamp((q.z - 120) / 600, 0, 1);
      if (a < 0.004) continue;
      const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
      g.addColorStop(0, `rgba(${w.farbe},${a.toFixed(3)})`);
      g.addColorStop(1, `rgba(${w.farbe},0)`);
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(q.x - r, q.y - r, r * 2, r * 2);
    }

    // Der Kern am Ziel: ein ferner heller Punkt, auf den das Netz zulaeuft --
    // er waechst, je naeher die Kamera kommt
    const kern = projiziere(k, bahn(ZIEL_U), f);
    if (kern) {
      // klein genug, dass er nie zum grauen Schleier ueber dem ganzen Bild wird;
      // er weicht, sobald die Lichtstroeme das Zeichen bilden
      const r = clamp((380 * f) / kern.z, 6, Math.min(B, H) * 0.32);
      const a = auftauchen * clamp(0.15 + (1 - kern.z / LAENGE) * 0.35, 0, 0.45) * (1 - stueck(p, 0.8, 0.88));
      const g = ctx.createRadialGradient(kern.x, kern.y, 0, kern.x, kern.y, r);
      g.addColorStop(0, `rgba(255,255,255,${a.toFixed(3)})`);
      g.addColorStop(0.18, `rgba(214,222,240,${(a * 0.45).toFixed(3)})`);
      g.addColorStop(1, "rgba(214,222,240,0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.fillRect(kern.x - r, kern.y - r, r * 2, r * 2);
    }

    // Knoten projizieren (einmal je Bild)
    const proj = welt.knoten.map((n) => projiziere(k, n.p, f));

    // Kanten in Helligkeitsstufen gebuendelt zeichnen
    if (netzSicht > 0) {
      const stufen = [[], [], [], [], []];
      const lang = Math.max(B, H) * 0.7;
      for (const e of welt.kanten) {
        const a = proj[e.a], b = proj[e.b];
        if (!a || !b) continue;
        if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > lang) continue;
        const h = Math.min(tiefe(a.z, 2600), tiefe(b.z, 2600)) * netzSicht;
        if (h < 0.04) continue;
        stufen[Math.min(4, Math.floor(h * 5))].push(a, b);
      }
      ctx.strokeStyle = "#dfe6f5";
      ctx.lineWidth = 1;
      stufen.forEach((liste, i) => {
        if (!liste.length) return;
        ctx.globalAlpha = 0.05 + i * 0.055;
        ctx.beginPath();
        for (let j = 0; j < liste.length; j += 2) { ctx.moveTo(liste[j].x, liste[j].y); ctx.lineTo(liste[j + 1].x, liste[j + 1].y); }
        ctx.stroke();
      });

      // Lichtimpulse fliessen die Kanten entlang nach vorn -- mit Schweif, damit
      // man das Fliessen sieht
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#ffffff";
      ctx.lineCap = "round";
      const punkt = (A, Bp, t) => [misch(A[0], Bp[0], t), misch(A[1], Bp[1], t), misch(A[2], Bp[2], t)];
      for (const e of welt.kanten) {
        const A = welt.knoten[e.a].p, Bp = welt.knoten[e.b].p;
        const t = (zeit * e.tempo + e.phase) % 1;
        const q = projiziere(k, punkt(A, Bp, t), f);
        if (!q) continue;
        const h = tiefe(q.z, 2400) * netzSicht * Math.sin(Math.PI * t);
        if (h < 0.05) continue;
        const g = clamp(640 / q.z, 1, 5);
        const hinten = projiziere(k, punkt(A, Bp, Math.max(0, t - 0.16)), f);
        if (hinten) {
          ctx.globalAlpha = h * 0.45;
          ctx.lineWidth = g * 0.7;
          ctx.beginPath(); ctx.moveTo(hinten.x, hinten.y); ctx.lineTo(q.x, q.y); ctx.stroke();
        }
        ctx.globalAlpha = h;
        ctx.fillRect(q.x - g / 2, q.y - g / 2, g, g);
        ctx.globalAlpha = h * 0.2;
        ctx.fillRect(q.x - g * 2, q.y - g * 2, g * 4, g * 4);
      }
      ctx.lineWidth = 1;

      // Knoten und ihre Beschriftung
      ctx.textBaseline = "middle";
      welt.knoten.forEach((n, i) => {
        const q = proj[i];
        if (!q) return;
        const h = tiefe(q.z, n.formel ? 1900 : 2600) * netzSicht;
        if (h < 0.03) return;
        const r = clamp((n.g * 300) / q.z, 0.8, 7);
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = h * 0.85;
        ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = h * 0.12;
        ctx.beginPath(); ctx.arc(q.x, q.y, r * 3.2, 0, Math.PI * 2); ctx.fill();
        if (n.text) {
          const g = ((n.formel ? 58 : 30) * f) / q.z / 2.2;
          // Was ganz nah vorbeizieht, blendet aus, statt riesig angeschnitten zu
          // stehen -- die Grenze haengt an der Breite (Handy: kleiner)
          const gross = Math.min(64, B * 0.06);
          if (g < 8 || g > gross * 1.6) return;
          ctx.globalAlpha = h * (n.formel ? 0.95 : 0.55) * clamp(1 - (g - gross) / (gross * 0.6), 0, 1);
          ctx.fillStyle = "#f4f2ee";
          if (n.formel) formelZeichnen(n.text, q.x, q.y - r - g * 0.9, g);
          else { ctx.font = `italic 500 ${g.toFixed(1)}px "Playfair Display", Georgia, serif`; ctx.textAlign = "center"; ctx.fillText(n.text, q.x, q.y - r - g * 0.8); ctx.textAlign = "left"; }
        }
      });
    }

    // Schlussbild: Lichtstroeme sammeln sich zum Zeichen
    const s = Math.min(B, H) * (B < 700 ? 0.36 : 0.3);   // Kantenlaenge des Zeichens
    const zx = B / 2, zy = H * 0.42;
    const weg = stueck(p, 0.92, 0.95);   // die Stroeme verloeschen, wenn das Zeichen steht
    if (ziel > 0 && weg < 1) {
      ctx.strokeStyle = "#ffffff";
      ctx.fillStyle = "#ffffff";
      ctx.lineCap = "round";
      ctx.lineWidth = 1.4;
      const R = Math.max(B, H) * 0.75;
      for (const st of welt.strom) {
        const roh = clamp((ziel - st.verzug * 0.5) / 0.5, 0, 1);
        if (roh <= 0) continue;
        const ort = (t) => [misch(zx + st.start[0] * R, zx + st.ziel[0] * s, t), misch(zy + st.start[1] * R, zy + st.ziel[1] * s, t)];
        const t = glatt(roh);
        const [x, y] = ort(t);
        const [hx, hy] = ort(glatt(Math.max(0, roh - 0.08)));
        const h = (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, roh * 1.1))) * (1 - weg);
        ctx.globalAlpha = h * 0.55;
        ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(x, y); ctx.stroke();
        ctx.globalAlpha = h;
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
    }

    const logo = stueck(p, 0.9, 0.95);
    if (logo > 0) {
      ctx.globalCompositeOperation = "source-over";
      // leiser Schein hinter dem Zeichen
      const schein = ctx.createRadialGradient(zx, zy, 0, zx, zy, s * 1.6);
      schein.addColorStop(0, `rgba(255,255,255,${(0.12 * logo).toFixed(3)})`);
      schein.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = schein;
      ctx.fillRect(zx - s * 1.6, zy - s * 1.6, s * 3.2, s * 3.2);
      ctx.globalAlpha = logo;
      ctx.fillStyle = "#f4f2ee";
      for (const b of welt.BALKEN) {
        ctx.fillRect(zx + (b.x / 100 - 0.5) * s, zy + (b.y / 100 - 0.5) * s, (b.b / 100) * s, (b.h / 100) * s);
      }
    }

    const schrift = stueck(p, 0.95, 1);
    if (schrift > 0) {
      ctx.globalCompositeOperation = "source-over";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      const wy = zy + s * 0.62 + 34;
      ctx.globalAlpha = schrift;
      ctx.fillStyle = "#f4f2ee";
      gesperrt("JKHD", zx, wy, `800 ${Math.round(Math.max(22, s * 0.16))}px Manrope, "Segoe UI", sans-serif`, 0.34);
      ctx.fillStyle = "#cfcdc8";
      gesperrt("Quant Systems", zx, wy + Math.max(26, s * 0.14), `700 ${Math.round(Math.max(12, s * 0.065))}px Manrope, "Segoe UI", sans-serif`, 0.05);
      ctx.fillStyle = "#9d9d99";
      gesperrt("Just Know How to Dominate.", zx, wy + Math.max(48, s * 0.24), `${Math.round(Math.max(11, s * 0.055))}px "Cascadia Code", Consolas, monospace`, 0.03);
    }
    ctx.globalAlpha = 1;
  }

  // Text mit Zeichenabstand (em-Anteil), zentriert
  function gesperrt(text, x, y, font, abstand) {
    ctx.font = font;
    const em = parseFloat(font.match(/(\d+(?:\.\d+)?)px/)[1]);
    const breiten = [...text].map((c) => ctx.measureText(c).width);
    const gesamt = breiten.reduce((a, b) => a + b, 0) + em * abstand * (text.length - 1);
    let lx = x - gesamt / 2;
    [...text].forEach((c, i) => { ctx.fillText(c, lx, y); lx += breiten[i] + em * abstand; });
  }

  // ---- Fortschritt, Schleife ----
  function zielFortschritt() {
    const r = abschnitt.getBoundingClientRect();
    const weg = abschnitt.offsetHeight - buehne.offsetHeight;
    if (weg <= 0) return 1;
    return clamp(-r.top / weg, 0, 1);
  }

  let p = 0;            // gezeigter Fortschritt (folgt dem Scrollen weich nach)
  let laeuft = false;
  let letzte = 0;
  function schleife(jetzt) {
    if (!laeuft) return;
    const dt = Math.min(0.05, (jetzt - letzte) / 1000 || 0.016);
    letzte = jetzt;
    const zielP = zielFortschritt();
    p += (zielP - p) * (1 - Math.exp(-dt * 6));   // weich, unabhaengig von der Bildrate
    if (Math.abs(zielP - p) < 0.0004) p = zielP;
    bild(p, jetzt / 1000);
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
    abschnitt.classList.toggle("ist-still", reduziert.matches);
    groesseAnpassen();
    if (reduziert.matches) { anhalten(); bild(1, 0); }
  }

  abschnitt.classList.add("ist-aktiv");
  einrichten();
  // Die Schriften (Playfair, Manrope) sind vielleicht noch nicht geladen
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (reduziert.matches) bild(1, 0); });

  new IntersectionObserver((eintraege) => {
    if (eintraege.some((e) => e.isIntersecting)) starten();
    else anhalten();
  }).observe(abschnitt);

  window.addEventListener("resize", () => { groesseAnpassen(); if (reduziert.matches) bild(1, 0); });
  if (reduziert.addEventListener) reduziert.addEventListener("change", einrichten);
})();

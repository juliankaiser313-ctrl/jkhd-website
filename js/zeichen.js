// ---------- Startseite: das Zeichen wird zum Chart ----------
// Julian, 10.10.2026: "wenn man in der Startseite runterscrollt, dass man eine
// Animation bekommt" -- gewaehlt: "Logo wird zum Chart". Beim Scrollen durch den
// Abschnitt #zeichen steht die Buehne still (position: sticky), und der
// Scrollfortschritt treibt das Bild:
//   0,00-0,12  das Zeichen (drei Balken) allein
//   0,12-0,46  die Balken faechern sich zu Kerzen auf, von der Mitte nach aussen
//   0,44-0,70  eine Linie (gleitender Durchschnitt) zeichnet sich durch
//   0,70-0,90  die Kerzen ziehen sich wieder zu den drei Balken zusammen
//   0,88-1,00  Wortmarke und Zeile darunter erscheinen
// Reine Grafik ohne Aussage: erfundene Kurse (feste Saat, jedes Mal gleich), keine
// Achsen, keine Zahlen. Nichts wird geladen oder gespeichert. Bei "reduzierter
// Bewegung" steht das Chart still da; ohne JavaScript zeigt das SVG das Zeichen.
(function () {
  const abschnitt = document.getElementById("zeichen");
  if (!abschnitt) return;
  const svg = abschnitt.querySelector(".zeichen-svg");
  const NS = "http://www.w3.org/2000/svg";
  const reduziert = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Das Zeichen in seinen eigenen Koordinaten (wie im <svg viewBox="0 0 100 100">
  // der Kopfzeile)
  const BALKEN = [
    { x: 10, y: 22, b: 20, h: 56 },
    { x: 40, y: 8, b: 20, h: 84 },
    { x: 70, y: 22, b: 20, h: 56 },
  ];

  // Zwei Zuschnitte: breit (Rechner, Tablet quer) und schmal (Handy hochkant)
  const ZUSCHNITTE = {
    breit: { w: 1200, h: 600, kerzen: 36, chart: { l: 90, r: 1110, o: 110, u: 470 }, zeichen: { x: 600, y: 270, s: 230 }, text: 540 },
    schmal: { w: 600, h: 760, kerzen: 16, chart: { l: 40, r: 560, o: 150, u: 590 }, zeichen: { x: 300, y: 340, s: 210 }, text: 640 },
  };

  // Fester Zufall: das Bild ist bei jedem Besuch dasselbe
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

  // Kerzen eines erfundenen Kursverlaufs, der im Ganzen steigt
  function kurse(anzahl) {
    const z = zufall(20261010);
    const liste = [];
    let schluss = 100;
    for (let i = 0; i < anzahl; i++) {
      const eroeffnung = schluss;
      schluss = eroeffnung + 0.55 + (z() - 0.45) * 5.2;
      const hoch = Math.max(eroeffnung, schluss) + z() * 1.8;
      const tief = Math.min(eroeffnung, schluss) - z() * 1.8;
      liste.push({ o: eroeffnung, c: schluss, h: hoch, l: tief });
    }
    return liste;
  }

  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const glatt = (t) => t * t * (3 - 2 * t);
  const misch = (a, b, t) => a + (b - a) * t;
  const stueck = (p, von, bis) => glatt(clamp((p - von) / (bis - von), 0, 1));

  let bild = null;   // aufgebautes Bild des aktuellen Zuschnitts
  let letzterP = -1;

  function aufbauen() {
    const name = window.innerWidth < 640 ? "schmal" : "breit";
    if (bild && bild.name === name) return;
    const Z = ZUSCHNITTE[name];
    svg.setAttribute("viewBox", `0 0 ${Z.w} ${Z.h}`);
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const daten = kurse(Z.kerzen);
    const min = Math.min(...daten.map((k) => k.l));
    const max = Math.max(...daten.map((k) => k.h));
    const yVon = (wert) => Z.chart.u - ((wert - min) / (max - min)) * (Z.chart.u - Z.chart.o);
    const schritt = (Z.chart.r - Z.chart.l) / Z.kerzen;
    const breite = Math.max(6, schritt * 0.52);

    // Die drei Balken des Zeichens in Bildkoordinaten
    const s = Z.zeichen.s / 100;
    const balken = BALKEN.map((b) => ({
      x: Z.zeichen.x - Z.zeichen.s / 2 + b.x * s,
      y: Z.zeichen.y - Z.zeichen.s / 2 + b.y * s,
      b: b.b * s,
      h: b.h * s,
    }));

    const gruppe = document.createElementNS(NS, "g");
    svg.appendChild(gruppe);
    const kerzen = daten.map((k, i) => {
      const cx = Z.chart.l + schritt * (i + 0.5);
      const yo = yVon(k.o), yc = yVon(k.c);
      const docht = document.createElementNS(NS, "line");
      docht.setAttribute("class", "zeichen-docht");
      docht.setAttribute("x1", cx);
      docht.setAttribute("x2", cx);
      docht.setAttribute("y1", yVon(k.h));
      docht.setAttribute("y2", yVon(k.l));
      const koerper = document.createElementNS(NS, "rect");
      koerper.setAttribute("class", "zeichen-kerze");
      gruppe.appendChild(docht);
      gruppe.appendChild(koerper);
      const drittel = i < Z.kerzen / 3 ? 0 : i < (2 * Z.kerzen) / 3 ? 1 : 2;
      return {
        docht,
        koerper,
        start: balken[drittel],
        ziel: { x: cx - breite / 2, y: Math.min(yo, yc), b: breite, h: Math.max(2, Math.abs(yo - yc)) },
        steigt: k.c >= k.o,
        // Abstand von der Mitte (0 innen, 1 aussen): bestimmt die Reihenfolge
        abstand: Math.abs(i - (Z.kerzen - 1) / 2) / ((Z.kerzen - 1) / 2),
      };
    });

    // Gleitender Durchschnitt ueber fuenf Schlusskurse als Linie
    const punkte = daten.map((k, i) => {
      const fenster = daten.slice(Math.max(0, i - 4), i + 1);
      const mittel = fenster.reduce((summe, f) => summe + f.c, 0) / fenster.length;
      return [Z.chart.l + schritt * (i + 0.5), yVon(mittel)];
    });
    // Die drei Balken liegen ueber den Kerzen: Die Kerzen kommen klein aus ihrer
    // Mitte und sind erst zu sehen, wenn sie den Balken verlassen; die Balken
    // blenden dabei aus (und am Ende wieder ein).
    const balkenFormen = balken.map((b) => {
      const r = document.createElementNS(NS, "rect");
      r.setAttribute("class", "zeichen-balken");
      r.setAttribute("x", b.x);
      r.setAttribute("y", b.y);
      r.setAttribute("width", b.b);
      r.setAttribute("height", b.h);
      svg.appendChild(r);
      return { r, cx: b.x + b.b / 2, cy: b.y + b.h / 2 };
    });

    const linie = document.createElementNS(NS, "path");
    linie.setAttribute("class", "zeichen-linie");
    linie.setAttribute("d", punkte.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" "));
    svg.appendChild(linie);
    const laenge = linie.getTotalLength();
    linie.style.strokeDasharray = laenge;

    // Wortmarke und Zeile darunter: dieselben Worte wie im Kopf der Seite
    const wort = document.createElementNS(NS, "text");
    wort.setAttribute("class", "zeichen-wort");
    wort.setAttribute("x", Z.w / 2);
    wort.setAttribute("y", Z.text);
    wort.textContent = "JKHD";
    const zeile = document.createElementNS(NS, "text");
    zeile.setAttribute("class", "zeichen-zeile");
    zeile.setAttribute("x", Z.w / 2);
    zeile.setAttribute("y", Z.text + (name === "breit" ? 34 : 38));
    zeile.textContent = "Just Know How to Dominate.";
    svg.appendChild(wort);
    svg.appendChild(zeile);

    bild = { name, kerzen, balkenFormen, linie, laenge, wort, zeile };
    letzterP = -1;
  }

  function zeichnen(p) {
    if (!bild || Math.abs(p - letzterP) < 0.0005) return;
    letzterP = p;
    for (const k of bild.kerzen) {
      // auffaechern: innen zuerst; zusammenziehen: aussen zuerst
      const auf = stueck(p, 0.12 + k.abstand * 0.16, 0.30 + k.abstand * 0.16);
      const zu = stueck(p, 0.70 + (1 - k.abstand) * 0.08, 0.82 + (1 - k.abstand) * 0.08);
      // Weg (Mitte des Balkens -> Mitte der Kerze) und Groesse getrennt: Eine
      // Kerze kommt klein aus der Mitte ihres Balkens und waechst auf dem Weg;
      // beim Zusammenziehen schrumpft sie erst auf dem letzten Stueck und
      // verschwindet im Balken. (Waren die Kerzen anfangs balkengross, flogen
      // treppenartig gestapelte Bloecke durchs Bild.)
      const weg = auf * (1 - zu);
      const groesse = Math.min(clamp(auf * 1.6, 0, 1), 1 - clamp((zu - 0.5) / 0.5, 0, 1));
      const a = k.start, b = k.ziel;
      const mx = misch(a.x + a.b / 2, b.x + b.b / 2, weg);
      const my = misch(a.y + a.h / 2, b.y + b.h / 2, weg);
      const bw = b.b * groesse;
      const bh = b.h * groesse;
      k.koerper.setAttribute("x", (mx - bw / 2).toFixed(2));
      k.koerper.setAttribute("y", (my - bh / 2).toFixed(2));
      k.koerper.setAttribute("width", bw.toFixed(2));
      k.koerper.setAttribute("height", bh.toFixed(2));
      // steigende Kerzen werden hohl, fallende bleiben gefuellt (wie im Spiel)
      k.koerper.style.fillOpacity = k.steigt ? (1 - clamp((groesse - 0.5) * 2, 0, 1)).toFixed(3) : "1";
      k.docht.style.opacity = clamp((weg - 0.75) / 0.25, 0, 1).toFixed(3);
    }
    // Die Balken: zu Beginn da, waehrend des Auffaecherns weg, am Ende wieder da
    const balken = clamp(1 - stueck(p, 0.16, 0.34) + stueck(p, 0.80, 0.92), 0, 1);
    for (const f of bild.balkenFormen) {
      const s = misch(0.35, 1, balken);
      f.r.setAttribute("transform", `translate(${f.cx} ${f.cy}) scale(${s.toFixed(3)}) translate(${-f.cx} ${-f.cy})`);
      f.r.style.opacity = balken.toFixed(3);
    }
    const strich = stueck(p, 0.44, 0.68) * (1 - stueck(p, 0.70, 0.78));
    bild.linie.style.strokeDashoffset = (bild.laenge * (1 - stueck(p, 0.44, 0.68))).toFixed(1);
    bild.linie.style.opacity = strich > 0 ? (1 - stueck(p, 0.70, 0.78)).toFixed(3) : "0";
    const schrift = stueck(p, 0.88, 0.98);
    bild.wort.style.opacity = schrift.toFixed(3);
    bild.zeile.style.opacity = schrift.toFixed(3);
  }

  // Fortschritt 0..1: wie weit die Buehne durch den Abschnitt gewandert ist
  function fortschritt() {
    const r = abschnitt.getBoundingClientRect();
    const weg = abschnitt.offsetHeight - abschnitt.querySelector(".zeichen-buehne").offsetHeight;
    if (weg <= 0) return 0.6;
    return clamp(-r.top / weg, 0, 1);
  }

  let angefordert = false;
  let sichtbar = false;
  function anfordern() {
    if (angefordert || !sichtbar) return;
    angefordert = true;
    requestAnimationFrame(() => {
      angefordert = false;
      zeichnen(fortschritt());
    });
  }

  function einrichten() {
    abschnitt.classList.toggle("ist-still", reduziert.matches);
    aufbauen();
    // Still: das fertige Chart mit Linie, ohne Scroll-Bindung
    if (reduziert.matches) {
      letzterP = -1;
      zeichnen(0.6);
    } else {
      letzterP = -1;
      zeichnen(fortschritt());
    }
  }

  abschnitt.classList.add("ist-aktiv");
  einrichten();

  new IntersectionObserver((eintraege) => {
    sichtbar = eintraege.some((e) => e.isIntersecting);
    if (sichtbar && !reduziert.matches) anfordern();
  }).observe(abschnitt);

  window.addEventListener("scroll", () => { if (!reduziert.matches) anfordern(); }, { passive: true });
  window.addEventListener("resize", () => {
    const vorher = bild && bild.name;
    aufbauen();
    if (bild.name !== vorher) letzterP = -1;
    if (reduziert.matches) zeichnen(0.6);
    else anfordern();
  });
  if (reduziert.addEventListener) reduziert.addEventListener("change", einrichten);
})();

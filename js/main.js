/* JKHD — gemeinsames JavaScript für alle Seiten */

// ---------- Mobile Navigation ----------
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    siteNav.classList.toggle("open");
  });
}

// ---------- Hell/Dunkel ----------
// Das Thema selbst setzt schon das Vorab-Skript im <head>. Hier haengt nur
// der Schalter dran: merken, umschalten, und der Systemeinstellung folgen,
// solange der Besucher nicht selbst gewaehlt hat.
(function () {
  const SPEICHER = "jkhd-theme";
  const wurzel = document.documentElement;
  const schalter = document.querySelector(".theme-toggle");
  const systemDunkel = window.matchMedia("(prefers-color-scheme: dark)");

  const istDunkel = () => wurzel.getAttribute("data-theme") === "dark";

  function anwenden(dunkel) {
    if (dunkel) wurzel.setAttribute("data-theme", "dark");
    else wurzel.removeAttribute("data-theme");

    // Browser-Oberflaeche (Adressleiste auf dem Handy) mitziehen
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dunkel ? "#0b0b0c" : "#f7f6f3");
    if (schalter) schalter.setAttribute("aria-pressed", String(dunkel));
  }

  anwenden(istDunkel());

  if (schalter) {
    schalter.addEventListener("click", () => {
      const neu = !istDunkel();
      anwenden(neu);
      try {
        localStorage.setItem(SPEICHER, neu ? "dark" : "light");
      } catch (e) {}
    });
  }

  // Ohne eigene Wahl folgt die Seite dem Betriebssystem, auch waehrend sie offen ist
  const beiSystemwechsel = (e) => {
    let gewaehlt = null;
    try {
      gewaehlt = localStorage.getItem(SPEICHER);
    } catch (err) {}
    if (!gewaehlt) anwenden(e.matches);
  };
  if (systemDunkel.addEventListener) systemDunkel.addEventListener("change", beiSystemwechsel);
  else if (systemDunkel.addListener) systemDunkel.addListener(beiSystemwechsel);
})();

// ---------- Footer-Jahr ----------
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---------- Header verdichtet sich beim Scrollen ----------
const siteHeader = document.querySelector(".site-header");
if (siteHeader) {
  const onScroll = () => siteHeader.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// ---------- Daten-Hintergrund: rohes Time-&-Sales-Tape (monochrom) ----------
// Kein Chart — Quants schauen auf Rohdaten. Im Hintergrund läuft ein Tick-Feed
// (Zeit, Preis, Volumen, Seite), der langsam nach oben durchläuft. Das
// Markenzeichen selbst bleibt statisch.
(function () {
  const canvas = document.getElementById("dataviz");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ROW_H = 26;      // Zeilenhöhe (px)
  const SPEED = 0.32;    // Scroll-Geschwindigkeit (px/Frame)

  let width = 0, height = 0;
  let rows = [];
  let offset = 0;
  let grad = null;

  // synthetischer Feed
  let price = 23400 + Math.random() * 200;
  let clock = (15 * 3600 + 30 * 60) * 1000 + Math.floor(Math.random() * 3600000);

  function fmtTime(ms) {
    const h = Math.floor(ms / 3600000) % 24;
    const m = Math.floor(ms / 60000) % 60;
    const s = Math.floor(ms / 1000) % 60;
    const f = Math.floor(ms % 1000);
    const p = (n, l) => String(n).padStart(l, "0");
    return `${p(h, 2)}:${p(m, 2)}:${p(s, 2)}.${p(f, 3)}`;
  }

  function fmtPrice(p) {
    return p.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function nextRow() {
    clock += 20 + Math.floor(Math.random() * 850);
    price += (Math.random() - 0.5) * price * 0.00013;
    return {
      time: fmtTime(clock),
      price: fmtPrice(price),
      size: "×" + (1 + Math.floor(Math.random() * 24)),
      side: Math.random() < 0.5 ? "BID" : "ASK",
    };
  }

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return; // Layout noch nicht da (z. B. Tab unsichtbar)
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Nach links ausblenden, damit die Headline frei bleibt
    grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(0.45, "rgba(255,255,255,0.025)");
    grad.addColorStop(1, "rgba(255,255,255,0.16)");

    rows = [];
    const count = Math.ceil(height / ROW_H) + 2;
    for (let i = 0; i < count; i++) rows.push(nextRow());

    if (reduced) draw(); // Standbild aktualisieren
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.font = "12px Consolas, 'Cascadia Code', monospace";
    ctx.fillStyle = grad;
    ctx.textAlign = "right";

    // Spalten von rechts: Seite, Volumen, Preis, Zeit
    const xSide = width - 28;
    const xSize = width - 118;
    const xPrice = width - 208;
    const xTime = width - 372;

    for (let i = 0; i < rows.length; i++) {
      const y = i * ROW_H - offset + ROW_H * 0.7;
      const r = rows[i];
      ctx.fillText(r.time, xTime, y);
      ctx.fillText(r.price, xPrice, y);
      ctx.fillText(r.size, xSize, y);
      ctx.fillText(r.side, xSide, y);
    }
  }

  function step() {
    if (width > 0) {
      offset += SPEED;
      if (offset >= ROW_H) {
        offset -= ROW_H;
        rows.shift();
        rows.push(nextRow());
      }
      draw();
    }
    requestAnimationFrame(step);
  }

  // ResizeObserver greift auch, wenn das Layout erst später Breite bekommt
  if ("ResizeObserver" in window) {
    new ResizeObserver(resize).observe(canvas.parentElement);
  } else {
    window.addEventListener("resize", resize);
  }
  resize();
  if (!reduced) step();
})();

// ---------- Tiefen-Raster: scrollgekoppelter Hintergrund (nur Startseite) ----------
// Drei Ebenen aus Datenpunkten bewegen sich beim Scrollen unterschiedlich
// schnell mit — wie eine Fahrt durch einen Datenraum. Dazu minimale Drift.
(function () {
  const canvas = document.getElementById("depthgrid");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // f = Scroll-Faktor (je näher die Ebene, desto schneller), link = Linien-Distanz
  const LAYERS = [
    { n: 90, r: 1.0, a: 0.045, f: 0.05 },
    { n: 60, r: 1.5, a: 0.07,  f: 0.12 },
    { n: 34, r: 2.0, a: 0.11,  f: 0.22, link: 130 },
  ];

  let w = 0, h = 0, dots = [], t = 0;

  function resize() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = LAYERS.map((L) =>
      Array.from({ length: L.n }, () => ({ x: Math.random() * w, y: Math.random() * h }))
    );
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const sy = window.scrollY;

    LAYERS.forEach((L, i) => {
      const off = sy * L.f + t * (i + 1) * 0.05;
      const pts = dots[i].map((d) => ({ x: d.x, y: (((d.y - off) % h) + h) % h }));

      if (L.link) {
        ctx.strokeStyle = "rgba(255,255,255,0.035)";
        ctx.lineWidth = 1;
        for (let a = 0; a < pts.length; a++) {
          for (let b = a + 1; b < pts.length; b++) {
            const dx = pts[a].x - pts[b].x;
            const dy = pts[a].y - pts[b].y;
            if (Math.hypot(dx, dy) < L.link) {
              ctx.beginPath();
              ctx.moveTo(pts[a].x, pts[a].y);
              ctx.lineTo(pts[b].x, pts[b].y);
              ctx.stroke();
            }
          }
        }
      }

      ctx.fillStyle = `rgba(255,255,255,${L.a})`;
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, L.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function loop() {
    t += 1;
    draw();
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  resize();
  if (reduced) {
    draw(); // statisch; bewegt sich nur durch aktives Scrollen
    window.addEventListener("scroll", draw, { passive: true });
  } else {
    loop();
  }
})();

// ---------- Scroll-Parallax + Fortschrittslinie ----------
(function () {
  const progress = document.getElementById("scrollProgress");
  const pxEls = document.querySelectorAll("[data-parallax]");
  if (!progress && !pxEls.length) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ticking = false;

  function update() {
    ticking = false;
    const sy = window.scrollY;

    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? (sy / max).toFixed(4) : 0})`;
    }

    if (!reduced) {
      for (const el of pxEls) {
        const f = parseFloat(el.dataset.parallax || "0");
        el.style.transform = `translateY(${(sy * f).toFixed(1)}px)`;
      }
    }
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  update();
})();

// ---------- Preis-Konfigurator ----------
// Die Beträge stehen ausschließlich im data-preis-Attribut der Zeilen (index.html).
// Hier wird nur gelesen, formatiert und summiert — nirgends ein zweiter Preis.
(function () {
  const config = document.getElementById("config");
  if (!config) return;

  const rows = Array.from(config.querySelectorAll(".config-row"));
  const sumEl = document.getElementById("config-sum");
  const metaEl = document.getElementById("config-meta");
  const hintEl = document.getElementById("config-hint");
  if (!rows.length || !sumEl) return;

  const euro = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  const preisVon = (row) => Number(row.dataset.preis || 0);
  const kernAnzahl = rows.filter((r) => r.dataset.kern === "ja").length;

  // Preisspalte einmalig aus den Daten füllen
  rows.forEach((row) => {
    const zelle = row.querySelector(".config-price");
    if (zelle) zelle.textContent = euro.format(preisVon(row));
  });

  function aktualisieren() {
    let summe = 0;
    let gewaehlt = 0;
    let kern = 0;

    rows.forEach((row) => {
      const box = row.querySelector("input");
      const an = box.checked;
      row.classList.toggle("is-on", an);
      if (!an) return;
      summe += preisVon(row);
      gewaehlt++;
      if (row.dataset.kern === "ja") kern++;
    });

    sumEl.textContent = euro.format(summe);
    metaEl.textContent =
      gewaehlt === 0
        ? "Noch nichts ausgewählt"
        : gewaehlt + " von " + rows.length + " Bausteinen gewählt";
    if (hintEl) hintEl.hidden = kern < kernAnzahl;
  }

  rows.forEach((row) => {
    row.querySelector("input").addEventListener("change", aktualisieren);
  });

  aktualisieren();
})();

// ---------- Zufalls-Demo: der schönste Backtest ist gewürfelt ----------
// Wir erzeugen 200 reine Zufallspfade ohne jeden Drift und zeigen den besten
// davon. Genau so entsteht ein überzeugender Backtest — und genau dagegen
// prüfen die Härtetests. Die Zahlen sind echt gerechnet, nur eben aus Rauschen.
(function () {
  const svg = document.getElementById("luck-svg");
  const rollBtn = document.getElementById("luck-roll");
  if (!svg || !rollBtn) return;

  const W = 640, H = 260, PAD = 12;
  const DAYS = 250;        // Handelstage je Pfad
  const PATHS = 200;       // Versuche, aus denen der beste gezeigt wird
  const VOL = 0.011;       // Tagesschwankung (~1,1 %)

  const gridG = svg.querySelector(".luck-grid");
  const areaEl = svg.querySelector(".luck-area");
  const lineEl = svg.querySelector(".luck-line");
  const out = {
    ret: document.getElementById("luck-return"),
    sharpe: document.getElementById("luck-sharpe"),
    hit: document.getElementById("luck-hit"),
    dd: document.getElementById("luck-dd"),
  };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Standardnormalverteilte Zufallszahl (Box-Muller)
  function gauss() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // Ein Pfad: Tagesrenditen ohne Erwartungswert, daraus die Kapitalkurve
  function makePath() {
    const rets = [];
    const eq = [100];
    for (let i = 0; i < DAYS; i++) {
      const r = gauss() * VOL;
      rets.push(r);
      eq.push(eq[i] * (1 + r));
    }

    const mean = rets.reduce((a, b) => a + b, 0) / DAYS;
    const varc = rets.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (DAYS - 1);
    const sd = Math.sqrt(varc);
    const sharpe = sd ? (mean / sd) * Math.sqrt(DAYS) : 0;

    let peak = eq[0], maxDD = 0;
    for (const v of eq) {
      if (v > peak) peak = v;
      const dd = (v - peak) / peak;
      if (dd < maxDD) maxDD = dd;
    }

    return {
      eq,
      sharpe,
      total: eq[eq.length - 1] / eq[0] - 1,
      hit: rets.filter((r) => r > 0).length / DAYS,
      maxDD,
    };
  }

  // Der beste aus vielen — das ist der ganze Trick
  function bestOfMany() {
    let best = makePath();
    for (let i = 1; i < PATHS; i++) {
      const p = makePath();
      if (p.sharpe > best.sharpe) best = p;
    }
    return best;
  }

  function toPath(eq) {
    const min = Math.min(...eq), max = Math.max(...eq);
    const span = max - min || 1;
    const x = (i) => PAD + (i / (eq.length - 1)) * (W - PAD * 2);
    const y = (v) => H - PAD - ((v - min) / span) * (H - PAD * 2);
    const line = eq.map((v, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(v).toFixed(1)).join(" ");
    const area = line + " L" + x(eq.length - 1).toFixed(1) + " " + (H - PAD) + " L" + x(0).toFixed(1) + " " + (H - PAD) + " Z";
    return { line, area };
  }

  function drawGrid() {
    for (let i = 1; i < 4; i++) {
      const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
      const y = (H / 4) * i;
      ln.setAttribute("x1", PAD); ln.setAttribute("x2", W - PAD);
      ln.setAttribute("y1", y); ln.setAttribute("y2", y);
      gridG.appendChild(ln);
    }
  }

  const pct = (v, digits = 1) =>
    (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v * 100).toFixed(digits) + " %";

  function render() {
    const p = bestOfMany();
    const d = toPath(p.eq);

    lineEl.setAttribute("d", d.line);
    areaEl.setAttribute("d", d.area);

    // Die Kurve zeichnet sich einmal durch — außer der Nutzer mag keine Animation
    if (!reduced) {
      const len = lineEl.getTotalLength();
      lineEl.style.transition = "none";
      lineEl.style.strokeDasharray = len;
      lineEl.style.strokeDashoffset = len;
      areaEl.style.opacity = "0";
      void lineEl.getBoundingClientRect();
      lineEl.style.transition = "stroke-dashoffset 1.1s cubic-bezier(0.2,0.7,0.2,1)";
      areaEl.style.transition = "opacity 0.9s ease 0.3s";
      lineEl.style.strokeDashoffset = "0";
      areaEl.style.opacity = "1";
    }

    out.ret.textContent = pct(p.total);
    out.sharpe.textContent = p.sharpe.toFixed(2);
    out.hit.textContent = (p.hit * 100).toFixed(0) + " %";
    out.dd.textContent = pct(p.maxDD);
  }

  drawGrid();
  render();
  rollBtn.addEventListener("click", render);
})();

// ---------- Scroll-Reveal: Inhalte gleiten beim Scrollen herein ----------
// Die Ziel-Elemente werden hier markiert, das CSS (.reveal/.in) macht den Rest.
(function () {
  const targets = document.querySelectorAll(
    ".section-head, .page-head, .offer, .block-head, .kind, .layer, .config, .exclusive, .rail, .guard, .step-row, .creed-cell, .creed-close, .founder-card, .luck, .verdict, .cta-panel, .contact-box, .prose, .console"
  );
  if (!targets.length) return;

  targets.forEach((el) => el.classList.add("reveal"));

  // Raster-Elemente leicht versetzt einblenden
  document.querySelectorAll(".offers, .guards, .creed").forEach((grid) => {
    Array.from(grid.children).forEach((card, i) => {
      card.style.transitionDelay = i * 90 + "ms";
    });
  });

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => io.observe(el));
})();

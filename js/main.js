/* JKHD — gemeinsames JavaScript für alle Seiten */

// ---------- Sprache ----------
// Dieselbe Datei bedient die deutschen Seiten und die unter /en/. Welche
// Fassung eines Textes gilt, entscheidet allein das lang-Attribut der Seite —
// es gibt keine Erkennung und keine Weiterleitung.
const IST_EN = document.documentElement.lang === "en";
const T = (de, en) => (IST_EN ? en : de);

// ---------- Navigation ----------
// Die Menuepunkte liegen auf jeder Bildschirmbreite hinter dem Menueknopf.
// Weil das der einzige Weg zu den Seiten ist, schliesst das Feld auch wieder:
// per Escape und beim Klick irgendwo daneben.
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

if (navToggle && siteNav) {
  const zeigen = (auf) => {
    siteNav.classList.toggle("open", auf);
    navToggle.setAttribute("aria-expanded", String(auf));
  };

  zeigen(false);

  // Wie bei der Fragen-Blase weiter unten: In der Abwaertsphase merken, dass
  // der Klick aus dem Menuebereich kam. Kein stopPropagation — sonst erfaehrt
  // die Fragen-Blase nichts von dem Klick und bliebe nebenher offen stehen.
  let ausMenue = false;
  const merken = () => { ausMenue = true; };
  siteNav.addEventListener("click", merken, true);
  navToggle.addEventListener("click", merken, true);

  navToggle.addEventListener("click", () => {
    zeigen(!siteNav.classList.contains("open"));
  });

  // Ein Klick auf einen Menuepunkt schliesst das Feld. Bei einem Sprung auf
  // derselben Seite (Anker) bliebe es sonst offen stehen und
  // verdeckte unterhalb von 1141 px genau das Ziel.
  siteNav.addEventListener("click", (e) => {
    if (e.target.closest("a[href]")) zeigen(false);
  });

  document.addEventListener("click", () => {
    if (siteNav.classList.contains("open") && !ausMenue) zeigen(false);
    ausMenue = false;
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && siteNav.classList.contains("open")) {
      zeigen(false);
      navToggle.focus();
    }
  });
}

// ---------- Hell/Dunkel ----------
// Das Thema selbst setzt schon das Vorab-Skript im <head>. Hier haengen nur
// die beiden Segmente im Menue dran: merken, umschalten, und der
// Systemeinstellung folgen, solange der Besucher nicht selbst gewaehlt hat.
(function () {
  const SPEICHER = "jkhd-theme";
  const wurzel = document.documentElement;
  const segmente = document.querySelectorAll(".theme-opt");
  const systemDunkel = window.matchMedia("(prefers-color-scheme: dark)");

  const istDunkel = () => wurzel.getAttribute("data-theme") === "dark";

  function anwenden(dunkel) {
    if (dunkel) wurzel.setAttribute("data-theme", "dark");
    else wurzel.removeAttribute("data-theme");

    // Browser-Oberflaeche (Adressleiste auf dem Handy) mitziehen
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dunkel ? "#0b0b0c" : "#f7f6f3");

    // Das Segment, das gerade gilt, steht hervorgehoben da
    segmente.forEach((s) => {
      const an = (s.dataset.themeSet === "dark") === dunkel;
      s.classList.toggle("is-on", an);
      s.setAttribute("aria-pressed", String(an));
    });
  }

  anwenden(istDunkel());

  segmente.forEach((s) => {
    s.addEventListener("click", () => {
      const dunkel = s.dataset.themeSet === "dark";
      anwenden(dunkel);
      try {
        localStorage.setItem(SPEICHER, dunkel ? "dark" : "light");
      } catch (e) {}
    });
  });

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

// ---------- Scroll-Reveal: Inhalte gleiten beim Scrollen herein ----------
// Die Ziel-Elemente werden hier markiert, das CSS (.reveal/.in) macht den Rest.
(function () {
  const targets = document.querySelectorAll(
    ".section-head, .page-head, .statement, .kachel, .partner, .layer, .rail, .guard, .step-row, .creed-cell, .creed-close, .founder-card, .cta-panel, .prose"
  );
  if (!targets.length) return;

  targets.forEach((el) => el.classList.add("reveal"));

  // Raster-Elemente leicht versetzt einblenden
  document.querySelectorAll(".kacheln, .guards, .creed").forEach((grid) => {
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

// ---------- Assistent: haeufige Fragen, sonst an den Menschen ----------
// Bewusst ohne Sprachmodell: kein API-Schluessel im Browser, keine laufenden
// Kosten, keine Datenuebertragung — und keine Maschine, die Preise oder
// Zusagen erfindet. Die Antworten stehen hier, sonst nirgends.
(function () {
  if (document.querySelector(".helper")) return;

  const FRAGEN_EN = [
    {
      f: "Do you sell the program?",
      a: "No. We build it for ourselves and do not pass it on \u2014 not as software, not as a subscription.",
    },
    {
      f: "Do you manage my money?",
      a: "No, for no one. There are no clients and no client money.",
    },
    {
      f: "Do you give tips on what to buy?",
      a: "No. We tell nobody what to buy or sell \u2014 not even when asked.",
    },
    {
      f: "Can I learn from you?",
      a: "Gladly, in conversation: how to tell chance from real patterns, how to limit losses, what went wrong for us. The recipe itself stays with us.",
    },
    {
      f: "Who is behind it?",
      a: "One founder who is responsible for everything and runs it himself.",
      link: { text: "About the company", href: "company.html" },
    },
    {
      f: "How do I reach you?",
      a: "By e-mail to kontakt@jkhd.de or via the contact page. One sentence is enough \u2014 a person answers.",
      link: { text: "Contact", href: "contact.html" },
    },
  ];

  const FRAGEN_DE = [
    {
      f: "Verkaufen Sie das Programm?",
      a: "Nein. Wir bauen es f\u00fcr uns und geben es nicht weiter \u2014 weder als Software noch als Abo.",
    },
    {
      f: "Verwalten Sie mein Geld?",
      a: "Nein, f\u00fcr niemanden. Es gibt keine Kunden und kein Kundengeld.",
    },
    {
      f: "Geben Sie Tipps, was ich kaufen soll?",
      a: "Nein. Wir sagen niemandem, was er kaufen oder verkaufen soll \u2014 auch nicht auf Nachfrage.",
    },
    {
      f: "Kann ich von Ihnen lernen?",
      a: "Im Austausch gern: wie man Zufall von echten Mustern unterscheidet, wie man Verluste begrenzt, was bei uns schiefgegangen ist. Das Rezept selbst bleibt bei uns.",
    },
    {
      f: "Wer steckt dahinter?",
      a: "Ein Gr\u00fcnder, der alles selbst verantwortet und betreibt.",
      link: { text: "Zum Unternehmen", href: "unternehmen.html" },
    },
    {
      f: "Wie erreiche ich Sie?",
      a: "Per E-Mail an kontakt@jkhd.de oder \u00fcber die Kontaktseite. Ein Satz gen\u00fcgt \u2014 es antwortet ein Mensch.",
      link: { text: "Zur Kontaktseite", href: "kontakt.html" },
    },
  ];

  const FRAGEN = IST_EN ? FRAGEN_EN : FRAGEN_DE;

  const html = `
    <button class="helper-btn" type="button" aria-expanded="false" aria-controls="helper-panel">
      <span class="helper-btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.6a8.2 8.2 0 0 1-8.8 8.2 8.6 8.6 0 0 1-3.1-.7L3.5 20.5l1.4-5a8.2 8.2 0 0 1-.9-3.7 8.2 8.2 0 0 1 8.2-8.2h.5a8.2 8.2 0 0 1 7.8 7.8z"/><path d="M10.2 9.6a1.9 1.9 0 0 1 3.7.6c0 1.3-1.9 1.9-1.9 1.9"/><path d="M12 15.4h.01"/></svg></span>
      <span class="helper-btn-text">${T("Fragen", "Questions")}</span>
    </button>
    <div class="helper-panel" id="helper-panel" role="dialog" aria-modal="false"
         aria-label="${T("H\u00e4ufige Fragen", "Frequently asked questions")}" hidden>
      <div class="helper-head">
        <span class="helper-title">${T("H\u00e4ufige Fragen", "Frequent questions")}</span>
        <button class="helper-close" type="button" aria-label="${T("Schlie\u00dfen", "Close")}">&times;</button>
      </div>
      <div class="helper-body"></div>
      <div class="helper-foot">
        <span>${T("Frage nicht dabei?", "Question not listed?")}</span>
        <a href="mailto:kontakt@jkhd.de">kontakt@jkhd.de</a>
        <a href="mailto:service@jkhd.de">service@jkhd.de</a>
      </div>
    </div>`;

  const wrap = document.createElement("div");
  wrap.className = "helper";
  wrap.innerHTML = html;
  document.body.appendChild(wrap);

  const btn = wrap.querySelector(".helper-btn");
  const panel = wrap.querySelector(".helper-panel");
  const body = wrap.querySelector(".helper-body");
  const close = wrap.querySelector(".helper-close");

  function liste() {
    body.innerHTML =
      '<p class="helper-intro">' +
      T(
        "Am schnellsten geht es per E-Mail \u2014 wir antworten pers\u00f6nlich. " +
          "Diese Fragen beantworte ich Ihnen aber sofort:",
        "E-mail is the quickest way \u2014 we answer personally. " +
          "These questions I can answer for you right away:"
      ) +
      "</p>" +
      '<ul class="helper-list">' +
      FRAGEN.map((q, i) => `<li><button type="button" data-i="${i}">${q.f}</button></li>`).join("") +
      "</ul>";
    body.scrollTop = 0;
  }

  function antwort(i) {
    const q = FRAGEN[i];
    body.innerHTML =
      '<button class="helper-back" type="button">&larr; ' +
      T("Alle Fragen", "All questions") +
      "</button>" +
      `<p class="helper-q">${q.f}</p>` +
      `<p class="helper-a">${q.a}</p>` +
      (q.link ? `<a class="helper-link" href="${q.link.href}">${q.link.text}</a>` : "");
    body.scrollTop = 0;
  }

  // fokus=false beim Schliessen von aussen: Wer daneben klickt, will dort
  // weiterlesen — dann darf der Knopf den Fokus nicht zurueckreiszen.
  function oeffnen(auf, fokus = true) {
    panel.hidden = !auf;
    btn.setAttribute("aria-expanded", String(auf));
    wrap.classList.toggle("is-open", auf);
    if (auf) {
      liste();
      const erste = body.querySelector("button");
      if (erste) erste.focus();
    } else if (fokus) {
      btn.focus();
    }
  }

  btn.addEventListener("click", () => oeffnen(panel.hidden));
  close.addEventListener("click", () => oeffnen(false));

  body.addEventListener("click", (e) => {
    const ziel = e.target.closest("button");
    if (!ziel) return;
    if (ziel.classList.contains("helper-back")) liste();
    else if (ziel.dataset.i) antwort(Number(ziel.dataset.i));
    else if (ziel.dataset.i === "0") antwort(0);
  });

  // Klick irgendwo daneben schliesst das Feld — wie beim Menue oben.
  //
  // Warum nicht einfach wrap.contains(e.target) im Dokument-Zuhoerer: Ein
  // Klick auf eine Frage baut den Inhalt neu auf. Bis der Klick oben am
  // Dokument ankommt, haengt der angeklickte Knopf nicht mehr im Dokument,
  // contains() sagt "war nicht drin" — und das Feld haette sich selbst
  // geschlossen. Deshalb wird in der Abwaertsphase gemerkt, dass der Klick
  // aus dem Feld kam, solange das Ziel noch steht.
  // Gemerkt wird nur, was den sichtbaren Teilen gilt — Knopf und Feld. Nicht
  // dem Behaelter drumherum: Der ist breiter als der Knopf, und sein
  // durchsichtiger Rest soll wie "daneben" wirken, nicht wie "drin".
  let vonInnen = false;
  const ausDerBlase = () => { vonInnen = true; };
  btn.addEventListener("click", ausDerBlase, true);
  panel.addEventListener("click", ausDerBlase, true);

  document.addEventListener("click", () => {
    if (!panel.hidden && !vonInnen) oeffnen(false, false);
    vonInnen = false;
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) oeffnen(false);
  });
})();

// ---------- Partnerzugang: E-Mail -> Code -> Daten ----------
// Der Kasten auf der Kontaktseite. Ein Server dahinter ist noch nicht
// angeschlossen (data-api am .partner-Element leer): Dann wird nichts
// gesendet, und der Kasten sagt das offen. Sobald es ihn gibt, erwartet der
// Ablauf diese Schnittstelle (siehe README, Abschnitt Partnerzugang):
//   POST {api}/code   {"email": "..."}                 -> 204, immer (verraet nicht, wer Partner ist)
//   POST {api}/login  {"email": "...", "code": "..."}  -> 200 {"name": "...", "felder": [{"label": "...", "wert": "..."}]}
//                                                      -> 401 bei falschem oder abgelaufenem Code
(function () {
  const box = document.querySelector(".partner");
  if (!box) return;
  const koerper = box.querySelector(".partner-koerper");
  const startKnopf = box.querySelector('[data-partner="start"]');
  if (!koerper || !startKnopf) return;

  const api = (box.dataset.api || "").replace(/\/+$/, "");
  const startHtml = koerper.innerHTML;

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const hinweis = (text, fehler) =>
    `<p class="partner-hinweis${fehler ? " is-error" : ""}">${text}</p>`;

  const aktionen = (haupt, nebenText, nebenAktion) =>
    `<div class="partner-aktionen">
       <button type="submit" class="btn btn-primary">${haupt}</button>
       <button type="button" class="btn btn-ghost" data-partner="${nebenAktion}">${nebenText}</button>
     </div>`;

  function zurueck() {
    koerper.innerHTML = startHtml;
    koerper.querySelector('[data-partner="start"]').addEventListener("click", mailSchritt);
  }

  // Schritt 1: E-Mail-Adresse
  function mailSchritt() {
    koerper.innerHTML =
      `<form class="partner-form" novalidate>
         <div class="field">
           <label for="partner-mail">${T("Ihre E-Mail-Adresse", "Your e-mail address")}</label>
           <input id="partner-mail" name="email" type="email" required autocomplete="email" inputmode="email">
         </div>
         ${aktionen(T("Code anfordern", "Request code"), T("Abbrechen", "Cancel"), "zurueck")}
         <div class="partner-meldung"></div>
       </form>`;
    const form = koerper.querySelector("form");
    const eingabe = form.querySelector("input");
    const meldung = form.querySelector(".partner-meldung");
    form.querySelector('[data-partner="zurueck"]').addEventListener("click", zurueck);
    eingabe.focus();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = eingabe.value.trim();
      if (!eingabe.checkValidity() || !email) {
        meldung.innerHTML = hinweis(T("Bitte eine gültige E-Mail-Adresse angeben.", "Please enter a valid e-mail address."), true);
        return;
      }
      if (!api) {
        // Kein Server angeschlossen: nichts senden, das ehrlich sagen.
        koerper.innerHTML =
          hinweis(T(
            "Der Partnerzugang wird gerade eingerichtet — es wurde nichts gesendet. Bis dahin erreichen Sie uns direkt unter <a href=\"mailto:elite@jkhd.de\">elite@jkhd.de</a>.",
            "Partner access is still being set up — nothing was sent. Until then you can reach us directly at <a href=\"mailto:elite@jkhd.de\">elite@jkhd.de</a>."
          )) +
          `<button type="button" class="btn btn-ghost" data-partner="zurueck">${T("Zurück", "Back")}</button>`;
        koerper.querySelector('[data-partner="zurueck"]').addEventListener("click", zurueck);
        return;
      }
      meldung.innerHTML = hinweis(T("Code wird angefordert …", "Requesting code …"));
      try {
        const r = await fetch(api + "/code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (!r.ok) throw new Error(String(r.status));
        codeSchritt(email);
      } catch (err) {
        meldung.innerHTML = hinweis(T("Keine Verbindung zum Server. Bitte später erneut versuchen.", "No connection to the server. Please try again later."), true);
      }
    });
  }

  // Schritt 2: Code aus der E-Mail
  function codeSchritt(email) {
    koerper.innerHTML =
      `<form class="partner-form" novalidate>
         ${hinweis(T(
           "Wenn diese Adresse bei uns als Partner hinterlegt ist, haben wir Ihnen gerade einen Code geschickt. Er ist nur kurz gültig.",
           "If this address is registered with us as a partner, we have just sent you a code. It is valid for a short time only."
         ))}
         <div class="field">
           <label for="partner-code">${T("Code aus der E-Mail", "Code from the e-mail")}</label>
           <input id="partner-code" name="code" type="text" required autocomplete="one-time-code" inputmode="numeric" maxlength="12">
         </div>
         ${aktionen(T("Anmelden", "Sign in"), T("Andere Adresse", "Different address"), "mail")}
         <div class="partner-meldung"></div>
       </form>`;
    const form = koerper.querySelector("form");
    const eingabe = form.querySelector("input");
    const meldung = form.querySelector(".partner-meldung");
    form.querySelector('[data-partner="mail"]').addEventListener("click", mailSchritt);
    eingabe.focus();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const code = eingabe.value.trim();
      if (!code) {
        meldung.innerHTML = hinweis(T("Bitte den Code eingeben.", "Please enter the code."), true);
        return;
      }
      meldung.innerHTML = hinweis(T("Wird geprüft …", "Checking …"));
      try {
        const r = await fetch(api + "/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });
        if (r.status === 401) {
          meldung.innerHTML = hinweis(T("Der Code ist falsch oder abgelaufen.", "The code is wrong or has expired."), true);
          return;
        }
        if (!r.ok) throw new Error(String(r.status));
        datenZeigen(await r.json());
      } catch (err) {
        meldung.innerHTML = hinweis(T("Keine Verbindung zum Server. Bitte später erneut versuchen.", "No connection to the server. Please try again later."), true);
      }
    });
  }

  // Schritt 3: die hinterlegten Daten
  function datenZeigen(daten) {
    const felder = Array.isArray(daten.felder) ? daten.felder : [];
    koerper.innerHTML =
      `<div class="partner-daten">
         <span class="kachel-label">${T("Ihre Daten bei JKHD", "Your data at JKHD")}</span>
         <h3>${esc(daten.name || "")}</h3>
         <dl>${felder.map((f) => `<dt>${esc(f.label)}</dt><dd>${esc(f.wert)}</dd>`).join("")}</dl>
         <button type="button" class="btn btn-ghost" data-partner="zurueck">${T("Abmelden", "Sign out")}</button>
       </div>`;
    koerper.querySelector('[data-partner="zurueck"]').addEventListener("click", zurueck);
  }

  startKnopf.addEventListener("click", mailSchritt);
})();

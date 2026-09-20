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
          // Die Stagger-Verzoegerung gilt nur fuers Einblenden, nicht fuer Hover
          e.target.addEventListener("transitionend", () => {
            e.target.style.transitionDelay = "";
            e.target.classList.add("settled");   // ab jetzt gilt das kurze Hover-Tempo (.kachel.settled)
          }, { once: true });
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

// ---------- Partnerzugang: E-Mail -> Code -> Anmeldung ----------
// Das Anmeldezeichen lebt nur im Sitzungsspeicher des Tabs: weg, sobald der
// Tab zu ist. Der Server kennt es nur als Hash (siehe README).
const PartnerSitzung = {
  SCHLUESSEL: "jkhd-partner",
  merke(token) { try { sessionStorage.setItem(this.SCHLUESSEL, token); return true; } catch (e) { return false; } },
  lies() { try { return sessionStorage.getItem(this.SCHLUESSEL) || ""; } catch (e) { return ""; } },
  vergiss() { try { sessionStorage.removeItem(this.SCHLUESSEL); } catch (e) {} },
};

// Der Kasten auf der Kontaktseite. data-api am .partner-Element nennt den
// Server (https://api.jkhd.de); steht es leer, wird nichts gesendet und der
// Kasten sagt das offen. Schnittstelle (siehe README, Abschnitt Partnerzugang):
//   POST {api}/code   {"email": "..."}                 -> 204, immer (verraet nicht, wer Partner ist)
//   POST {api}/login  {"email": "...", "code": "..."}  -> 200 {"token": "..."}, 401 bei falschem oder abgelaufenem Code
//   Danach geht es auf partner.html; die holt mit dem Zeichen POST {api}/daten.
(function () {
  const box = document.querySelector(".partner");
  if (!box) return;
  const koerper = box.querySelector(".partner-koerper");
  const startKnopf = box.querySelector('[data-partner="start"]');
  const anfrageKnopf = box.querySelector('[data-partner="anfrage"]');
  if (!koerper || !startKnopf) return;

  // Wohin der Fragebogen geht: die Anfragen-Adresse der Kontaktseite.
  // Die Partner-Adresse bleibt Angemeldeten vorbehalten.
  const ANFRAGE_AN = "service@jkhd.de";

  // mailto-Koerper: RFC 6068 will CRLF als Zeilenumbruch
  const mailto = (an, betreff, text) =>
    "mailto:" + an + "?subject=" + encodeURIComponent(betreff) + "&body=" + encodeURIComponent(text.replace(/\r?\n/g, "\r\n"));

  const api = (box.dataset.api || "").replace(/\/+$/, "");
  const startHtml = koerper.innerHTML;

  const OHNE_SERVER = () => T(
    "Der Partnerzugang wird gerade eingerichtet — es wurde nichts gesendet. Bis dahin erreichen Sie uns unter <a href=\"mailto:kontakt@jkhd.de\">kontakt@jkhd.de</a>.",
    "Partner access is still being set up — nothing was sent. Until then you can reach us at <a href=\"mailto:kontakt@jkhd.de\">kontakt@jkhd.de</a>."
  );

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const hinweis = (text, fehler) =>
    `<p class="partner-hinweis${fehler ? " is-error" : ""}" role="${fehler ? "alert" : "status"}" tabindex="-1">${text}</p>`;

  // Nach jedem Neuzeichnen bekommt die Tastatur wieder einen Platz: erst das
  // Eingabefeld, sonst der Hinweis, sonst der erste Knopf.
  function fokus() {
    const ziel = koerper.querySelector("input") || koerper.querySelector(".partner-hinweis") || koerper.querySelector("[data-partner]");
    if (ziel) ziel.focus();
  }

  const aktionen = (haupt, nebenText, nebenAktion) =>
    `<div class="partner-aktionen">
       <button type="submit" class="btn btn-primary">${haupt}</button>
       <button type="button" class="btn btn-ghost" data-partner="${nebenAktion}">${nebenText}</button>
     </div>`;

  // Hinweis + „Text kopieren" nach einem mailto-Aufruf. Klappt das Kopieren
  // nicht (kein Clipboard, unsicherer Kontext), erscheint der Text selbst zum
  // Markieren. bauen() liefert den Text frisch, falls jemand nach dem ersten
  // Versuch noch ein Feld aendert.
  function kopierHinweis(meldung, textFn, an) {
    meldung.innerHTML =
      hinweis(T(
        `Ihr E-Mail-Programm öffnet sich jetzt mit dem fertigen Text — nur noch senden. Falls sich nichts öffnet: Text kopieren und an ${an} schicken.`,
        `Your e-mail program now opens with the finished text — just send it. If nothing opens: copy the text and send it to ${an}.`
      )) +
      `<button type="button" class="btn btn-ghost btn-sm" data-partner="kopieren">${T("Text kopieren", "Copy text")}</button>`;
    meldung.querySelector('[data-partner="kopieren"]').addEventListener("click", async (ev) => {
      const text = textFn();
      try {
        await navigator.clipboard.writeText(text);
        ev.target.textContent = T("Kopiert", "Copied");
      } catch (err) {
        ev.target.textContent = T("Bitte markieren und kopieren:", "Please select and copy:");
        let feld = meldung.querySelector("textarea");
        if (!feld) {
          feld = document.createElement("textarea");
          feld.readOnly = true;
          feld.rows = 8;
          feld.className = "partner-rohtext";
          meldung.appendChild(feld);
        }
        feld.value = text;
        feld.focus();
        feld.select();
      }
    });
  }

  function zurueck() {
    neuerLauf();
    box.classList.remove("is-anfrage");
    koerper.innerHTML = startHtml;
    koerper.querySelector('[data-partner="start"]').addEventListener("click", start);
    const a = koerper.querySelector('[data-partner="anfrage"]');
    if (a) a.addEventListener("click", anfrageSchritt);
    fokus();
  }

  // Ohne Server gibt es kein Formular: Der Knopf zeigt den Hinweis, der
  // Kasten traegt ihn von Anfang an unter dem Einleitungstext.
  function ohneServer() {
    koerper.innerHTML =
      hinweis(OHNE_SERVER()) +
      `<button type="button" class="btn btn-ghost" data-partner="zurueck">${T("Zurück", "Back")}</button>`;
    koerper.querySelector('[data-partner="zurueck"]').addEventListener("click", zurueck);
    fokus();
  }

  function start() {
    if (!api) { ohneServer(); return; }
    // Wer schon angemeldet ist, braucht keinen neuen Code: die Partnerseite
    // prueft das Zeichen und sagt selbst, wenn es abgelaufen ist.
    if (PartnerSitzung.lies()) { window.location.href = "partner.html"; return; }
    mailSchritt();
  }

  // Jeder Schritt bekommt eine laufende Nummer: eine Antwort, die erst nach
  // „Abbrechen" oder „Andere Adresse" eintrifft, darf den Kasten nicht mehr
  // umbauen. Und waehrend eine Anfrage laeuft, ist der Knopf gesperrt —
  // ein Doppelklick wuerde sonst zwei Codes verbrauchen.
  let lauf = 0;
  function neuerLauf() { return ++lauf; }
  function veraltet(meins) { return meins !== lauf; }
  function gesperrt(form, ja) {
    form.querySelectorAll("button").forEach((b) => { b.disabled = ja; });
  }

  // Schritt 1: E-Mail-Adresse
  function mailSchritt() {
    const meins = neuerLauf();
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
    fokus();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = eingabe.value.trim();
      if (!eingabe.checkValidity() || !email) {
        meldung.innerHTML = hinweis(T("Bitte eine gültige E-Mail-Adresse angeben.", "Please enter a valid e-mail address."), true);
        return;
      }
      if (!api) { ohneServer(); return; }
      meldung.innerHTML = hinweis(T("Code wird angefordert …", "Requesting code …"));
      gesperrt(form, true);
      try {
        const r = await fetch(api + "/code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        if (veraltet(meins)) return;
        if (!r.ok) throw new Error(String(r.status));
        codeSchritt(email);
      } catch (err) {
        if (veraltet(meins)) return;
        gesperrt(form, false);
        meldung.innerHTML = hinweis(T("Das hat gerade nicht geklappt. Bitte später erneut versuchen oder an kontakt@jkhd.de schreiben.", "That did not work just now. Please try again later or write to kontakt@jkhd.de."), true);
      }
    });
  }

  // Schritt 2: Code aus der E-Mail
  function codeSchritt(email) {
    const meins = neuerLauf();
    koerper.innerHTML =
      `<form class="partner-form" novalidate>
         ${hinweis(T(
           "Wenn diese Adresse bei uns als Partner hinterlegt ist, haben wir Ihnen gerade einen Code geschickt. Er gilt zehn Minuten und nur einmal.",
           "If this address is registered with us as a partner, we have just sent you a code. It is valid for ten minutes and can be used once."
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
    fokus();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const code = eingabe.value.trim();
      if (!code) {
        meldung.innerHTML = hinweis(T("Bitte den Code eingeben.", "Please enter the code."), true);
        return;
      }
      meldung.innerHTML = hinweis(T("Wird geprüft …", "Checking …"));
      gesperrt(form, true);
      try {
        const r = await fetch(api + "/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });
        if (veraltet(meins)) return;
        if (r.status === 401) {
          gesperrt(form, false);
          meldung.innerHTML = hinweis(T("Der Code ist falsch oder abgelaufen.", "The code is wrong or has expired."), true);
          return;
        }
        if (!r.ok) throw new Error(String(r.status));
        angemeldet(await r.json());
      } catch (err) {
        if (veraltet(meins)) return;
        gesperrt(form, false);
        meldung.innerHTML = hinweis(T("Das hat gerade nicht geklappt. Bitte später erneut versuchen oder an kontakt@jkhd.de schreiben.", "That did not work just now. Please try again later or write to kontakt@jkhd.de."), true);
      }
    });
  }

  // Schritt 3: angemeldet — das Zeichen merken, weiter zur Partnerseite
  function angemeldet(daten) {
    const token = daten && typeof daten.token === "string" ? daten.token : "";
    if (!token || !PartnerSitzung.merke(token)) {
      koerper.innerHTML =
        hinweis(!token ? T(
          "Der Server hat kein Anmeldezeichen geschickt. Bitte später erneut versuchen oder an kontakt@jkhd.de schreiben.",
          "The server did not send a sign-in token. Please try again later or write to kontakt@jkhd.de."
        ) : T(
          "Angemeldet — aber Ihr Browser lässt keinen Sitzungsspeicher zu, deshalb kann die Partnerseite so nicht geöffnet werden.",
          "Signed in — but your browser does not allow session storage, so the partner page cannot be opened this way."
        ), true) +
        `<button type="button" class="btn btn-ghost" data-partner="zurueck">${T("Zurück", "Back")}</button>`;
      koerper.querySelector('[data-partner="zurueck"]').addEventListener("click", zurueck);
      fokus();
      return;
    }
    koerper.innerHTML = hinweis(T("Angemeldet — einen Moment …", "Signed in — one moment …"));
    window.location.href = "partner.html";
  }

  // Anfrage: ein fester Fragebogen. „Senden" baut aus den Antworten eine
  // E-Mail und oeffnet das E-Mail-Programm des Besuchers (mailto) — es geht
  // nichts an den Server, es bleibt nichts im Browser.
  const FRAGEN = () => [
    { id: "name", frage: T("Ihr Name", "Your name"), typ: "text", pflicht: true, auto: "name" },
    { id: "email", frage: T("Ihre E-Mail-Adresse", "Your e-mail address"), typ: "email", pflicht: true, auto: "email" },
    { id: "rolle", frage: T("Was beschreibt Sie am besten?", "What describes you best?"), typ: "select", pflicht: true,
      optionen: [T("Quant / Entwickler", "Quant / developer"), T("Trader", "Trader"), T("Unternehmen", "Company"), T("Etwas anderes", "Something else")] },
    { id: "anliegen", frage: T("Worum geht es?", "What is it about?"), typ: "select", pflicht: true,
      optionen: [T("Partnerschaft", "Partnership"), T("Austausch unter Quants", "Exchange among quants"), T("Zugang zum Partnerbereich", "Access to the partner area"), T("Etwas anderes", "Something else")] },
    { id: "profil", frage: T("Website oder Profil (optional)", "Website or profile (optional)"), typ: "url", pflicht: false, auto: "url" },
    { id: "nachricht", frage: T("Ihre Nachricht", "Your message"), typ: "textarea", pflicht: true },
  ];

  function feldHtml(f) {
    const id = "anfrage-" + f.id;
    const pflicht = f.pflicht ? " required" : "";
    const label = `<label for="${id}">${f.frage}</label>`;
    if (f.typ === "select") {
      return `<div class="field">${label}<select id="${id}" name="${f.id}"${pflicht}>
        <option value="">${T("Bitte wählen", "Please choose")}</option>
        ${f.optionen.map((o) => `<option>${esc(o)}</option>`).join("")}</select></div>`;
    }
    if (f.typ === "textarea") {
      return `<div class="field">${label}<textarea id="${id}" name="${f.id}" rows="5" maxlength="1500"${pflicht}></textarea></div>`;
    }
    const auto = f.auto ? ` autocomplete="${f.auto}"` : "";
    return `<div class="field">${label}<input id="${id}" name="${f.id}" type="${f.typ}" maxlength="200"${auto}${pflicht}></div>`;
  }

  function anfrageSchritt() {
    const fragen = FRAGEN();
    box.classList.add("is-anfrage");
    koerper.innerHTML =
      `<form class="partner-form partner-anfrage" novalidate>
         ${hinweis(T(
           "Ein paar Fragen — am Ende öffnet sich Ihr E-Mail-Programm mit dem fertigen Text, Sie müssen nur noch senden.",
           "A few questions — at the end your e-mail program opens with the finished text; you only need to send it."
         ))}
         <div class="field-row">${feldHtml(fragen[0])}${feldHtml(fragen[1])}</div>
         <div class="field-row">${feldHtml(fragen[2])}${feldHtml(fragen[3])}</div>
         ${fragen.slice(4).map(feldHtml).join("")}
         ${aktionen(T("Senden", "Send"), T("Abbrechen", "Cancel"), "zurueck")}
         <div class="partner-meldung"></div>
       </form>`;
    const form = koerper.querySelector("form");
    const meldung = form.querySelector(".partner-meldung");
    form.querySelector('[data-partner="zurueck"]').addEventListener("click", zurueck);
    fokus();

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const werte = fragen.map((f) => ({ f, el: form.elements[f.id] }));
      const leer = werte.find(({ f, el }) => f.pflicht && !el.value.trim());
      if (leer) {
        meldung.innerHTML = hinweis(T("Bitte alle Pflichtfelder ausfüllen.", "Please fill in all required fields."), true);
        leer.el.focus();
        return;
      }
      const email = form.elements.email;
      if (!email.checkValidity()) {
        meldung.innerHTML = hinweis(T("Bitte eine gültige E-Mail-Adresse angeben.", "Please enter a valid e-mail address."), true);
        email.focus();
        return;
      }
      const bauen = () => {
        const zeilen = fragen.map((f) => {
          const wert = form.elements[f.id].value.trim() || "—";
          return f.typ === "textarea" ? f.frage + ":\n" + wert : f.frage + ": " + wert;
        });
        return T("Guten Tag,\n\nhier meine Anfrage über www.jkhd.de:\n\n", "Hello,\n\nhere is my enquiry via www.jkhd.de:\n\n")
          + zeilen.join("\n") + "\n";
      };
      const betreff = T("Partneranfrage", "Partner enquiry") + " — " + form.elements.name.value.trim();
      kopierHinweis(meldung, bauen, ANFRAGE_AN);
      // Ein Doppelklick oder zweimal Enter wuerde zwei Entwuerfe oeffnen
      const senden = form.querySelector('[type="submit"]');
      senden.disabled = true;
      setTimeout(() => { senden.disabled = false; }, 2000);
      window.location.href = mailto(ANFRAGE_AN, betreff, bauen());
    });
  }

  startKnopf.addEventListener("click", start);
  if (anfrageKnopf) anfrageKnopf.addEventListener("click", anfrageSchritt);

  // Kommt die Seite aus dem Zurueck-Cache des Browsers, steht sonst noch
  // „Angemeldet — einen Moment …" oder ein halb ausgefuelltes Formular da.
  window.addEventListener("pageshow", (e) => {
    if (e.persisted && koerper.querySelector("form, .partner-hinweis")) zurueck();
  });

  // Solange kein Server angeschlossen ist, steht der Hinweis von Anfang an im
  // Kasten — der Besucher soll es lesen, bevor er etwas eintippt.
  if (!api) {
    const kopf = box.querySelector(".partner-kopf");
    if (kopf) kopf.insertAdjacentHTML("beforeend", hinweis(OHNE_SERVER()));
  }
})();

// ---------- Partnerseite: die Daten und die VIP-Adresse, nur angemeldet ----------
// partner.html traegt .partner-seite[data-api]. Ohne Zeichen im Sitzungs-
// speicher (oder wenn der Server es nicht mehr kennt) sagt die Seite das und
// fuehrt zum Partnerzugang. Die VIP-Adresse kommt NUR vom Server und steht
// verdeckt, bis der Partner sie aufdeckt — im Quelltext der Seite steht sie nie.
//   POST {api}/daten    {"token": "..."} -> 200 {"name", "felder", "vip", "module", "freigaben"} | 401
//   POST {api}/abmelden {"token": "..."} -> 204
// „module" ist der VIP-Katalog (api-daten/vip.json, pflegt Julian), „freigaben"
// die Modul-IDs, die fuer diesen Partner freigeschaltet sind. Anfordern =
// Auswahl per Haekchen, dann mailto an die VIP-Adresse; an den Server geht nichts.
(function () {
  const seite = document.querySelector(".partner-seite");
  if (!seite) return;
  const api = (seite.dataset.api || "").replace(/\/+$/, "");

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hinweis = (text, fehler) =>
    `<p class="partner-hinweis${fehler ? " is-error" : ""}" role="${fehler ? "alert" : "status"}" tabindex="-1">${text}</p>`;
  const post = (pfad, daten) =>
    fetch(api + pfad, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(daten) });

  const mailto = (an, betreff, text) =>
    "mailto:" + an + "?subject=" + encodeURIComponent(betreff) + "&body=" + encodeURIComponent(text.replace(/\r?\n/g, "\r\n"));
  function kopierHinweis(meldung, textFn, an) {
    meldung.innerHTML =
      hinweis(T(
        `Ihr E-Mail-Programm öffnet sich jetzt mit dem fertigen Text — nur noch senden. Falls sich nichts öffnet: Text kopieren und an ${an} schicken.`,
        `Your e-mail program now opens with the finished text — just send it. If nothing opens: copy the text and send it to ${an}.`
      )) +
      `<button type="button" class="btn btn-ghost btn-sm" data-partner="kopieren">${T("Text kopieren", "Copy text")}</button>`;
    meldung.querySelector('[data-partner="kopieren"]').addEventListener("click", async (ev) => {
      const text = textFn();
      try {
        await navigator.clipboard.writeText(text);
        ev.target.textContent = T("Kopiert", "Copied");
      } catch (err) {
        ev.target.textContent = T("Bitte markieren und kopieren:", "Please select and copy:");
        let feld = meldung.querySelector("textarea");
        if (!feld) {
          feld = document.createElement("textarea");
          feld.readOnly = true;
          feld.rows = 8;
          feld.className = "partner-rohtext";
          meldung.appendChild(feld);
        }
        feld.value = text;
        feld.focus();
        feld.select();
      }
    });
  }

  // Verdeckt = nur die Domain bleibt lesbar; die Laenge des Namensteils verraet nichts.
  const verdeckt = (adresse) => "••••••" + (adresse.includes("@") ? adresse.slice(adresse.indexOf("@")) : "");

  function nichtAngemeldet(text) {
    seite.innerHTML =
      `<div class="partner-karte">
         <span class="kachel-label">${T("Nur für Partner", "Partners only")}</span>
         <h2 tabindex="-1">${T("Nicht angemeldet", "Not signed in")}</h2>
         <p>${text || T(
           "Diese Seite zeigt Partnern von JKHD, was bei uns zu ihnen hinterlegt ist. Melden Sie sich über den Partnerzugang an.",
           "This page shows JKHD partners what we hold about them. Sign in via partner access."
         )}</p>
         <a class="btn btn-primary" href="${T("kontakt.html#partner", "contact.html#partner")}">${T("Zum Partnerzugang", "To partner access")}</a>
       </div>`;
    const kopf = seite.querySelector("h2");
    if (kopf) kopf.focus();
  }

  // Die goldene Krone ueber jedem VIP-Kaestchen (Julians Wunsch); Inline-SVG,
  // Farbe kommt aus --gold.
  const KRONE = '<svg class="vip-krone" viewBox="0 0 32 24" aria-hidden="true" focusable="false">'
    + '<path d="M3 19 1.5 5.5 10 11.5 16 2.5 22 11.5 30.5 5.5 29 19Z"/>'
    + '<rect x="3" y="20" width="26" height="3" rx="1"/>'
    + '<circle cx="1.5" cy="5.5" r="1.5"/><circle cx="16" cy="2.5" r="1.6"/><circle cx="30.5" cy="5.5" r="1.5"/>'
    + '</svg>';

  // Ein Modul des VIP-Katalogs: freigeschaltet (mit Link), auf Anfrage
  // (auswaehlbar) oder bald.
  function modulHtml(m, frei) {
    const lage = m.status === "bald" ? "bald" : (frei.has(m.id) ? "frei" : "anfrage");
    const kurz = T(m.kurz || "", m.kurz_en || m.kurz || "");
    const status = { frei: T("Freigeschaltet", "Unlocked"), bald: T("Bald", "Soon"), anfrage: T("Auf Anfrage", "On request") }[lage];
    const aktion = lage === "frei"
      ? (m.link
          ? `<a class="btn btn-ghost btn-sm" href="${esc(m.link)}" rel="noopener">${T("Öffnen", "Open")}</a>`
          : `<span class="modul-hinweis">${T("Zugang per E-Mail an die VIP-Adresse unten.", "Access by e-mail to the VIP address below.")}</span>`)
      : lage === "anfrage"
        ? `<label class="modul-wahl"><input type="checkbox" name="modul" value="${esc(m.id)}"> ${T("Auswählen", "Select")}</label>`
        : "";
    return `<div class="modul is-${lage}">
         <div class="modul-kopf">
           <span class="modul-name">${esc(m.name)}</span>
           ${m.neu ? `<span class="modul-neu">${T("Neu", "New")}</span>` : ""}
           <span class="modul-status">${status}</span>
         </div>
         ${kurz ? `<p>${esc(kurz)}</p>` : ""}
         ${aktion}
       </div>`;
  }

  function zeige(daten) {
    const felder = Array.isArray(daten.felder) ? daten.felder : [];
    const vip = typeof daten.vip === "string" ? daten.vip : "";
    const module = (Array.isArray(daten.module) ? daten.module : []).filter((m) => m && typeof m.id === "string" && typeof m.name === "string");
    const frei = new Set(Array.isArray(daten.freigaben) ? daten.freigaben : []);
    const waehlbar = vip !== "" && module.some((m) => !frei.has(m.id) && m.status !== "bald");
    seite.innerHTML =
      `<div class="partner-karte partner-daten">
         <span class="kachel-label">${T("Ihre Daten bei JKHD", "Your data at JKHD")}</span>
         <h2>${esc(daten.name || "")}</h2>
         <dl>${felder.map((f) => `<dt>${esc(f.label)}</dt><dd>${esc(f.wert)}</dd>`).join("")}</dl>
       </div>` +
      (module.length ? `<section class="partner-karte vip-bereich" aria-labelledby="vip-bereich-titel">
         ${KRONE}
         <span class="kachel-label">VIP</span>
         <h2 id="vip-bereich-titel">${T("Zugänge", "Access")}</h2>
         <p>${waehlbar ? T(
           "Was für Sie freigeschaltet ist — und was Sie anfordern können. Auswählen und „Auswahl anfordern\": Ihr E-Mail-Programm öffnet sich mit dem fertigen Text.",
           "What is unlocked for you — and what you can request. Select and press \"Request selection\": your e-mail program opens with the finished text."
         ) : T("Was für Sie freigeschaltet ist.", "What is unlocked for you.")}</p>
         <form class="module" novalidate>
           ${module.map((m) => modulHtml(m, frei)).join("")}
           ${waehlbar ? `<div class="partner-aktionen">
             <button type="submit" class="btn btn-primary" data-partner="anfordern" disabled>${T("Auswahl anfordern", "Request selection")}</button>
             <span class="partner-hinweis modul-zaehler" aria-live="polite"></span>
           </div>
           <div class="partner-meldung"></div>` : ""}
         </form>
       </section>` : "") +
      (vip ? `<section class="vip" aria-labelledby="vip-titel">
         ${KRONE}
         <span class="vip-label" id="vip-titel">${T("VIP-E-Mail-Adresse", "VIP e-mail address")}</span>
         <p>${T(
           "Nur für Partner — bitte nicht weitergeben. Nachrichten von Unbekannten werden dort nicht beantwortet.",
           "Partners only — please do not pass it on. Messages from unknown senders are not answered there."
         )}</p>
         <div class="vip-adresse">
           <span class="vip-wert is-verdeckt" data-vip>${esc(verdeckt(vip))}</span>
           <button type="button" class="btn btn-ghost btn-sm" data-partner="aufdecken">${T("Aufdecken", "Reveal")}</button>
         </div>
       </section>` : "") +
      `<div class="partner-aktionen">
         <button type="button" class="btn btn-ghost" data-partner="abmelden">${T("Abmelden", "Sign out")}</button>
       </div>`;

    // Auswahl anfordern: Haekchen zaehlen, dann mailto an die VIP-Adresse
    const form = seite.querySelector("form.module");
    const anfordern = seite.querySelector('[data-partner="anfordern"]');
    if (form && anfordern) {
      const zaehler = form.querySelector(".modul-zaehler");
      const gewaehlt = () => [...form.querySelectorAll('input[name="modul"]:checked')].map((i) => i.value);
      form.addEventListener("change", () => {
        const k = gewaehlt().length;
        anfordern.disabled = k === 0;
        zaehler.textContent = k ? T(`${k} ausgewählt`, `${k} selected`) : "";
      });
      const bauen = () => {
        const namen = module.filter((m) => gewaehlt().includes(m.id)).map((m) => "- " + m.name);
        return T("Guten Tag,\n\nich möchte Zugang zu folgenden Modulen anfordern:\n\n", "Hello,\n\nI would like to request access to the following modules:\n\n")
          + namen.join("\n") + "\n\n" + T("Viele Grüße\n", "Kind regards\n") + (daten.name || "") + "\n";
      };
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!gewaehlt().length) return;
        const betreff = T("Zugang anfordern", "Access request") + " — " + (daten.name || "");
        kopierHinweis(form.querySelector(".partner-meldung"), bauen, vip);
        anfordern.disabled = true;
        setTimeout(() => { anfordern.disabled = gewaehlt().length === 0; }, 2000);
        window.location.href = mailto(vip, betreff, bauen());
      });
    }

    const wert = seite.querySelector("[data-vip]");
    const knopf = seite.querySelector('[data-partner="aufdecken"]');
    if (wert && knopf) {
      let offen = false;
      knopf.addEventListener("click", () => {
        offen = !offen;
        wert.classList.toggle("is-verdeckt", !offen);
        wert.innerHTML = offen ? `<a href="mailto:${esc(vip)}">${esc(vip)}</a>` : esc(verdeckt(vip));
        knopf.textContent = offen ? T("Verdecken", "Hide") : T("Aufdecken", "Reveal");   // Beschriftung wechselt, daher kein aria-pressed
      });
    }
    seite.querySelector('[data-partner="abmelden"]').addEventListener("click", abmelden);
  }

  async function abmelden() {
    const token = PartnerSitzung.lies();
    PartnerSitzung.vergiss();
    if (api && token) {
      try { await post("/abmelden", { token }); } catch (e) { /* lokal ist es weg, das zaehlt */ }
    }
    nichtAngemeldet(T("Sie sind abgemeldet.", "You are signed out."));
  }

  async function laden() {
    const token = PartnerSitzung.lies();
    if (!api || !token) { nichtAngemeldet(); return; }
    seite.innerHTML = hinweis(T("Wird geladen …", "Loading …"));
    try {
      const r = await post("/daten", { token });
      if (r.status === 401) {
        PartnerSitzung.vergiss();
        nichtAngemeldet(T("Ihre Anmeldung ist abgelaufen. Bitte melden Sie sich erneut an.", "Your sign-in has expired. Please sign in again."));
        return;
      }
      if (!r.ok) throw new Error(String(r.status));
      zeige(await r.json());
    } catch (err) {
      seite.innerHTML =
        hinweis(T(
          "Das hat gerade nicht geklappt. Bitte die Seite neu laden oder später erneut versuchen.",
          "That did not work just now. Please reload the page or try again later."
        ), true) +
        `<div class="partner-aktionen">
           <button type="button" class="btn btn-ghost" data-partner="abmelden">${T("Neu anmelden", "Sign in again")}</button>
         </div>`;
      seite.querySelector('[data-partner="abmelden"]').addEventListener("click", abmelden);
    }
  }

  laden();
  // Aus dem Zurueck-Cache: die Sitzung neu pruefen, die Adresse ist dann wieder verdeckt
  window.addEventListener("pageshow", (e) => { if (e.persisted) laden(); });
})();

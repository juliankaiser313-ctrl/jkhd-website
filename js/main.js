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

// ---------- Startseite: der Hero fuellt genau den ersten Bildschirm ----------
// Den ersten Wert setzt ein Inline-Skript in index.html direkt hinter der
// Kopfzeile (sonst waere die Seite beim ersten Zeichnen zu hoch). Hier wird
// nur nachgemessen: abgezogen wird, was ueber dem Hero liegt (Aufbau-Band +
// Kopfzeile). Abgerundet, damit die Laufleiste keine Haarlinie zeigt.
(function () {
  const hero = document.querySelector(".hero-voll");
  if (!hero) return;

  function abzug() {
    const oben = hero.getBoundingClientRect().top + window.scrollY;
    document.documentElement.style.setProperty("--hero-abzug", Math.floor(oben) + "px");
    // Passt der Hero nicht auf den Schirm (kurzes Fenster, starker Zoom),
    // waere der Pfeil unter der Falte — dann ist er ueberfluessig.
    hero.classList.toggle("ist-ueberhoch", Math.ceil(oben + hero.offsetHeight) > window.innerHeight + 1);
  }

  let geplant = false;
  function spaeter() {
    if (geplant) return;
    geplant = true;
    requestAnimationFrame(() => { geplant = false; abzug(); });
  }

  abzug();
  window.addEventListener("resize", spaeter);
  // Die Hoehe des Aufbau-Bandes haengt an der Schriftgroesse: reiner Textzoom
  // aendert sie, ohne dass resize feuert. Der Beobachter merkt es trotzdem.
  if (window.ResizeObserver) {
    const wache = new ResizeObserver(spaeter);
    document.querySelectorAll(".build-note, .site-header").forEach((el) => wache.observe(el));
  } else {
    window.addEventListener("orientationchange", spaeter);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(abzug);
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

// ---------- Assistent: haeufige Fragen, darunter Fragen an die KI ----------
// Oben die sechs festen Antworten: Sie stehen hier, sonst nirgends, und kommen
// sofort, ohne Server. Darunter kann man eine eigene Frage stellen. Die geht an
// unseren eigenen Server (KI_API, JKHD-Partner-Server), und erst der fragt das
// Sprachmodell (OVHcloud AI Endpoints; Rechenzentrum laut OVH-Doku, 26.09.2026, in
// Frankreich -- schriftlich noch nicht bestaetigt, README des Servers). Im Browser
// liegt kein Schluessel und laeuft kein fremdes Script; der Server deckelt Zahl
// und Kosten und sperrt Anlagefragen vor und nach dem Modell.
// Was vom Modell kommt, ist fremde Eingabe: Es geht NUR per textContent ins
// Dokument, nie per innerHTML. Nichts davon landet im localStorage oder
// sessionStorage -- der Verlauf lebt nur, solange die Seite offen ist.
// Schnittstelle (README des Servers, Abschnitt KI-Fragen):
//   POST {KI_API}/frage {frage, sprache: "de"|"en", verlauf: [{frage, antwort, sig}]}
//     (Rumpf hoechstens KI_ANFRAGE_BYTES in UTF-8, sonst 400)
//     -> 200 {antwort, art: "ki", ki_generiert: true, sig}
//        200 {antwort, art: "sperre", ki_generiert: false}   feste Antwort des Servers
//        429 {grenze}, 503 {fehler: "aus"}, 502 {fehler: "modell"}, 400 {fehler: "frage"}
(function () {
  if (document.querySelector(".helper")) return;

  // Der Server der Fragen. Die lokale Uebungsumgebung ersetzt genau diesen Text.
  const KI_API = "https://api.jkhd.de";
  const KI_FRAGE_MAX = 500;     // wie KI_FRAGE_MAX auf dem Server
  const KI_VERLAUF_MAX = 3;     // so viele fruehere Paare nimmt der Server hoechstens an
  const KI_ANFRAGE_BYTES = 8192; // wie KI_ANFRAGE_BYTES auf dem Server: groesserer Rumpf -> 400
  const KI_WARTEN_MS = 30000;   // danach gilt der Server als nicht erreichbar (beide Versuche zusammen)

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
      a: "By e-mail to kontakt@jkhd.de or via the contact page. E-mails are answered by a person.",
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
      a: "Per E-Mail an kontakt@jkhd.de oder \u00fcber die Kontaktseite. Auf E-Mails antwortet ein Mensch.",
      link: { text: "Zur Kontaktseite", href: "kontakt.html" },
    },
  ];

  const FRAGEN = IST_EN ? FRAGEN_EN : FRAGEN_DE;

  // Wohin die Fehlertexte verweisen -- relativ wie die Links der festen Antworten
  const KONTAKT = T("kontakt.html", "contact.html");

  // Der KI-Hinweis steht fest direkt ueber dem Eingabefeld (Art. 50 KI-VO): sichtbar
  // immer die Zeile <summary>, der volle Text klappt auf und ist zugleich die
  // Beschreibung des Felds fuer Bildschirmleser. Der Knopf traegt
  // einen eigenen Namen: auf dem Handy ist sein Text ausgeblendet (style.css),
  // und display:none zaehlt fuer den Namen nicht mit.
  const html = `
    <button class="helper-btn" type="button" aria-expanded="false" aria-controls="helper-panel"
            aria-label="${T("Fragen und KI-Assistent", "Questions and AI assistant")}">
      <span class="helper-btn-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 11.6a8.2 8.2 0 0 1-8.8 8.2 8.6 8.6 0 0 1-3.1-.7L3.5 20.5l1.4-5a8.2 8.2 0 0 1-.9-3.7 8.2 8.2 0 0 1 8.2-8.2h.5a8.2 8.2 0 0 1 7.8 7.8z"/><path d="M10.2 9.6a1.9 1.9 0 0 1 3.7.6c0 1.3-1.9 1.9-1.9 1.9"/><path d="M12 15.4h.01"/></svg></span>
      <span class="helper-btn-text">${T("Fragen", "Questions")}</span>
    </button>
    <div class="helper-panel" id="helper-panel" role="dialog" aria-modal="false"
         aria-label="${T("Fragen und KI-Assistent", "Questions and AI assistant")}" hidden>
      <div class="helper-head">
        <span class="helper-title">${T("H\u00e4ufige Fragen", "Frequent questions")}</span>
        <button class="helper-close" type="button" aria-label="${T("Schlie\u00dfen", "Close")}">&times;</button>
      </div>
      <div class="helper-body">
        <div class="helper-faq"></div>
        <div class="helper-chat">
          <p class="helper-abschnitt" id="helper-abschnitt">${T("Frage an die KI", "Ask the AI")}</p>
          <div class="helper-log" role="log" aria-live="polite" aria-labelledby="helper-abschnitt"></div>
          <div class="helper-meldung"></div>
        </div>
      </div>
      <form class="helper-form" novalidate>
        <details class="helper-hinweis">
          <summary>${T("KI-System \u00b7 Llama 3.3 \u00b7 Built with Llama", "AI system \u00b7 Llama 3.3 \u00b7 Built with Llama")}</summary>
          <p id="helper-hinweis">${T(
            "Sie schreiben mit einem KI-System. Die Antworten entstehen automatisch, k\u00f6nnen Fehler enthalten und sind keine Beratung. Bitte geben Sie keine pers\u00f6nlichen Daten ein. Sprachmodell: Llama 3.3 bei OVHcloud (Frankreich).",
            "You are writing to an AI system. The answers are generated automatically, may contain errors and are not advice. Please do not enter any personal data. Language model: Llama 3.3 at OVHcloud (France)."
          )}</p>
        </details>
        <label class="nur-vorlesen" for="helper-eingabe">${T(
          `Ihre Frage an die KI, h\u00f6chstens ${KI_FRAGE_MAX} Zeichen`,
          `Your question to the AI, at most ${KI_FRAGE_MAX} characters`
        )}</label>
        <textarea class="helper-eingabe" id="helper-eingabe" rows="2" maxlength="${KI_FRAGE_MAX}"
                  autocomplete="off" enterkeyhint="send" aria-describedby="helper-hinweis"
                  placeholder="${T("Ihre Frage \u2026", "Your question \u2026")}"></textarea>
        <div class="helper-zeile">
          <span class="helper-zaehler" aria-hidden="true">0 / ${KI_FRAGE_MAX}</span>
          <button class="helper-senden" type="submit">${T("Senden", "Send")}</button>
        </div>
      </form>
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
  const faq = wrap.querySelector(".helper-faq");
  const close = wrap.querySelector(".helper-close");
  const log = wrap.querySelector(".helper-log");
  const meldung = wrap.querySelector(".helper-meldung");
  const form = wrap.querySelector(".helper-form");
  const feld = wrap.querySelector(".helper-eingabe");
  const zaehler = wrap.querySelector(".helper-zaehler");
  const senden = wrap.querySelector(".helper-senden");

  // Die festen Fragen bauen nur ihren eigenen Teil neu auf -- der Verlauf mit
  // der KI darunter bleibt stehen.
  function liste() {
    faq.innerHTML =
      '<p class="helper-intro">' +
      T(
        "Diese Fragen sind sofort beantwortet. " +
          "Alles andere k\u00f6nnen Sie unten die KI fragen \u2014 oder per E-Mail einen Menschen.",
        "These questions are answered right away. " +
          "Anything else you can ask the AI below \u2014 or a person by e-mail."
      ) +
      "</p>" +
      '<ul class="helper-list">' +
      FRAGEN.map((q, i) => `<li><button type="button" data-i="${i}">${q.f}</button></li>`).join("") +
      "</ul>";
    body.scrollTop = 0;
  }

  function antwort(i) {
    const q = FRAGEN[i];
    faq.innerHTML =
      '<button class="helper-back" type="button">&larr; ' +
      T("Alle Fragen", "All questions") +
      "</button>" +
      `<p class="helper-q">${q.f}</p>` +
      `<p class="helper-a">${q.a}</p>` +
      (q.link ? `<a class="helper-link" href="${q.link.href}">${q.link.text}</a>` : "");
    body.scrollTop = 0;
  }

  // ---- Fragen an die KI ----
  // Gemerkt werden nur Paare, deren Antwort vom Modell kam und die der Server
  // signiert hat: Die gehen beim naechsten Mal als Verlauf mit. Eine erfundene
  // "fruehere Antwort" faellt dort an der Signatur durch.
  const verlauf = [];
  let laeuft = false;

  const FEHLER_LAST = T(
    "Die KI ist gerade ausgelastet. Bitte versuchen Sie es sp\u00e4ter noch einmal \u2014 oder schreiben Sie uns.",
    "The AI is busy right now. Please try again later \u2014 or write to us."
  );
  const FEHLER_AUS = T(
    "KI-Antworten sind gerade ausgeschaltet. Die h\u00e4ufigen Fragen oben gehen weiterhin \u2014 alles andere beantworten wir gern pers\u00f6nlich.",
    "AI answers are switched off right now. The frequent questions above still work \u2014 anything else we are glad to answer personally."
  );
  const FEHLER_FRAGE = T(
    `Diese Frage konnte so nicht gesendet werden. Bitte fassen Sie sie in h\u00f6chstens ${KI_FRAGE_MAX} Zeichen.`,
    `This question could not be sent as it is. Please keep it to at most ${KI_FRAGE_MAX} characters.`
  );
  const FEHLER_WEG = T(
    "Die KI ist gerade nicht erreichbar. Bitte versuchen Sie es sp\u00e4ter noch einmal \u2014 oder schreiben Sie uns.",
    "The AI cannot be reached right now. Please try again later \u2014 or write to us."
  );

  // Der Rumpf einer Anfrage, hoechstens KI_ANFRAGE_BYTES in UTF-8. Drei lange
  // Paare in nicht-lateinischer Schrift (3 Bytes je Zeichen) reissen die
  // Grenze -- dann fallen die aeltesten Paare weg, bis er passt. Die Frage
  // allein passt immer: 500 Zeichen sind auch als \uXXXX hoechstens 3000 Bytes.
  const utf8 = new TextEncoder();
  function rumpfFuer(frage, mitVerlauf) {
    const r = { frage, sprache: IST_EN ? "en" : "de", verlauf: mitVerlauf ? verlauf.slice(-KI_VERLAUF_MAX) : [] };
    while (r.verlauf.length && utf8.encode(JSON.stringify(r)).length > KI_ANFRAGE_BYTES) r.verlauf.shift();
    return r;
  }

  // Ein Aufruf von /frage. Wirft nie: status 0 heisst kein Netz, abgebrochen
  // oder vom Browser verweigert. antwortKoerper liest mit demselben Signal und
  // liefert {} statt zu werfen.
  async function schicken(rumpf, signal) {
    try {
      const r = await fetch(KI_API + "/frage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rumpf),
        signal,
      });
      return { status: r.status, d: await antwortKoerper(r) };
    } catch (e) {
      return { status: 0, d: {} };
    }
  }

  // Ans Ende des Verlaufs rollen. In niedrigen Fenstern rollt statt der Mitte
  // das ganze Feld (siehe style.css) -- dann eben das.
  function ansEnde() {
    body.scrollTop = body.scrollHeight;
    panel.scrollTop = panel.scrollHeight;
  }

  // Ein Eintrag im Verlauf: oben die Marke, darunter der Text -- als Text, nie
  // als HTML. Absaetze entstehen an den Zeilenumbruechen.
  function eintrag(klasse, marke, text) {
    const el = document.createElement("div");
    el.className = "helper-nachricht " + klasse;
    const m = document.createElement("span");
    m.className = "helper-marke";
    m.textContent = marke;
    el.appendChild(m);
    for (const absatz of text.split("\n")) {
      if (!absatz.trim()) continue;
      const p = document.createElement("p");
      p.textContent = absatz.trim();
      el.appendChild(p);
    }
    log.appendChild(el);
    ansEnde();
    return el;
  }

  // Die erste Zeile beim ersten Oeffnen: Hier antwortet eine Maschine.
  function begruessen() {
    if (log.firstChild) return;
    const p = document.createElement("p");
    p.className = "helper-system";
    p.textContent = T("Hier antwortet ein KI-System.", "An AI system answers here.");
    log.appendChild(p);
  }

  // Fehler: ein verstaendlicher Satz und der Weg zum Menschen. Steht ausserhalb
  // des Verlaufs, damit Bildschirmleser ihn einmal (als Alarm) vorlesen und
  // nicht zweimal.
  function fehler(text) {
    const p = document.createElement("p");
    p.className = "helper-fehler";
    p.setAttribute("role", "alert");
    p.textContent = text + " ";
    const a = document.createElement("a");
    a.href = KONTAKT;
    a.textContent = T("Zur Kontaktseite", "Contact");
    p.appendChild(a);
    meldung.textContent = "";
    meldung.appendChild(p);
    ansEnde();
  }

  function zaehlen() {
    const n = feld.value.length;
    zaehler.textContent = `${n} / ${KI_FRAGE_MAX}`;
    zaehler.classList.toggle("is-knapp", n > KI_FRAGE_MAX - 50);
    // Mitwachsen bis zur Hoechsthoehe aus style.css. Bei geschlossenem Feld
    // gibt es nichts zu messen (scrollHeight waere 0).
    if (panel.hidden) return;
    feld.style.height = "auto";
    feld.style.height = feld.scrollHeight + (feld.offsetHeight - feld.clientHeight) + "px";
  }

  async function fragen() {
    if (laeuft) return;
    const frage = feld.value.trim();
    feld.focus();
    if (!frage) return;
    if (frage.length > KI_FRAGE_MAX) { fehler(FEHLER_FRAGE); return; }

    laeuft = true;
    senden.disabled = true;
    meldung.textContent = "";
    const frageEl = eintrag("is-frage", T("Ihre Frage", "Your question"), frage);
    feld.value = "";
    zaehlen();
    const schreibt = document.createElement("p");
    schreibt.className = "helper-schreibt";
    schreibt.textContent = T("KI schreibt \u2026", "AI is writing \u2026");
    log.appendChild(schreibt);
    ansEnde();

    // Das Zeitlimit gilt fuer Anfrage UND Antwortkoerper, und fuer beide
    // Versuche zusammen.
    const abbruch = new AbortController();
    const uhr = setTimeout(() => abbruch.abort(), KI_WARTEN_MS);
    const rumpf = rumpfFuer(frage, true);
    let { status, d } = await schicken(rumpf, abbruch.signal);
    // Lehnt der Server den Rumpf trotzdem ab und ging Verlauf mit, dann einmal
    // ohne. Kommt die Frage so durch, lag es am Verlauf -- der faellt dann weg,
    // sonst scheiterte jede weitere Frage genauso. Eine 400 kostet dort nichts:
    // sie faellt vor jeder Grenze und jeder Buchung.
    if (status === 400 && rumpf.verlauf.length) {
      ({ status, d } = await schicken(rumpfFuer(frage, false), abbruch.signal));
      if (status !== 0 && status !== 400) verlauf.length = 0;
    }
    clearTimeout(uhr);
    schreibt.remove();
    laeuft = false;
    senden.disabled = false;

    if (status === 200 && typeof d.antwort === "string" && d.antwort.trim()) {
      // Alles, was nicht ausdruecklich eine Sperre ist, traegt die KI-Marke --
      // im Zweifel lieber einmal zu oft gekennzeichnet.
      const sperre = d.art === "sperre";
      const el = eintrag(
        sperre ? "is-antwort is-sperre" : "is-antwort",
        sperre ? T("Automatische Antwort", "Automatic answer") : T("KI-Antwort", "AI answer"),
        d.antwort
      );
      el.dataset.kiGeneriert = sperre ? "false" : "true";
      if (d.art === "ki" && typeof d.sig === "string" && /^[0-9a-f]{64}$/.test(d.sig)) {
        verlauf.push({ frage, antwort: d.antwort, sig: d.sig });
        if (verlauf.length > KI_VERLAUF_MAX) verlauf.shift();
      }
      return;
    }

    // Wie im Vertrag: nur 429 und 503 "aus" haben eigene Saetze, alles andere
    // (auch eine 400, die nach dem Versuch ohne Verlauf bleibt) heisst "nicht
    // erreichbar". FEHLER_FRAGE gilt nur fuer die Pruefung hier im Browser.
    if (status === 429) fehler(FEHLER_LAST);
    else if (status === 503 && d.fehler === "aus") fehler(FEHLER_AUS);
    else fehler(FEHLER_WEG);
    // Die Frage wandert zurueck ins Feld, damit sie nicht neu getippt werden
    // muss -- aber nur, wenn dort inzwischen nichts Neues steht.
    if (!feld.value) {
      frageEl.remove();
      feld.value = frage;
      zaehlen();
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    fragen();
  });

  // Enter sendet, Umschalt+Enter macht eine neue Zeile. Waehrend einer
  // Wortbildung (IME, z. B. Japanisch) gehoert Enter der Eingabehilfe.
  feld.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.shiftKey || e.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    fragen();
  });

  feld.addEventListener("input", zaehlen);

  // fokus=false beim Schliessen von aussen: Wer daneben klickt, will dort
  // weiterlesen — dann darf der Knopf den Fokus nicht zurueckreiszen.
  function oeffnen(auf, fokus = true) {
    panel.hidden = !auf;
    btn.setAttribute("aria-expanded", String(auf));
    wrap.classList.toggle("is-open", auf);
    if (auf) {
      liste();
      begruessen();
      zaehlen();
      const erste = faq.querySelector("button");
      if (erste) erste.focus();
    } else if (fokus) {
      btn.focus();
    }
  }

  btn.addEventListener("click", () => oeffnen(panel.hidden));
  close.addEventListener("click", () => oeffnen(false));

  // Der angeklickte Knopf verschwindet beim Neuaufbau -- damit die Tastatur
  // nicht im Nichts landet, bekommt der Gegenknopf den Fokus: in der Antwort
  // "Alle Fragen", zurueck in der Liste die Frage, von der man kam.
  let offen = 0;
  faq.addEventListener("click", (e) => {
    const ziel = e.target.closest("button");
    if (!ziel) return;
    if (ziel.classList.contains("helper-back")) {
      liste();
      const vorher = faq.querySelector(`[data-i="${offen}"]`);
      if (vorher) vorher.focus();
    } else if (ziel.dataset.i) {
      offen = Number(ziel.dataset.i);
      antwort(offen);
      faq.querySelector(".helper-back").focus();
    }
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

  // Escape waehrend einer Wortbildung bricht nur die ab, nicht das Feld
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !e.isComposing && !panel.hidden) oeffnen(false);
  });
})();

// ---------- Partnerzugang: E-Mail + Passwort oder Code -> Anmeldung ----------
// Das Anmeldezeichen lebt nur im Sitzungsspeicher des Tabs: weg, sobald der
// Tab zu ist. Der Server kennt es nur als Hash (siehe README).
const PartnerSitzung = {
  SCHLUESSEL: "jkhd-partner",
  merke(token) { try { sessionStorage.setItem(this.SCHLUESSEL, token); return true; } catch (e) { return false; } },
  lies() { try { return sessionStorage.getItem(this.SCHLUESSEL) || ""; } catch (e) { return ""; } },
  vergiss() { try { sessionStorage.removeItem(this.SCHLUESSEL); } catch (e) {} },
};

// Fuer beide Partner-Abschnitte und die Fragen-Blase weiter oben (als
// Funktionsdeklaration dort schon bekannt): den JSON-Koerper einer Antwort
// lesen. Leer oder kaputt ergibt {} -- dann zaehlt der Statuscode allein.
async function antwortKoerper(r) {
  try {
    const d = await r.json();
    return d && typeof d === "object" ? d : {};
  } catch (e) {
    return {};
  }
}

// 429 {"grenze":"netz"}: aus diesem Netz kamen zu viele Anmeldeversuche. Dann
// kaeme auch ein Code nicht an -- deshalb steht bei diesem Text nie der
// Knopf „Code per E-Mail schicken".
const NETZ_VOLL = () => T(
  "Von Ihrem Internetanschluss kamen in der letzten Stunde zu viele Anmeldeversuche. Bitte in einer Stunde erneut — auch ein Code käme bis dahin nicht an.",
  "Too many sign-in attempts came from your internet connection in the last hour. Please try again in an hour — until then, a code would not arrive either."
);

// Der Kasten auf partnerzugang.html (und kontakt.html). data-api am .partner-Element nennt den
// Server (https://api.jkhd.de); steht es leer, wird nichts gesendet und der
// Kasten sagt das offen. Schnittstelle (siehe README, Abschnitt Partnerzugang):
//   POST {api}/code   {"email": "..."}                 -> 204, immer (verraet nicht, wer Partner ist);
//                                                        429 {"grenze":"netz"}, wenn das Netz voll ist
//   POST {api}/login  {"email": "...", "code": "..."}  -> 200 {"token": "..."}, 401 bei falschem oder abgelaufenem Code
//   POST {api}/passwort_login {"email": "...", "passwort": "..."}
//                                                     -> 200 {"token": "..."}, 401 {"fehler": "falsch"|"bestaetigen"},
//                                                        429 {"grenze": "netz"|"konto"|"last"}
//   POST {api}/anfrage {name, email, rolle, anliegen, profil, nachricht, sprache}
//                                                     -> 200 {"ok":true}, 429 zu oft, 400 Eingabe
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
  const post = (pfad, daten) =>
    fetch(api + pfad, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(daten) });
  // Schon angemeldet: der Knopf fuehrt ohnehin gleich auf die Partnerseite
  // (siehe start()) -- dann soll er das auch sagen.
  if (api && PartnerSitzung.lies()) startKnopf.textContent = T("Zur Partnerseite", "To the partner page");
  const startHtml = koerper.innerHTML;

  // Merker „neues Passwort festlegen" (von „Passwort vergessen?" oder
  // partnerzugang.html#partner-passwort): nach der Anmeldung geht es dann auf
  // partner.html#neues-passwort. Bewusst nur eine Variable, kein
  // Sitzungsspeicher; „Abbrechen" nimmt ihn zurueck.
  let neuesPasswort = false;

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
    neuesPasswort = false;
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
  // Waehrend eine Anfrage laeuft, ist der Senden-Knopf zu — „Abbrechen"
  // bleibt offen, sonst sitzt fest, wer auf eine haengende Antwort wartet.
  function gesperrt(form, ja) {
    form.querySelectorAll("button").forEach((b) => {
      if (b.dataset.partner !== "zurueck") b.disabled = ja;
    });
  }

  // Schritt 1: E-Mail-Adresse und, falls festgelegt, Passwort -- EIN Formular
  // mit festem Knopf „Anmelden". Welcher Weg laeuft, entscheidet erst das
  // Absenden: Passwortfeld leer = Code per E-Mail genau wie bisher, sonst
  // /passwort_login. Ob eine Adresse ein Passwort hat, fragt die Seite nie ab.
  // `status` steht als Hinweis ueber den Feldern (partnerzugang.html#partner-passwort).
  function mailSchritt(status) {
    const meins = neuerLauf();
    koerper.innerHTML =
      `<form class="partner-form" method="post" novalidate>
         ${status ? hinweis(status) : ""}
         <div class="field">
           <label for="partner-mail">${T("Ihre E-Mail-Adresse", "Your e-mail address")}</label>
           <input id="partner-mail" name="email" type="email" required autocomplete="username" inputmode="email">
         </div>
         <div class="field">
           <label for="partner-passwort">${T("Passwort (falls festgelegt)", "Password (if you set one)")}</label>
           <input id="partner-passwort" type="password" autocomplete="current-password" aria-describedby="partner-passwort-hinweis">
           <p class="partner-hinweis" id="partner-passwort-hinweis">${T(
             "Noch kein Passwort? Feld leer lassen — wir schicken Ihnen einen Code. Ein Passwort legen Sie nach der Anmeldung auf Ihrer Partnerseite fest.",
             "No password yet? Leave this field empty — we will send you a code. You can set a password on your partner page after signing in."
           )}</p>
           <button type="button" class="partner-textknopf" data-partner="vergessen">${T("Passwort vergessen?", "Forgot password?")}</button>
         </div>
         ${aktionen(T("Anmelden", "Sign in"), T("Abbrechen", "Cancel"), "zurueck")}
         <div class="partner-meldung"></div>
       </form>`;
    // Der Zuhoerer kommt vor allem anderen: bricht danach etwas ab, schickt
    // der Browser das Formular sonst selbst ab (das Passwortfeld traegt
    // deshalb auch keinen name).
    const form = koerper.querySelector("form");
    form.addEventListener("submit", (e) => { e.preventDefault(); absenden(); });
    const mail = form.querySelector("#partner-mail");
    const passwort = form.querySelector("#partner-passwort");
    const meldung = form.querySelector(".partner-meldung");
    form.querySelector('[data-partner="zurueck"]').addEventListener("click", zurueck);
    form.querySelector('[data-partner="vergessen"]').addEventListener("click", vergessen);
    fokus();

    // Die eingetippte Adresse -- oder "" mit Fehlermeldung
    function adresse() {
      const email = mail.value.trim();
      if (mail.checkValidity() && email) return email;
      meldung.innerHTML = hinweis(T("Bitte eine gültige E-Mail-Adresse angeben.", "Please enter a valid e-mail address."), true);
      mail.focus();
      return "";
    }

    // Einen Code anfordern: vom leeren Passwortfeld, vom Knopf „Code per
    // E-Mail schicken" oder von „Passwort vergessen?".
    async function codeAnfordern(email, text) {
      if (!api) { ohneServer(); return; }
      meldung.innerHTML = hinweis(text);
      gesperrt(form, true);
      try {
        const r = await post("/code", { email });
        if (veraltet(meins)) return;
        if (r.status === 429) {
          gesperrt(form, false);
          meldung.innerHTML = hinweis(NETZ_VOLL(), true);
          meldung.querySelector(".partner-hinweis").focus();   // der Knopf, der den Fokus hatte, ist weg
          return;
        }
        if (!r.ok) throw new Error(String(r.status));
        codeSchritt(email);
      } catch (err) {
        if (veraltet(meins)) return;
        gesperrt(form, false);
        meldung.innerHTML = hinweis(T("Das hat gerade nicht geklappt. Bitte später erneut versuchen oder an kontakt@jkhd.de schreiben.", "That did not work just now. Please try again later or write to kontakt@jkhd.de."), true);
        meldung.querySelector(".partner-hinweis").focus();
      }
    }

    // Die Anmeldung mit Passwort ging nicht durch: der Hinweis und -- ausser
    // bei vollem Netz -- der Knopf, der fuer die eingetippte Adresse einen
    // Code holt. Von selbst schickt die Seite nie einen Code.
    function ohnePasswort(text, mitCode) {
      gesperrt(form, false);
      meldung.innerHTML = hinweis(text, true) + (mitCode
        ? `<button type="button" class="btn btn-ghost btn-sm" data-partner="code">${T("Code per E-Mail schicken", "Send code by e-mail")}</button>`
        : "");
      const knopf = meldung.querySelector('[data-partner="code"]');
      if (knopf) {
        knopf.addEventListener("click", () => {
          const email = adresse();
          if (email) codeAnfordern(email, T("Code wird angefordert …", "Requesting code …"));
        });
      }
      (knopf || meldung.querySelector(".partner-hinweis")).focus();
    }

    async function absenden() {
      const email = adresse();
      if (!email) return;
      if (!api) { ohneServer(); return; }
      // Nie trimmen: Leerzeichen gehoeren zum Passwort, wie auf dem Server
      const pw = passwort.value;
      if (!pw) {
        codeAnfordern(email, T("Kein Passwort eingegeben — wir schicken Ihnen einen Code …", "No password entered — we are sending you a code …"));
        return;
      }
      meldung.innerHTML = hinweis(T("Wird geprüft …", "Checking …"));
      gesperrt(form, true);
      try {
        const r = await post("/passwort_login", { email, passwort: pw });
        if (veraltet(meins)) return;
        if (r.ok) { angemeldet(await r.json()); return; }
        const d = await antwortKoerper(r);
        if (veraltet(meins)) return;
        if (r.status === 401 && d.fehler === "bestaetigen") {
          ohnePasswort(T(
            "Ihr Passwort stimmt. Zur Sicherheit bitte einmal mit einem Code per E-Mail anmelden — danach gilt es wieder ein halbes Jahr.",
            "Your password is correct. For security, please sign in once with a code by e-mail — after that it is valid for another six months."
          ), true);
        } else if (r.status === 401) {
          ohnePasswort(T(
            "Mit diesem Passwort hat es nicht geklappt: Adresse oder Passwort stimmt nicht, oder für diese Adresse ist noch kein Passwort festgelegt. Mit einem Code per E-Mail kommen Sie immer hinein.",
            "That password did not work: the address or the password is wrong, or no password has been set for this address yet. With a code by e-mail you can always sign in."
          ), true);
          passwort.focus();
          passwort.select();
        } else if (r.status === 429 && d.grenze === "netz") {
          ohnePasswort(NETZ_VOLL(), false);
        } else if (r.status === 429) {
          ohnePasswort(T(
            "Die Anmeldung mit Passwort ist für diese Adresse gerade gesperrt oder der Server ist ausgelastet — mit einem Code per E-Mail kommen Sie sofort hinein.",
            "Signing in with a password is blocked for this address right now, or the server is busy — with a code by e-mail you can sign in right away."
          ), true);
        } else {
          throw new Error(String(r.status));
        }
      } catch (err) {
        if (veraltet(meins)) return;
        // 404 (Server ohne die neue Route), 5xx, Netzfehler: der Code-Weg bleibt
        ohnePasswort(T(
          "Das hat gerade nicht geklappt — mit einem Code per E-Mail kommen Sie sofort hinein.",
          "That did not work just now — with a code by e-mail you can sign in right away."
        ), true);
      }
    }

    // „Passwort vergessen?": ein Code wie sonst auch -- nur steht danach der
    // Merker, und die Partnerseite zeigt die Passwortkarte ganz oben.
    function vergessen() {
      const email = adresse();
      if (!email) return;
      neuesPasswort = true;
      codeAnfordern(email, T("Code wird angefordert …", "Requesting code …"));
    }
  }

  // Schritt 2: Code aus der E-Mail. Nach „Passwort vergessen?" sagt ein
  // Zusatzsatz, dass die Code-Mail die richtige ist -- gesucht wird im
  // Postfach sonst nach „Passwort".
  function codeSchritt(email) {
    const meins = neuerLauf();
    koerper.innerHTML =
      `<form class="partner-form" novalidate>
         ${hinweis(T(
           "Wenn diese Adresse bei uns als Partner hinterlegt ist, haben wir Ihnen gerade einen Code geschickt. Er gilt zehn Minuten und nur einmal.",
           "If this address is registered with us as a partner, we have just sent you a code. It is valid for ten minutes and can be used once."
         ) + (neuesPasswort ? " " + T(
           `Geben Sie den Code aus der E-Mail „Ihr Code für den JKHD-Partnerzugang" ein. Danach legen Sie auf Ihrer Partnerseite ein neues Passwort fest; ein bisheriges gilt weiter, bis Sie das tun.`,
           `Enter the code from the e-mail "Ihr Code für den JKHD-Partnerzugang". Then set a new password on your partner page; any previous one stays valid until you do.`
         ) : ""))}
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
    form.querySelector('[data-partner="mail"]').addEventListener("click", () => mailSchritt());
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
        const r = await post("/login", { email, code });
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
  // (mit dem Merker direkt zur Passwortkarte)
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
    window.location.href = neuesPasswort ? "partner.html#neues-passwort" : "partner.html";
  }

  // Anfrage: ein fester Fragebogen. „Senden" schickt die Antworten an den
  // Zugang; der leitet sie an service@ weiter und bestaetigt dem Einsender
  // sofort per E-Mail (Julians Wunsch, 24.09.2026). Klappt das nicht — kein
  // Server, kein Netz, Bremse —, oeffnet sich wie bisher das E-Mail-Programm
  // mit dem fertigen Text: niemand verliert, was er geschrieben hat.
  const FRAGEN = () => [
    { id: "name", frage: T("Ihr Name", "Your name"), typ: "text", pflicht: true, auto: "name" },
    { id: "email", frage: T("Ihre E-Mail-Adresse", "Your e-mail address"), typ: "email", pflicht: true, auto: "email" },
    // Die Optionen tragen stabile Schluessel: gesendet wird der Schluessel,
    // angezeigt die uebersetzte Beschriftung. Sonst haetten wir auf der
    // englischen Seite andere Werte als auf der deutschen.
    { id: "rolle", frage: T("Was beschreibt Sie am besten?", "What describes you best?"), typ: "select", pflicht: true,
      optionen: [
        { w: "quant", t: T("Quant / Entwickler", "Quant / developer") },
        { w: "trader", t: T("Trader", "Trader") },
        { w: "firma", t: T("Unternehmen", "Company") },
        { w: "anderes", t: T("Etwas anderes", "Something else") },
      ] },
    { id: "anliegen", frage: T("Worum geht es?", "What is it about?"), typ: "select", pflicht: true,
      optionen: [
        { w: "partnerschaft", t: T("Partnerschaft", "Partnership") },
        { w: "austausch", t: T("Austausch unter Quants", "Exchange among quants") },
        { w: "zugang", t: T("Zugang zum Partnerbereich", "Access to the partner area") },
        { w: "anderes", t: T("Etwas anderes", "Something else") },
      ] },
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
        ${f.optionen.map((o) => `<option value="${esc(o.w)}">${esc(o.t)}</option>`).join("")}</select></div>`;
    }
    if (f.typ === "textarea") {
      return `<div class="field">${label}<textarea id="${id}" name="${f.id}" rows="5" maxlength="1500"${pflicht}></textarea></div>`;
    }
    const auto = f.auto ? ` autocomplete="${f.auto}"` : "";
    return `<div class="field">${label}<input id="${id}" name="${f.id}" type="${f.typ}" maxlength="200"${auto}${pflicht}></div>`;
  }

  function anfrageSchritt() {
    const meins = neuerLauf();
    const fragen = FRAGEN();
    box.classList.add("is-anfrage");
    koerper.innerHTML =
      `<form class="partner-form partner-anfrage" novalidate>
         ${hinweis(T(
           "Ein paar Fragen. Wir bestätigen den Eingang sofort per E-Mail und antworten innerhalb von 24 Stunden.",
           "A few questions. We confirm receipt by e-mail right away and answer within 24 hours."
         ))}
         <div class="field-row">${feldHtml(fragen[0])}${feldHtml(fragen[1])}</div>
         <div class="field-row">${feldHtml(fragen[2])}${feldHtml(fragen[3])}</div>
         ${fragen.slice(4).map(feldHtml).join("")}
         ${aktionen(T("Senden", "Send"), T("Abbrechen", "Cancel"), "zurueck")}
         ${hinweis(T(
           `Pflichtfelder sind markiert. Was mit Ihren Angaben passiert, steht in der <a href="${IST_EN ? "../datenschutz.html" : "datenschutz.html"}">Datenschutzerklärung</a>.`,
           `Required fields are marked. What happens with your details is set out in the <a href="../datenschutz.html">privacy policy</a>.`
         ))}
         <div class="partner-meldung"></div>
       </form>`;
    const form = koerper.querySelector("form");
    const meldung = form.querySelector(".partner-meldung");
    form.querySelector('[data-partner="zurueck"]').addEventListener("click", zurueck);
    fokus();

    form.addEventListener("submit", async (e) => {
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
          const el = form.elements[f.id];
          // Bei Auswahlfeldern steht im Wert der Schluessel — in die Mail
          // gehoert, was der Besucher gelesen hat.
          const wert = (f.typ === "select" ? (el.selectedOptions[0] || {}).text : el.value).trim() || "—";
          return f.typ === "textarea" ? f.frage + ":\n" + wert : f.frage + ": " + wert;
        });
        return T("Guten Tag,\n\nhier meine Anfrage über www.jkhd.de:\n\n", "Hello,\n\nhere is my enquiry via www.jkhd.de:\n\n")
          + zeilen.join("\n") + "\n";
      };
      const betreff = T("Partneranfrage", "Partner enquiry") + " — " + form.elements.name.value.trim();

      // Ohne Server bleibt es beim alten Weg: das Mailprogramm des Besuchers.
      if (!api) { perMailprogramm(meldung, bauen, betreff); return; }

      meldung.innerHTML = hinweis(T("Anfrage wird gesendet …", "Sending enquiry …"));
      gesperrt(form, true);
      const daten = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        rolle: form.elements.rolle.value.trim(),
        anliegen: form.elements.anliegen.value.trim(),
        profil: form.elements.profil.value.trim(),
        nachricht: form.elements.nachricht.value.trim(),
        sprache: IST_EN ? "en" : "de",
      };
      const text = bauen();
      try {
        const r = await fetch(api + "/anfrage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(daten),
          // Ohne Zeitlimit haengt das Formular, wenn die Antwort ausbleibt.
          signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined,
        });
        if (veraltet(meins)) return;
        if (r.status === 429) {
          gesperrt(form, false);
          meldung.innerHTML = hinweis(T(
            `Gerade sind zu viele Anfragen unterwegs. Bitte in einer Stunde erneut versuchen — oder direkt an <a href="mailto:${ANFRAGE_AN}">${ANFRAGE_AN}</a> schreiben.`,
            `Too many enquiries are in flight just now. Please try again in an hour — or write directly to <a href="mailto:${ANFRAGE_AN}">${ANFRAGE_AN}</a>.`
          ), true);
          return;
        }
        if (r.status === 400) {
          gesperrt(form, false);
          meldung.innerHTML = hinweis(T(
            "Eine Angabe fehlt oder ist unvollständig — bitte Name, E-Mail-Adresse und Nachricht prüfen.",
            "Something is missing or incomplete — please check name, e-mail address and message."
          ), true);
          return;
        }
        if (!r.ok) throw new Error(String(r.status));
        let bestaetigt = true;
        try { bestaetigt = (await r.json()).bestaetigung !== false; } catch (e) {}
        angekommen(daten.email, bestaetigt, text);
      } catch (err) {
        if (veraltet(meins)) return;
        gesperrt(form, false);
        meldung.innerHTML = hinweis(T(
          "Der Zugang ist gerade nicht erreichbar — wir gehen über Ihr E-Mail-Programm, damit Ihr Text nicht verloren geht.",
          "The access is not reachable just now — we will go via your e-mail program so your text is not lost."
        ), true);
        perMailprogramm(meldung, bauen, betreff, true);
      }
    });
  }

  // Der alte Weg, jetzt nur noch Rueckfall: Mailprogramm oeffnen und den Text
  // zum Kopieren anbieten. `anhaengen` laesst die Fehlermeldung darueber
  // stehen, statt sie zu ueberschreiben.
  function perMailprogramm(meldung, bauen, betreff, anhaengen) {
    const ziel = anhaengen ? document.createElement("div") : meldung;
    kopierHinweis(ziel, bauen, ANFRAGE_AN);
    if (anhaengen) meldung.appendChild(ziel);
    window.location.href = mailto(ANFRAGE_AN, betreff, bauen());
  }

  // Erfolg: die Anfrage liegt beim Zugang. „Unterwegs" ist die ehrliche
  // Formulierung — der Versand laeuft in einer zweiten Anfrage des Servers und
  // kann noch scheitern, deshalb steht auch der Weg dahinter da.
  // Erfolg. Die Anfrage liegt bei uns — das ist die Aussage, die traegt.
  // Ob die Bestaetigung wirklich rausgegangen ist, sagt der Server mit; sonst
  // stuende hier ein Versprechen, das niemand geprueft hat. Der eigene Text
  // bleibt zum Kopieren stehen, damit auch ohne Bestaetigung nichts verloren
  // ist.
  function angekommen(email, bestaetigt, text) {
    neuerLauf();
    koerper.innerHTML =
      hinweis(T(
        `<b>Ihre Anfrage ist bei uns angekommen.</b> Wir antworten innerhalb von 24 Stunden.`,
        `<b>Your enquiry has arrived.</b> We will answer within 24 hours.`
      )) +
      hinweis(bestaetigt
        ? T(
            `Eine Bestätigung ist an ${esc(email)} unterwegs, Absender ${ANFRAGE_AN}. Ist sie in ein paar Minuten nicht da, sehen Sie bitte im Spam-Ordner nach.`,
            `A confirmation is on its way to ${esc(email)} from ${ANFRAGE_AN}. If it has not arrived in a few minutes, please check your spam folder.`
          )
        : T(
            `Eine Bestätigungs-Mail haben wir dieses Mal nicht geschickt — an diese Adresse ging vor kurzem schon eine. Die Anfrage selbst ist da.`,
            `We did not send a confirmation e-mail this time — one recently went to this address. The enquiry itself has arrived.`
          )) +
      `<div class="partner-aktionen">
         <button type="button" class="btn btn-ghost" data-partner="kopieren">${T("Text kopieren", "Copy text")}</button>
         <button type="button" class="btn btn-ghost" data-partner="zurueck">${T("Zurück", "Back")}</button>
       </div>`;
    koerper.querySelector('[data-partner="zurueck"]').addEventListener("click", zurueck);
    koerper.querySelector('[data-partner="kopieren"]').addEventListener("click", async (ev) => {
      try {
        await navigator.clipboard.writeText(text);
        ev.target.textContent = T("Kopiert", "Copied");
      } catch (e) {
        ev.target.insertAdjacentHTML("afterend",
          `<textarea class="partner-rohtext" rows="8" readonly>${esc(text)}</textarea>`);
        ev.target.remove();
      }
    });
    fokus();
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

  // Von der Partnerseite („Abmelden und Code anfordern"): der Kasten steht
  // gleich offen wie nach „Anmelden", der Merker ist gesetzt. Die Adresse
  // traegt der Link bewusst nicht mit -- die fuellt das Autofill. Der Anker
  // verschwindet sofort: er heisst wie das Passwortfeld, und der Browser
  // setzte den Fokus sonst dorthin statt auf die Adresse.
  if (window.location.hash === "#partner-passwort" && !PartnerSitzung.lies()) {
    neuesPasswort = true;
    history.replaceState(null, "", location.pathname + location.search);
    if (!api) {
      ohneServer();
    } else {
      mailSchritt(T(
        `Neues Passwort festlegen: E-Mail-Adresse eingeben und „Passwort vergessen?" wählen.`,
        `Set a new password: enter your e-mail address and choose "Forgot password?".`
      ));
    }
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
// Seit 25.09.2026 zusaetzlich (Partner-App): „dateien" [{id, name, typ, groesse,
// datum, text}] -- Download ueber POST {api}/datei {token, id} -- und „ansicht"
// {begruessung, daten, dateien, module, vip}: was ausgeblendet ist, schickt der
// Server gar nicht erst. VORSCHAU: die Partner-App laedt diese Seite auf
// 127.0.0.1 mit window.JKHD_VORSCHAU = true und schickt die Daten per
// postMessage (nur vom eigenen Ursprung) -- auf www.jkhd.de gibt es das nie.
// Seit 25.09.2026 ausserdem die Passwortkarte: /daten liefert „email" (wie in
// partner.json) und „passwort" {gesetzt, seit: "JJJJ-MM-TT"|"", ohne_altes_bis:
// Unix-Sekunden|0}; fehlt „passwort", gibt es keine Karte.
//   POST {api}/passwort_setzen    {token, passwort, altes_passwort?} -> 200 {ok, passwort} | 400 {fehler} | 401
//                                  | 403 {fehler} | 409 {fehler: "geaendert"} | 429 {grenze}
//   POST {api}/passwort_entfernen {token, altes_passwort?}           -> 200 {entfernt, passwort} | sonst wie oben ohne 400
(function () {
  const seite = document.querySelector(".partner-seite");
  if (!seite) return;
  const api = (seite.dataset.api || "").replace(/\/+$/, "");
  const VORSCHAU = window.JKHD_VORSCHAU === true;
  // Nach „Passwort vergessen?" kommt der Partner mit #neues-passwort: dann
  // steht die Passwortkarte ganz oben, solange diese Seite offen ist.
  const passwortOben = window.location.hash === "#neues-passwort";

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
         <a class="btn btn-primary" href="${T("partnerzugang.html#partner", "partner-access.html#partner")}">${T("Zum Partnerzugang", "To partner access")}</a>
       </div>`;
    const kopf = seite.querySelector("h2");
    if (kopf) kopf.focus();
  }

  function abgelaufen() {
    PartnerSitzung.vergiss();
    nichtAngemeldet(T("Ihre Anmeldung ist abgelaufen. Bitte melden Sie sich erneut an.", "Your sign-in has expired. Please sign in again."));
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
  // Ohne VIP-Adresse (Ansicht „vip" aus) gibt es weder den Hinweis auf sie noch
  // Haekchen zum Anfordern -- angefordert wird ja per Mail an genau diese Adresse.
  function modulHtml(m, frei, vip) {
    const lage = m.status === "bald" ? "bald" : (frei.has(m.id) ? "frei" : "anfrage");
    const kurz = T(m.kurz || "", m.kurz_en || m.kurz || "");
    const status = { frei: T("Freigeschaltet", "Unlocked"), bald: T("Bald", "Soon"), anfrage: T("Auf Anfrage", "On request") }[lage];
    const aktion = lage === "frei"
      ? (m.link
          ? `<a class="btn btn-ghost btn-sm" href="${esc(m.link)}" rel="noopener">${T("Öffnen", "Open")}</a>`
          : (vip ? `<span class="modul-hinweis">${T("Zugang per E-Mail an die VIP-Adresse unten.", "Access by e-mail to the VIP address below.")}</span>` : ""))
      : (lage === "anfrage" && vip)
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

  // 1234567 -> "1,2 MB"
  const groesse = (b) => {
    const n = Number(b) || 0;
    const zahl = (x) => x.toLocaleString(IST_EN ? "en-GB" : "de-DE", { maximumFractionDigits: 1 });
    return n >= 1048576 ? zahl(n / 1048576) + " MB" : n >= 1024 ? zahl(n / 1024) + " KB" : n + " B";
  };

  function dateienHtml(dateien) {
    return `<section class="partner-karte partner-dateien" aria-labelledby="dateien-titel">
         <span class="kachel-label">${T("Für Sie hinterlegt", "Stored for you")}</span>
         <h2 id="dateien-titel">${T("Dateien", "Files")}</h2>
         <ul class="dateien">
           ${dateien.map((d) => `<li class="datei">
             <div class="datei-kopf">
               <span class="datei-typ">${esc(d.typ || "")}</span>
               <span class="datei-name">${esc(d.name)}</span>
             </div>
             ${d.text ? `<p>${esc(d.text)}</p>` : ""}
             <div class="datei-fuss">
               <span class="datei-info">${groesse(d.groesse)}${d.datum ? " · " + esc(d.datum) : ""}</span>
               <button type="button" class="btn btn-ghost btn-sm" data-datei="${esc(d.id)}">${T("Herunterladen", "Download")}</button>
             </div>
           </li>`).join("")}
         </ul>
         <div class="partner-meldung" data-dateien-meldung></div>
       </section>`;
  }

  // Eingebaute Browser von Apps (Instagram, Facebook, TikTok ...) laden keine Datei herunter,
  // die die Seite selbst bereitstellt (Blob) -- es passiert einfach nichts (gemeldet: Instagram
  // auf Android, 26.09.2026). Dann sagt die Seite das, statt still „Lädt …" zu zeigen.
  // Name der App, "" fuer einen anderen eingebauten Browser (Android-WebView), sonst null.
  function appBrowser() {
    const ua = navigator.userAgent || "";
    const apps = [[/Instagram/i, "Instagram"], [/FBAN|FBAV|FB_IAB|FBIOS/, "Facebook"], [/musical_ly|BytedanceWebview|TikTok/i, "TikTok"],
      [/Snapchat/i, "Snapchat"], [/LinkedInApp/i, "LinkedIn"], [/Pinterest/i, "Pinterest"], [/\bLine\//, "LINE"], [/MicroMessenger/i, "WeChat"]];
    for (const [muster, name] of apps) if (muster.test(ua)) return name;
    return /; wv\)/.test(ua) ? "" : null;
  }

  // Download: mit dem Anmeldezeichen holen, als Datei speichern. Der Name kommt
  // aus der Liste (nicht aus einem Kopf der Antwort -- den liest fetch quer
  // ueber Herkunftsgrenzen ohnehin nicht).
  async function herunterladen(knopf, datei, meldung) {
    if (VORSCHAU) {
      meldung.innerHTML = hinweis(T("Vorschau: Herunterladen kann nur der Partner selbst.", "Preview: only the partner can download."));
      return;
    }
    const app = appBrowser();
    if (app !== null) {
      meldung.innerHTML = hinweis(T(
        `Im ${app ? app + "-Browser" : "eingebauten Browser dieser App"} lassen sich keine Dateien herunterladen. Bitte öffnen Sie diese Seite in Chrome oder Safari – über das Menü oben rechts (⋮ oder …) „Im Browser öffnen“ – und melden Sie sich dort einmal neu an.`,
        `Files cannot be downloaded in the ${app ? app + " browser" : "built-in browser of this app"}. Please open this page in Chrome or Safari – via the menu at the top right (⋮ or …) “Open in browser” – and sign in there once more.`
      ), true);
      meldung.querySelector(".partner-hinweis").focus();
      return;
    }
    const token = PartnerSitzung.lies();
    const text = knopf.textContent;
    knopf.disabled = true;
    knopf.textContent = T("Lädt …", "Loading …");
    try {
      const r = await post("/datei", { token, id: datei.id });
      if (r.status === 401) {
        abgelaufen();
        return;
      }
      if (r.status === 404) {
        // Die Datei ist nicht mehr fuer ihn da (entfernt oder ausgeblendet): Liste neu holen statt „spaeter nochmal".
        await laden();
        const m = seite.querySelector("[data-dateien-meldung]");
        const text = T("Diese Datei ist nicht mehr für Sie hinterlegt. Die Liste wurde aktualisiert.",
                       "This file is no longer available to you. The list has been updated.");
        if (m) m.innerHTML = hinweis(text, true);
        else seite.insertAdjacentHTML("afterbegin", hinweis(text, true));
        return;
      }
      if (!r.ok) throw new Error(String(r.status));
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = datei.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      meldung.innerHTML = "";
    } catch (err) {
      meldung.innerHTML = hinweis(T("Die Datei ließ sich gerade nicht laden. Bitte später noch einmal versuchen.", "The file could not be loaded just now. Please try again later."), true);
    } finally {
      knopf.disabled = false;
      knopf.textContent = text;
    }
  }

  // ---- Passwort ----
  // Dieselben Regeln prueft der Server (JKHD-Partner-Server, api/index.php):
  // erst NFC, nie trimmen, Laenge in Codepunkten. Die Liste steht klein
  // geschrieben. Die Seite prueft nur vorab, massgeblich ist der Server.
  const PASSWORT_ZU_EINFACH = new Set((
    "passwort123 passwort1234 passwort12345 password123 password1234 password12345 1234567890 12345678910 " +
    "0123456789 0987654321 qwertz1234 qwertzuiop qwerty1234 qwertyuiop 1q2w3e4r5t asdfghjkl1 abcdefghij " +
    "jkhd123456 jkhdjkhd12 partner123 partner1234 willkommen1 willkommen123 hallo12345 geheim1234 sommer2026"
  ).split(" "));

  // "" = in Ordnung, sonst der Fehlercode, den auch der Server schicken wuerde.
  // gleich_adresse prueft der Server gegen den Anmeldeschluessel, die Seite
  // nur gegen die Adresse aus /daten.
  function passwortRegel(pw, email) {
    const n = pw.normalize("NFC");
    const zeichen = [...n];
    if (zeichen.length < 10) return "zu_kurz";
    if (zeichen.length > 128) return "zu_lang";
    if (/^\s*$/u.test(n) || zeichen.every((z) => z === zeichen[0]) || PASSWORT_ZU_EINFACH.has(n.toLowerCase())) return "zu_einfach";
    if (email && n.toLowerCase() === email.toLowerCase()) return "gleich_adresse";
    return "";
  }

  const PASSWORT_TEXT = {
    zu_kurz: T("Bitte mindestens 10 Zeichen.", "Please use at least 10 characters."),
    zu_lang: T("Höchstens 128 Zeichen.", "At most 128 characters."),
    zu_einfach: T("Dieses Passwort ist zu leicht zu erraten — bitte ein anderes.", "This password is too easy to guess — please choose another one."),
    gleich_adresse: T("Bitte nicht Ihre E-Mail-Adresse als Passwort.", "Please do not use your e-mail address as the password."),
    ungueltig: T("Dieses Passwort enthält Zeichen, die wir nicht verarbeiten können.", "This password contains characters we cannot process."),
  };

  // 429 der Passwort-Wege: welche Grenze voll ist, sagt der Koerper
  const PASSWORT_GRENZE = {
    konto: T("Zu viele falsche Versuche — bitte in einer Stunde erneut oder mit einem Code per E-Mail anmelden.", "Too many wrong attempts — please try again in an hour or sign in with a code by e-mail."),
    aenderung: T("Zu viele Änderungen in der letzten Stunde — bitte später erneut.", "Too many changes in the last hour — please try again later."),
    last: T("Der Server ist gerade ausgelastet — bitte gleich noch einmal.", "The server is busy right now — please try again in a moment."),
    netz: NETZ_VOLL(),
  };

  // 1790000000 -> "14:05"; "2026-09-25" -> "25.09.2026" (EN "25/09/2026").
  // Das Datum wird zerlegt statt geparst: new Date("2026-09-25") ist UTC und
  // waere westlich von Greenwich schon der Vortag.
  const uhrzeit = (sek) => new Date(sek * 1000).toLocaleTimeString(IST_EN ? "en-GB" : "de-DE", { hour: "2-digit", minute: "2-digit" });
  const tag = (iso) => {
    const t = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    return t ? (IST_EN ? `${t[3]}/${t[2]}/${t[1]}` : `${t[3]}.${t[2]}.${t[1]}`) : "";
  };

  // Ein Passwortfeld ohne name. Der Fehlertext darunter ist von Anfang an per
  // aria-describedby verbunden und bleibt unsichtbar, solange er leer ist.
  const passwortFeld = (id, label, auto, regel) => `<div class="field">
       <label for="${id}">${label}</label>
       <input id="${id}" type="password" autocomplete="${auto}" autocapitalize="off" spellcheck="false" aria-describedby="${regel ? id + "-regel " : ""}${id}-fehler">
       ${regel ? `<p class="partner-hinweis" id="${id}-regel">${regel}</p>` : ""}
       <p class="partner-hinweis is-error feld-fehler" id="${id}-fehler" role="alert"></p>
     </div>`;

  // Laeuft ohne_altes_bis ab, zeichnet sich die Karte selbst neu.
  let passwortUhr = 0;

  // Zeichnet die Passwortkarte an die Stelle von `alt` -- immer als neues
  // Element mit neuem Formular: erst wenn das alte aus dem Dokument
  // verschwindet, bietet der Browser an, das Passwort zu speichern.
  // `meldung` (fertiges hinweis()-HTML) steht unter der Ueberschrift und
  // bekommt den Fokus. Drei Zustaende: A kein Passwort, frisch per Code
  // angemeldet (festlegen); B kein Passwort, Fenster zu (erst neu mit Code
  // anmelden); C Passwort gesetzt (aendern/entfernen, ausserhalb des
  // Fensters nur mit dem bisherigen).
  function passwortKarte(alt, stand, email, meldung) {
    clearTimeout(passwortUhr);
    const fokusDrin = alt.contains(document.activeElement);
    const bis = Number(stand.ohne_altes_bis) || 0;
    // Wie lange das Fenster ohne altes Passwort noch offen ist, sagt der Server
    // als Restzeit (ohne_altes_rest). Gemessen wird ab Empfang mit der Uhr
    // dieses Browsers, nie gegen dessen Datum: eine vorgehende Uhr schloesse das
    // Fenster sonst vorzeitig oder nie (Pruefung 25.09.2026). ohne_altes_bis ist
    // nur fuer „bis HH:MM Uhr". Die Frist reist mit `stand` in jedes Neuzeichnen.
    if (stand.frist === undefined) {
      const rest = stand.ohne_altes_rest !== undefined
        ? Number(stand.ohne_altes_rest) || 0
        : Math.max(0, bis - Date.now() / 1000);   // Server ohne Restzeit (alte Fassung)
      stand = { ...stand, frist: rest > 0 ? Date.now() + rest * 1000 : 0 };
    }
    const frisch = stand.frist > Date.now();
    const gesetzt = stand.gesetzt === true;
    const seit = tag(typeof stand.seit === "string" ? stand.seit : "");

    let text;
    if (gesetzt) {
      text = (seit ? T(`Ihr Passwort ist festgelegt (seit ${seit}).`, `Your password is set (since ${seit}).`) : T("Ihr Passwort ist festgelegt.", "Your password is set."))
        + (frisch ? " " + T(`Bis ${uhrzeit(bis)} Uhr können Sie ohne das bisherige Passwort ein neues festlegen.`, `Until ${uhrzeit(bis)} you can set a new one without the previous password.`) : "");
    } else if (frisch) {
      text = T(
        `Sie melden sich zurzeit mit einem Code per E-Mail an. Mit einem Passwort geht es künftig ohne Code. Festlegen können Sie es bis ${uhrzeit(bis)} Uhr.`,
        `You currently sign in with a code by e-mail. With a password you will not need a code in future. You can set it until ${uhrzeit(bis)}.`
      );
    } else {
      text = T(
        "Sie melden sich mit einem Code per E-Mail an. Ein Passwort legen Sie direkt nach einer Anmeldung mit Code fest.",
        "You sign in with a code by e-mail. You set a password right after signing in with a code."
      );
    }

    const karte = document.createElement("section");
    karte.className = "partner-karte partner-passwort";
    karte.setAttribute("aria-labelledby", "passwort-titel");
    karte.innerHTML =
      `<span class="kachel-label">${T("Anmeldung", "Sign-in")}</span>
       <h2 id="passwort-titel" tabindex="-1">${T("Passwort", "Password")}</h2>
       ${meldung || ""}
       <p>${text}</p>` +
      (gesetzt || frisch
        ? `<form class="partner-form" method="post" novalidate>
             <div class="field">
               <label for="passwort-adresse">${T("Ihre Anmeldeadresse", "Your sign-in address")}</label>
               <input id="passwort-adresse" type="email" autocomplete="username" readonly value="${esc(email)}">
             </div>
             ${gesetzt && !frisch ? passwortFeld("passwort-alt", T("Bisheriges Passwort", "Current password"), "current-password", "") : ""}
             ${passwortFeld("passwort-neu", T("Neues Passwort", "New password"), "new-password",
               T("Mindestens 10 Zeichen — am einfachsten ein Satz aus vier Wörtern.", "At least 10 characters — easiest is a sentence of four words."))}
             <button type="button" class="partner-textknopf" data-passwort="anzeigen" aria-pressed="false">${T("Passwörter anzeigen", "Show passwords")}</button>
             <div class="partner-aktionen">
               <button type="submit" class="btn btn-primary">${gesetzt ? T("Passwort ändern", "Change password") : T("Passwort festlegen", "Set password")}</button>
               ${gesetzt ? `<button type="button" class="btn btn-ghost" data-passwort="entfernen">${T("Passwort entfernen", "Remove password")}</button>` : ""}
             </div>
             <div class="partner-meldung"></div>
           </form>`
        : `<div class="partner-aktionen">
             <button type="button" class="btn btn-ghost" data-passwort="code">${T("Abmelden und Code anfordern", "Sign out and request a code")}</button>
           </div>
           <div class="partner-meldung"></div>`);
    // Wie im Anmeldekasten: der submit-Zuhoerer haengt vor allem anderen
    const form = karte.querySelector("form");
    if (form) form.addEventListener("submit", (e) => { e.preventDefault(); festlegen(); });

    const knopf = (name) => karte.querySelector(`[data-passwort="${name}"]`);
    const ausgang = karte.querySelector(".partner-meldung");
    const bisher = karte.querySelector("#passwort-alt");
    const neu = karte.querySelector("#passwort-neu");
    const anzeigen = knopf("anzeigen");

    const zeigen = (ja) => {
      karte.querySelectorAll("#passwort-alt, #passwort-neu").forEach((f) => { f.type = ja ? "text" : "password"; });
      if (anzeigen) anzeigen.setAttribute("aria-pressed", String(ja));
    };
    if (anzeigen) anzeigen.addEventListener("click", () => zeigen(anzeigen.getAttribute("aria-pressed") !== "true"));

    function feldFehler(feld, fehlertext) {
      feld.setAttribute("aria-invalid", "true");
      karte.querySelector(`#${feld.id}-fehler`).textContent = fehlertext;
      feld.focus();
    }
    // Vor jedem Versuch: alte Fehler weg, alle Felder wieder verdeckt (ein
    // Feld, das beim Senden Klartext zeigt, erkennen manche Passwortmanager nicht)
    function neuerVersuch() {
      karte.querySelectorAll("[aria-invalid]").forEach((f) => f.removeAttribute("aria-invalid"));
      karte.querySelectorAll(".feld-fehler").forEach((p) => { p.textContent = ""; });
      ausgang.innerHTML = "";
      zeigen(false);
    }
    const bisherFehlt = () => {
      if (!bisher || bisher.value) return false;
      feldFehler(bisher, T("Bitte Ihr bisheriges Passwort eingeben.", "Please enter your current password."));
      return true;
    };
    // In der Vorschau der Partner-App bleiben alle Knoepfe ohne Wirkung -- nie ein fetch
    const vorschau = () => {
      ausgang.innerHTML = hinweis(T("Vorschau: Sein Passwort verwaltet nur der Partner selbst.", "Preview: only the partner manages their own password."));
    };

    function festlegen() {
      neuerVersuch();
      if (VORSCHAU) { vorschau(); return; }
      if (bisherFehlt()) return;
      const regel = passwortRegel(neu.value, email);
      if (regel) { feldFehler(neu, PASSWORT_TEXT[regel]); return; }
      const daten = { passwort: neu.value };
      if (bisher) daten.altes_passwort = bisher.value;
      senden("/passwort_setzen", daten, () => T(
        "Ihr Passwort ist festgelegt. Ab jetzt melden Sie sich mit E-Mail-Adresse und Passwort an; ein Code per E-Mail geht weiterhin. Andere Anmeldungen wurden beendet, eine Bestätigung ist per E-Mail unterwegs.",
        "Your password is set. From now on you sign in with your e-mail address and password; a code by e-mail still works. Other sign-ins have been ended, and a confirmation is on its way by e-mail."
      ));
    }

    // „Passwort entfernen": erst die Rueckfrage in der Karte, dann senden
    const entfernen = knopf("entfernen");
    if (entfernen) {
      entfernen.addEventListener("click", () => {
        neuerVersuch();
        if (VORSCHAU) { vorschau(); return; }
        if (bisherFehlt()) return;
        ausgang.innerHTML =
          hinweis(T("Passwort wirklich entfernen? Danach melden Sie sich wieder mit einem Code an.", "Really remove your password? After that you sign in with a code again.")) +
          `<div class="partner-aktionen">
             <button type="button" class="btn btn-primary btn-sm" data-passwort="ja">${T("Entfernen", "Remove")}</button>
             <button type="button" class="btn btn-ghost btn-sm" data-passwort="nein">${T("Abbrechen", "Cancel")}</button>
           </div>`;
        knopf("nein").addEventListener("click", () => { ausgang.innerHTML = ""; entfernen.focus(); });
        knopf("ja").addEventListener("click", () => {
          neuerVersuch();
          if (bisherFehlt()) return;
          senden("/passwort_entfernen", bisher ? { altes_passwort: bisher.value } : {}, (d) => d.entfernt === false
            ? T("Es war kein Passwort mehr festgelegt. Sie melden sich mit einem Code per E-Mail an.", "No password was set any more. You sign in with a code by e-mail.")
            : T("Ihr Passwort ist entfernt. Sie melden sich jetzt wieder mit einem Code per E-Mail an. Eine Bestätigung ist per E-Mail unterwegs.",
                "Your password has been removed. You now sign in with a code by e-mail again. A confirmation is on its way by e-mail."));
        });
        ausgang.querySelector(".partner-hinweis").focus();
      });
    }

    // Zustand B: abmelden wie mit dem Knopf unten, dann zum Anmeldekasten --
    // dort steht der Merker schon, der Code fuehrt zurueck zu dieser Karte.
    const code = knopf("code");
    if (code) {
      code.addEventListener("click", async () => {
        if (VORSCHAU) { vorschau(); return; }
        await abmelden();
        window.location.href = T("partnerzugang.html#partner-passwort", "partner-access.html#partner-passwort");
      });
    }

    // Senden. Erfolg zeichnet die Karte neu; bei einem Fehler bleibt das
    // Formular samt Inhalt stehen. 403 (Fenster zu) und 409 (anderswo
    // geaendert): der Stand auf dem Server ist ein anderer -- neu laden.
    // Solange eine Anfrage laeuft, zeichnet die Uhr nicht neu: die Antwort
    // ginge sonst verloren, auch ein Erfolg in der letzten Sekunde.
    let unterwegs = false;
    async function senden(pfad, daten, erfolg) {
      ausgang.innerHTML = hinweis(T("Einen Moment …", "One moment …"));
      const knoepfe = [...form.querySelectorAll("button")];
      knoepfe.forEach((b) => { b.disabled = true; });
      unterwegs = true;
      const freigeben = () => {
        unterwegs = false;
        knoepfe.forEach((b) => { b.disabled = false; });
        ausgang.innerHTML = "";
      };
      const fehlschlag = (fehlertext) => {
        freigeben();
        ausgang.innerHTML = hinweis(fehlertext, true);
        ausgang.querySelector(".partner-hinweis").focus();
      };
      try {
        const r = await post(pfad, { token: PartnerSitzung.lies(), ...daten });
        if (!karte.isConnected) return;
        if (r.status === 401) { abgelaufen(); return; }
        const d = await antwortKoerper(r);
        if (!karte.isConnected) return;
        if (r.ok) {
          if (d.passwort && typeof d.passwort === "object") passwortKarte(karte, d.passwort, email, hinweis(erfolg(d)));
          else await passwortNeuLaden(erfolg(d));
          return;
        }
        // Nur eigene Texte: ein unbekannter Code faellt auf den allgemeinen zurueck
        const eigen = (tabelle, schluessel) => (Object.prototype.hasOwnProperty.call(tabelle, schluessel) ? tabelle[schluessel] : "");
        if (r.status === 400) {
          freigeben();
          feldFehler(neu, eigen(PASSWORT_TEXT, d.fehler) || PASSWORT_TEXT.ungueltig);
          return;
        }
        if (r.status === 403 && d.fehler === "altes_passwort_falsch" && bisher) {
          freigeben();
          feldFehler(bisher, T("Das bisherige Passwort stimmt nicht.", "The current password is not correct."));
          return;
        }
        if (r.status === 403 || r.status === 409) {
          await passwortNeuLaden(r.status === 409
            ? T("Ihr Passwort wurde inzwischen an anderer Stelle geändert. Die Karte zeigt jetzt den aktuellen Stand.",
                "Your password was changed elsewhere in the meantime. The card now shows the current state.")
            : T("Die Zeit nach der Anmeldung mit Code ist abgelaufen. Die Karte zeigt jetzt, wie es weitergeht.",
                "The time after signing in with a code has run out. The card now shows how to continue."));
          return;
        }
        if (r.status === 429 && eigen(PASSWORT_GRENZE, d.grenze)) { fehlschlag(eigen(PASSWORT_GRENZE, d.grenze)); return; }
        throw new Error(String(r.status));
      } catch (err) {
        if (karte.isConnected) fehlschlag(T("Das hat gerade nicht geklappt. Bitte später erneut versuchen.", "That did not work just now. Please try again later."));
      }
    }

    alt.replaceWith(karte);
    if (meldung) karte.querySelector(".partner-hinweis").focus();
    else if (fokusDrin) karte.querySelector("h2").focus();
    if (frisch) {
      // Laeuft gerade eine Anfrage, fragt die Uhr eine Sekunde spaeter nach;
      // zeichnet deren Antwort die Karte neu, raeumt das die Uhr mit ab.
      const ablauf = () => {
        if (!karte.isConnected) return;
        if (unterwegs) passwortUhr = setTimeout(ablauf, 1000);
        else passwortKarte(karte, stand, email, "");
      };
      // Gekappt, weil setTimeout mit 32 Bit rechnet: eine unsinnig lange
      // Restzeit liefe sonst sofort ab und zeichnete die Karte endlos neu.
      passwortUhr = setTimeout(ablauf, Math.min(stand.frist - Date.now() + 1000, 2147483647));
    }
  }

  // Nach 403/409 oder einer unerwarteten Erfolgsantwort: alles neu holen wie
  // nach einer entfernten Datei, dann den Hinweis in die neue Karte.
  async function passwortNeuLaden(text) {
    await laden();
    const m = seite.querySelector(".partner-passwort .partner-meldung");
    if (!m) return;
    m.innerHTML = hinweis(text);
    m.firstElementChild.focus();
  }

  function zeige(daten) {
    const ansicht = daten.ansicht && typeof daten.ansicht === "object" ? daten.ansicht : {};
    const gruss = typeof ansicht.begruessung === "string" ? ansicht.begruessung.trim() : "";
    const felder = ansicht.daten === false ? [] : (Array.isArray(daten.felder) ? daten.felder : []);
    const vip = ansicht.vip === false ? "" : (typeof daten.vip === "string" ? daten.vip : "");
    const module = ansicht.module === false ? [] : (Array.isArray(daten.module) ? daten.module : []).filter((m) => m && typeof m.id === "string" && typeof m.name === "string");
    const dateien = ansicht.dateien === false ? [] : (Array.isArray(daten.dateien) ? daten.dateien : []).filter((d) => d && typeof d.id === "string" && typeof d.name === "string");
    const frei = new Set(Array.isArray(daten.freigaben) ? daten.freigaben : []);
    const waehlbar = vip !== "" && module.some((m) => !frei.has(m.id) && m.status !== "bald");
    // Ist alles ausgeblendet und nichts hinterlegt, sieht der Partner trotzdem eine Karte statt einer leeren Seite.
    const leer = !gruss && ansicht.daten === false && !dateien.length && !module.length && !vip;
    // Die Passwortkarte: hier nur ihr Platz, passwortKarte() zeichnet sie
    // gleich darauf hinein. Normal nach Begruessung und Daten, sonst ganz oben.
    const passwort = daten.passwort && typeof daten.passwort === "object" ? daten.passwort : null;
    const passwortPlatz = passwort ? `<section class="partner-karte partner-passwort"></section>` : "";
    seite.innerHTML =
      (passwortOben ? passwortPlatz : "") +
      (leer ? `<div class="partner-karte">
         <span class="kachel-label">${T("Angemeldet", "Signed in")}</span>
         ${daten.name ? `<h2>${esc(daten.name)}</h2>` : ""}
         <p>${T("Zurzeit ist hier nichts für Sie hinterlegt. Sobald etwas bereitliegt, erscheint es auf dieser Seite.",
                "Nothing is stored for you here at the moment. As soon as something is ready, it will appear on this page.")}</p>
       </div>` : "") +
      (gruss ? `<div class="partner-karte partner-gruss">
         <span class="kachel-label">${T("Willkommen", "Welcome")}</span>
         <p>${esc(gruss)}</p>
       </div>` : "") +
      (ansicht.daten === false ? "" : `<div class="partner-karte partner-daten">
         <span class="kachel-label">${T("Ihre Daten bei JKHD", "Your data at JKHD")}</span>
         <h2>${esc(daten.name || "")}</h2>
         <dl>${felder.map((f) => `<dt>${esc(f.label)}</dt><dd>${esc(f.wert)}</dd>`).join("")}</dl>
       </div>`) +
      (passwortOben ? "" : passwortPlatz) +
      (dateien.length ? dateienHtml(dateien) : "") +
      (module.length ? `<section class="partner-karte vip-bereich" aria-labelledby="vip-bereich-titel">
         ${KRONE}
         <span class="kachel-label">VIP</span>
         <h2 id="vip-bereich-titel">${T("Zugänge", "Access")}</h2>
         <p>${waehlbar ? T(
           "Was für Sie freigeschaltet ist — und was Sie anfordern können. Auswählen und „Auswahl anfordern\": Ihr E-Mail-Programm öffnet sich mit dem fertigen Text.",
           "What is unlocked for you — and what you can request. Select and press \"Request selection\": your e-mail program opens with the finished text."
         ) : T("Was für Sie freigeschaltet ist.", "What is unlocked for you.")}</p>
         <form class="module" novalidate>
           ${module.map((m) => modulHtml(m, frei, vip)).join("")}
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

    const dateiMeldung = seite.querySelector("[data-dateien-meldung]");
    seite.querySelectorAll("[data-datei]").forEach((k) => {
      const datei = dateien.find((d) => d.id === k.dataset.datei);
      if (datei) k.addEventListener("click", () => herunterladen(k, datei, dateiMeldung));
    });

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

    if (passwort) passwortKarte(seite.querySelector(".partner-passwort"), passwort, typeof daten.email === "string" ? daten.email : "", "");
    // Einmal nach „Passwort vergessen?": Fokus auf die Karte, dann den Anker
    // weg -- neu geladen zeigt die Seite wieder die gewohnte Reihenfolge.
    if (window.location.hash === "#neues-passwort") {
      const kopf = seite.querySelector("#passwort-titel");
      if (kopf) kopf.focus();
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  async function abmelden() {
    if (VORSCHAU) return;   // in der Vorschau gibt es keine Sitzung
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
        abgelaufen();
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

  if (VORSCHAU) {
    // Nur Daten aus dem eigenen Fenster (der Partner-App) -- nie von einer fremden Herkunft.
    seite.innerHTML = hinweis(T("Vorschau wird geladen …", "Loading preview …"));
    window.addEventListener("message", (ev) => {
      if (ev.origin !== window.location.origin || !ev.data || ev.data.typ !== "jkhd-vorschau") return;
      zeige(ev.data.daten || {});
    });
    if (window.parent !== window) window.parent.postMessage({ typ: "jkhd-vorschau-bereit" }, window.location.origin);
    return;
  }
  laden();
  // Aus dem Zurueck-Cache: die Sitzung neu pruefen, die Adresse ist dann wieder verdeckt
  window.addEventListener("pageshow", (e) => { if (e.persisted) laden(); });
})();

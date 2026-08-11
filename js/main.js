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

  const euro = new Intl.NumberFormat(T("de-DE", "en-GB"), {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  const preisVon = (row) => Number(row.dataset.preis || 0);
  const kernAnzahl = rows.filter((r) => r.dataset.kern === "ja").length;

  // Preisspalte einmalig aus den Daten füllen. Zeilen mit data-text zeigen
  // diesen Text statt eines Betrages — sie zaehlen mit 0 in die Summe.
  rows.forEach((row) => {
    const zelle = row.querySelector(".config-price");
    if (!zelle) return;
    if (row.dataset.text) {
      zelle.textContent = row.dataset.text;
      zelle.classList.add("is-text");
    } else {
      zelle.textContent = euro.format(preisVon(row));
    }
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
        ? T("Noch nichts ausgewählt", "Nothing selected yet")
        : T(
            gewaehlt + " von " + rows.length + " Bausteinen gewählt",
            gewaehlt + " of " + rows.length + " components selected"
          );
    if (hintEl) hintEl.hidden = kern < kernAnzahl;

    // Auswahl an das Anfrageformular weiterreichen: Name~Betrag je Baustein.
    // Wohin der Knopf zeigt, steht im HTML (kontakt.html bzw. contact.html) —
    // hier wird nur die Auswahl angehaengt.
    const anfrage = config.querySelector(".config-total-side a[href]");
    if (anfrage) {
      const ziel = (anfrage.getAttribute("href") || "").split("?")[0].split("#")[0];
      const gewaehlteZeilen = rows.filter((r) => r.querySelector("input").checked);
      const teile = gewaehlteZeilen.map(
        (r) => r.querySelector(".config-name").textContent.trim() + "~" + preisVon(r)
      );
      anfrage.setAttribute(
        "href",
        teile.length
          ? ziel + "?bausteine=" + encodeURIComponent(teile.join("|")) + "#anfrage"
          : ziel + "#anfrage"
      );
    }
  }

  rows.forEach((row) => {
    row.querySelector("input").addEventListener("change", aktualisieren);
  });

  aktualisieren();
})();
// ---------- Scroll-Reveal: Inhalte gleiten beim Scrollen herein ----------
// Die Ziel-Elemente werden hier markiert, das CSS (.reveal/.in) macht den Rest.
(function () {
  const targets = document.querySelectorAll(
    ".section-head, .page-head, .offer, .block-head, .kind, .layer, .config, .exclusive, .rail, .guard, .step-row, .creed-cell, .creed-close, .founder-card, .cta-panel, .contact-box, .prose, .console"
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

// ---------- Assistent: haeufige Fragen, sonst an den Menschen ----------
// Bewusst ohne Sprachmodell: kein API-Schluessel im Browser, keine laufenden
// Kosten, keine Datenuebertragung — und keine Maschine, die Preise oder
// Zusagen erfindet. Die Antworten stehen hier, sonst nirgends.
(function () {
  if (document.querySelector(".helper")) return;

  const FRAGEN_EN = [
    {
      f: "What does a system cost?",
      a: "Individual components range from €1,800 to €9,500; a full system covering all six stages comes to roughly €29,300. Advisory and system audit are €25,000. These are orders of magnitude, not an offer — the configurator lets you put your own selection together.",
      link: { text: "Go to the configurator", href: "index.html#preise" },
    },
    {
      f: "Do you also build systems that do not trade?",
      a: "Yes, and that is often the case. We build pure observation systems (they watch and report) and pure analysis systems (they compute and evaluate) — both without any market access at all. Only the execution stage trades.",
      link: { text: "See the types of system", href: "index.html#leistungen" },
    },
    {
      f: "How does working together proceed?",
      a: "Usually in three stages: advisory and audit — an advisor speaks with you directly and records your specific requirements. Then implementation. Finally acceptance and handover. You can also license individual modules only, if you already have something in place.",
      link: { text: "How a system is built", href: "system.html" },
    },
    {
      f: "Does the system belong to me alone afterwards?",
      a: "Yes. What we build for you belongs to you entirely. We keep no copy, no parameter and no derivative of it — no resale, no second edition for anyone else.",
    },
    {
      f: "Can I test the system beforehand?",
      a: "Yes, two months of trial operation are provided for; after that you may decline. We settle the exact terms with you in advance — please ask about them before you decide.",
    },
    {
      f: "Who do you work for?",
      a: "For banks, funds and professional institutions. No retail product and no copy-trading bots — we take on private individuals only in exceptional cases and by arrangement.",
    },
    {
      f: "Are you currently accepting orders?",
      a: "Not at present. This website is still being built; we will accept orders once it is finished. You are welcome to enquire at any time — we will come back to you as soon as commissioning is possible.",
    },
    {
      f: "Do you trade my money for me?",
      a: "No. We develop and deliver software. No investment advice, no investment brokerage, no portfolio management — we do not manage third-party assets and make no investment decisions for others. Operation is the client’s responsibility.",
    },
  ];

  const FRAGEN_DE = [
    {
      f: "Was kostet ein System?",
      a: "Die einzelnen Bausteine liegen zwischen 1.800 \u20ac und 9.500 \u20ac, ein Vollsystem aus allen sechs Stufen bei rund 29.300 \u20ac. Beratung und System-Audit kosten 25.000 \u20ac. Das sind Gr\u00f6\u00dfenordnungen, kein Angebot \u2014 im Konfigurator k\u00f6nnen Sie sich Ihre Auswahl zusammenstellen.",
      link: { text: "Zum Konfigurator", href: "index.html#preise" },
    },
    {
      f: "Baut ihr auch Systeme, die nicht handeln?",
      a: "Ja, und das ist h\u00e4ufig der Fall. Wir bauen reine Beobachtungssysteme (\u00fcberwachen und melden) und reine Analysesysteme (rechnen und bewerten) \u2014 beide ohne jeden Marktzugriff. Erst die Ausf\u00fchrungsstufe handelt.",
      link: { text: "Systemarten ansehen", href: "index.html#leistungen" },
    },
    {
      f: "Wie l\u00e4uft eine Zusammenarbeit ab?",
      a: "In der Regel dreistufig: Beratung und Audit \u2014 dabei spricht ein Berater direkt mit Ihnen und nimmt Ihre Sonderw\u00fcnsche auf. Dann die Umsetzung. Zuletzt Abnahme und \u00dcbergabe. Sie k\u00f6nnen auch nur einzelne Module lizenzieren, wenn bei Ihnen schon etwas steht.",
      link: { text: "Aufbau eines Systems", href: "system.html" },
    },
    {
      f: "Geh\u00f6rt mir das System danach allein?",
      a: "Ja. Was wir f\u00fcr Sie bauen, geh\u00f6rt Ihnen vollst\u00e4ndig. Wir behalten keine Kopie, keinen Parameter und keine Ableitung davon zur\u00fcck \u2014 kein Weiterverkauf, keine zweite Ausfertigung f\u00fcr jemand anderen.",
    },
    {
      f: "Kann ich das System vorher testen?",
      a: "Ja, zwei Monate Testbetrieb sind vorgesehen; danach k\u00f6nnen Sie ablehnen. Die genauen Bedingungen kl\u00e4ren wir vorab im Gespr\u00e4ch \u2014 fragen Sie danach, bevor Sie sich entscheiden.",
    },
    {
      f: "F\u00fcr wen arbeitet ihr?",
      a: "F\u00fcr Banken, Fonds und professionelle Adressen. Kein Retail-Produkt und keine Copy-Trading-Bots \u2014 Privatpersonen nehmen wir nur in Ausnahmen und nach Absprache.",
    },
    {
      f: "Nehmt ihr gerade Auftr\u00e4ge an?",
      a: "Aktuell nicht. Diese Website ist im Aufbau; Auftr\u00e4ge nehmen wir erst an, wenn sie fertig ist. Anfragen k\u00f6nnen Sie jederzeit stellen \u2014 wir melden uns, sobald eine Beauftragung m\u00f6glich ist.",
    },
    {
      f: "Handelt ihr mein Geld f\u00fcr mich?",
      a: "Nein. Wir entwickeln und liefern Software. Keine Anlageberatung, keine Anlagevermittlung, keine Finanzportfolioverwaltung \u2014 wir verwalten kein fremdes Verm\u00f6gen und treffen keine Anlageentscheidungen f\u00fcr Dritte. Den Betrieb verantwortet der Auftraggeber.",
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

// ---------- Anfrage-Formular: baut eine E-Mail, verschickt selbst nichts ----------
// Kein Server, kein Dienstleister: Die Eingaben bleiben im Browser und landen
// im E-Mail-Programm des Besuchers. Abgeschickt wird dort, von ihm.
(function () {
  const form = document.getElementById("inquiry");
  if (!form) return;

  const hint = document.getElementById("iq-hint");
  const kopieren = document.getElementById("iq-copy");

  const ZIEL = {
    kontakt: { mail: "kontakt@jkhd.de", betreff: T("Anfrage", "Enquiry") },
    service: { mail: "service@jkhd.de", betreff: T("Support", "Support") },
    info: { mail: "info@jkhd.de", betreff: T("Anliegen", "General") },
  };

  const wert = (id) => (document.getElementById(id).value || "").trim();

  function melden(text, fehler) {
    hint.textContent = text;
    hint.classList.toggle("is-error", Boolean(fehler));
  }

  const euro = new Intl.NumberFormat(T("de-DE", "en-GB"), {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  // Bausteine aus dem Konfigurator uebernehmen: je Eintrag "Name~Betrag"
  function ausKonfigurator() {
    const p = new URLSearchParams(location.search).get("bausteine");
    if (!p) return [];
    return p
      .split("|")
      .filter(Boolean)
      .map((eintrag) => {
        const [name, betrag] = eintrag.split("~");
        return { name: (name || "").trim(), preis: Number(betrag) || 0 };
      })
      .filter((b) => b.name);
  }

  const summeVon = (liste) => liste.reduce((s, b) => s + b.preis, 0);

  function nachricht() {
    const haus = wert("iq-haus");
    const name = wert("iq-name");
    const mail = wert("iq-mail");
    const text = wert("iq-text");
    const bausteine = ausKonfigurator();

    const zeilen = [];
    if (haus) zeilen.push(T("Institution: ", "Institution: ") + haus);
    if (name) zeilen.push(T("Ansprechpartner: ", "Contact: ") + name);
    if (mail) zeilen.push("E-Mail: " + mail);
    if (zeilen.length) zeilen.push("");

    if (bausteine.length) {
      zeilen.push(T("Zusammenstellung aus dem Konfigurator:", "Selection from the configurator:"));
      bausteine.forEach((b) => {
        zeilen.push(
          "  - " +
            b.name +
            ": " +
            (b.preis > 0 ? euro.format(b.preis) : T("im Projekt enthalten", "included in the project"))
        );
      });
      zeilen.push(
        T("  Ungefähre Summe: ", "  Approximate total: ") +
          euro.format(summeVon(bausteine)) +
          T(" (unverbindlich)", " (non-binding)")
      );
      zeilen.push("");
    }

    if (text) zeilen.push(text, "");
    zeilen.push(
      "—",
      T(
        "Vorbereitet über das Anfrageformular auf www.jkhd.de",
        "Prepared with the enquiry form on www.jkhd.de"
      )
    );
    return zeilen.join("\n");
  }

  function betreff() {
    const thema = ZIEL[document.getElementById("iq-thema").value] || ZIEL.kontakt;
    const haus = wert("iq-haus");
    return thema.betreff + T(" über jkhd.de", " via jkhd.de") + (haus ? " — " + haus : "");
  }

  function ziel() {
    return (ZIEL[document.getElementById("iq-thema").value] || ZIEL.kontakt).mail;
  }

  function vollstaendig() {
    if (!wert("iq-text")) {
      melden(
        T("Bitte beschreiben Sie kurz Ihr Anliegen.", "Please describe your enquiry briefly."),
        true
      );
      document.getElementById("iq-text").focus();
      return false;
    }
    return true;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!vollstaendig()) return;
    const url =
      "mailto:" + ziel() +
      "?subject=" + encodeURIComponent(betreff()) +
      "&body=" + encodeURIComponent(nachricht());
    melden(T("E-Mail-Programm wird geöffnet …", "Opening your e-mail program …"));
    window.location.href = url;
    // Falls kein Mail-Programm eingerichtet ist, passiert sichtbar nichts —
    // deshalb nach kurzer Zeit auf den Kopier-Weg hinweisen.
    setTimeout(() => {
      melden(
        T(
          "Nichts passiert? Nutzen Sie „Text kopieren“ und schreiben Sie an " + ziel() + ".",
          "Nothing happened? Use “Copy text” and write to " + ziel() + "."
        )
      );
    }, 2500);
  });

  kopieren.addEventListener("click", async () => {
    if (!vollstaendig()) return;
    const text =
      T("An: ", "To: ") + ziel() +
      T("\nBetreff: ", "\nSubject: ") + betreff() +
      "\n\n" + nachricht();
    try {
      await navigator.clipboard.writeText(text);
      melden(
        T("Kopiert — jetzt in Ihr E-Mail-Programm einfügen.", "Copied — now paste it into your e-mail program.")
      );
    } catch (err) {
      melden(
        T(
          "Kopieren nicht möglich. Bitte an " + ziel() + " schreiben.",
          "Copying failed. Please write to " + ziel() + "."
        ),
        true
      );
    }
  });

  // Kommt der Besucher aus dem Konfigurator, seine Auswahl sichtbar anzeigen —
  // er soll sehen, was mitgeschickt wird, bevor er absendet.
  (function auswahlZeigen() {
    const bausteine = ausKonfigurator();
    if (!bausteine.length) return;

    const kasten = document.createElement("div");
    kasten.className = "inquiry-picked";
    kasten.innerHTML =
      '<span class="inquiry-picked-label">' +
      T("Aus dem Konfigurator übernommen", "Taken from the configurator") +
      "</span>" +
      "<ul>" +
      bausteine
        .map(
          (b) =>
            "<li><span>" + b.name + "</span><span>" +
            (b.preis > 0 ? euro.format(b.preis) : T("enthalten", "included")) +
            "</span></li>"
        )
        .join("") +
      "</ul>" +
      '<p class="inquiry-picked-sum"><span>' +
      T("Ungefähre Summe", "Approximate total") +
      "</span><span>" +
      euro.format(summeVon(bausteine)) +
      "</span></p>" +
      '<p class="inquiry-picked-note">' +
      T(
        "Diese Aufstellung geht mit Ihrer Nachricht mit. Unverbindlich — kein Angebot.",
        "This breakdown is sent along with your message. Non-binding — not an offer."
      ) +
      "</p>";

    form.insertBefore(kasten, form.firstElementChild);
  })();
})();

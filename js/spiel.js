/* JKHD -- Oberflaeche fuer "Sie gegen den JKHD-Algo" (simulation.html, en/simulation.html) */

// Diese Datei zeichnet das Spiel und nimmt die Eingaben an. Die Regeln selbst
// (Markt, Konten, Ausfuehrung, ruhende Orders, der Algo) stehen allein in
// js/spiel-motor.js (window.JKHDSpiel); hier wird nichts davon nachgebaut.
// Auch das Ergebnis an einer SL- oder TP-Linie rechnet der Motor
// (spiel.ergebnisBei), damit Beschriftung und Ausfuehrung nie auseinanderlaufen.
//
// Zusagen wie auf der ganzen Website: kein Speicher (kein Cookie, kein
// localStorage, sessionStorage oder IndexedDB), kein Netz, nichts von fremden
// Servern. Ein Spiel lebt nur, solange die Seite offen ist.
//
// Aufbau
// - Takt: feste Schrittweite (REGELN.TAKT_MS, bei Tempo 2x doppelt so oft)
//   ueber requestAnimationFrame mit Zeitspeicher. Haengt der Browser laenger
//   als NACHHOLEN_MS, geht die Zeit verloren, statt den Markt springen zu
//   lassen. Ist der Tab unsichtbar, pausiert das Spiel.
// - Anzeige: nach jedem Takt und jeder eigenen Order einmal zustand() lesen,
//   Tafeln und Knoepfe nachfuehren (nur geaenderte Texte schreiben) und den
//   Chart neu zeichnen. Kerzen, Markierungen und Protokoll sind begrenzt;
//   Trades derselben Kerze, Seite und Person werden eine Markierung, das
//   Aufstocken des Algos ein Protokolleintrag.
// - Tasten wirken nur, solange das Spiel den Fokus hat (WCAG 2.1.4, Kuerzel
//   aus einzelnen Zeichen nur bei Fokus): Wer in der Fragen-Blase oder sonst
//   auf der Seite tippt, handelt nie -- auch nicht in den Feldern fuer SL und
//   TP im Spiel. Die Knoepfe sind nie "disabled" (das wuerfe den Fokus aus
//   dem Spiel), sondern aria-disabled.
// - SL und TP im Chart (Pointer Events: Maus, Stift, Finger): Die
//   Einstandslinie und gesetzte SL-/TP-Linien lassen sich greifen, wenn der
//   Zeiger auf ihnen beginnt -- mit dem Finger erst, nachdem die Linie
//   angetippt ist. Nur dann wird fuer diese Beruehrung das Scrollen der Seite
//   unterdrueckt (touchstart ohne passive); sonst bleibt die Seite auf dem
//   Handy scrollbar. Waehrend des Ziehens laeuft das Spiel weiter, die Linie
//   folgt dem Zeiger, und die Skala schrumpft nicht (sie waechst nur mit dem
//   Kurs oder, solange der Zeiger jenseits des Rands haelt, in diese
//   Richtung). Erst beim Loslassen geht die Marke an den Motor (spiel.schutz);
//   Escape bricht ab. Dasselbe geht ohne Ziehen mit den Feldern unter dem
//   Chart.
// - Pause: Der Markt steht. Nach "Weiter" sind Kaufen, Verkaufen und
//   Glattstellen kurz gesperrt (OBERFLAECHE.SPERRE_NACH_PAUSE).
// - Zahlen im Seitentext (Attribut data-sp-zahl) kommen aus REGELN und ALGO
//   des Motors und aus OBERFLAECHE unten, damit Regeltext und Spiel nie
//   auseinanderlaufen (pruefung.js im Ordner JKHD-Spiel vergleicht sie).

(function () {
  "use strict";

  const S = window.JKHDSpiel;
  const wurzel = document.getElementById("spiel");
  if (!S || !wurzel) return;

  const R = S.REGELN;
  const A = S.ALGO;

  // Wie in js/main.js: das lang-Attribut der Seite entscheidet
  const IST_EN = document.documentElement.lang === "en";
  const T = (de, en) => (IST_EN ? en : de);

  // ---------- Feste Werte der Oberflaeche ----------
  // Diese stehen auch im Regeltext (data-sp-zahl="SPIEL.x").
  // SPERRE_NACH_PAUSE: In der Pause laesst sich der eingefrorene Chart in
  // Ruhe studieren. Ginge die Order gleich nach "Weiter" hinaus, handelte man
  // zu genau dem Kurs, den man studiert hat -- ohne die Reaktionszeit, mit der
  // die Balance rechnet (4 bis 6 Takte, Ordner JKHD-Spiel). Deshalb sind
  // Kaufen, Verkaufen und Glattstellen nach "Weiter" so viele Takte gesperrt,
  // bei Tempo 2x doppelt so viele (also immer anderthalb Sekunden). Ruhende
  // SL/TP bleiben frei: Sie fuellen nur zu kuenftigen Kursen.
  // Julian, 05.10.2026: 1,5 s statt 1 s. Mit 1 s gewann ein in der Pause
  // planender Spieler, der genau mit dem Ende der Sperre handelt, auf den
  // Abnahme-Saaten 50,2 / 50,8 % (Grenze 50 %), mit 1,5 s 43,0 % (JKHD-Spiel,
  // README). Der Pausen-Spieler der Messung (stellvertreter.js, PAUSE) muss
  // diesen Wert tragen -- pruefung.js vergleicht beide.
  const OBERFLAECHE = Object.freeze({
    SCHUTZ_SCHRITT: 1,         // Dollar je Unze je Druck auf - / + oder Pfeiltaste im Feld
    SCHUTZ_SCHRITT_GROSS: 10,  // mit Umschalt oder Bild auf / Bild ab
    SPERRE_NACH_PAUSE: 6       // Takte bei Tempo 1x: nach "Weiter" kein Kauf, Verkauf, Glattstellen
  });
  const NACHHOLEN_MS = 1000;           // laengere Aussetzer holt der Takt nicht nach
  // Bestenliste der schnellsten Siege (Julian, 10.10.2026): liegt auf unserem
  // Server (api.jkhd.de, der Partner-Server). Drei Aufrufe, alle POST: die
  // Liste beim Oeffnen der Seite, eine Spielmarke beim Start (belegt dem
  // Server, dass ein Spiel lief und wie lange es hoechstens dauern konnte) und
  // der Eintrag nach einem Sieg mit Spitzname, Spielzeit, Spielnummer und
  // Tempo. Faellt der Server aus, fehlt nur die Liste; das Spiel laeuft wie
  // immer, und ausser diesen drei Aufrufen geht nichts hinaus.
  const BESTEN_API = "https://api.jkhd.de/index.php?aktion=";
  const BESTEN_PLAETZE = 10;
  const PROTOKOLL_MAX = 8;             // Eintraege im Protokoll des Algos
  const ANSAGEN_MAX = 3;               // Zeilen im Vorlesebereich
  const NACHRICHT_NACHLAUF = 20;       // Takte, die eine eingetretene Nachricht im Band bleibt
  const ZEITRASTER_SEKUNDEN = 30;      // senkrechte Hilfslinien im Chart
  const KERZE_ABSTAND_MIN = 6;         // Pixel je Kerze: schmaler wird hohl/gefuellt unlesbar
  const KERZE_ABSTAND_MAX = 10;
  const KERZEN_ZIEL = 110;             // so viele Kerzen passen, wenn Platz ist
  const KERZE_KOERPER_ANTEIL = 0.62;   // Breite des Kerzenkoerpers am Kerzenabstand
  const MINDEST_SPANNE_ANTEIL = 0.004; // kleinster Kursbereich im Chart, relativ zum Kurs
  const KURS_POLSTER_ANTEIL = 0.08;    // Luft ueber und unter dem Kursbereich
  // Linien greifen: so viele Pixel um eine Linie zaehlen als Treffer, und erst
  // ab so vielen Pixeln Bewegung wird aus Tippen ein Ziehen (je Zeigerart)
  const TREFFER = { mouse: 8, pen: 12, touch: 20 };
  const ZIEH_SCHWELLE = { mouse: 3, pen: 5, touch: 8 };
  // Haelt der Zeiger beim Ziehen ueber dem oberen oder unter dem unteren Rand
  // des Charts, waechst der Kursbereich in diese Richtung, gleichmaessig: je
  // Sekunde um diesen Anteil des Bereichs beim Greifen, bei RAND_VOLL Pixeln
  // (oder mehr) jenseits des Rands, darunter anteilig. So laesst sich eine
  // Linie weit ueber den sichtbaren Kurs hinaus ziehen, ohne loszulassen --
  // etwa ein TP ueber einem neuen Hoch.
  const RAND_WACHSTUM = 1;
  const RAND_VOLL = 60;
  const ETIKETT_HOEHE = { fein: 18, grob: 22 };   // Etiketten an den Linien; grob = Fingerbedienung
  const KREUZ_BREITE = { fein: 18, grob: 26 };    // das x zum Entfernen am Etikett

  // ---------- Zahlen und Texte ----------
  const SPRACHE = IST_EN ? "en-GB" : "de-DE";
  const FORMAT_GANZ = new Intl.NumberFormat(SPRACHE, { maximumFractionDigits: 0 });
  const FORMAT_CENT = new Intl.NumberFormat(SPRACHE, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const FORMAT_ZAHL = new Intl.NumberFormat(SPRACHE, { maximumFractionDigits: 2 });
  const FORMAT_EINE = new Intl.NumberFormat(SPRACHE, { maximumFractionDigits: 1 });
  // In den Eingabefeldern ohne Tausenderpunkt, damit sich der Preis leicht aendern laesst
  const FORMAT_EINGABE = new Intl.NumberFormat(SPRACHE, { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false });
  // Kurzform fuer die Skala unter dem Balken. Englisch mit en-US: en-GB schreibt
  // je nach Browser "1m" statt "1M", und das liest sich wie eine Einheit.
  const FORMAT_KOMPAKT = new Intl.NumberFormat(IST_EN ? "en-US" : "de-DE", { notation: "compact" });
  const MINUS = "\u2212";
  const STRICH = "\u2014";
  const PUNKT = " \u00b7 ";

  // Waehrung wie im Seitentext: "100.000 $" bzw. "$100,000"
  const mitDollar = (text) => (IST_EN ? "$" + text : text + "\u00a0$");

  // Ganze Dollar; Minus vorn, bei null kein Vorzeichen
  function betrag(wert) {
    const ganz = Math.round(wert);
    const text = mitDollar(FORMAT_GANZ.format(Math.abs(ganz)));
    return ganz < 0 ? MINUS + text : text;
  }

  // Wie betrag, aber Gewinne mit Plus (Ergebnis, offener G/V)
  function ergebnis(wert) {
    const ganz = Math.round(wert);
    const text = mitDollar(FORMAT_GANZ.format(Math.abs(ganz)));
    return ganz > 0 ? "+" + text : ganz < 0 ? MINUS + text : text;
  }

  const kurs = (wert) => mitDollar(FORMAT_CENT.format(wert));
  const zahl = (wert) => FORMAT_ZAHL.format(wert);
  const prozentZeichen = (text) => text + (IST_EN ? "%" : "\u00a0%");
  const prozent = (anteil) => prozentZeichen(FORMAT_ZAHL.format(anteil * 100));
  const sekundenAusTakten = (takte) => (takte * R.TAKT_MS) / 1000;
  const aufCent = (wert) => Math.round(wert * 100) / 100;

  // Kurssprung einer Nachricht (kommt schon in Prozent, mit Vorzeichen)
  function sprungText(sprung) {
    const text = prozentZeichen(FORMAT_ZAHL.format(Math.abs(sprung)));
    return sprung > 0 ? "+" + text : sprung < 0 ? MINUS + text : text;
  }

  function uhr(sekunden) {
    const ganz = Math.floor(sekunden);
    const rest = ganz % 60;
    return Math.floor(ganz / 60) + ":" + (rest < 10 ? "0" : "") + rest;
  }

  const kontrakte = (n) =>
    FORMAT_GANZ.format(n) + " " + (n === 1 ? T("Kontrakt", "contract") : T("Kontrakte", "contracts"));

  function positionText(position) {
    if (position > 0) return "Long " + FORMAT_GANZ.format(position);
    if (position < 0) return "Short " + FORMAT_GANZ.format(-position);
    return T("keine", "none");
  }

  const THEMEN = {
    notenbank: T("Notenbank-Entscheid", "Central bank decision"),
    arbeitsmarkt: T("Arbeitsmarktdaten", "Jobs report"),
    inflation: T("Inflationsdaten", "Inflation data")
  };
  const themaText = (thema) => THEMEN[thema] || thema;

  // "SL" und "TP" heissen in beiden Sprachen so
  const typName = (typ) => (typ === "sl" ? "SL" : "TP");

  // Preis aus einem Eingabefeld: "2034,50", "2.034,50", "2034.50" oder
  // "2,034.50", auch mit $. Leer: null; nicht lesbar: NaN. Ein einzelner
  // Trenner vor genau drei Ziffern gilt als Tausenderpunkt, wenn er in der
  // Sprache der Seite einer ist ("2.034" deutsch, "2,034" englisch).
  function preisLesen(text) {
    let t = String(text).replace(/[\s$\u00a0]/g, "");
    if (t === "") return null;
    const komma = t.lastIndexOf(",");
    const punkt = t.lastIndexOf(".");
    if (komma >= 0 && punkt >= 0) {
      const dezimal = komma > punkt ? "," : ".";
      t = t.split(dezimal === "," ? "." : ",").join("").replace(dezimal, ".");
    } else if (komma >= 0 || punkt >= 0) {
      const zeichen = komma >= 0 ? "," : ".";
      const teile = t.split(zeichen);
      if (zeichen === (IST_EN ? "," : ".") && teile.slice(1).every((s) => s.length === 3)) t = teile.join("");
      else if (teile.length === 2) t = teile.join(".");
      else return NaN;
    }
    if (!/^\d+(\.\d+)?$/.test(t)) return NaN;
    return aufCent(Number(t));
  }

  // ---------- Regelzahlen im Seitentext ----------
  // <span data-sp-zahl="REGELN.START_KAPITAL" data-sp-art="betrag">100.000 $</span>
  // Im HTML steht derselbe Wert fuer Besucher ohne JavaScript.
  const QUELLEN = { REGELN: R, ALGO: A, SPIEL: OBERFLAECHE };
  const ARTEN = {
    betrag,
    kurs,
    zahl,
    prozent,
    sekunden: (takte) => zahl(sekundenAusTakten(takte)),
    millisekunden: (ms) => zahl(ms / 1000),
    kompakt: (wert) => FORMAT_KOMPAKT.format(wert),
    // Ordnungszahl: deutsch "1.", englisch "1st" (die Regeln sagen "bis zur 1. Beruehrung")
    ordnungszahl: (wert) => {
      if (!IST_EN) return zahl(wert) + ".";
      const n = Math.round(wert), rest = n % 100;
      const endung = rest >= 11 && rest <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] || "th";
      return n + endung;
    }
  };
  document.querySelectorAll("[data-sp-zahl]").forEach((stelle) => {
    const [quelle, name] = stelle.dataset.spZahl.split(".");
    const art = ARTEN[stelle.dataset.spArt];
    const wert = QUELLEN[quelle] ? QUELLEN[quelle][name] : undefined;
    if (!art || typeof wert !== "number") return;
    // data-sp-wort="Bewegung|Bewegungen": das Hauptwort steht im Span, Einzahl bei 1
    const wort = stelle.dataset.spWort;
    if (wort) {
      const [einzahl, mehrzahl] = wort.split("|");
      stelle.textContent = art(wert) + " " + (wert === 1 ? einzahl : mehrzahl);
    } else stelle.textContent = art(wert);
  });

  // ---------- Teile der Seite ----------
  const teil = (name) => wurzel.querySelector('[data-sp="' + name + '"]');

  const koerper = teil("koerper");
  const schichtStart = teil("start");
  const schichtEnde = teil("ende");
  const leinwand = teil("chart");
  const chartRahmen = leinwand.parentElement;
  const kontext = leinwand.getContext("2d");
  const anzeigeZeit = teil("zeit");
  const nachrichtBand = teil("nachricht");
  const pausiertMarke = teil("pausiert");
  const meldungZeile = teil("meldung");
  const protokollListe = teil("protokoll");
  const protokollLeer = teil("protokoll-leer");
  const algoJetzt = teil("status-algo");
  const ansage = teil("ansage");
  const knopfPause = wurzel.querySelector('[data-sp-aktion="pause"]');
  const knopfNeu = wurzel.querySelector('[data-sp-aktion="neu"]');
  const knopfEinstand = wurzel.querySelector('[data-sp-aktion="sl-einstand"]');
  const endeUeberschrift = teil("ende-titel");
  const endeKarte = schichtEnde.querySelector(".sp-schicht-inhalt");
  const bestenForm = teil("besten-form");
  const bestenHinweis = teil("besten-hinweis");
  const bestenMeldung = teil("besten-meldung");
  const bestenFeld = bestenForm ? bestenForm.querySelector("input") : null;
  const bestenKnopf = bestenForm ? bestenForm.querySelector("button") : null;
  const bestenAbschnitt = document.querySelector('[data-sp="besten"]');
  const bestenOl = document.querySelector('[data-sp="besten-liste"]');
  const bestenLeer = document.querySelector('[data-sp="besten-leer"]');
  const bestenStatistik = document.querySelector('[data-sp="besten-statistik"]');
  const tempoKnoepfe = wurzel.querySelectorAll("[data-sp-tempo]");
  const mengenKnoepfe = wurzel.querySelectorAll("[data-sp-menge]");
  const orderKnoepfe = {
    kauf: wurzel.querySelector('[data-sp-order="kauf"]'),
    verkauf: wurzel.querySelector('[data-sp-order="verkauf"]'),
    glatt: wurzel.querySelector('[data-sp-order="glatt"]')
  };
  const orderTexte = {
    kauf: { menge: teil("menge-kauf"), preis: teil("preis-kauf"), max: teil("max-kauf") },
    verkauf: { menge: teil("menge-verkauf"), preis: teil("preis-verkauf"), max: teil("max-verkauf") }
  };
  const glattPosition = teil("glatt-position");
  const kurse = { geld: teil("geld"), brief: teil("brief"), spanne: teil("spanne") };

  function tafelTeile(wer) {
    return {
      kapital: teil("kapital-" + wer),
      weg: teil("weg-" + wer),
      fuellung: teil("fuellung-" + wer),
      position: teil("position-" + wer),
      einstand: teil("einstand-" + wer),
      offen: teil("offen-" + wer),
      sl: teil("sl-" + wer),
      tp: teil("tp-" + wer),
      trades: teil("trades-" + wer),
      fuehrt: teil("fuehrt-" + wer)
    };
  }
  const tafeln = { du: tafelTeile("du"), algo: tafelTeile("algo") };

  // Die Felder fuer SL und TP unter dem Chart. gesetzt: die Marke, die das
  // Feld zuletzt vom Motor uebernommen hat; aendert sie sich (gesetzt,
  // verschoben, entfernt, ausgeloest, verfallen), zeigt das Feld sie neu.
  function schutzZeile(typ) {
    const zeile = wurzel.querySelector('[data-sp-schutz="' + typ + '"]');
    return {
      typ,
      eingabe: zeile.querySelector("input"),
      info: teil("info-" + typ),
      schritte: zeile.querySelectorAll("[data-sp-schritt]"),
      aktionen: zeile.querySelectorAll("[data-sp-schutz-aktion]"),
      gesetzt: null
    };
  }
  const schutzZeilen = { sl: schutzZeile("sl"), tp: schutzZeile("tp") };

  function setzeText(element, text) {
    if (element.textContent !== text) element.textContent = text;
  }
  function setzeAttribut(element, name, wert) {
    if (element.getAttribute(name) !== wert) element.setAttribute(name, wert);
  }

  // Der Balken unter dem Kapital: logarithmisch von der Pleitegrenze (0) bis
  // zum Ziel (1), damit jede Verdopplung gleich lang ist.
  function wegAnteil(kapital) {
    if (kapital <= R.PLEITE_GRENZE) return 0;
    const anteil = Math.log(kapital / R.PLEITE_GRENZE) / Math.log(R.ZIEL_KAPITAL / R.PLEITE_GRENZE);
    return Math.min(1, anteil);
  }

  // ---------- Zustand der Oberflaeche ----------
  let spiel = null;
  let bestenListe = null;        // die Liste vom Server (null: nicht geladen)
  let marke = null;              // Spielmarke des laufenden Spiels
  let markeSpiel = null;         // ... und fuer welches Spiel sie geholt wurde
  let tempoMax = 1;              // hoechstes Tempo in diesem Spiel
  let bestenOffen = null;        // Sieg, der eingetragen werden kann
  let partienBeendet = 0;        // zu Ende gespielte Partien seit dem Oeffnen der Seite
  let ersterSiegGemeldet = false; // die Zahl der Anlaeufe geht nur mit dem ersten Sieg
  let modus = "start";           // "start" | "laeuft" | "pause" | "ende"
  let tempo = 1;
  // Voreingestellt ist "max": Mit einer kleinen festen Menge je Order kommt
  // niemand in die Naehe des Ziels (Messung im Ordner JKHD-Spiel, README).
  let menge = "max";             // Kontrakte oder "max"
  let neuGefragt = false;        // "Neues Spiel" mitten im Spiel wartet auf Bestaetigung
  let handelFrei = 0;            // Takt, ab dem nach "Weiter" wieder gehandelt wird
  let rafKennung = 0;
  let letzteZeit = null;
  let zeitspeicher = 0;
  let zustand = null;            // letzte Sicht aus spiel.zustand()
  let markierungen = [];         // Trades: { takt, kerze, preis, kauf, wer, menge } -- nur, was noch im Chart steht
  let ausloesungen = [];         // ausgeloeste SL/TP: { takt, preis (Marke), typ, wer }
  let nachrichtMarken = [];      // Takte, an denen eine Nachricht eintrat
  let letzteNachricht = null;    // { thema, sprung, takt }
  let nachkaufGruppe = null;     // oberster Protokolleintrag, wenn er Nachkaeufe zusammenfasst
  let endeTitel = "";
  // Linien im Chart
  let auswahl = null;            // angetippte Linie: "einstand" | "sl" | "tp" | null
  let schwebt = null;            // Linie unter dem Mauszeiger (nur Hervorhebung)
  let ziehen = null;             // { art: "linie" | "entfernen", quelle, zeiger, schwelle, startY, y, bewegt, bereich, zuletzt }
  let antippen = null;           // Beruehrung, die erst beim Loslassen ohne Bewegung zaehlt: { zeiger, x, y, schwelle, was: "waehlen" | "entfernen" | "pause", quelle }
  let skalaFest = null;          // Kursbereich waehrend des Ziehens (waechst, schrumpft nie): { tief, hoch }
  let geo = null;                // Masse der letzten Zeichnung: { oben, unten, preisVon, linien }
  let entfernenFlaechen = [];    // die x an den Etiketten: { typ, x, y, b, h }
  let zeichnenAngefragt = false;

  // ---------- Ansagen und Meldungen ----------
  // Vorgelesen wird nur, was zaehlt: eigene Ausfuehrungen, gesetzte und
  // ausgeloeste SL/TP, Nachrichten, Pause von selbst, "Weiter" mit der
  // Sperre und das Spielende -- nie jeder Takt und nie jeder Pfeiltasten-
  // Schritt im Preisfeld (dort hat das Feld den Fokus). Nur die Knoepfe
  // - / + sagen den Entwurf an, weil der Fokus dann auf dem Knopf steht.
  function ansagen(text) {
    const zeile = document.createElement("p");
    zeile.textContent = text;
    ansage.append(zeile);
    while (ansage.children.length > ANSAGEN_MAX) ansage.firstElementChild.remove();
  }

  function melden(text) {
    setzeText(meldungZeile, text);
    if (text) ansagen(text);
  }

  // ---------- Protokoll des Algos ----------
  function eintragFuellen(eintrag, takt, text) {
    const zeit = document.createElement("span");
    zeit.className = "sp-protokoll-zeit";
    zeit.textContent = uhr(sekundenAusTakten(takt));
    eintrag.textContent = "";
    eintrag.append(zeit, " " + text);
  }

  function protokollieren(takt, text) {
    const eintrag = document.createElement("li");
    eintragFuellen(eintrag, takt, text);
    protokollListe.prepend(eintrag);
    while (protokollListe.children.length > PROTOKOLL_MAX) protokollListe.lastElementChild.remove();
    protokollLeer.hidden = true;
    return eintrag;
  }

  function ausfuehrungText(trade) {
    const kauf = trade.aktion === "kauf";
    return T(
      (kauf ? "kauft " : "verkauft ") + kontrakte(trade.menge) + " zu " + kurs(trade.preis),
      (kauf ? "buys " : "sells ") + kontrakte(trade.menge) + " at " + kurs(trade.preis)
    );
  }

  function ergebnisText(trade) {
    return typeof trade.ergebnis === "number" ? T(", Ergebnis ", ", result ") + ergebnis(trade.ergebnis) : "";
  }

  // Auf einstieg, nachkauf, trendende und vor_nachricht folgt im selben Takt
  // der Trade des Algos; beides wird ein Eintrag. Einen ausgeloesten Stop
  // meldet das schutz-Ereignis (siehe schutzVerarbeiten).
  const MIT_ORDER = ["einstieg", "nachkauf", "trendende", "hektik", "vor_nachricht"];

  function algoText(e, trade) {
    const handel = trade ? ausfuehrungText(trade) + ergebnisText(trade) : "";
    switch (e.code) {
      case "bereit":
        return T("Beobachtung beendet \u2013 handelt jetzt.", "Done watching \u2013 trading now.");
      case "einstieg": {
        const grund = e.grund === "zone" ? T(" an der Zone", " at the zone")
          : e.grund === "abholung" ? T(" gegen die Abholung", " against the liquidity grab")
            : e.grund === "nachricht" ? T(" mit dem Nachrichtenschub", " with the news move")
              : T(" im Trend", " with the trend");
        return T("Einstieg " + e.richtung + grund + ": ", "Enters " + e.richtung + grund + ": ") + handel +
          T(", Stop ", ", stop ") + kurs(e.stop) + (typeof e.ziel === "number" ? T(", Ziel ", ", target ") + kurs(e.ziel) : "") + ".";
      }
      case "nachkauf":
        return T("Stockt auf: ", "Adds to the position: ") + handel + ".";
      case "trendende":
        return T("Trend gedreht, raus: ", "Trend has turned, out: ") + handel + ".";
      case "hektik":
        return T("Markt wird hektisch, raus: ", "Market turning hectic, out: ") + handel + ".";
      case "vor_nachricht":
        return T("Vor der Nachricht (" + themaText(e.thema) + ") flach: ",
          "Flat before the news (" + themaText(e.thema) + "): ") + handel + ".";
      // Die Einschaetzung des Algos nach seiner eigenen Regel, keine
      // Feststellung ueber den Markt: Er meldet deutlich mehr "Abholungen",
      // als der Markt macht (Messung im Ordner JKHD-Spiel)
      case "abholung":
        return e.richtung === "oben"
          ? T("Hoch bei " + kurs(e.zone) + " kurz durchstochen \u2013 wertet das als Abholung.",
            "High at " + kurs(e.zone) + " briefly pierced \u2013 treats it as a liquidity grab.")
          : T("Tief bei " + kurs(e.zone) + " kurz durchstochen \u2013 wertet das als Abholung.",
            "Low at " + kurs(e.zone) + " briefly pierced \u2013 treats it as a liquidity grab.");
      case "abwarten":
        return T("Nachricht eingetreten, wartet " + zahl(e.sekunden) + " s ab.",
          "News is out, waits " + zahl(e.sekunden) + " s.");
      case "pause":
        return T(FORMAT_GANZ.format(e.verluste) + " Verluste in Folge: " + zahl(e.sekunden) + " s Pause.",
          FORMAT_GANZ.format(e.verluste) + " losses in a row: " + zahl(e.sekunden) + " s break.");
      case "pause_ende":
        return T("Pause vorbei.", "Break over.");
      default:
        return e.code;
    }
  }

  // Das Aufstocken kommt im Trend oft mehrmals je Sekunde; aufeinander
  // folgende Nachkaeufe werden deshalb ein Eintrag, der mitzaehlt.
  function nachkaufProtokollieren(e, trade) {
    const gruppe = nachkaufGruppe;
    if (gruppe === null || gruppe.eintrag !== protokollListe.firstElementChild) {
      nachkaufGruppe = { eintrag: protokollieren(e.takt, algoText(e, trade)), anzahl: 1, menge: e.menge };
      return;
    }
    gruppe.anzahl += 1;
    gruppe.menge += e.menge;
    const zuletzt = trade ? ausfuehrungText(trade) : "";
    eintragFuellen(gruppe.eintrag, e.takt, T(
      "Stockt " + FORMAT_GANZ.format(gruppe.anzahl) + "-mal auf, zusammen " + kontrakte(gruppe.menge) + "; zuletzt " + zuletzt + ".",
      "Adds to the position " + FORMAT_GANZ.format(gruppe.anzahl) + " times, " + kontrakte(gruppe.menge) + " in all; last " + zuletzt + "."
    ));
  }

  function algoPhaseText(algo) {
    switch (algo.phase) {
      case "long":
      case "short":
        return (algo.phase === "long" ? "Long " : "Short ") + FORMAT_GANZ.format(Math.abs(algo.position)) +
          (algo.sl === null ? "" : ", SL " + kurs(algo.sl)) +
          (algo.tp === null ? "" : ", TP " + kurs(algo.tp));
      case "beobachtet": return T("beobachtet den Markt", "watching the market");
      case "bereit": return T("sucht Trend, Zone oder Abholung", "looking for a trend, a zone or a grab");
      case "hektik": return T("wartet \u2013 Markt zu hektisch", "waiting \u2013 market too hectic");
      case "nachricht": return T("bleibt vor der Nachricht flach", "staying flat before the news");
      default: return algo.phase;
    }
  }

  // ---------- Ereignisse eines Takts ----------
  // Trades derselben Person, Seite und Kerze werden eine Markierung am
  // mengengewichteten Kurs: Der Algo stockt im Trend oft mehrmals je Kerze auf.
  function markieren(trade) {
    const kerze = Math.floor(trade.takt / R.KERZE_TAKTE);
    const kauf = trade.aktion === "kauf";
    for (let i = markierungen.length - 1; i >= 0 && markierungen[i].kerze === kerze; i--) {
      const m = markierungen[i];
      if (m.wer === trade.wer && m.kauf === kauf) {
        m.preis = (m.preis * m.menge + trade.preis * trade.menge) / (m.menge + trade.menge);
        m.menge += trade.menge;
        return;
      }
    }
    markierungen.push({ takt: trade.takt, kerze, preis: trade.preis, kauf, wer: trade.wer, menge: trade.menge });
  }

  // Das naechste Ereignis der Art trade von wer nach Stelle i
  function folgenderTrade(liste, i, wer) {
    for (let j = i + 1; j < liste.length; j++) {
      if (liste[j].art === "trade" && liste[j].wer === wer) return liste[j];
    }
    return null;
  }

  // " Ihr TP entfaellt." -- wenn in liste eigene ruhende Orders verfallen
  function verfallenText(liste) {
    const typen = liste.filter((e) => e.art === "schutz" && e.code === "verfallen" && e.wer === "du").map((e) => e.typ);
    if (typen.length === 0) return "";
    if (typen.length > 1) return T(" SL und TP entfallen.", " SL and TP are cancelled.");
    return T(" Ihr " + typName(typen[0]) + " entf\u00e4llt.", " Your " + typName(typen[0]) + " is cancelled.");
  }

  // gesetzt, entfernt und verfallen zeigt die Anzeige ohnehin (Tafel, Linie,
  // Feld); hier geht es um die Ausloesung. Beim Menschen wird sie gemeldet und
  // vorgelesen, beim Algo steht sie im Protokoll. Das Verschieben seines
  // Stops (etwa zweimal je Sekunde) protokolliert niemand einzeln -- es steht
  // in "Jetzt" und in seiner Tafel.
  function schutzVerarbeiten(e, liste, i) {
    if (e.code !== "ausgeloest") return;
    ausloesungen.push({ takt: e.takt, preis: e.preis, typ: e.typ, wer: e.wer });
    const trade = folgenderTrade(liste, i, e.wer);
    if (e.wer === "du") {
      const kauf = trade && trade.aktion === "kauf";
      const handel = trade
        ? T((kauf ? "gekauft " : "verkauft ") + kontrakte(trade.menge) + " zu ", (kauf ? "bought " : "sold ") + kontrakte(trade.menge) + " at ") +
          kurs(trade.preis) + ergebnisText(trade)
        : "";
      melden(T("Ihr " + typName(e.typ) + " bei " + kurs(e.preis) + " wurde ausgel\u00f6st: ",
        "Your " + typName(e.typ) + " at " + kurs(e.preis) + " was triggered: ") + handel + "." +
        verfallenText(liste.slice(i + 1)));
    } else {
      const handel = trade ? ausfuehrungText(trade) + ergebnisText(trade) : "";
      protokollieren(e.takt, e.typ === "sl"
        ? T("Stop bei " + kurs(e.preis) + " ausgel\u00f6st: ", "Stop at " + kurs(e.preis) + " triggered: ") + handel + "."
        : T("Take-Profit bei " + kurs(e.preis) + " ausgel\u00f6st: ", "Take-profit at " + kurs(e.preis) + " triggered: ") + handel + ".");
    }
  }

  function verarbeiten(ereignisse) {
    for (let i = 0; i < ereignisse.length; i++) {
      const e = ereignisse[i];
      if (e.art === "trade") {
        markieren(e);
        if (e.zwang && e.wer === "algo") {
          protokollieren(e.takt, T("Pleite: Position zwangsweise glattgestellt, ", "Broke: position closed out, ") +
            ausfuehrungText(e) + ".");
        } else if (e.zwang) {
          melden(T("Pleite: Ihre Position wurde zu " + kurs(e.preis) + " zwangsweise glattgestellt.",
            "Broke: your position was closed out at " + kurs(e.preis) + "."));
        }
      } else if (e.art === "schutz") {
        schutzVerarbeiten(e, ereignisse, i);
      } else if (e.art === "algo") {
        const trade = MIT_ORDER.indexOf(e.code) >= 0 ? folgenderTrade(ereignisse, i, "algo") : null;
        if (e.code === "nachkauf") nachkaufProtokollieren(e, trade);
        else protokollieren(e.takt, algoText(e, trade));
      } else if (e.art === "nachricht" && e.code === "angekuendigt") {
        const sekunden = Math.ceil(sekundenAusTakten(e.inTakten));
        ansagen(T("Nachricht angek\u00fcndigt: " + themaText(e.thema) + " in " + sekunden + " Sekunden.",
          "News announced: " + themaText(e.thema) + " in " + sekunden + " seconds."));
      } else if (e.art === "nachricht") {
        letzteNachricht = { thema: e.thema, sprung: e.sprung, takt: e.takt };
        nachrichtMarken.push(e.takt);
        ansagen(T(themaText(e.thema) + " eingetreten: Kurs " + sprungText(e.sprung) + ".",
          themaText(e.thema) + " released: price " + sprungText(e.sprung) + "."));
      } else if (e.art === "ende") {
        spielende(e);
      }
    }
  }

  // ---------- Eigene Orders ----------
  function grenzText(erlaubt) {
    if (erlaubt === 0) return T("Die Positionsgrenze ist ausgesch\u00f6pft.", "The position limit is used up.");
    return T("So viel erlaubt die Positionsgrenze nicht \u2013 h\u00f6chstens " + kontrakte(erlaubt) + ".",
      "The position limit does not allow that much \u2013 at most " + kontrakte(erlaubt) + ".");
  }

  function fehlerText(fehler, aktion) {
    if (fehler === "keine_position") return T("Sie haben keine offene Position.", "You have no open position.");
    if (fehler === "grenze") return grenzText(spiel.maxMenge(aktion));
    if (fehler === "beendet") return T("Das Spiel ist vorbei.", "The game is over.");
    return T("Die Order wurde abgelehnt.", "The order was rejected.");
  }

  function ausfuehrungMeldung(e) {
    const kauf = e.aktion === "kauf";
    let text = T(
      (kauf ? "Gekauft: " : "Verkauft: ") + kontrakte(e.menge) + " zu " + kurs(e.preis) + ", Geb\u00fchr " + betrag(e.gebuehr) + ".",
      (kauf ? "Bought " : "Sold ") + kontrakte(e.menge) + " at " + kurs(e.preis) + ", fee " + betrag(e.gebuehr) + "."
    );
    if (typeof e.ergebnis === "number") {
      text += T(" Ergebnis der Position: ", " Result of the position: ") + ergebnis(e.ergebnis) + ".";
    }
    return text + T(" Position jetzt: ", " Position now: ") + positionText(e.position) + ".";
  }

  const PAUSE_TEXT = () => T("Pausiert \u2013 erst weiter, dann handeln.", "Paused \u2013 resume first, then trade.");
  const SPERRE_SEKUNDEN = () => zahl(sekundenAusTakten(OBERFLAECHE.SPERRE_NACH_PAUSE));

  // Nach "Weiter" gesperrt (siehe OBERFLAECHE.SPERRE_NACH_PAUSE)?
  const gesperrt = () => modus === "laeuft" && zustand !== null && zustand.takt < handelFrei;

  function handeln(aktion) {
    if (modus === "pause") return melden(PAUSE_TEXT());
    if (modus === "ende") return melden(T("Das Spiel ist vorbei.", "The game is over."));
    if (modus !== "laeuft") return;
    if (gesperrt()) {
      return melden(T("Noch gesperrt \u2013 nach \u201eWeiter\u201c wird erst nach " + SPERRE_SEKUNDEN() + " s gehandelt.",
        "Still locked \u2013 trading resumes " + SPERRE_SEKUNDEN() + " s after \u201cResume\u201d."));
    }

    let antwort;
    if (aktion === "glatt") {
      antwort = spiel.order("glatt");
    } else {
      const erlaubt = spiel.maxMenge(aktion);
      const n = menge === "max" ? erlaubt : menge;
      if (n < 1 || n > erlaubt) return melden(grenzText(erlaubt));
      antwort = spiel.order(aktion, n);
    }
    if (!antwort.ok) return melden(fehlerText(antwort.fehler, aktion));
    markieren(antwort.ereignis);
    melden(ausfuehrungMeldung(antwort.ereignis) + verfallenText(antwort.ereignisse));
    anzeigen();
  }

  // ---------- SL und TP ----------
  // Auf welcher Seite des Kurses eine Marke liegen muss -- dieselbe Regel wie
  // im Motor (spiel.schutz): Long SL unter, TP ueber dem Geldkurs; Short SL
  // ueber, TP unter dem Briefkurs. Der Motor entscheidet beim Setzen; hier
  // dient sie nur der Anzeige waehrend des Ziehens und im Feld.
  function richtigeSeite(z, typ, preis) {
    const long = z.du.position > 0;
    if (typ === "sl") return long ? preis < z.geld : preis > z.brief;
    return long ? preis > z.geld : preis < z.brief;
  }

  function seitenText(typ, long) {
    if (typ === "sl") return long ? T("SL muss unter den Geldkurs", "SL must be below the bid") : T("SL muss \u00fcber den Briefkurs", "SL must be above the ask");
    return long ? T("TP muss \u00fcber den Geldkurs", "TP must be above the bid") : T("TP muss unter den Briefkurs", "TP must be below the ask");
  }

  function seitenMeldung(typ, long) {
    if (typ === "sl") {
      return long
        ? T("Ein SL muss bei Long unter dem Geldkurs liegen \u2013 nicht gesetzt.", "For a long position the SL must be below the bid \u2013 not set.")
        : T("Ein SL muss bei Short \u00fcber dem Briefkurs liegen \u2013 nicht gesetzt.", "For a short position the SL must be above the ask \u2013 not set.");
    }
    return long
      ? T("Ein TP muss bei Long \u00fcber dem Geldkurs liegen \u2013 nicht gesetzt.", "For a long position the TP must be above the bid \u2013 not set.")
      : T("Ein TP muss bei Short unter dem Briefkurs liegen \u2013 nicht gesetzt.", "For a short position the TP must be below the ask \u2013 not set.");
  }

  // Wird eine Linie von der Einstandslinie weggezogen, entscheidet die
  // Richtung: bei Long nach oben TP, nach unten SL, bei Short umgekehrt. Liegt
  // die Linie dabei auf der falschen Seite des Kurses (etwa ein TP zwischen
  // Einstand und Kurs, wenn der Trade schon im Gewinn ist), wird sie sichtbar
  // abgelehnt, bis sie auf der richtigen Seite ist. Eine SL-Linie bleibt SL,
  // eine TP-Linie TP, wohin sie auch gezogen wird. kurz: der Grund fuer ein
  // schmales Chart.
  function vorschauPruefen(z, quelle, preis) {
    const long = z.du.position > 0;
    let typ = quelle;
    if (quelle === "einstand") {
      if (preis === z.du.einstand) {
        return { typ: null, gueltig: false, grund: T("auf dem Einstand \u2013 weiter ziehen", "on the entry \u2013 drag further"), kurz: T("weiter ziehen", "drag further") };
      }
      typ = (preis > z.du.einstand) === long ? "tp" : "sl";
    }
    const gueltig = richtigeSeite(z, typ, preis);
    return { typ, gueltig, grund: gueltig ? "" : seitenText(typ, long), kurz: gueltig ? "" : typName(typ) + T(" \u2013 falsche Seite", " \u2013 wrong side") };
  }

  function schutzFehlerText(fehler, typ, herkunft) {
    const long = zustand && zustand.du.position > 0;
    if (fehler === "keine_position") return T("Ohne offene Position gibt es keinen SL oder TP.", "There is no SL or TP without an open position.");
    if (fehler === "beendet") return T("Das Spiel ist vorbei.", "The game is over.");
    if (fehler === "preis_ungueltig") return T("Bitte einen Preis eintragen, etwa " + FORMAT_EINGABE.format(2034.5) + ".", "Please enter a price, such as " + FORMAT_EINGABE.format(2034.5) + ".");
    if (fehler === "preis_seite" && herkunft === "einstand") {
      return long
        ? T("SL auf Einstand geht erst, wenn der Geldkurs \u00fcber Ihrem Einstand liegt.", "A stop at entry only works once the bid is above your entry.")
        : T("SL auf Einstand geht erst, wenn der Briefkurs unter Ihrem Einstand liegt.", "A stop at entry only works once the ask is below your entry.");
    }
    if (fehler === "preis_seite") return seitenMeldung(typ, long);
    return T("Die Order wurde abgelehnt.", "The order was rejected.");
  }

  function schutzMeldung(e) {
    const name = typName(e.typ);
    if (e.code === "entfernt") return T(name + " entfernt.", name + " removed.");
    const g = spiel.ergebnisBei(e.typ, e.preis);
    const dort = g === null ? "" : T(" \u2013 Ergebnis dort ", " \u2013 result if hit ") + ergebnis(g);
    if (e.vorher === null) return T(name + " gesetzt: ", name + " set: ") + kurs(e.preis) + dort + ".";
    return T(name + " verschoben: ", name + " moved: ") + kurs(e.preis) + T(" (vorher ", " (was ") + kurs(e.vorher) + ")" + dort + ".";
  }

  // Die eine Stelle, an der die Oberflaeche SL/TP setzt, verschiebt oder
  // entfernt -- fuer Chart, Felder und "SL auf Einstand". preis null: entfernen.
  function schutzAendern(typ, preis, herkunft) {
    if (modus === "pause") return melden(T("Pausiert \u2013 erst weiter, dann SL oder TP setzen.", "Paused \u2013 resume first, then set SL or TP."));
    if (modus === "ende") return melden(T("Das Spiel ist vorbei.", "The game is over."));
    if (modus !== "laeuft") return;
    const antwort = spiel.schutz(typ, preis);
    if (!antwort.ok) return melden(schutzFehlerText(antwort.fehler, typ, herkunft));
    if (antwort.ereignis === null) return melden(T("Kein " + typName(typ) + " gesetzt.", "No " + typName(typ) + " set."));
    melden(schutzMeldung(antwort.ereignis));
    schutzZeilen[typ].gesetzt = undefined;   // Feld zeigt beim naechsten anzeigen() die neue Marke
    anzeigen();
  }

  // Zeile unter dem Chart: was im Feld steht und was es dort ergaebe
  function schutzInfo(z, typ) {
    if (z.du.position === 0) return T("keine offene Position", "no open position");
    const wert = preisLesen(schutzZeilen[typ].eingabe.value);
    const gesetzt = z.du[typ];
    if (wert === null) return gesetzt === null ? T("nicht gesetzt", "not set") : T("Feld leer \u2013 gesetzt bei ", "field empty \u2013 set at ") + kurs(gesetzt);
    if (Number.isNaN(wert) || wert <= 0) return T("kein g\u00fcltiger Preis", "not a valid price");
    const stand = wert === gesetzt ? T("gesetzt", "set") : T("noch nicht gesetzt", "not set yet");
    if (wert !== gesetzt && !richtigeSeite(z, typ, wert)) return stand + PUNKT + seitenText(typ, z.du.position > 0);
    const g = spiel.ergebnisBei(typ, wert);
    return stand + (g === null ? "" : PUNKT + T("Ergebnis dort ", "result if hit ") + ergebnis(g));
  }

  // - / + und Pfeiltasten aendern nur das Feld; gesetzt wird mit "Setzen".
  // Ohne Wert im Feld beginnt der Schritt bei der gesetzten Marke, sonst
  // einen grossen Schritt vom Kurs auf der richtigen Seite (SL bei Long
  // darunter, TP darueber; bei Short umgekehrt) -- vom Kurs selbst aus waere
  // schon der erste Schritt oft auf der falschen Seite. Die Knoepfe sagen den
  // Entwurf an (ansagen); die Pfeiltasten nicht, dort steht der Fokus im Feld.
  function schutzSchritt(typ, richtung, gross, ansage) {
    const z = zustand;
    if (!z || z.du.position === 0) return melden(schutzFehlerText("keine_position", typ));
    const f = schutzZeilen[typ];
    const long = z.du.position > 0;
    let basis = preisLesen(f.eingabe.value);
    if (basis === null || Number.isNaN(basis)) {
      const seite = (typ === "sl") === long ? -1 : 1;
      basis = z.du[typ] !== null ? z.du[typ] : (long ? z.geld : z.brief) + seite * OBERFLAECHE.SCHUTZ_SCHRITT_GROSS;
    }
    const schritt = gross ? OBERFLAECHE.SCHUTZ_SCHRITT_GROSS : OBERFLAECHE.SCHUTZ_SCHRITT;
    const wert = Math.max(0.01, aufCent(basis + richtung * schritt));
    f.eingabe.value = FORMAT_EINGABE.format(wert);
    const info = schutzInfo(z, typ);
    setzeText(f.info, info);
    if (ansage) ansagen(T(typName(typ) + "-Entwurf ", typName(typ) + " draft ") + kurs(wert) + PUNKT + info);
  }

  function schutzAusFeld(typ) {
    const wert = preisLesen(schutzZeilen[typ].eingabe.value);
    if (wert === null || Number.isNaN(wert)) return melden(schutzFehlerText("preis_ungueltig", typ));
    schutzAendern(typ, wert);
  }

  function schutzEntfernen(typ) {
    schutzAendern(typ, null);
    // Auch ein nicht gesetzter Entwurf im Feld ist dann weg (nicht in der
    // Pause: dort wird nichts geaendert, nur gemeldet)
    if (modus === "laeuft" && zustand && zustand.du[typ] === null) {
      schutzZeilen[typ].eingabe.value = "";
      setzeText(schutzZeilen[typ].info, schutzInfo(zustand, typ));
    }
  }

  function slAufEinstand() {
    const z = zustand;
    if (!z || z.du.position === 0) return melden(schutzFehlerText("keine_position", "sl"));
    schutzAendern("sl", z.du.einstand, "einstand");
  }

  // ---------- Takt ----------
  function schleife(zeit) {
    if (modus !== "laeuft") return;
    if (letzteZeit !== null) zeitspeicher += Math.min(zeit - letzteZeit, NACHHOLEN_MS) * tempo;
    letzteZeit = zeit;
    let takte = 0;
    while (zeitspeicher >= R.TAKT_MS && modus === "laeuft") {
      zeitspeicher -= R.TAKT_MS;
      takte += 1;
      verarbeiten(spiel.schritt());
    }
    if (takte > 0) anzeigen();
    if (modus === "laeuft") rafKennung = requestAnimationFrame(schleife);
  }

  function anhalten() {
    cancelAnimationFrame(rafKennung);
    letzteZeit = null;
  }

  function laufen() {
    anhalten();
    rafKennung = requestAnimationFrame(schleife);
  }

  // Bevor eine Schicht verschwindet, die den Fokus hat, geht er aufs Spiel --
  // sonst faellt er auf die Seite zurueck, und die Tasten waeren aus.
  function schichtZu(schicht) {
    const hatteFokus = schicht.contains(document.activeElement);
    schicht.hidden = true;
    koerper.inert = false;
    if (hatteFokus) wurzel.focus({ preventScroll: true });
  }

  function neuesSpielVorbereiten() {
    anhalten();
    ziehenAbbrechen();
    spiel = S.neuesSpiel(S.zufallsSaat());
    zeitspeicher = 0;
    handelFrei = 0;
    markierungen = [];
    ausloesungen = [];
    nachrichtMarken = [];
    letzteNachricht = null;
    nachkaufGruppe = null;
    auswahl = null;
    antippen = null;
    endeTitel = "";
    tempoMax = tempo;
    bestenZuruecksetzen();
    protokollListe.textContent = "";
    protokollLeer.hidden = false;
    setzeText(meldungZeile, "");
    Object.keys(schutzZeilen).forEach((typ) => {
      schutzZeilen[typ].eingabe.value = "";
      schutzZeilen[typ].gesetzt = null;
    });
  }

  // Das erste Spiel ist beim Laden schon vorbereitet (die Startschicht liegt
  // darueber); "Nochmal" und "Neues Spiel" wuerfeln eine neue Saat.
  function starten(neu) {
    if (neu) neuesSpielVorbereiten();
    neuGefragt = false;
    schichtZu(schichtStart);
    schichtZu(schichtEnde);
    markeHolen();
    modus = "laeuft";
    anzeigen();
    brettInsBild();
    laufen();
  }

  // Beim Start das Brett ins Bild holen. Gemeint ist das Brett bis SL/TP -- das
  // Protokoll darunter darf unter dem Rand liegen. Passt das unter die Kopfzeile,
  // steht das Brett oben (breit: Chart, Handel und SL/TP zugleich zu sehen). Ist
  // es hoeher als das Fenster (Handy), steht der Chart oben und die Handels-
  // knoepfe gleich darunter. Wer das Brett schon ganz sieht, bleibt, wo er ist.
  function brettInsBild() {
    const kopf = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const brett = wurzel.getBoundingClientRect();
    const schutz = wurzel.querySelector(".sp-schutz");
    const unten = (schutz ? schutz.getBoundingClientRect().bottom : brett.bottom) + 16;
    if (brett.top >= kopf && unten <= window.innerHeight) return;
    const ziel = unten - brett.top <= window.innerHeight - kopf ? wurzel : chartRahmen.parentElement;
    ziel.scrollIntoView({ block: "start" });
  }

  function pausieren(vonSelbst) {
    if (modus !== "laeuft") return;
    anhalten();
    modus = "pause";
    setzeText(pausiertMarke, vonSelbst
      ? T("Pausiert \u2013 der Tab war im Hintergrund", "Paused \u2013 the tab was in the background")
      : T("Pausiert", "Paused"));
    if (vonSelbst) ansagen(T("Pausiert, weil der Tab im Hintergrund war.", "Paused because the tab was in the background."));
    anzeigen();
  }

  function fortsetzen() {
    if (modus !== "pause") return;
    rueckfrageZuruecknehmen();
    modus = "laeuft";
    // Der angebrochene Takt von vor der Pause verfaellt: Sonst kaeme der erste
    // Takt nach "Weiter" frueher, und die Sperre dauerte auf der Uhr nur
    // 1,25-1,5 s statt 1,5 s (Pruefer, 06.10.2026: 1340-1445 ms gemessen).
    zeitspeicher = 0;
    handelFrei = zustand.takt + OBERFLAECHE.SPERRE_NACH_PAUSE * tempo;
    setzeText(pausiertMarke, T("Weiter \u2013 Handel in " + SPERRE_SEKUNDEN() + " s", "Resumed \u2013 trading in " + SPERRE_SEKUNDEN() + " s"));
    ansagen(T("Weiter. Kaufen, Verkaufen und Glattstellen in " + SPERRE_SEKUNDEN() + " s.",
      "Resumed. Buy, sell and close in " + SPERRE_SEKUNDEN() + " s."));
    anzeigen();
    laufen();
  }

  function pauseUmschalten() {
    if (modus === "pause") fortsetzen();
    else pausieren(false);
  }

  // "Neues Spiel" wirft ein laufendes Spiel weg. Mitten im Spiel haelt der
  // erste Druck deshalb an und fragt nach, erst der zweite beginnt neu. Jede
  // andere Bedienung nimmt die Frage zurueck.
  function neuesSpielAnfragen() {
    if (neuGefragt || (modus !== "laeuft" && modus !== "pause")) return starten(true);
    pausieren(false);
    neuGefragt = true;
    melden(T("Das laufende Spiel verwerfen? Zum Best\u00e4tigen \u201eWirklich neu?\u201c w\u00e4hlen.",
      "Discard the current game? Choose \u201cStart over?\u201d to confirm."));
    anzeigen();
  }

  function rueckfrageZuruecknehmen() {
    if (!neuGefragt) return;
    neuGefragt = false;
    setzeText(meldungZeile, "");
    anzeigen();
  }

  function endeGrund(e) {
    const ziel = betrag(R.ZIEL_KAPITAL);
    const grenze = betrag(R.PLEITE_GRENZE);
    const gleich = e.sieger === "unentschieden"
      ? T(" Beide haben genau gleich viel.", " Both have exactly the same capital.")
      : "";
    if (e.grund === "ziel") {
      if (e.kapitalDu >= R.ZIEL_KAPITAL && e.kapitalAlgo >= R.ZIEL_KAPITAL) {
        return T("Beide haben im selben Augenblick " + ziel + " erreicht; das h\u00f6here Kapital entscheidet.",
          "Both reached " + ziel + " at the same moment; the higher capital decides.") + gleich;
      }
      return e.sieger === "du"
        ? T("Sie haben " + ziel + " zuerst erreicht.", "You reached " + ziel + " first.")
        : T("Der JKHD-Algo hat " + ziel + " zuerst erreicht.", "The JKHD Algo reached " + ziel + " first.");
    }
    if (e.pleiteDu && e.pleiteAlgo) {
      return T("Beide sind im selben Augenblick unter " + grenze + " gefallen; das h\u00f6here Kapital entscheidet.",
        "Both fell below " + grenze + " at the same moment; the higher capital decides.") + gleich;
    }
    return e.pleiteDu
      ? T("Ihr Kapital ist unter " + grenze + " gefallen \u2013 pleite.", "Your capital fell below " + grenze + " \u2013 broke.")
      : T("Das Kapital des JKHD-Algos ist unter " + grenze + " gefallen \u2013 pleite.",
        "The JKHD Algo\u2019s capital fell below " + grenze + " \u2013 broke.");
  }

  function spielende(e) {
    anhalten();
    ziehenAbbrechen();
    modus = "ende";
    endeTitel = e.sieger === "du"
      ? T("Sie haben gewonnen", "You won")
      : e.sieger === "algo"
        ? T("Der JKHD-Algo hat gewonnen", "The JKHD Algo won")
        : T("Unentschieden", "Draw");
    const grund = endeGrund(e);
    const z = spiel.zustand();
    setzeText(endeUeberschrift, endeTitel);
    setzeText(teil("ende-grund"), grund);
    setzeText(teil("ende-zeit"), uhr(sekundenAusTakten(e.takt)));
    setzeText(teil("ende-saat"), String(spiel.saat));
    setzeText(teil("ende-kapital-du"), betrag(e.kapitalDu));
    setzeText(teil("ende-kapital-algo"), betrag(e.kapitalAlgo));
    setzeText(teil("ende-trades-du"), FORMAT_GANZ.format(z.du.trades));
    setzeText(teil("ende-trades-algo"), FORMAT_GANZ.format(z.algo.trades));
    bestenAnbieten(e);
    endeMelden(e);

    const fokusImSpiel = wurzel.contains(document.activeElement);
    schichtEnde.hidden = false;
    koerper.inert = true;

    // Die Karte liegt oben auf dem Brett. Wer am Brett spielt, etwa unten bei
    // den Handelsknoepfen, saehe sie sonst nicht: Dann wird sie unter die
    // Kopfzeile geholt. Wer anderswo auf der Seite liest, bleibt, wo er ist.
    const kopf = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const brett = wurzel.getBoundingClientRect();
    const karte = endeKarte.getBoundingClientRect();
    const brettImBild = brett.bottom > kopf && brett.top < window.innerHeight;
    const karteImBild = karte.top >= kopf && karte.bottom <= window.innerHeight;
    if (brettImBild && !karteImBild) endeKarte.scrollIntoView({ block: "start" });

    // Der Fokus geht auf die Ueberschrift, nicht auf "Nochmal": Wer im letzten
    // Augenblick noch die Leertaste fuer die Pause drueckt, soll das Ergebnis
    // sehen, statt gleich ein neues Spiel zu starten.
    if (fokusImSpiel) endeUeberschrift.focus({ preventScroll: true });
    ansagen(endeTitel + ". " + grund);
  }

  // ---------- Bestenliste ----------
  // Ein Aufruf an den Server: POST mit JSON; Antwort als { status, json } --
  // status 0, wenn kein Netz. Der Server kennt die Herkunft (Origin) der Seite.
  function bestenAnfrage(aktion, daten) {
    if (typeof fetch !== "function") return Promise.resolve({ status: 0, json: null });
    return fetch(BESTEN_API + aktion, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(daten || {}) })
      .then((r) => r.json().catch(() => null).then((json) => ({ status: r.status, json })))
      .catch(() => ({ status: 0, json: null }));
  }

  function datumText(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) return "";
    return IST_EN ? m[1] + "-" + m[2] + "-" + m[3] : m[3] + "." + m[2] + "." + m[1];
  }

  // Die Liste anzeigen; hervor: Rang des eigenen Eintrags (0 = keiner)
  function bestenZeigen(liste, hervor) {
    if (!bestenAbschnitt || !bestenOl) return;
    bestenOl.textContent = "";
    liste.slice(0, BESTEN_PLAETZE).forEach((e, i) => {
      const li = document.createElement("li");
      if (i + 1 === hervor) li.className = "ist-du";
      const zelle = (klasse, text) => {
        const s = document.createElement("span");
        s.className = klasse;
        s.textContent = text;
        li.appendChild(s);
      };
      zelle("sp-besten-rang", String(i + 1) + ".");
      zelle("sp-besten-name", String(e.name));
      zelle("sp-besten-zeit", uhr(Number(e.sekunden)));
      zelle("sp-besten-datum", datumText(e.datum));
      bestenOl.appendChild(li);
    });
    if (bestenLeer) bestenLeer.hidden = liste.length > 0;
    bestenAbschnitt.hidden = false;
  }

  function bestenLaden() {
    if (!bestenAbschnitt) return;
    bestenAnfrage("bestenliste").then((r) => {
      if (r.status !== 200 || !r.json || !Array.isArray(r.json.liste)) return;
      bestenListe = r.json.liste.filter((e) => e && typeof e.name === "string" && Number.isFinite(e.sekunden));
      bestenZeigen(bestenListe, 0);
      statistikZeigen(r.json.statistik);
    });
  }

  // Die Statistik ueber der Liste: zu Ende gespielte Partien, Siege mit
  // Anteil, mittlere Anlaeufe bis zum ersten Sieg -- Summen vom Server,
  // ohne Bezug zu Personen. Ohne Partien bleibt der Block verborgen.
  function statistikZeigen(s) {
    if (!bestenStatistik || !s || !Number.isFinite(s.spiele) || !Number.isFinite(s.siege) || s.spiele < 1) return;
    const wert = (name) => bestenStatistik.querySelector('[data-sp="statistik-' + name + '"]');
    const prozent = FORMAT_EINE.format(Math.round(s.siege / s.spiele * 1000) / 10);
    setzeText(wert("spiele"), FORMAT_GANZ.format(s.spiele));
    setzeText(wert("siege"), FORMAT_GANZ.format(s.siege) + " (" + prozent + "\u00a0%)");
    setzeText(wert("anlaeufe"), Number.isFinite(s.anlaeufe) && s.anlaeufe > 0 ? "\u00d8 " + FORMAT_EINE.format(s.anlaeufe) : "\u2013");
    bestenStatistik.hidden = false;
  }

  // Das Ergebnis jeder zu Ende gespielten Partie: nur Marke und Sieger, beim
  // ersten Sieg dazu die Zahl der Partien seit dem Oeffnen der Seite. Ohne
  // Marke (kein Server beim Start) wird nichts gemeldet.
  function endeMelden(e) {
    partienBeendet += 1;
    if (!bestenForm || !marke || markeSpiel !== spiel) return;
    const daten = { marke, sieger: e.sieger === "du" ? "du" : e.sieger === "algo" ? "algo" : "keiner" };
    if (daten.sieger === "du" && !ersterSiegGemeldet) {
      ersterSiegGemeldet = true;
      daten.anlaeufe = partienBeendet;
    }
    bestenAnfrage("bestenliste_ende", daten).then((r) => {
      if (r.status === 200 && r.json) statistikZeigen(r.json.statistik);
    });
  }

  // Die Spielmarke fuer das laufende Spiel -- einmal je Spiel, beim Start
  function markeHolen() {
    if (!bestenForm || markeSpiel === spiel) return;
    const meins = spiel;
    markeSpiel = spiel;
    marke = null;
    bestenAnfrage("bestenliste_marke").then((r) => {
      if (spiel === meins && r.status === 200 && r.json && typeof r.json.marke === "string") marke = r.json.marke;
    });
  }

  function bestenZuruecksetzen() {
    bestenOffen = null;
    if (!bestenForm) return;
    bestenForm.hidden = true;
    bestenForm.classList.remove("ist-fertig");
    setzeText(bestenMeldung, "");
    if (bestenFeld) { bestenFeld.value = ""; bestenFeld.disabled = false; }
    if (bestenKnopf) bestenKnopf.disabled = false;
  }

  // Nach dem Spielende: Hat der Mensch gewonnen und kaeme seine Zeit unter die
  // ersten BESTEN_PLAETZE, bietet die Endkarte den Eintrag an. Ohne Marke (kein
  // Server erreichbar) gibt es nichts anzubieten.
  function bestenAnbieten(e) {
    bestenZuruecksetzen();
    if (!bestenForm || e.sieger !== "du" || !marke || markeSpiel !== spiel) return;
    const sekunden = Math.round(sekundenAusTakten(e.takt));
    const liste = bestenListe || [];
    const rang = liste.filter((x) => x.sekunden <= sekunden).length + 1;
    if (liste.length >= BESTEN_PLAETZE && rang > BESTEN_PLAETZE) return;
    bestenOffen = { marke, sekunden, saat: spiel.saat, tempo: tempoMax };
    setzeText(bestenHinweis, bestenListe === null
      ? T("Ihr Sieg kann in die Bestenliste \u2013 tragen Sie einen Spitznamen ein.", "Your win can go on the leaderboard \u2013 enter a nickname.")
      : T("Platz " + rang + " der Bestenliste \u2013 tragen Sie einen Spitznamen ein.", "Rank " + rang + " on the leaderboard \u2013 enter a nickname."));
    bestenForm.hidden = false;
  }

  function bestenEintragen(ev) {
    ev.preventDefault();
    if (!bestenOffen || !bestenFeld) return;
    const name = bestenFeld.value.replace(/\s+/g, " ").trim();
    if (name.length < 2 || name.length > 16 || !/^[\p{L}\p{N} ._-]+$/u.test(name)) {
      setzeText(bestenMeldung, T("2 bis 16 Zeichen: Buchstaben, Ziffern, Leerzeichen, Punkt, Strich.", "2 to 16 characters: letters, digits, spaces, dot, dash."));
      bestenFeld.focus();
      return;
    }
    const offen = bestenOffen;
    bestenFeld.disabled = true;
    if (bestenKnopf) bestenKnopf.disabled = true;
    setzeText(bestenMeldung, T("Wird eingetragen \u2026", "Submitting \u2026"));
    bestenAnfrage("bestenliste_eintrag", { marke: offen.marke, name, sekunden: offen.sekunden, saat: offen.saat, tempo: offen.tempo }).then((r) => {
      if (r.status === 200 && r.json && Array.isArray(r.json.liste)) {
        bestenOffen = null;
        bestenListe = r.json.liste;
        bestenZeigen(bestenListe, Number(r.json.rang) || 0);
        bestenForm.classList.add("ist-fertig");
        setzeText(bestenMeldung, T("Eingetragen: Platz " + r.json.rang + ". Die Liste steht unter dem Spiel.", "Listed: rank " + r.json.rang + ". The list is below the game."));
        ansagen(T("In die Bestenliste eingetragen, Platz " + r.json.rang + ".", "Added to the leaderboard, rank " + r.json.rang + "."));
        return;
      }
      let text;
      if (r.status === 409) {
        bestenOffen = null;
        if (r.json && Array.isArray(r.json.liste)) { bestenListe = r.json.liste; bestenZeigen(bestenListe, 0); }
        text = T("Inzwischen ist die Liste schneller \u2013 diese Zeit reicht nicht mehr.", "The list has got faster in the meantime \u2013 this time no longer qualifies.");
      } else if (r.status === 400 && r.json && r.json.fehler === "name") {
        text = T("Dieser Spitzname geht nicht \u2013 bitte einen anderen.", "This nickname is not allowed \u2013 please choose another.");
        bestenFeld.disabled = false;
        if (bestenKnopf) bestenKnopf.disabled = false;
        bestenFeld.focus();
        setzeText(bestenMeldung, text);
        return;
      } else if (r.status === 400) {
        bestenOffen = null;
        text = T("Die Spielmarke gilt nicht mehr \u2013 beim n\u00e4chsten Sieg klappt es.", "The game token has expired \u2013 it will work with the next win.");
      } else if (r.status === 429) {
        text = T("Zu viele Eintr\u00e4ge aus Ihrem Netz \u2013 bitte sp\u00e4ter noch einmal.", "Too many entries from your network \u2013 please try again later.");
      } else {
        text = T("Keine Verbindung zum Server \u2013 bitte noch einmal versuchen.", "No connection to the server \u2013 please try again.");
      }
      if (bestenOffen) {
        bestenFeld.disabled = false;
        if (bestenKnopf) bestenKnopf.disabled = false;
      }
      setzeText(bestenMeldung, text);
    });
  }
  if (bestenForm) bestenForm.addEventListener("submit", bestenEintragen);

  // ---------- Anzeige ----------
  // Offener G/V (konto.offen) rechnet der Motor: genau das Ergebnis, das
  // Glattstellen jetzt melden wuerde, alle Kosten eingerechnet.
  function tafelZeigen(t, konto, fuehrt) {
    setzeText(t.kapital, betrag(konto.kapital));
    const fuellBreite = (wegAnteil(konto.kapital) * 100).toFixed(2) + "%";
    if (t.fuellung.style.width !== fuellBreite) t.fuellung.style.width = fuellBreite;
    // aria-valuenow muss zwischen min und max liegen; den echten Wert (auch
    // unter null nach einem Kurssprung) nennt aria-valuetext
    const stand = Math.min(R.ZIEL_KAPITAL, Math.max(R.PLEITE_GRENZE, Math.round(konto.kapital)));
    setzeAttribut(t.weg, "aria-valuenow", String(stand));
    setzeAttribut(t.weg, "aria-valuetext", betrag(konto.kapital));
    setzeText(t.position, positionText(konto.position));
    setzeText(t.einstand, konto.einstand === null ? STRICH : kurs(konto.einstand));
    setzeText(t.offen, konto.offen === null ? STRICH : ergebnis(konto.offen));
    setzeText(t.sl, konto.sl === null ? STRICH : kurs(konto.sl));
    setzeText(t.tp, konto.tp === null ? STRICH : kurs(konto.tp));
    setzeText(t.trades, FORMAT_GANZ.format(konto.trades));
    t.fuehrt.hidden = !fuehrt;
  }

  function nachrichtZeigen(z) {
    let text = T("Keine Nachricht angek\u00fcndigt", "No news announced");
    let art = "";
    if (modus === "ende") {
      text = T("Spiel beendet: ", "Game over: ") + endeTitel;
    } else if (z.nachricht) {
      text = T("Angek\u00fcndigt: ", "Announced: ") + themaText(z.nachricht.thema) + " in " + z.nachricht.inSekunden + " s";
      art = "is-angekuendigt";
    } else if (letzteNachricht && z.takt - letzteNachricht.takt < NACHRICHT_NACHLAUF) {
      text = T("Eingetreten: ", "Released: ") + themaText(letzteNachricht.thema) + T(", Kurs ", ", price ") +
        sprungText(letzteNachricht.sprung);
      art = "is-eingetreten";
    }
    setzeText(nachrichtBand, text);
    nachrichtBand.classList.toggle("is-angekuendigt", art === "is-angekuendigt");
    nachrichtBand.classList.toggle("is-eingetreten", art === "is-eingetreten");
  }

  function knoepfeZeigen(z) {
    const aktiv = modus === "laeuft" && !gesperrt();
    ["kauf", "verkauf"].forEach((aktion) => {
      const erlaubt = aktion === "kauf" ? z.du.maxKauf : z.du.maxVerkauf;
      const n = menge === "max" ? erlaubt : menge;
      const texte = orderTexte[aktion];
      // Der Name fuer Bildschirmleser bleibt ruhig: Kurs und Hoechstmenge
      // aendern sich jeden Takt und stehen deshalb nur sichtbar im Knopf (der
      // Kurs auch in der Zeile ueber dem Chart). Er wechselt nur mit der Menge.
      setzeAttribut(orderKnoepfe[aktion], "aria-label",
        (aktion === "kauf" ? T("Kaufen ", "Buy ") : T("Verkaufen ", "Sell ")) + (menge === "max" ? "Max" : FORMAT_GANZ.format(menge)));
      setzeAttribut(orderKnoepfe[aktion], "aria-disabled", String(!(aktiv && n >= 1 && n <= erlaubt)));
      setzeText(texte.menge, FORMAT_GANZ.format(n));
      setzeText(texte.preis, T("zu ", "at ") + kurs(aktion === "kauf" ? z.brief : z.geld));
      setzeText(texte.max, "max. " + FORMAT_GANZ.format(erlaubt));
    });
    setzeAttribut(orderKnoepfe.glatt, "aria-disabled", String(!(aktiv && z.du.position !== 0)));
    setzeText(glattPosition, z.du.position === 0 ? T("keine Position", "no position") : positionText(z.du.position));

    setzeAttribut(knopfPause, "aria-disabled", String(modus !== "laeuft" && modus !== "pause"));
    setzeText(knopfPause, modus === "pause" ? T("Weiter", "Resume") : T("Pause", "Pause"));
    setzeText(knopfNeu, neuGefragt ? T("Wirklich neu?", "Start over?") : T("Neues Spiel", "New game"));
  }

  // Felder fuer SL und TP: Aendert sich eine Marke im Motor, zeigt das Feld
  // sie; einen Entwurf, den Sie tippen, ueberschreibt nur eine solche
  // Aenderung. - / + gehen mit offener Position, auch in der Pause (sie
  // aendern nur das Feld); Setzen und Entfernen nur, solange das Spiel laeuft.
  function schutzZeigen(z) {
    const offen = z.du.position !== 0 && (modus === "laeuft" || modus === "pause");
    const setzbar = z.du.position !== 0 && modus === "laeuft";
    Object.keys(schutzZeilen).forEach((typ) => {
      const f = schutzZeilen[typ];
      const marke = z.du[typ];
      if (marke !== f.gesetzt) {
        f.gesetzt = marke;
        f.eingabe.value = marke === null ? "" : FORMAT_EINGABE.format(marke);
      }
      f.schritte.forEach((k) => setzeAttribut(k, "aria-disabled", String(!offen)));
      f.aktionen.forEach((k) => setzeAttribut(k, "aria-disabled", String(!setzbar)));
      setzeText(f.info, schutzInfo(z, typ));
    });
    setzeAttribut(knopfEinstand, "aria-disabled", String(!setzbar));
  }

  // Ziehen und Auswahl enden, wenn es nichts mehr zu ziehen gibt: Position
  // zu Ende, gezogene Order ausgeloest oder verfallen, Pause, Spielende.
  function ziehenPruefen(z) {
    if (ziehen) {
      const quelleWeg = ziehen.quelle === "einstand" ? z.du.position === 0 : z.du[ziehen.quelle] === null;
      if (modus !== "laeuft" || quelleWeg) ziehenAbbrechen();
    }
    if (auswahl && (z.du.position === 0 || (auswahl !== "einstand" && z.du[auswahl] === null))) auswahl = null;
    if (schwebt && (z.du.position === 0 || (schwebt !== "einstand" && z.du[schwebt] === null))) schwebt = null;
  }

  function anzeigen() {
    const z = spiel.zustand();
    zustand = z;

    // Was aus dem Chart gefallen ist, braucht keine Markierung mehr
    const aeltester = z.kerzen[0].takt;
    while (markierungen.length && markierungen[0].takt < aeltester) markierungen.shift();
    while (ausloesungen.length && ausloesungen[0].takt < aeltester) ausloesungen.shift();
    while (nachrichtMarken.length && nachrichtMarken[0] < aeltester) nachrichtMarken.shift();

    ziehenPruefen(z);
    setzeText(anzeigeZeit, uhr(z.sekunden));
    tafelZeigen(tafeln.du, z.du, z.du.kapital - z.algo.kapital >= 1);
    tafelZeigen(tafeln.algo, z.algo, z.algo.kapital - z.du.kapital >= 1);
    setzeText(algoJetzt, algoPhaseText(z.algo));
    setzeText(kurse.geld, kurs(z.geld));
    setzeText(kurse.brief, kurs(z.brief));
    setzeText(kurse.spanne, kurs(z.spanne));
    nachrichtZeigen(z);
    knoepfeZeigen(z);
    schutzZeigen(z);
    // Das Schild zeigt die Pause und danach die Sperre bis zum Handel
    pausiertMarke.hidden = modus !== "pause" && !gesperrt();
    zeichnen();
  }

  // ---------- Chart ----------
  // Farben kommen aus den CSS-Variablen der Seite und werden beim Wechsel
  // Hell/Dunkel neu gelesen. Kerzen: gestiegen hohl, gefallen gefuellt --
  // die Richtung haengt nie nur an der Farbe. Linien unterscheiden sich durch
  // den Strich: Ihr Einstand gestrichelt, Ihr SL/TP durchgezogen mit Etikett
  // in Tinte, SL des Algos gepunktet und grau, TP des Algos Strich-Punkt.
  const farben = {};
  function farbenLesen() {
    const stil = getComputedStyle(document.documentElement);
    const lies = (name) => stil.getPropertyValue(name).trim();
    farben.papier = lies("--bg");
    farben.tinte = lies("--text");
    farben.grau = lies("--muted");
    farben.linie = lies("--border");
    farben.mono = lies("--mono") || "monospace";
  }

  // Fingerbedienung (irgendein grober Zeiger): groessere Etiketten und x
  const grobAbfrage = window.matchMedia("(any-pointer: coarse)");

  let breite = 0;
  let hoehe = 0;
  let pixelFaktor = 1;

  // Gemessen wird die Leinwand selbst (ohne den Rand des Rahmens), sonst
  // stuende die Zeichnung um den Rand gestaucht und unscharf da.
  function groesseAnpassen() {
    const flaeche = leinwand.getBoundingClientRect();
    if (!flaeche.width || !flaeche.height) return;
    pixelFaktor = Math.min(3, window.devicePixelRatio || 1);
    breite = flaeche.width;
    hoehe = flaeche.height;
    leinwand.width = Math.round(breite * pixelFaktor);
    leinwand.height = Math.round(hoehe * pixelFaktor);
    zeichnen();
  }

  // Beim Ziehen und Zeigen mit der Maus wird zwischen den Takten neu
  // gezeichnet, hoechstens einmal je Bild
  function zeichnenAnfragen() {
    if (zeichnenAngefragt) return;
    zeichnenAngefragt = true;
    requestAnimationFrame(() => {
      zeichnenAngefragt = false;
      zeichnen();
    });
  }

  // Runde Kursschritte fuer das Raster: 1, 2 oder 5 mal eine Zehnerpotenz
  function schoenerSchritt(roh) {
    const potenz = Math.pow(10, Math.floor(Math.log10(roh)));
    const faktor = roh / potenz;
    return (faktor <= 1 ? 1 : faktor <= 2 ? 2 : faktor <= 5 ? 5 : 10) * potenz;
  }

  // Halbe Pixel: eine 1-px-Linie liegt so genau auf einer Pixelreihe
  const scharf = (wert) => Math.round(wert) + 0.5;

  function zeichnen() {
    if (!zustand || breite === 0 || hoehe === 0) return;
    const z = zustand;
    const c = kontext;
    c.setTransform(pixelFaktor, 0, 0, pixelFaktor, 0, 0);
    c.clearRect(0, 0, breite, hoehe);
    c.font = "11px " + farben.mono;
    c.textBaseline = "middle";
    c.lineWidth = 1;
    geo = null;
    entfernenFlaechen = [];

    // Flaeche: rechts die Kursachse, unten die Zeitachse
    const achse = Math.ceil(c.measureText(FORMAT_CENT.format(z.kurs)).width) + 16;
    const links = 4;
    const oben = 10;
    const unten = hoehe - 20;
    const rechts = breite - achse;
    if (rechts - links < 40 || unten - oben < 40) return;

    const abstand = Math.max(KERZE_ABSTAND_MIN, Math.min(KERZE_ABSTAND_MAX, (rechts - links) / KERZEN_ZIEL));
    const anzahl = Math.max(1, Math.floor((rechts - links) / abstand) - 1);
    const kerzen = z.kerzen.slice(-anzahl);
    const ersterTakt = kerzen[0].takt;
    const xVon = (takt) => links + (Math.floor((takt - ersterTakt) / R.KERZE_TAKTE) + 0.5) * abstand;
    const sichtbar = markierungen.filter((m) => m.takt >= ersterTakt);
    const ausgeloest = ausloesungen.filter((a) => a.takt >= ersterTakt);

    // Kursbereich: Kerzen, Geld/Brief, Einstand, SL/TP beider Spieler und
    // Markierungen. Waehrend des Ziehens schrumpft er nicht (die Linie unter
    // dem Finger bliebe sonst nicht stehen); er waechst hoechstens mit dem Kurs.
    let tief = Infinity;
    let hoch = -Infinity;
    const einbeziehen = (preis) => {
      if (preis < tief) tief = preis;
      if (preis > hoch) hoch = preis;
    };
    kerzen.forEach((k) => { einbeziehen(k.l); einbeziehen(k.h); });
    einbeziehen(z.geld);
    einbeziehen(z.brief);
    [z.du.einstand, z.du.sl, z.du.tp, z.algo.sl, z.algo.tp].forEach((preis) => {
      if (preis !== null) einbeziehen(preis);
    });
    sichtbar.forEach((m) => einbeziehen(m.preis));
    ausgeloest.forEach((a) => einbeziehen(a.preis));
    const mindest = z.kurs * MINDEST_SPANNE_ANTEIL;
    if (hoch - tief < mindest) {
      const mitte = (hoch + tief) / 2;
      tief = mitte - mindest / 2;
      hoch = mitte + mindest / 2;
    }
    const polster = (hoch - tief) * KURS_POLSTER_ANTEIL;
    tief -= polster;
    hoch += polster;
    if (ziehen && skalaFest) {
      // Vereinigung mit allem, was der Bereich waehrend des Ziehens schon war:
      // Er waechst mit dem Kurs, schrumpft aber nie, bis losgelassen wird
      tief = Math.min(tief, skalaFest.tief);
      hoch = Math.max(hoch, skalaFest.hoch);
      // Zeiger jenseits des Rands: Bereich waechst dorthin (Zeit seit dem
      // letzten Bild, hoechstens 0,1 s), und es wird weiter gezeichnet,
      // solange er draussen bleibt
      const jetzt = performance.now();
      const dt = Math.min(0.1, (jetzt - (ziehen.zuletzt || jetzt)) / 1000);
      ziehen.zuletzt = jetzt;
      const ueber = ziehen.bewegt ? (ziehen.y < oben ? oben - ziehen.y : ziehen.y > unten ? ziehen.y - unten : 0) : 0;
      if (ueber > 0) {
        const wachsen = ziehen.bereich * RAND_WACHSTUM * (Math.min(ueber, RAND_VOLL) / RAND_VOLL) * dt;
        if (ziehen.y < oben) hoch += wachsen;
        else tief -= wachsen;
        zeichnenAnfragen();
      }
      skalaFest = { tief, hoch };
    }
    const yVon = (preis) => oben + ((hoch - preis) / (hoch - tief)) * (unten - oben);
    const preisVon = (y) => hoch - ((y - oben) / (unten - oben)) * (hoch - tief);
    geo = { oben, unten, tief, hoch, preisVon, linien: {} };

    const linie = (x1, y1, x2, y2) => {
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
      c.stroke();
    };

    // Kursraster mit Beschriftung rechts
    const schritt = schoenerSchritt((hoch - tief) / 4);
    const rasterFormat = schritt < 1 ? FORMAT_CENT : FORMAT_GANZ;
    c.strokeStyle = farben.linie;
    c.fillStyle = farben.grau;
    c.textAlign = "left";
    for (let i = Math.ceil(tief / schritt); i * schritt <= hoch; i++) {
      const y = scharf(yVon(i * schritt));
      linie(links, y, rechts, y);
      c.fillText(rasterFormat.format(i * schritt), rechts + 8, y);
    }

    // Zeitraster mit Spielzeit unten
    c.textAlign = "center";
    kerzen.forEach((k) => {
      if ((k.takt * R.TAKT_MS) % (ZEITRASTER_SEKUNDEN * 1000) !== 0) return;
      const x = scharf(xVon(k.takt));
      c.strokeStyle = farben.linie;
      linie(x, oben, x, unten);
      const text = uhr(sekundenAusTakten(k.takt));
      const halb = c.measureText(text).width / 2;
      c.fillText(text, Math.max(links + halb, Math.min(rechts - halb, x)), unten + 11);
    });

    // Nachrichten als senkrechte Punktlinie, in Grau wie die Legende (3:1
    // gegen das Papier, WCAG 1.4.11)
    c.strokeStyle = farben.grau;
    c.setLineDash([2, 3]);
    nachrichtMarken.forEach((takt) => {
      if (takt < ersterTakt) return;
      const x = scharf(xVon(takt));
      linie(x, oben, x, unten);
    });
    c.setLineDash([]);

    // Kerzen
    const kerzenBreite = Math.max(3, Math.round(abstand * KERZE_KOERPER_ANTEIL));
    kerzen.forEach((k, i) => {
      const x = Math.round(links + i * abstand + (abstand - kerzenBreite) / 2);
      const docht = x + Math.floor(kerzenBreite / 2);
      const yHoch = Math.round(yVon(k.h));
      const yTief = Math.round(yVon(k.l));
      const oberkante = Math.round(yVon(Math.max(k.o, k.c)));
      const unterkante = Math.max(oberkante + 1, Math.round(yVon(Math.min(k.o, k.c))));
      c.fillStyle = farben.tinte;
      if (k.c >= k.o) {
        // Gestiegen: hohl, der Docht endet am Koerper
        c.fillRect(docht, yHoch, 1, oberkante - yHoch);
        c.fillRect(docht, unterkante, 1, yTief - unterkante);
        c.fillRect(x, oberkante, kerzenBreite, unterkante - oberkante);
        if (unterkante - oberkante > 2) {
          c.fillStyle = farben.papier;
          c.fillRect(x + 1, oberkante + 1, kerzenBreite - 2, unterkante - oberkante - 2);
        }
      } else {
        c.fillRect(docht, yHoch, 1, yTief - yHoch);
        c.fillRect(x, oberkante, kerzenBreite, unterkante - oberkante);
      }
    });

    // ----- Waagerechte Linien; ihre Etiketten werden danach ohne
    // Ueberlappung links gesetzt -----
    function waagerecht(y, strich, dicke, farbe) {
      const yy = dicke % 2 === 1 ? scharf(y) : Math.round(y);
      c.strokeStyle = farbe;
      c.lineWidth = dicke;
      c.setLineDash(strich);
      linie(links, yy, rechts, yy);
      c.setLineDash([]);
      c.lineWidth = 1;
      return yy;
    }
    // texte: vom laengsten zum kuerzesten; gesetzt wird der laengste, der in
    // die Breite des Charts passt (auf dem Handy etwa ohne Preis)
    const etiketten = [];   // { y, texte, art: "voll" | "hell" | "leise" | "abgelehnt", rang, entfernen }
    const long = z.du.position > 0;
    // SL/TP mit Preis und Ergebnis dort; kuerzer ohne $ am Preis, am kuerzesten ohne Preis
    const schutzTexte = (typ, preis, g) => {
      const dort = g === null ? "" : PUNKT + ergebnis(g);
      return [typName(typ) + " " + kurs(preis) + dort, typName(typ) + " " + FORMAT_CENT.format(preis) + dort].concat(dort ? [typName(typ) + dort] : []);
    };

    // Linien des Algos
    if (z.algo.sl !== null) etiketten.push({ y: waagerecht(yVon(z.algo.sl), [1, 3], 1, farben.grau), texte: [T("SL Algo", "Algo SL")], art: "leise", rang: 3 });
    if (z.algo.tp !== null) etiketten.push({ y: waagerecht(yVon(z.algo.tp), [6, 3, 1, 3], 1, farben.grau), texte: [T("TP Algo", "Algo TP")], art: "leise", rang: 3 });

    // Vorschau der gezogenen Linie: folgt dem Zeiger, bleibt im Chart
    let vorschau = null;
    if (ziehen && ziehen.art === "linie" && ziehen.bewegt && z.du.position !== 0) {
      const y = Math.min(unten, Math.max(oben, ziehen.y));
      const preis = aufCent(preisVon(y));
      vorschau = Object.assign({ y, preis }, vorschauPruefen(z, ziehen.quelle, preis));
    }

    // Ihr Einstand; angetippt oder unter der Maus mit Hinweis zum Ziehen
    if (z.du.einstand !== null) {
      const gewaehlt = auswahl === "einstand" || schwebt === "einstand" || (ziehen !== null && ziehen.quelle === "einstand");
      const y = waagerecht(yVon(z.du.einstand), [6, 4], gewaehlt ? 2 : 1, farben.tinte);
      if (z.du.position !== 0) geo.linien.einstand = y;
      let texte = [T("Ihr Einstand", "Your entry"), T("Einstand", "Entry")];
      if (gewaehlt && !vorschau && modus === "laeuft") {
        const pfeile = long ? "\u2191 TP \u2193 SL" : "\u2191 SL \u2193 TP";
        texte = [T("Ihr Einstand \u00b7 ziehen: ", "Your entry \u00b7 drag: ") + pfeile, T("Einstand \u00b7 ", "Entry \u00b7 ") + pfeile, pfeile];
      }
      etiketten.push({ y, texte, art: "hell", rang: gewaehlt ? 1.5 : 2 });
    }

    // Ihr SL und TP; die Order, die gerade ersetzt wird, nur noch als Schatten
    ["sl", "tp"].forEach((typ) => {
      const preis = z.du[typ];
      if (preis === null) return;
      if (vorschau && vorschau.typ === typ) {
        waagerecht(yVon(preis), [2, 3], 1, farben.grau);
        return;
      }
      const gewaehlt = auswahl === typ || schwebt === typ;
      const y = waagerecht(yVon(preis), [], gewaehlt ? 2 : 1, farben.tinte);
      geo.linien[typ] = y;
      const g = spiel.ergebnisBei(typ, preis);
      etiketten.push({ y, texte: schutzTexte(typ, preis, g), art: "voll", rang: 1, entfernen: typ });
    });

    if (vorschau) {
      const g = vorschau.gueltig ? spiel.ergebnisBei(vorschau.typ, vorschau.preis) : null;
      const y = waagerecht(vorschau.y, vorschau.gueltig ? [] : [2, 3], vorschau.gueltig ? 2 : 1, farben.tinte);
      etiketten.push(vorschau.gueltig
        ? { y, texte: schutzTexte(vorschau.typ, vorschau.preis, g), art: "voll", rang: 0 }
        : { y, texte: [vorschau.grund, vorschau.kurz], art: "abgelehnt", rang: 0 });
    }

    function kreuzZeichnen(x, y, r, farbe, dicke) {
      c.strokeStyle = farbe;
      c.lineWidth = dicke;
      c.beginPath();
      c.moveTo(x - r, y - r);
      c.lineTo(x + r, y + r);
      c.moveTo(x + r, y - r);
      c.lineTo(x - r, y + r);
      c.stroke();
      c.lineWidth = 1;
    }

    // Trades: Ihre als Dreieck, die des Algos als Winkel. Die Spitze zeigt auf
    // den Ausfuehrungskurs, Kaeufe von unten, Verkaeufe von oben. Ein Hof in
    // Papierfarbe haelt die Zeichen auf den Kerzen lesbar.
    sichtbar.forEach((m) => {
      const x = Math.round(xVon(m.takt)) + 0.5;
      const y = yVon(m.preis);
      const seite = m.kauf ? 1 : -1;
      c.beginPath();
      if (m.wer === "du") {
        c.moveTo(x, y);
        c.lineTo(x - 5, y + 9 * seite);
        c.lineTo(x + 5, y + 9 * seite);
        c.closePath();
        c.lineWidth = 3;
        c.strokeStyle = farben.papier;
        c.stroke();
        c.fillStyle = farben.tinte;
        c.fill();
      } else {
        c.moveTo(x - 5, y + 7 * seite);
        c.lineTo(x, y + seite);
        c.lineTo(x + 5, y + 7 * seite);
        c.lineWidth = 4;
        c.strokeStyle = farben.papier;
        c.stroke();
        c.lineWidth = 2;
        c.strokeStyle = farben.tinte;
        c.stroke();
      }
      c.lineWidth = 1;
    });

    // Ausgeloeste SL (x) und TP (Kreis) an ihrer Marke: Ihre kraeftig in
    // Tinte, die des Algos duenn und grau; daneben steht die Ausfuehrung
    ausgeloest.forEach((a) => {
      const x = Math.round(xVon(a.takt)) + 0.5;
      const y = yVon(a.preis);
      const du = a.wer === "du";
      [[farben.papier, du ? 5 : 4], [du ? farben.tinte : farben.grau, du ? 2 : 1.5]].forEach(([farbe, dicke]) => {
        if (a.typ === "sl") {
          kreuzZeichnen(x, y, 4.5, farbe, dicke);
        } else {
          c.strokeStyle = farbe;
          c.lineWidth = dicke;
          c.beginPath();
          c.arc(x, y, 4.5, 0, 2 * Math.PI);
          c.stroke();
          c.lineWidth = 1;
        }
      });
    });

    // Etiketten zuletzt, damit sie lesbar und ihre x greifbar bleiben: links
    // an der Linie, uebereinanderliegende nebeneinander -- nie in die
    // Kursachse. Ihre SL/TP (mit x) und die gezogene Linie haben immer ein
    // Etikett; passt es nicht neben die anderen, rueckt es von dem weg, mit
    // dem es zusammenstoesst (mit einem Strich zur Linie). Einstand und Algo
    // bekommen eines nur, wenn es an ihrer Linie Platz hat -- an einer fremden
    // Linie wuerde es die falsche beschriften; Strich und Legende bleiben.
    // Auf schmalen Charts gilt die kuerzere Fassung; was dann noch zu breit
    // waere, schneidet der Rand der Zeichenflaeche ab, nie die Kursachse. Das
    // Schild "Pausiert" (bzw. die Sperre danach) gilt als belegt: Etiketten
    // weichen ihm aus, statt darunter zu verschwinden.
    const grob = grobAbfrage.matches;
    const h = grob ? ETIKETT_HOEHE.grob : ETIKETT_HOEHE.fein;
    const kreuzBreite = grob ? KREUZ_BREITE.grob : KREUZ_BREITE.fein;
    const belegt = [];
    if (!pausiertMarke.hidden) {
      const schild = pausiertMarke.getBoundingClientRect();
      const flaeche = leinwand.getBoundingClientRect();
      belegt.push({ x: schild.left - flaeche.left, y: schild.top - flaeche.top, b: schild.width, h: schild.height });
    }
    const imBild = (y0) => Math.max(0, Math.min(hoehe - h, y0));
    function xBei(y0, b) {
      let x = links + 2;
      for (;;) {
        const stoss = belegt.find((r) => x < r.x + r.b + 4 && x + b + 4 > r.x && y0 < r.y + r.h && y0 + h > r.y);
        if (!stoss) return x + b <= rechts ? x : null;
        x = stoss.x + stoss.b + 6;
      }
    }
    function platzFinden(yLinie, b, mussSein) {
      const grund = imBild(Math.round(yLinie - h / 2));
      let x = xBei(grund, b);
      if (x !== null) return { x, y0: grund };
      if (!mussSein) return null;
      const nachbar = belegt.find((r) => grund < r.y + r.h && grund + h > r.y);
      const weg = nachbar && nachbar.y + nachbar.h / 2 < yLinie ? 1 : -1;
      for (const schritt of [1, 2, 3]) {
        for (const richtung of [weg, -weg]) {
          const y0 = imBild(grund + richtung * schritt * (h + 2));
          x = xBei(y0, b);
          if (x !== null) return { x, y0 };
        }
      }
      return { x: links + 2, y0: grund };
    }
    c.textAlign = "left";
    c.save();
    c.beginPath();
    c.rect(0, 0, rechts, hoehe);
    c.clip();
    const passt = rechts - links - 4;
    etiketten.sort((a, b) => a.rang - b.rang).forEach((e) => {
      const kreuz = e.entfernen ? kreuzBreite : 0;
      let text = "";
      let b = 0;
      for (const t of e.texte) {
        text = t;
        b = Math.ceil(c.measureText(t).width) + 12 + kreuz;
        if (b <= passt) break;
      }
      const platz = platzFinden(e.y, b, e.rang < 2);
      if (platz === null) return;
      const { x, y0 } = platz;
      belegt.push({ x, y: y0, b, h });
      const mitte = y0 + h / 2;
      const farbe = e.art === "leise" ? farben.grau : farben.tinte;
      if (e.y < y0 || e.y > y0 + h) {
        c.fillStyle = farbe;
        c.fillRect(x + 3, Math.min(e.y, y0), 1, Math.abs(e.y - (e.y < y0 ? y0 : y0 + h)) + 1);
      }
      if (e.art === "voll") {
        c.fillStyle = farben.tinte;
        c.fillRect(x, y0, b, h);
        c.fillStyle = farben.papier;
        c.fillText(text, x + 6, mitte);
        if (kreuz) {
          const kx = x + b - kreuz;
          c.fillRect(kx, y0 + 3, 1, h - 6);
          kreuzZeichnen(kx + kreuz / 2 + 0.5, mitte, 3.5, farben.papier, 1.5);
          entfernenFlaechen.push({ typ: e.entfernen, x: kx, y: y0, b: kreuz, h });
        }
      } else {
        c.fillStyle = farben.papier;
        c.fillRect(x, y0, b, h);
        if (e.art === "abgelehnt") {
          c.strokeStyle = farben.tinte;
          c.setLineDash([3, 2]);
          c.strokeRect(x + 0.5, y0 + 0.5, b - 1, h - 1);
          c.setLineDash([]);
        }
        c.fillStyle = farbe;
        c.fillText(text, x + 6, mitte);
      }
    });
    c.restore();

    // Aktueller Kurs: Linie, Geld/Brief als Striche an der Achse, Kurs im Kaestchen
    const yKurs = scharf(yVon(z.kurs));
    c.strokeStyle = farben.grau;
    c.setLineDash([1, 2]);
    linie(links, yKurs, rechts, yKurs);
    c.setLineDash([]);
    c.fillStyle = farben.tinte;
    c.fillRect(rechts, Math.round(yVon(z.brief)), 6, 1);
    c.fillRect(rechts, Math.round(yVon(z.geld)), 6, 1);
    c.fillRect(rechts + 2, Math.round(yKurs) - 9, achse - 2, 18);
    c.fillStyle = farben.papier;
    c.textAlign = "left";
    c.fillText(FORMAT_CENT.format(z.kurs), rechts + 8, yKurs);

    // Beim Ziehen: der Preis unter dem Zeiger an der Achse, hohl
    if (vorschau) {
      const y = Math.round(vorschau.y);
      c.fillStyle = farben.papier;
      c.fillRect(rechts + 2, y - 9, achse - 2, 18);
      c.strokeStyle = farben.tinte;
      c.strokeRect(rechts + 2.5, y - 8.5, achse - 3, 17);
      c.fillStyle = farben.tinte;
      c.fillText(FORMAT_CENT.format(vorschau.preis), rechts + 8, y);
    }
  }

  // ---------- Linien greifen und ziehen ----------
  const zeigerArt = (e) => (e.pointerType === "touch" || e.pointerType === "pen" ? e.pointerType : "mouse");

  function zeigerPunkt(e) {
    const flaeche = leinwand.getBoundingClientRect();
    return { x: e.clientX - flaeche.left, y: e.clientY - flaeche.top };
  }

  // Was liegt unter dem Zeiger? Zuerst die x zum Entfernen, dann die naechste
  // greifbare Linie (bei gleichem Abstand SL/TP vor dem Einstand)
  function trefferBei(x, y, art) {
    if (!geo || !zustand || zustand.du.position === 0) return null;
    const rand = art === "mouse" ? 1 : 6;
    for (const f of entfernenFlaechen) {
      if (x >= f.x - rand && x <= f.x + f.b + rand && y >= f.y - rand && y <= f.y + f.h + rand) return { art: "entfernen", quelle: f.typ };
    }
    let beste = null;
    Object.keys(geo.linien).forEach((quelle) => {
      const abstand = Math.abs(y - geo.linien[quelle]);
      if (abstand > TREFFER[art]) return;
      if (beste === null || abstand < beste.abstand || (abstand === beste.abstand && beste.quelle === "einstand")) {
        beste = { art: "linie", quelle, abstand };
      }
    });
    return beste;
  }

  function ziehenAbbrechen() {
    if (!ziehen) return;
    try {
      if (leinwand.hasPointerCapture(ziehen.zeiger)) leinwand.releasePointerCapture(ziehen.zeiger);
    } catch (f) {
      // Zeiger gibt es nicht mehr -- nichts freizugeben
    }
    ziehen = null;
    skalaFest = null;
    leinwand.classList.remove("is-ziehen");
    zeichnenAnfragen();
  }

  // Loslassen nach dem Ziehen: Die Marke unter dem Zeiger geht an den Motor.
  // Eine Linie auf der falschen Seite des Kurses wird nicht gesetzt; die alte
  // Marke bleibt dann, wo sie war.
  function linieLoslassen(z) {
    if (!geo || !zustand || zustand.du.position === 0) return;
    const y = Math.min(geo.unten, Math.max(geo.oben, z.y));
    const preis = aufCent(geo.preisVon(y));
    const v = vorschauPruefen(zustand, z.quelle, preis);
    if (v.typ === null) return melden(T("Auf dem Einstand entsteht keine Linie \u2013 weiter nach oben oder unten ziehen.", "No line on the entry itself \u2013 drag it further up or down."));
    if (!v.gueltig) return melden(seitenMeldung(v.typ, zustand.du.position > 0));
    if (preis === zustand.du[v.typ]) return;
    schutzAendern(v.typ, preis);
  }

  // Beruehrung (Finger): Eine Linie laesst sich erst ziehen, wenn sie vorher
  // angetippt ist -- "Einstandslinie antippen, dann wegziehen". Sonst
  // verschob fast jeder zweite Wisch ueber den Chart SL oder TP, denn eine
  // Linie mit ihrem Trefferband liegt fast ueberall (Pruefer, 28.09.2026: 54
  // von 147 Wischgesten). Eine Beruehrung, die nicht zieht, laesst die Seite
  // rollen; erst Loslassen ohne Bewegung zaehlt als Antippen (waehlt die
  // Linie, loest das x aus, meldet in der Pause den Hinweis). Maus und Stift
  // ziehen sofort.
  leinwand.addEventListener("pointerdown", (e) => {
    if (!e.isPrimary || (e.pointerType === "mouse" && e.button !== 0)) return;
    // Ein neuer erster Zeiger heisst: der alte ist fort, auch wenn der Browser
    // sein Ende (pointercancel) verschluckt hat -- sonst bliebe das Ziehen haengen
    if (ziehen) ziehenAbbrechen();
    antippen = null;
    const p = zeigerPunkt(e);
    const art = zeigerArt(e);
    const t = trefferBei(p.x, p.y, art);
    if (!t) {
      // Tippen ins Leere hebt die Auswahl auf; die Seite darf scrollen
      if (auswahl) {
        auswahl = null;
        zeichnenAnfragen();
      }
      return;
    }
    const merken = (was) => {
      antippen = { zeiger: e.pointerId, x: p.x, y: p.y, schwelle: ZIEH_SCHWELLE[art], was, quelle: t.quelle };
    };
    if (modus !== "laeuft") {
      if (modus === "pause") merken("pause");
      return;
    }
    if (art === "touch" && (t.art === "entfernen" || t.quelle !== auswahl)) {
      merken(t.art === "entfernen" ? "entfernen" : "waehlen");
      return;
    }
    e.preventDefault();
    rueckfrageZuruecknehmen();
    ziehen = { art: t.art, quelle: t.quelle, zeiger: e.pointerId, schwelle: ZIEH_SCHWELLE[art], startY: p.y, y: p.y, bewegt: false, bereich: geo.hoch - geo.tief };
    skalaFest = { tief: geo.tief, hoch: geo.hoch };
    try {
      leinwand.setPointerCapture(e.pointerId);
    } catch (f) {
      // ohne Einfangen geht es auch, solange der Zeiger auf der Leinwand bleibt
    }
    leinwand.classList.add("is-ziehen");
    zeichnenAnfragen();
  });

  // Beginnt eine Beruehrung auf der angetippten Linie, scrollt die Seite
  // nicht mit. pointerdown kommt vor touchstart und hat ziehen dann schon
  // gesetzt; touchstart prueft den Treffer trotzdem selbst, falls ein Browser
  // die Reihenfolge anders haelt.
  leinwand.addEventListener("touchstart", (e) => {
    if (ziehen && ziehen.art === "linie") {
      e.preventDefault();
      return;
    }
    if (e.touches.length !== 1 || modus !== "laeuft" || !auswahl) return;
    const flaeche = leinwand.getBoundingClientRect();
    const t = trefferBei(e.touches[0].clientX - flaeche.left, e.touches[0].clientY - flaeche.top, "touch");
    if (t && t.art === "linie" && t.quelle === auswahl) e.preventDefault();
  }, { passive: false });
  leinwand.addEventListener("touchmove", (e) => {
    if (ziehen && ziehen.art === "linie") e.preventDefault();
  }, { passive: false });

  leinwand.addEventListener("pointermove", (e) => {
    const p = zeigerPunkt(e);
    if (ziehen) {
      if (e.pointerId !== ziehen.zeiger) return;
      ziehen.y = p.y;
      if (!ziehen.bewegt && ziehen.art === "linie" && Math.abs(p.y - ziehen.startY) >= ziehen.schwelle) {
        ziehen.bewegt = true;
        auswahl = null;
      }
      zeichnenAnfragen();
      return;
    }
    if (e.pointerType !== "mouse") return;
    // Maus ohne Taste: Zeiger und Hervorhebung zeigen, was sich greifen laesst
    const t = modus === "laeuft" ? trefferBei(p.x, p.y, "mouse") : null;
    const zeiger = !t ? "" : t.art === "entfernen" ? "pointer" : "ns-resize";
    if (leinwand.style.cursor !== zeiger) leinwand.style.cursor = zeiger;
    const neu = t && t.art === "linie" ? t.quelle : null;
    if (neu !== schwebt) {
      schwebt = neu;
      zeichnenAnfragen();
    }
  });

  leinwand.addEventListener("pointerleave", (e) => {
    if (e.pointerType !== "mouse" || ziehen || schwebt === null) return;
    schwebt = null;
    zeichnenAnfragen();
  });

  leinwand.addEventListener("pointerup", (e) => {
    if (antippen && e.pointerId === antippen.zeiger) {
      const a = antippen;
      const p = zeigerPunkt(e);
      antippen = null;
      if (Math.abs(p.x - a.x) >= a.schwelle || Math.abs(p.y - a.y) >= a.schwelle) return;
      if (a.was === "pause") {
        if (modus === "pause") melden(T("Pausiert \u2013 erst weiter, dann SL oder TP setzen.", "Paused \u2013 resume first, then set SL or TP."));
      } else if (a.was === "entfernen") {
        const t = trefferBei(p.x, p.y, zeigerArt(e));
        if (t && t.art === "entfernen" && t.quelle === a.quelle) schutzEntfernen(a.quelle);
      } else if (modus === "laeuft") {
        auswahl = auswahl === a.quelle ? null : a.quelle;
        zeichnenAnfragen();
      }
      return;
    }
    if (!ziehen || e.pointerId !== ziehen.zeiger) return;
    const z = ziehen;
    const p = zeigerPunkt(e);
    const art = zeigerArt(e);
    ziehenAbbrechen();
    if (z.art === "entfernen") {
      // Wie ein Knopf: nur, wenn der Zeiger noch auf dem x ist
      const t = trefferBei(p.x, p.y, art);
      if (t && t.art === "entfernen" && t.quelle === z.quelle) schutzEntfernen(z.quelle);
    } else if (!z.bewegt) {
      auswahl = auswahl === z.quelle ? null : z.quelle;
    } else {
      linieLoslassen(z);
    }
    zeichnenAnfragen();
  });

  // Abgebrochen (etwa vom System, oder die Seite rollt) oder das Einfangen
  // verloren, ohne dass pointerup kam: nichts setzen, die alte Marke bleibt
  ["pointercancel", "lostpointercapture"].forEach((art) => {
    leinwand.addEventListener(art, (e) => {
      if (antippen && e.pointerId === antippen.zeiger && art === "pointercancel") antippen = null;
      if (ziehen && e.pointerId === ziehen.zeiger) ziehenAbbrechen();
    });
  });

  // Escape bricht ein Ziehen ab, wo auch immer der Fokus gerade ist (etwa in
  // einem Preisfeld): Loslassen setzt danach nichts. Vor allen anderen
  // Hoerern, damit ein Feld nicht zugleich seinen Entwurf zuruecknimmt.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !ziehen) return;
    e.preventDefault();
    e.stopPropagation();
    ziehenAbbrechen();
    melden(T("Ziehen abgebrochen \u2013 nichts ge\u00e4ndert.", "Drag cancelled \u2013 nothing changed."));
  }, true);

  // ---------- Bedienung ----------
  function tempoWaehlen(neu) {
    tempo = neu;
    if (neu > tempoMax) tempoMax = neu;
    tempoKnoepfe.forEach((k) => setzeAttribut(k, "aria-pressed", String(Number(k.dataset.spTempo) === neu)));
  }

  function mengeWaehlen(wert) {
    menge = wert === "max" ? "max" : Number(wert);
    mengenKnoepfe.forEach((k) => setzeAttribut(k, "aria-pressed", String(k.dataset.spMenge === wert)));
    anzeigen();
  }

  wurzel.addEventListener("click", (e) => {
    const knopf = e.target.closest("button");
    if (knopf && wurzel.contains(knopf)) {
      const d = knopf.dataset;
      const schutzTyp = knopf.closest("[data-sp-schutz]") ? knopf.closest("[data-sp-schutz]").dataset.spSchutz : null;
      if (d.spAktion !== "neu") rueckfrageZuruecknehmen();
      if (d.spAktion === "start") starten(false);
      else if (d.spAktion === "nochmal") starten(true);
      else if (d.spAktion === "neu") neuesSpielAnfragen();
      else if (d.spAktion === "pause") pauseUmschalten();
      else if (d.spAktion === "ansehen") schichtZu(schichtEnde);
      else if (d.spAktion === "sl-einstand") slAufEinstand();
      else if (d.spTempo) tempoWaehlen(Number(d.spTempo));
      else if (d.spMenge) mengeWaehlen(d.spMenge);
      else if (d.spOrder) handeln(d.spOrder);
      else if (schutzTyp && d.spSchritt) {
        if (modus === "laeuft" || modus === "pause") schutzSchritt(schutzTyp, Number(d.spSchritt), e.shiftKey, true);
      } else if (schutzTyp && d.spSchutzAktion === "setzen") schutzAusFeld(schutzTyp);
      else if (schutzTyp && d.spSchutzAktion === "entfernen") schutzEntfernen(schutzTyp);
    }
    // Safari legt beim Klick auf einen Knopf den Fokus nicht darauf; damit die
    // Tasten danach wirken, bekommt ihn dann das Spiel selbst.
    if (!wurzel.contains(document.activeElement)) wurzel.focus({ preventScroll: true });
  });

  // Felder fuer SL und TP: Eingabetaste setzt, Escape nimmt den Entwurf
  // zurueck, Pfeiltasten gehen einen Schritt, mit Umschalt oder Bild auf/ab
  // einen grossen. B, S, X und die Leertaste handeln hier nie (siehe unten).
  Object.keys(schutzZeilen).forEach((typ) => {
    const f = schutzZeilen[typ];
    f.eingabe.addEventListener("keydown", (e) => {
      if (e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
      const hoch = e.key === "ArrowUp" || e.key === "PageUp";
      const runter = e.key === "ArrowDown" || e.key === "PageDown";
      if (e.key === "Enter") {
        e.preventDefault();
        rueckfrageZuruecknehmen();
        schutzAusFeld(typ);
      } else if (e.key === "Escape") {
        const gesetzt = zustand ? zustand.du[typ] : null;
        const soll = gesetzt === null ? "" : FORMAT_EINGABE.format(gesetzt);
        if (f.eingabe.value !== soll) {
          e.preventDefault();
          f.eingabe.value = soll;
          if (zustand) setzeText(f.info, schutzInfo(zustand, typ));
        }
      } else if ((hoch || runter) && (modus === "laeuft" || modus === "pause")) {
        e.preventDefault();
        schutzSchritt(typ, hoch ? 1 : -1, e.shiftKey || e.key === "PageUp" || e.key === "PageDown");
      }
    });
    f.eingabe.addEventListener("input", () => {
      if (zustand) setzeText(f.info, schutzInfo(zustand, typ));
    });
  });

  // Tasten: nur mit Fokus im Spiel, ohne Strg/Alt/Meta, nie in Eingabefeldern
  const ORDER_TASTEN = { b: "kauf", s: "verkauf", x: "glatt" };
  const istEingabe = (ziel) =>
    Boolean(ziel.closest && ziel.closest("input, textarea, select, [contenteditable]:not([contenteditable='false'])"));
  let leertasteGefangen = false;

  wurzel.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey || e.isComposing || istEingabe(e.target)) return;
    if (e.key === " ") {
      // Die Leertaste gehoert waehrend eines Spiels der Pause -- auch auf einem
      // Knopf, sonst loeste sie dort ein zweites Mal Kauf oder Verkauf aus.
      // Nach dem Ende bedient sie nur noch Knoepfe; sonst tut sie nichts, damit
      // ein spaetes Pause-Druecken die Seite nicht vom Ergebnis wegrollt.
      if (modus === "start") return;
      if (modus === "ende") {
        if (!e.target.closest("button")) e.preventDefault();
        return;
      }
      e.preventDefault();
      leertasteGefangen = true;
      if (!e.repeat) pauseUmschalten();
      return;
    }
    const aktion = ORDER_TASTEN[(e.key || "").toLowerCase()];
    if (!aktion || e.repeat || modus === "start") return;
    e.preventDefault();
    rueckfrageZuruecknehmen();
    handeln(aktion);
  });

  // Manche Browser loesen einen Knopf erst beim Loslassen der Leertaste aus
  wurzel.addEventListener("keyup", (e) => {
    if (e.key === " " && leertasteGefangen) {
      e.preventDefault();
      leertasteGefangen = false;
    }
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pausieren(true);
  });

  // Hell/Dunkel: js/main.js setzt data-theme am <html>
  new MutationObserver(() => {
    farbenLesen();
    zeichnen();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // ---------- Start ----------
  document.querySelectorAll("[data-sp-start]").forEach((marke) => {
    marke.style.left = (wegAnteil(R.START_KAPITAL) * 100).toFixed(2) + "%";
  });
  [tafeln.du.weg, tafeln.algo.weg].forEach((weg) => {
    weg.setAttribute("aria-valuemin", String(R.PLEITE_GRENZE));
    weg.setAttribute("aria-valuemax", String(R.ZIEL_KAPITAL));
  });
  // Namen der Schritt-Knoepfe mit der Schrittweite dieser Datei
  Object.keys(schutzZeilen).forEach((typ) => {
    schutzZeilen[typ].schritte.forEach((k) => {
      const hoeher = Number(k.dataset.spSchritt) > 0;
      const weite = kurs(OBERFLAECHE.SCHUTZ_SCHRITT).replace(/[.,]00(?=\D|$)/, "");
      k.setAttribute("aria-label", typName(typ) + " " + weite + (hoeher ? T(" h\u00f6her", " higher") : T(" tiefer", " lower")));
    });
  });

  farbenLesen();
  wurzel.hidden = false;
  koerper.inert = true;
  neuesSpielVorbereiten();
  bestenLaden();
  anzeigen();

  if ("ResizeObserver" in window) new ResizeObserver(groesseAnpassen).observe(chartRahmen);
  else window.addEventListener("resize", groesseAnpassen);

  // Zieht das Fenster auf einen Schirm mit anderer Pixeldichte, bleibt die
  // Groesse gleich und der ResizeObserver schweigt -- die Dichte meldet sich
  // ueber ihre eigene Abfrage, die danach fuer die neue Dichte neu entsteht.
  function dichteBeobachten() {
    const abfrage = window.matchMedia("(resolution: " + (window.devicePixelRatio || 1) + "dppx)");
    if (!abfrage.addEventListener) return;
    abfrage.addEventListener("change", () => {
      groesseAnpassen();
      dichteBeobachten();
    }, { once: true });
  }
  dichteBeobachten();
  groesseAnpassen();
})();

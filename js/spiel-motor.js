/* JKHD -- Spielmotor fuer "Gold gegen den JKHD-Algo" (reine Logik, ohne DOM) */

// Diese Datei enthaelt nur die Spielregeln: Markt, Konten, Ausfuehrung und den
// Spielgegner. Die Oberflaeche ruft schritt() im Takt auf und zeichnet, was
// zustand() liefert. Dieselbe Datei laeuft in Node; dort spielt das
// Messwerkzeug im Ordner JKHD-Spiel Tausende Runden, um die Staerke des
// Gegners zu belegen.
//
// Grundsaetze
// - Aller Zufall kommt aus einem eigenen Generator mit Saat. Er rechnet nur mit
//   +, -, *, / und Wurzel, die in jeder JavaScript-Umgebung bitgenau gleich
//   sind: gleiche Saat, gleiches Spiel.
// - Kurse sind intern ganze Cent je Unze, Betraege ganze Cent. Eine Order
//   rechnet ohne jede Rundung, deshalb kann keine Rundung Geld erzeugen.
// - Der Spielmarkt ist erfunden. Der JKHD-Algo ist ein vereinfachter
//   Spiel-Algorithmus mit festen Regeln -- kein echtes Handelssystem.
// - Fairness ist baulich erzwungen: Der Algo bekommt je Takt nur eine
//   eingefrorene Beobachtung mit dem, was auch der Mensch sieht (Kurse bis
//   jetzt, eigenes Konto samt eigener ruhender Orders, angekuendigte
//   Nachrichten). Den Zufallsgenerator, die Marktphase, die Zonen des Markts,
//   die ruhenden Orders des Menschen und die Zukunft sieht er nie. Er handelt
//   ueber dieselbe Ausfuehrung mit denselben Gebuehren, derselben
//   Positionsgrenze und denselben ruhenden Orders.
// - Der Kursprozess (erzeugeKursprozess) steht ausserhalb von neuesSpiel():
//   Von dort ist kein Konto und keine ruhende Order erreichbar. Der Kurs ohne
//   die Preiswirkung der Spieler haengt nur von der Saat ab; der Markt weiss
//   nicht, wo Stops liegen, und zielt nicht auf sie.
//
// Schnittstelle (Betraege in Dollar, Kurse in Dollar je Unze, beides auf Cent)
//   JKHDSpiel.neuesSpiel(saat)   -> spiel; saat: ganze Zahl 0 ... 4294967295,
//                                   sonst TypeError
//   JKHDSpiel.zufallsSaat()      -> neue Saat aus dem Zufall des Geraets
//   JKHDSpiel.REGELN             -> feste Spielregeln (eingefroren, siehe unten)
//   JKHDSpiel.ALGO               -> die festen Regeln des JKHD-Algos (eingefroren;
//                                   Zeiten in Takten, fuer die Regel-Erklaerung)
//   JKHDSpiel.kursprozess(saat)  -> nur in Node (Messwerkzeuge im Ordner JKHD-Spiel):
//                                   der Kursprozess dieser Saat allein, ohne Spieler
//                                   (Kurs ohne Preiswirkung, Zaehler der Zonen-
//                                   Reaktionen); im Browser gibt es ihn nicht
//   spiel.saat                   -> die Saat dieses Spiels (zum Wiederholen)
//   spiel.schritt()              -> Ereignisse dieses Takts (Liste, oft leer);
//                                   nach dem Ende immer leer
//   spiel.order(aktion, menge)   -> { ok: true, ereignis, ereignisse }
//                                   | { ok: false, fehler }
//       aktion "kauf" | "verkauf" (menge: ganze Kontrakte >= 1) | "glatt"
//       (schliesst die ganze Position, menge entfaellt). Sofort ausgefuehrt
//       zum aktuellen Geld-/Briefkurs samt Preiswirkung. ereignis ist das
//       trade-Ereignis; ereignisse enthaelt es und danach die schutz-
//       Ereignisse "verfallen", wenn die Order die Position schliesst oder die
//       Seite wechselt. Fehlercodes: "beendet", "aktion_ungueltig",
//       "menge_ungueltig", "grenze", "keine_position". Diese Ereignisse kommen
//       nur hier zurueck, nicht noch einmal aus schritt().
//   spiel.schutz(typ, preis)     -> { ok: true, ereignis } | { ok: false, fehler }
//       Ruhende Schutz-Order fuer die ganze Position setzen, verschieben
//       (einfach neu setzen) oder mit preis null entfernen. typ "sl"
//       (Stop-Loss) | "tp" (Take-Profit); preis in Dollar je Unze, auf ganze
//       Cent gerundet. Je Spieler hoechstens ein SL und ein TP. Gueltig bei
//       Long: SL unter dem Geldkurs, TP ueber dem Geldkurs; bei Short: SL ueber
//       dem Briefkurs, TP unter dem Briefkurs. ereignis ist das schutz-
//       Ereignis ("gesetzt" oder "entfernt"; null, wenn preis null war und
//       keine Order lag). Fehlercodes: "beendet", "typ_ungueltig",
//       "preis_ungueltig" (keine endliche Zahl > 0), "keine_position",
//       "preis_seite" (Marke auf der falschen Seite des Kurses).
//   spiel.ergebnisBei(typ, preis) -> Ergebnis der ganzen offenen Position in
//       Dollar, wenn die Order typ genau auf dieser Marke ausgeloest wuerde
//       (fuer die Beschriftung der Linien), oder null ohne Position bzw. bei
//       ungueltigem preis. "tp": Durchschnittskurs = preis. "sl": Geld- bzw.
//       Briefkurs = preis, danach die eigene Preiswirkung (ohne Kursluecke;
//       springt der Kurs ueber die Marke, wird es schlechter).
//   spiel.maxMenge(aktion)       -> groesste erlaubte Menge fuer "kauf" oder
//                                   "verkauf" (0 nach dem Ende)
//   spiel.beobachtung()          -> dieselbe eingefrorene Sicht, die der Algo
//                                   bekommt, fuer den Menschen:
//       { takt, kurs, geld, brief, nachricht: null | { thema, inTakten },
//         seitNachricht: null | Takte seit der letzten Nachricht, position,
//         einstand, kapital, bargeld, maxKauf, maxVerkauf, sl, tp,
//         gegner: { position, kapital } }
//       sl, tp: eigene ruhende Orders oder null. Die ruhenden Orders des
//       Gegners stehen nicht darin.
//   spiel.zustand()              -> alles fuer die Anzeige:
//       { saat, takt, sekunden, kurs, geld, brief, spanne, preiswirkung,
//         kerzen: [{ takt, o, h, l, c }] (hoechstens KERZEN_MAX, die letzte
//                 waechst noch),
//         nachricht: null | { thema, inTakten, inSekunden },
//         du:   { kapital, bargeld, position, einstand, offen, gebuehren,
//                 trades, maxKauf, maxVerkauf, sl, tp },
//         algo: { ...wie du, phase, stop },
//         beendet, sieger: null | "du" | "algo" | "unentschieden",
//         grund: null | "ziel" | "pleite" }
//       position: Kontrakte, + long, - short; einstand: Durchschnittskurs der
//       offenen Position oder null; offen: das Ergebnis, das Glattstellen
//       jetzt melden wuerde (Kapitalveraenderung seit Eroeffnung der
//       Position, alle Kosten eingerechnet), oder null; sl, tp: ruhende
//       Orders oder null. preiswirkung: die Verschiebung des Kurses durch die
//       Orders beider Spieler (Dollar je Unze, klingt ab). algo.phase:
//       "beobachtet" | "bereit" | "long" | "short" | "pause" | "abwarten" |
//       "nachricht"; algo.stop: veraltet, gleich algo.sl.
//
// Ereignisse (sprachneutrale Codes; die Oberflaeche uebersetzt), jedes mit
// art und takt:
//   { art: "nachricht", code: "angekuendigt", thema, inTakten }
//   { art: "nachricht", code: "eingetreten", thema, richtung: "hoch" | "runter",
//     sprung (Kursaenderung in Prozent, mit Vorzeichen) }
//     thema: "notenbank" | "arbeitsmarkt" | "inflation"
//   { art: "trade", wer: "du" | "algo", aktion: "kauf" | "verkauf", menge,
//     preis (Durchschnitt je Unze), betrag, gebuehr, position (danach),
//     ergebnis (nur wenn eine Position endet, auch beim Seitenwechsel in einer
//     Order: Kapitalveraenderung der beendeten Position seit ihrer
//     Eroeffnung, alle Kosten eingerechnet),
//     schutz: "sl" | "tp" (nur wenn eine ruhende Order ausgeloest hat),
//     zwang: true (nur bei Zwangsglattstellung wegen Pleite) }
//   { art: "schutz", wer, code: "gesetzt" | "entfernt" | "ausgeloest" |
//     "verfallen", typ: "sl" | "tp", preis (die Marke),
//     vorher (nur bei "gesetzt": die alte Marke, wenn die Order verschoben
//     wurde, sonst null) }
//     "ausgeloest": die Order wird jetzt ausgefuehrt, das trade-Ereignis mit
//     schutz folgt unmittelbar. "verfallen": die Position ist zu Ende (auch
//     durch die andere ruhende Order), hat die Seite gewechselt oder das
//     Spiel ist aus.
//   { art: "algo", code: "bereit" }                       Beobachtung beendet
//   { art: "algo", code: "einstieg", richtung: "long" | "short", menge, stop,
//     grund: "trend" | "zone" | "abholung" | "nachricht", ziel? }
//     (ziel nur bei Zone und Abholung: sein Gewinnziel als ruhende Order)
//   { art: "algo", code: "nachkauf", menge }              stockt die Position auf
//   { art: "algo", code: "trendende" }                    Trend gedreht, raus
//   { art: "algo", code: "hektik" }                       Markt hektisch, raus
//   { art: "algo", code: "vor_nachricht", thema }         raus vor Nachricht
//   { art: "algo", code: "abholung", richtung: "oben" | "unten", zone }
//     Der Kurs hat ein Hoch (oben) bzw. Tief (unten) nur kurz durchstochen;
//     ist der Algo flach, steigt er im selben Takt dagegen ein
//   { art: "ende", sieger, grund: "ziel" | "pleite", pleiteDu, pleiteAlgo,
//     kapitalDu, kapitalAlgo }
// Auf ein algo-Ereignis mit Order folgt im selben Takt dessen trade-Ereignis;
// auf "einstieg" danach das schutz-Ereignis seines Stops (und seines Ziels).
//
// Ablauf eines Takts (schritt), immer in dieser Reihenfolge:
//   1. Kursprozess: Nachrichten, Phase, Zonen, neuer Kurs ohne Preiswirkung;
//      die Preiswirkung der Spieler klingt ab.
//   2. Ruhende Orders beider Spieler: faellig ist ein SL, sobald der Geldkurs
//      (Long) bzw. Briefkurs (Short) die Marke erreicht oder ueberschritten
//      hat -- er wird als Marktorder zum dann aktuellen Kurs samt
//      Preiswirkung ausgefuehrt (bei schnellen Bewegungen schlechter als die
//      Marke). Faellig ist ein TP, sobald die ganze Position samt eigener
//      Preiswirkung mindestens zur Marke glattgestellt werden kann -- er wird
//      also zur Marke oder besser ausgefuehrt. Von allen faelligen Orders
//      kommt zuerst die, deren Marke der Kurs am weitesten ueberschritten hat
//      (die er zuerst erreicht hat); bei Gleichstand in geraden Takten die
//      des Menschen, in ungeraden die des Algos. Nach jeder Ausfuehrung wird
//      neu geprueft, denn ihre Preiswirkung kann weitere Orders ausloesen
//      (Stop-Kaskade) oder eine eben erreichte Marke wieder verfehlen.
//   3. Der Algo handelt auf seine Beobachtung (Order, dann ruhende Orders).
//   4. Spielende pruefen.
// Orders und ruhende Orders des Menschen wirken sofort beim Aufruf; ob sie
// eine ruhende Order ausloesen, zeigt der naechste Takt.

(function (wurzel, fabrik) {
  "use strict";
  const teile = fabrik();
  // In Node (Messwerkzeuge) zusaetzlich der Kursprozess allein, im Browser nicht
  if (typeof module === "object" && module && module.exports) {
    module.exports = Object.freeze(Object.assign({ kursprozess: teile.kursprozess }, teile.modul));
  } else {
    wurzel.JKHDSpiel = teile.modul;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // ---------- Feste Spielregeln ----------
  // Betraege in Dollar, Kurse in Dollar je Unze. Die Oberflaeche liest sie fuer
  // die Regel-Erklaerung; intern rechnet der Motor in Cent (siehe unten).
  const REGELN = Object.freeze({
    TAKT_MS: 250,             // ein Takt bei Tempo 1x
    KONTRAKT_UNZEN: 10,       // ein Kontrakt = 10 Unzen
    START_KAPITAL: 100000,
    ZIEL_KAPITAL: 1000000,    // wer das zuerst erreicht, gewinnt
    PLEITE_GRENZE: 10000,     // wer darunter faellt, ist pleite und verliert
    HEBEL: 20,                // Nennwert der Position hoechstens 20 x Kapital
    GEBUEHR: 2,               // je Kontrakt und Seite
    SPANNE: 1,                // Abstand Geld/Brief im ruhigen Markt
    SPANNE_WEIT: 2,           // bei Hektik und kurz nach einer Nachricht
    PREISWIRKUNG: 0.01,       // Verschiebung je gehandeltem Kontrakt
    ABKLINGEN: 0.8,           // Anteil der Verschiebung, der nach einem Takt bleibt
    KERZE_TAKTE: 8,           // eine Kerze = 8 Takte = 2 Sekunden
    KERZEN_MAX: 150           // so viele Kerzen haelt zustand() hoechstens vor
  });

  // Dieselben Regeln in Cent; nur mit diesen Werten wird gerechnet.
  const UNZEN = REGELN.KONTRAKT_UNZEN;
  const START_CENT = REGELN.START_KAPITAL * 100;
  const ZIEL_CENT = REGELN.ZIEL_KAPITAL * 100;
  const PLEITE_CENT = REGELN.PLEITE_GRENZE * 100;
  const GEBUEHR_CENT = Math.round(REGELN.GEBUEHR * 100);
  const HALBE_SPANNE_CENT = Math.round(REGELN.SPANNE * 50);
  const HALBE_SPANNE_WEIT_CENT = Math.round(REGELN.SPANNE_WEIT * 50);
  const WIRKUNG_CENT = Math.round(REGELN.PREISWIRKUNG * 100);

  // ---------- Verborgene Marktparameter ----------
  // Sieht weder der Mensch noch der Algo. Alle Werte sind mit dem Messwerkzeug
  // abgestimmt (Ordner JKHD-Spiel, balance.js); dort steht die letzte Messung.
  // "Einheit" bei den Zonen: die Schwankung des Kurses je Takt im Augenblick
  // (Grundschwankung * Haeufung * Phase), in Dollar je Unze.
  const MARKT = Object.freeze({
    START_MIN: 1900,          // Startkurs in Dollar je Unze, gleichverteilt
    START_MAX: 2100,
    CHARAKTER: 0.12,          // je Spiel: Schwankung und Trend * (1 +- CHARAKTER)
    SCHWANKUNG: 0.0016,       // Grundschwankung je Takt (relativ)
    TREND: 0.0008,            // Drift je Takt in einer Trendphase (relativ)
    TREND_STREUUNG: 0.25,     // Trendstaerke je Phase: TREND * (1 +- 0.25)
    WELLE_IMPULS: [12, 32],   // ein Trend laeuft in Wellen: Schub (Takte) ...
    WELLE_RUECKLAUF: [7, 20], //   ... und Ruecklauf (Takte)
    IMPULS: 2.5,              // Drift im Schub: TREND * IMPULS
    RUECKLAUF: 1.6,           // Drift im Ruecklauf: -TREND * RUECKLAUF
    RUECKKEHR: 0.0118,        // Seitwaertsphase: Zug zum Mittel je Takt
    SCHWANKUNG_SEITWAERTS: 0.9,
    SCHWANKUNG_HEKTIK: 2.5,
    HAEUFUNG_ZUG: 0.03,       // Schwankungs-Haeufung: Rueckkehr zu 1 je Takt
    HAEUFUNG_STOSS: 0.02,     //   und Staerke des Zufallsstosses
    HAEUFUNG_MIN: 0.4,
    HAEUFUNG_MAX: 2.5,
    FOLGE: [0.54, 0.1, 0.36],       // Gewichte der Folgephase: Trend, Seitwaerts, Hektik
    WENDE: 0.13,                    // so oft folgt auf einen Trend gleich ein Trend in Gegenrichtung
    ANLAUF: 8,                      // ein Trend kommt in so vielen Takten auf volle Staerke
    DAUER_TREND: [120, 160],        // Dauer je Phase in Takten [min, max]
    DAUER_SEITWAERTS: [80, 240],
    DAUER_HEKTIK: [30, 80],
    NACHRICHT_ABSTAND: [300, 540],    // Takte von Nachricht zu naechster Ankuendigung
    NACHRICHT_VORLAUF: [48, 80],      // Takte zwischen Ankuendigung und Eintritt
    NACHRICHT_SPRUNG: [0.0105, 0.017], // Kurssprung relativ, Richtung zufaellig
    NACHRICHT_ZUG: 0.55,              // danach Trend in Sprungrichtung, sonst Hektik
    NACHRICHT_WEIT: 12,               // Takte mit weiter Spanne nach dem Eintritt
    // Liquiditaetszonen: Hochs und Tiefs des Kursverlaufs
    ZONE_PIVOT: 6,            // Ruecklauf (Einheiten), der ein Hoch/Tief zur Zone macht
    ZONE_NAEHE: 1.5,          // so nah (Einheiten) gilt die Zone als beruehrt
    ZONE_ABSTAND: 5,          // erst so weit entfernt zaehlt die naechste Beruehrung
    ZONE_GLEICH: 2.5,         // neues Hoch/Tief so nah an einer Zone: dieselbe Zone
    ZONE_WEIT: 80,            // weiter entfernte Zonen verfallen
    ZONE_MAX: 8,              // hoechstens so viele Zonen zugleich
    // Reaktion beim 1., 2., 3. und ab dem 4. Wiederanlauf: Gewichte
    // Abprallen, Abholung, Ausbruch, keine Reaktion. Beim ersten Wiederanlauf
    // prallt der Kurs meist ab; je oefter er abgeprallt ist, desto eher holt
    // er die Stops dahinter ab.
    ZONE_REAKTION: [[0.72, 0.09, 0.11, 0.08], [0.62, 0.28, 0.05, 0.05], [0.38, 0.5, 0.07, 0.05], [0.25, 0.55, 0.15, 0.05]],
    ZONE_STREUUNG: 0.12,      // je Spiel: jedes Gewicht * (1 +- 0.12)
    TREND_MIT: [0.18, 0.41, 3.5], // laeuft der Trend in die Zone: Faktoren auf Abprallen, Abholung, Ausbruch
    TREND_GEGEN: [1.2, 2.5, 0.3], // laeuft ein Ruecklauf gegen den Trend in die Zone: dieselben Faktoren
    PLAN_RAUSCHEN: 0.5,       // Schwankung waehrend einer Reaktion (Anteil)
    ABPRALL_UEBER: [-0.5, 1],       // Abprallen: so weit (Einheiten) sticht der Kurs hoechstens durch
    ABPRALL_WEG: [6, 12],           //   und laeuft so weit zurueck
    ABPRALL_TAKTE: [10, 22],        //   in so vielen Takten
    ABPRALL_ZURUECK: 0.98,          //   ausserhalb eines Trends so oft danach wieder an die Zone
    ABPRALL_ZURUECK_TREND: 0.75,    //   im Trend so oft, wenn ein Ruecklauf in die Zone lief
    ZURUECK_TAKTE: [8, 20],         //   in so vielen Takten
    ABHOLUNG_TIEFE: [0.7, 4.5],     // Abholung: Tiefe hinter der Zone (Einheiten, meist flach)
    ABHOLUNG_TAKTE: [2, 4],         //   in so vielen Takten
    POLSTER: [0.2, 0.4],            // Stoss aus den Stops hinter der Zone (Einheiten, klingt ab)
    UMKEHR_WEG: [6, 14],            //   dann zurueck, so weit auf die andere Seite
    UMKEHR_TAKTE: [10, 24],         //   in so vielen Takten
    UMKEHR_TREND: 0.2,              //   danach so oft ein Trend in Gegenrichtung
    AUSBRUCH_WEG: [4, 8],           // Ausbruch: so weit durch (Einheiten)
    AUSBRUCH_TAKTE: [4, 8],         //   in so vielen Takten
    AUSBRUCH_TREND: 0.34            //   danach so oft ein Trend in Ausbruchsrichtung
  });

  // Phasen des Kursprozesses (nur intern). Auf eine Phase folgt immer eine
  // andere Art; die Richtung eines Trends ist zufaellig.
  const TREND = 0;
  const SEITWAERTS = 1;
  const HEKTIK = 2;

  // Reaktionen an einer Zone (nur intern), in der Reihenfolge von ZONE_REAKTION
  // (die vierte Stelle dort ist "keine Reaktion"). ZURUECK hat kein Gewicht:
  // Es folgt nur auf ein Abprallen und fuehrt den Kurs wieder an die Zone.
  const ABPRALL = 0;
  const ABHOLUNG = 1;
  const AUSBRUCH = 2;
  const ZURUECK = 4;

  const THEMEN = ["notenbank", "arbeitsmarkt", "inflation"];

  // ---------- Regeln des JKHD-Algos ----------
  // Fest und vorher festgelegt, auch fuer die Oberflaeche lesbar. Einheit der
  // Schwankung ("Bewegung") ist der gleitende Mittelwert der Kursbewegung je
  // Takt (in Dollar je Unze), Trendstaerke der Abstand der beiden gleitenden
  // Mittel in dieser Einheit. Seit dem 10.10.2026 spielt der Algo wie ein
  // Profi (Julian: "so gut, dass er zu 99 % gewinnt, und schneller handeln"):
  // Er unterscheidet Trend, Seitwaertsmarkt und Hektik, handelt im Trend die
  // Wellen, im Seitwaertsmarkt die Zonen und jede Abholung dagegen, nimmt den
  // Schub nach einer Nachricht mit und haelt nach Verlusten keine Pause.
  const ALGO = Object.freeze({
    AUFWAERMEN: 32,           // Takte beobachten, bevor der erste Trade erlaubt ist
    MITTEL_SCHNELL: 4,        // gleitende Mittel (Takte)
    MITTEL_LANGSAM: 40,
    MITTEL_SCHWANKUNG: 64,    // uebliche Bewegung je Takt: gemittelt ueber so viele Takte
    MITTEL_HEKTIK: 6,         // Bewegung der letzten Takte, fuer die Hektik-Erkennung
    HEKTIK: 3.2,              // Bewegung der letzten Takte / uebliche Bewegung: ab da ist es Hektik
    EINSTIEG: 7.5,            // Trendstaerke fuer einen Einstieg in Trendrichtung
    TRENDENDE: 3.5,           // Trendstaerke so weit gegen die Position: Ausstieg
    RUHE: 8,                 // Takte nach dem Ende eines Trend-Trades ohne neuen Trend-Einstieg
    STOP: 3,                  // erster Stop: mindestens so viele Bewegungen entfernt ...
    STOP_MAX: 4,              // ... hoechstens so viele (hinter dem letzten Umkehrpunkt)
    BREAKEVEN: 4,             // liegt der Kurs so viele Bewegungen im Gewinn, rueckt der Stop auf den Einstand
    NACHZIEHEN: 20,           // Stop je Kerze nachziehen: Abstand zum besten Kurs seit Einstieg
    ZONE: 6,                  // Ruecklauf (Bewegungen), der ein Hoch/Tief zur Zone macht
    ZONE_PUFFER: 3,           // Stop so viele Bewegungen hinter einer Zone, nie knapp dahinter
    NAEHE: 1.5,               // so nah (Bewegungen) gilt eine Zone als beruehrt
    ABPRALLER: 1,             // im Seitwaertsmarkt: bis zur so vielten Beruehrung gegen die Zone handeln
    ZONE_STOP: 3,             // dabei Stop so viele Bewegungen hinter der Zone
    ZIEL: 6,                  // Gewinnziel (Bewegungen) im Seitwaertsmarkt und nach einer Abholung
    ABHOLUNG: 1,              // Zone um so viele Bewegungen durchstochen ...
    ABHOLUNG_TAKTE: 12,       // ... und binnen so vieler Takte zurueck: Abholung -> Einstieg dagegen
    ABHOLUNG_PUFFER: 1,       // Stop dann so viele Bewegungen hinter dem Stich
    RISIKO: 0.65,             // Verlust bis zum Stop: hoechstens 65 % des Kapitals (meist bindet die Positionsgrenze)
    NACHKAUF: 0.02,           // aufstocken, sobald die Grenze so viel mehr erlaubt (Anteil der Position)
    FLACH_VOR: 8,             // Takte vor einer Nachricht: Position schliessen
    KEIN_EINSTIEG_VOR: 16,    // Takte vor einer Nachricht: nichts eroeffnen, nicht aufstocken
    NACHRICHT_MIT: 2          // Takte nach einer Nachricht: laeuft der Kurs weiter in Sprungrichtung, geht er mit
  });

  // ---------- Zufallsgenerator ----------
  // sfc32, die vier Startwerte kommen per splitmix32 aus der Saat. Normalverteilte
  // Zahlen naehern vier gleichverteilte an (Irwin-Hall, auf Varianz 1 skaliert);
  // das kommt ohne Logarithmus und Winkelfunktionen aus, die je nach Umgebung in
  // der letzten Stelle abweichen duerfen, und hat keine unbegrenzten Ausreisser.
  function zufallsgenerator(saat) {
    let s = saat >>> 0;
    const aufbereiten = () => {
      s = (s + 0x9e3779b9) >>> 0;
      let z = s;
      z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
      z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
      return (z ^ (z >>> 16)) >>> 0;
    };
    let a = aufbereiten();
    let b = aufbereiten();
    let c = aufbereiten();
    let d = aufbereiten();

    const gleich = () => {
      const t = (((a + b) | 0) + d) | 0;
      d = (d + 1) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      c = (c + t) | 0;
      return (t >>> 0) / 4294967296;
    };
    for (let i = 0; i < 12; i++) gleich();

    const WURZEL_DREI = Math.sqrt(3);
    return {
      gleich,
      normal: () => (gleich() + gleich() + gleich() + gleich() - 2) * WURZEL_DREI,
      zwischen: (min, max) => min + (max - min) * gleich(),
      ganz: (min, max) => min + Math.floor((max - min + 1) * gleich()),
      wahl: (anteile) => {
        let rest = gleich();
        for (let i = 0; i < anteile.length; i++) {
          rest -= anteile[i];
          if (rest < 0) return i;
        }
        return anteile.length - 1;
      }
    };
  }

  // Saat aus dem Zufall des Geraets, fuer ein neues Spiel in der Oberflaeche
  function zufallsSaat() {
    const krypto = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
    if (krypto && krypto.getRandomValues) return krypto.getRandomValues(new Uint32Array(1))[0];
    return (Date.now() ^ 0x5bd1e995) >>> 0;
  }

  const dollar = (cent) => cent / 100;
  const aufCent = (betrag) => Math.round(betrag * 100) / 100;
  const summe = (liste) => liste.reduce((s, x) => s + x, 0);

  // ---------- Der Kursprozess ----------
  // Erzeugt den Kurs ohne die Preiswirkung der Spieler: Phasen (Trend,
  // Seitwaerts, Hektik), Nachrichten und Liquiditaetszonen. Ein Trend laeuft
  // allmaehlich an (ANLAUF) und endet manchmal mit einer Wende (WENDE).
  //
  // BAULICHE TRENNUNG: Diese Funktion steht ausserhalb von neuesSpiel() und
  // bekommt nur den Zufallsgenerator. Konten, Positionen und ruhende Orders
  // der Spieler sind von hier aus nicht erreichbar, und sie nimmt keinen Kurs
  // mit Preiswirkung entgegen. Der Kurs ohne Preiswirkung haengt deshalb nur
  // von der Saat ab (pruefung.js prueft das). Die Stops der Spieler wirken
  // allein ueber ihre Ausfuehrung als Marktorder mit Preiswirkung.
  //
  // Zonen: Jedes Hoch und Tief, von dem der Kurs um ZONE_PIVOT Einheiten
  // zurueckgelaufen ist, wird eine Zone (ein Widerstand ueber dem Kurs, eine
  // Unterstuetzung darunter). Laeuft der Kurs wieder an eine Zone, zieht der
  // Prozess eine Reaktion nach ZONE_REAKTION (im Trend mit TREND_MIT bzw.
  // TREND_GEGEN gewichtet): Abprallen (danach laeuft der Kurs meist wieder an
  // dieselbe Zone -- ausserhalb eines Trends fast immer, im Trend nach einem
  // Ruecklauf in die Zone oft --, und die naechste Beruehrung zieht mit den
  // Gewichten des naechsten Wiederanlaufs); Abholung (durch die
  // Zone um eine zufaellige Tiefe stechen, die Stops dahinter -- ein
  // simuliertes Polster -- stossen den Kurs weiter, dann scharfe Umkehr auf
  // die andere Seite); Ausbruch (durch, danach Trend; die Zone kippt vom
  // Widerstand zur Unterstuetzung oder umgekehrt); oder keine Reaktion. So
  // prallt der Kurs an einer Zone oft ein paar Mal ab, bevor er die Stops
  // dahinter abholt -- aber nicht immer: Er kann auch weiter abprallen oder
  // wirklich ausbrechen. Welche Reaktion kommt und wie tief eine Abholung
  // sticht, ist Zufall. Die Zonen stehen in keiner Beobachtung.
  function erzeugeKursprozess(z) {
    const startDollar = z.zwischen(MARKT.START_MIN, MARKT.START_MAX);
    let grund = Math.round(startDollar * 100);  // Kurs ohne Stoss und Preiswirkung, Cent je Unze (Kommazahl)
    let polster = 0;                             // Stoss aus dem Stop-Polster hinter einer Zone, klingt ab
    let phase = SEITWAERTS;
    let phaseRest = z.ganz(MARKT.DAUER_SEITWAERTS[0], MARKT.DAUER_SEITWAERTS[1]);
    let trend = 0;
    let welle = 0;                               // Trend: Schub (+1) oder Ruecklauf (-1)
    let welleRest = 0;
    let anker = grund;
    let haeufung = 1;
    let weitBis = -1;
    let trendAlter = 0;                          // Takte seit Beginn des Trends (fuer ANLAUF)
    const schwankung = MARKT.SCHWANKUNG * (1 + MARKT.CHARAKTER * (2 * z.gleich() - 1));
    const trendBasis = MARKT.TREND * (1 + MARKT.CHARAKTER * (2 * z.gleich() - 1));
    // Reaktionsgewichte dieses Spiels: je Spiel etwas anders
    const gewichte = MARKT.ZONE_REAKTION.map((zeile) => {
      const w = zeile.map((x) => x * (1 + MARKT.ZONE_STREUUNG * (2 * z.gleich() - 1)));
      const s = summe(w);
      return w.map((x) => x / s);
    });

    // Nachrichten: eine Ankuendigung zur Zeit
    let naechsteAnkuendigung = z.ganz(MARKT.NACHRICHT_ABSTAND[0] / 2, MARKT.NACHRICHT_ABSTAND[1] / 2);
    let nachricht = null;                        // { thema, eintritt }
    let letzteNachricht = null;                  // Takt des letzten Eintritts

    // Zonen: { preis (Cent), seite: +1 Widerstand (Kurs darunter) | -1
    // Unterstuetzung, beruehrungen, scharf: zaehlt die naechste Beruehrung,
    // abpraller: seit der Entstehung bzw. dem letzten Kippen, offen: nach dem
    // letzten Abprallen noch nicht wieder beruehrt (1 im Trend, 2 ausserhalb;
    // beides nur Statistik) }
    const zonen = [];
    let plan = null;                             // laufende Reaktion an einer Zone
    let zzRichtung = 1;                          // Zickzack: sucht ein Hoch (+1) oder Tief (-1)
    let zzExtrem = grund;
    // Statistik fuer die Messwerkzeuge: Zaehler je Reaktion; vorAbholung[k]:
    // Abholungen nach k Abprallern an derselben Zone (k = 0, 1, 2, ab 3);
    // nachAbprallern[k]: alle Reaktionen (Abprallen, Abholung, Ausbruch,
    // keine) bei einer Beruehrung nach k Abprallern; wieder[k]: dasselbe nur
    // bei der ersten Beruehrung nach dem k-ten Abprallen (k = 1, 2, ab 3;
    // fehlt sie, kam der Kurs nicht wieder); Ruhig: dasselbe nur ausserhalb
    // eines Trends
    const statistik = {
      zonen: 0, beruehrungen: 0, abpraller: 0, abholungen: 0, ausbrueche: 0, ohne: 0, gebrochen: 0, phasen: [0, 0, 0],
      vorAbholung: [0, 0, 0, 0], vorAbholungRuhig: [0, 0, 0, 0],
      nachAbprallern: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      nachAbprallernRuhig: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      wieder: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      wiederRuhig: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      jeBeruehrung: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
      jeBeruehrungRuhig: [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]
    };

    const kurs = () => grund + polster;

    // Neue Phase; ein Trend bekommt die vorgegebene oder eine zufaellige Richtung
    function phaseBeginnen(neu, richtung) {
      phase = neu;
      const dauer = neu === TREND ? MARKT.DAUER_TREND : neu === SEITWAERTS ? MARKT.DAUER_SEITWAERTS : MARKT.DAUER_HEKTIK;
      phaseRest = z.ganz(dauer[0], dauer[1]);
      trend = 0;
      if (neu === TREND) {
        const vorzeichen = richtung !== undefined ? richtung : z.gleich() < 0.5 ? -1 : 1;
        trend = vorzeichen * trendBasis * (1 + MARKT.TREND_STREUUNG * (2 * z.gleich() - 1));
        welle = 1;
        welleRest = z.ganz(MARKT.WELLE_IMPULS[0], MARKT.WELLE_IMPULS[1]);
        trendAlter = 0;
      }
      anker = grund;
    }

    // Drift je Takt: Trend in Wellen aus Schub und Ruecklauf, Seitwaerts mit
    // Zug zum Mittel, Hektik ohne Richtung. Ein neuer Trend kommt in ANLAUF
    // Takten (frei gelaufen) gleichmaessig auf volle Staerke
    function drift() {
      if (phase === SEITWAERTS) return (-MARKT.RUECKKEHR * (grund - anker)) / anker;
      if (phase === HEKTIK) return 0;
      welleRest -= 1;
      if (welleRest <= 0) {
        welle = -welle;
        const takte = welle > 0 ? MARKT.WELLE_IMPULS : MARKT.WELLE_RUECKLAUF;
        welleRest = z.ganz(takte[0], takte[1]);
      }
      trendAlter += 1;
      const anlauf = trendAlter < MARKT.ANLAUF ? trendAlter / MARKT.ANLAUF : 1;
      return anlauf * (welle > 0 ? trend * MARKT.IMPULS : -trend * MARKT.RUECKLAUF);
    }

    // Folgephase nach den Gewichten, ohne die Art der laufenden Phase
    function folgephase() {
      const w = MARKT.FOLGE.map((x, i) => (i === phase ? 0 : x));
      const s = summe(w);
      return z.wahl(w.map((x) => x / s));
    }

    function nachrichtBewegen(takt, ereignisse) {
      if (nachricht === null && takt >= naechsteAnkuendigung) {
        const thema = THEMEN[z.ganz(0, THEMEN.length - 1)];
        const vorlauf = z.ganz(MARKT.NACHRICHT_VORLAUF[0], MARKT.NACHRICHT_VORLAUF[1]);
        nachricht = { thema, eintritt: takt + vorlauf };
        ereignisse.push({ art: "nachricht", code: "angekuendigt", takt, thema, inTakten: vorlauf });
      }
      if (nachricht !== null && takt === nachricht.eintritt) {
        const richtung = z.gleich() < 0.5 ? -1 : 1;
        const sprung = z.zwischen(MARKT.NACHRICHT_SPRUNG[0], MARKT.NACHRICHT_SPRUNG[1]);
        const vorher = Math.round(kurs());
        grund *= 1 + richtung * sprung;
        ereignisse.push({
          art: "nachricht",
          code: "eingetreten",
          takt,
          thema: nachricht.thema,
          richtung: richtung > 0 ? "hoch" : "runter",
          sprung: Math.round(((Math.round(kurs()) - vorher) / vorher) * 10000) / 100
        });
        // Die Nachricht beendet jede laufende Reaktion an einer Zone
        plan = null;
        if (z.gleich() < MARKT.NACHRICHT_ZUG) phaseBeginnen(TREND, richtung);
        else phaseBeginnen(HEKTIK);
        weitBis = takt + MARKT.NACHRICHT_WEIT;
        letzteNachricht = takt;
        nachricht = null;
        naechsteAnkuendigung = takt + z.ganz(MARKT.NACHRICHT_ABSTAND[0], MARKT.NACHRICHT_ABSTAND[1]);
      }
    }

    // ----- Zonen -----
    // Die zuerst erreichte scharfe Zone, an die der Kurs p heranlaeuft, oder null
    function beruehrteZone(p, einheit) {
      let treffer = null;
      let vorneTreffer = 0;
      for (const zo of zonen) {
        if (!zo.scharf) continue;
        const vorne = zo.seite * (zo.preis - p);          // Abstand auf der Anlaufseite
        if (vorne <= MARKT.ZONE_NAEHE * einheit && (treffer === null || vorne < vorneTreffer)) {
          treffer = zo;
          vorneTreffer = vorne;
        }
      }
      return treffer;
    }

    // Reaktion an der Zone ziehen und als Plan aus Stufen { rest, ziel }
    // anlegen: in rest Takten auf ziel zu, mit gedaempfter Schwankung
    function planBeginnen(zo, einheit) {
      const w = gewichte[Math.min(zo.beruehrungen, gewichte.length) - 1].slice();
      if (phase === TREND) {
        const f = Math.sign(trend) === zo.seite ? MARKT.TREND_MIT : MARKT.TREND_GEGEN;
        for (let i = 0; i < f.length; i++) w[i] *= f[i];
      }
      const s = summe(w);
      const art = z.wahl(w.map((x) => x / s));
      const k = Math.min(zo.abpraller, 3);
      const nr = Math.min(zo.beruehrungen, 4) - 1;
      statistik.nachAbprallern[k][art] += 1;
      statistik.jeBeruehrung[nr][art] += 1;
      if (phase !== TREND) {
        statistik.nachAbprallernRuhig[k][art] += 1;
        statistik.jeBeruehrungRuhig[nr][art] += 1;
      }
      if (zo.offen > 0) {
        statistik.wieder[k][art] += 1;
        if (zo.offen === 2) statistik.wiederRuhig[k][art] += 1;
      }
      zo.offen = 0;
      zo.beruehrungen += 1;
      zo.scharf = false;
      statistik.beruehrungen += 1;
      const L = zo.preis;
      const r = zo.seite;
      const stufe = (takte, weg) => ({ rest: z.ganz(takte[0], takte[1]), ziel: L + r * weg * einheit });
      if (art === ABPRALL) {
        statistik.abpraller += 1;
        zo.abpraller += 1;
        zo.offen = phase === TREND ? 1 : 2;
        plan = { art, zone: zo, polster: 0, stufen: [
          { rest: 1, ziel: L + r * z.zwischen(MARKT.ABPRALL_UEBER[0], MARKT.ABPRALL_UEBER[1]) * einheit },
          stufe(MARKT.ABPRALL_TAKTE, -z.zwischen(MARKT.ABPRALL_WEG[0], MARKT.ABPRALL_WEG[1]))
        ] };
      } else if (art === ABHOLUNG) {
        statistik.abholungen += 1;
        statistik.vorAbholung[Math.min(zo.abpraller, 3)] += 1;
        if (phase !== TREND) statistik.vorAbholungRuhig[Math.min(zo.abpraller, 3)] += 1;
        // Tiefe meist flach, manchmal tief: untere Grenze + Spanne * gleich^2
        const g = z.gleich();
        const tiefe = MARKT.ABHOLUNG_TIEFE[0] + (MARKT.ABHOLUNG_TIEFE[1] - MARKT.ABHOLUNG_TIEFE[0]) * g * g;
        plan = { art, zone: zo, polster: r * z.zwischen(MARKT.POLSTER[0], MARKT.POLSTER[1]) * einheit, stufen: [
          stufe(MARKT.ABHOLUNG_TAKTE, tiefe),
          stufe(MARKT.UMKEHR_TAKTE, -z.zwischen(MARKT.UMKEHR_WEG[0], MARKT.UMKEHR_WEG[1]))
        ] };
      } else if (art === AUSBRUCH) {
        statistik.ausbrueche += 1;
        plan = { art, zone: zo, polster: r * z.zwischen(MARKT.POLSTER[0], MARKT.POLSTER[1]) * einheit, stufen: [
          stufe(MARKT.AUSBRUCH_TAKTE, z.zwischen(MARKT.AUSBRUCH_WEG[0], MARKT.AUSBRUCH_WEG[1]))
        ] };
      } else {
        statistik.ohne += 1;
      }
    }

    // Nach dem Kursschritt: Stufe weiterzaehlen, am Ende die Folgen
    function planWeiter(einheit) {
      const st = plan.stufen[0];
      st.rest -= 1;
      if (st.rest > 0) return;
      plan.stufen.shift();
      if (plan.stufen.length > 0) return;
      const zo = plan.zone;
      const r = zo.seite;
      const trendDorthin = phase === TREND && Math.sign(trend) === r;
      if (plan.art === ABPRALL) {
        // Nach dem Abprallen laeuft der Kurs oft wieder an dieselbe Zone (bis
        // eine Einheit davor): ausserhalb eines Trends meist, im Trend
        // manchmal, wenn ein Ruecklauf gegen den Trend in die Zone gelaufen
        // ist (Doppelboden bzw. Doppeltop). Die Zone ist wieder scharf, und
        // am Ende des Wiederanlaufs zieht die Reaktion mit den Gewichten des
        // naechsten Wiederanlaufs
        const zurueck = phase !== TREND ? MARKT.ABPRALL_ZURUECK : trendDorthin ? 0 : MARKT.ABPRALL_ZURUECK_TREND;
        if (z.gleich() < zurueck) {
          zo.scharf = true;
          plan = { art: ZURUECK, zone: zo, polster: 0, stufen: [
            { rest: z.ganz(MARKT.ZURUECK_TAKTE[0], MARKT.ZURUECK_TAKTE[1]), ziel: zo.preis - r * einheit }
          ] };
          return;
        }
      } else if (plan.art === ZURUECK) {
        // Wieder an der Zone: die naechste Reaktion beginnt sofort
        plan = null;
        if (zo.scharf) planBeginnen(zo, einheit);
        return;
      } else if (plan.art === ABHOLUNG) {
        // Liquiditaet geholt: die Zone ist verbraucht, der Kurs wechselt die
        // Seite -- manchmal als neuer Trend in Gegenrichtung (laeuft schon
        // einer dorthin, geht er weiter)
        zonen.splice(zonen.indexOf(zo), 1);
        if (z.gleich() < MARKT.UMKEHR_TREND && !(phase === TREND && Math.sign(trend) === -r)) phaseBeginnen(TREND, -r);
      } else if (plan.art === AUSBRUCH) {
        // Die Zone kippt: aus dem Widerstand wird eine Unterstuetzung und
        // umgekehrt. Ein Trend in Ausbruchsrichtung laeuft weiter; sonst
        // manchmal ein neuer Trend, oder die Seitwaertsphase verschiebt ihr
        // Mittel hinter die Zone; ein Trend dagegen ist vorbei
        zo.seite = -r;
        zo.beruehrungen = 1;
        zo.abpraller = 0;
        zo.scharf = false;
        if (trendDorthin) {
          // weiter
        } else if (z.gleich() < MARKT.AUSBRUCH_TREND) phaseBeginnen(TREND, r);
        else if (phase === TREND) phaseBeginnen(SEITWAERTS);
        else anker = grund;
      }
      plan = null;
    }

    function neueZone(preis, seite, einheit) {
      for (const zo of zonen) {
        if (Math.abs(zo.preis - preis) <= MARKT.ZONE_GLEICH * einheit) {
          zo.seite = seite;
          return;
        }
      }
      zonen.push({ preis, seite, beruehrungen: 1, scharf: false, abpraller: 0, offen: 0 });
      statistik.zonen += 1;
      if (zonen.length > MARKT.ZONE_MAX) {
        const i = plan !== null && zonen[0] === plan.zone ? 1 : 0;
        zonen.splice(i, 1);
      }
    }

    // Zonen pflegen: durchlaufene kippen, entfernte verfallen, neue aus
    // Hochs und Tiefs (Zickzack mit Ruecklauf ZONE_PIVOT)
    function zonenPflegen(einheit) {
      const p = kurs();
      for (let i = zonen.length - 1; i >= 0; i--) {
        const zo = zonen[i];
        if (plan !== null && plan.zone === zo) continue;
        const vorne = zo.seite * (zo.preis - p);
        if (vorne < -MARKT.ZONE_NAEHE * einheit) {
          zo.seite = -zo.seite;
          zo.beruehrungen = 1;
          zo.abpraller = 0;
          zo.offen = 0;
          zo.scharf = false;
          statistik.gebrochen += 1;
        } else if (!zo.scharf && vorne > MARKT.ZONE_ABSTAND * einheit) {
          zo.scharf = true;
        }
        if (Math.abs(zo.preis - p) > MARKT.ZONE_WEIT * einheit) zonen.splice(i, 1);
      }
      if (zzRichtung > 0) {
        if (p > zzExtrem) zzExtrem = p;
        else if (zzExtrem - p >= MARKT.ZONE_PIVOT * einheit) {
          neueZone(zzExtrem, 1, einheit);
          zzRichtung = -1;
          zzExtrem = p;
        }
      } else if (p < zzExtrem) zzExtrem = p;
      else if (p - zzExtrem >= MARKT.ZONE_PIVOT * einheit) {
        neueZone(zzExtrem, -1, einheit);
        zzRichtung = 1;
        zzExtrem = p;
      }
    }

    // Ein Takt: Nachricht, Phase, Haeufung, Kursschritt (frei oder nach dem
    // Plan einer Zonen-Reaktion), Zonen pflegen
    function schritt(takt, ereignisse) {
      polster *= REGELN.ABKLINGEN;
      nachrichtBewegen(takt, ereignisse);

      // Die Uhr einer Phase laeuft in jedem Takt, auch waehrend einer
      // Zonen-Reaktion: Abprallen, Wiederanlauf und Abholung kosten einen
      // Trend Zeit. Manchmal endet ein Trend mit einer Wende -- gleich ein
      // Trend in Gegenrichtung
      phaseRest -= 1;
      if (phaseRest <= 0) {
        if (phase === TREND && z.gleich() < MARKT.WENDE) phaseBeginnen(TREND, trend > 0 ? -1 : 1);
        else phaseBeginnen(folgephase());
      }
      statistik.phasen[phase] += 1;

      // Schwankungs-Haeufung: ruhige und unruhige Abschnitte wechseln sich ab
      haeufung += MARKT.HAEUFUNG_ZUG * (1 - haeufung) + MARKT.HAEUFUNG_STOSS * haeufung * z.normal();
      if (haeufung < MARKT.HAEUFUNG_MIN) haeufung = MARKT.HAEUFUNG_MIN;
      if (haeufung > MARKT.HAEUFUNG_MAX) haeufung = MARKT.HAEUFUNG_MAX;

      const faktor = phase === SEITWAERTS ? MARKT.SCHWANKUNG_SEITWAERTS : phase === HEKTIK ? MARKT.SCHWANKUNG_HEKTIK : 1;
      const sigma = schwankung * haeufung * faktor;
      const einheit = sigma * grund;
      const rauschen = z.normal();

      let neu = grund;
      if (plan === null) {
        neu = grund * (1 + drift() + sigma * rauschen);
        const zo = beruehrteZone(neu + polster, einheit);
        if (zo !== null) planBeginnen(zo, einheit);
      }
      if (plan !== null) {
        const st = plan.stufen[0];
        neu = grund + (st.ziel - grund) / st.rest + MARKT.PLAN_RAUSCHEN * einheit * rauschen;
        // Sticht der Kurs durch die Zone, loesen die Stops dahinter aus
        if (plan.polster !== 0 && plan.zone.seite * (neu + polster - plan.zone.preis) > 0) {
          polster += plan.polster;
          plan.polster = 0;
        }
      }
      grund = neu;
      if (plan !== null) planWeiter(einheit);
      zonenPflegen(einheit);
    }

    return {
      schritt,
      kurs,
      // Weite Spanne bei Hektik und kurz nach einer Nachricht
      weit: (takt) => phase === HEKTIK || takt < weitBis,
      nachricht: () => nachricht,
      letzteNachricht: () => letzteNachricht,
      statistik: () => Object.assign({}, statistik, {
        phasen: statistik.phasen.slice(),
        vorAbholung: statistik.vorAbholung.slice(),
        vorAbholungRuhig: statistik.vorAbholungRuhig.slice(),
        nachAbprallern: statistik.nachAbprallern.map((zeile) => zeile.slice()),
        nachAbprallernRuhig: statistik.nachAbprallernRuhig.map((zeile) => zeile.slice()),
        wieder: statistik.wieder.map((zeile) => zeile.slice()),
        wiederRuhig: statistik.wiederRuhig.map((zeile) => zeile.slice()),
        jeBeruehrung: statistik.jeBeruehrung.map((zeile) => zeile.slice()),
        jeBeruehrungRuhig: statistik.jeBeruehrungRuhig.map((zeile) => zeile.slice())
      }),
      zonen: () => zonen.map((zo) => ({ preis: dollar(zo.preis), seite: zo.seite, beruehrungen: zo.beruehrungen })),
      phase: () => phase
    };
  }

  // ---------- Der JKHD-Algo ----------
  // Bekommt je Takt eine Beobachtung (siehe beobachtungFuer) und antwortet mit
  // hoechstens einer Order, seinen Wuenschen fuer ruhende Orders und seinen
  // Ereignis-Codes. Sein Gedaechtnis baut er selbst aus den Beobachtungen auf;
  // mehr als diese erreicht ihn nicht. Zonen erkennt er selbst aus dem
  // Kursverlauf, so wie ein Mensch im Chart -- die Zonen des Markts kennt er
  // nicht, die Zukunft auch nicht.
  //
  // Sein Spiel: Im Trend (die gleitenden Mittel liegen EINSTIEG Bewegungen
  // auseinander) geht er mit, Stop hinter dem letzten Umkehrpunkt, je Kerze
  // nachgezogen; wird es hektisch (die Bewegung der letzten Takte ist HEKTIK
  // mal so gross wie ueblich) oder dreht der Trend, ist er sofort raus. Im
  // Seitwaertsmarkt handelt er gegen die Zonen: bei der ersten und zweiten
  // Beruehrung eines Tiefs kauft er die Umkehr, Stop ZONE_STOP hinter der Zone,
  // Ziel ZIEL Bewegungen oder bis kurz vor die naechste Zone. Wird eine Zone
  // kurz durchstochen (Abholung), steigt er sofort dagegen ein, Stop hinter dem
  // Stich. Nach einer Nachricht geht er mit, wenn der Kurs nach dem Sprung
  // weiterlaeuft. Er setzt so viel ein, wie die Positionsgrenze erlaubt, und
  // stockt auf, sobald das Kapital waechst.
  function erzeugeAlgo() {
    const aSchnell = 2 / (ALGO.MITTEL_SCHNELL + 1);
    const aLangsam = 2 / (ALGO.MITTEL_LANGSAM + 1);
    const aSchwankung = 2 / (ALGO.MITTEL_SCHWANKUNG + 1);
    const aHektik = 2 / (ALGO.MITTEL_HEKTIK + 1);
    const wirkung = REGELN.PREISWIRKUNG;
    const NAEHE_ZONE = 5;     // Bewegungen Abstand, bevor eine Zone erneut als beruehrt zaehlt

    const g = {
      takte: 0,
      schnell: 0,
      langsam: 0,
      schwankung: 0,
      hektik: 0,
      vorher: 0,
      davor: 0,
      eigeneWirkung: 0,       // eigene Preiswirkung nach den oeffentlichen Regeln
      bestand: 0,             // eigene Position nach der eigenen Order im letzten Takt
      bester: 0,
      imMarkt: false,
      art: null,              // "trend" | "zone" | "abholung" | "nachricht"
      einstiegKurs: 0,
      ruheBis: -1,            // bis dahin kein neuer Trend-Einstieg
      bereit: false,
      zzRichtung: 1,          // Zickzack: sucht ein Hoch (+1) oder Tief (-1)
      zzExtrem: 0,
      letztesHoch: null,      // juengste bestaetigte Umkehrpunkte
      letztesTief: null,
      hochs: [],              // erkannte Zonen: { preis, drueber, extrem, beruehrt, scharf, beruehrtTakt }
      tiefs: [],
      sprung: 0,              // Richtung des letzten Nachrichtensprungs, Kurs danach
      nachSprung: 0,
      stich: null             // Abholung in diesem Takt: { richtung, extrem }
    };

    function phase(b) {
      if (b.position > 0) return "long";
      if (b.position < 0) return "short";
      if (!g.bereit) return "beobachtet";
      if (b.nachricht && b.nachricht.inTakten <= ALGO.KEIN_EINSTIEG_VOR) return "nachricht";
      if (g.schwankung > 0 && g.hektik / g.schwankung > ALGO.HEKTIK) return "hektik";
      return "bereit";
    }

    // Zonen aus dem eigenen Kursverlauf: Hochs und Tiefs mit Ruecklauf ZONE.
    // Jede Annaeherung bis NAEHE zaehlt als Beruehrung (die naechste erst,
    // wenn der Kurs NAEHE_ZONE weit weg war). Durchsticht der Kurs eine Zone um
    // ABHOLUNG und ist binnen ABHOLUNG_TAKTE zurueck, war es eine Abholung
    // (merkt sich den Stich fuer den Einstieg dagegen); bleibt er laenger
    // dahinter, kippt die Zone (ein Hoch wird Unterstuetzung, ein Tief
    // Widerstand).
    function zonenLernen(takt, kurs, einheit, ereignisse) {
      g.stich = null;
      const merken = (liste, preis) => {
        liste.push({ preis, drueber: -1, extrem: preis, beruehrt: 0, scharf: false, beruehrtTakt: -99 });
        if (liste.length > 3) liste.shift();
      };
      if (g.zzRichtung > 0) {
        if (kurs > g.zzExtrem) g.zzExtrem = kurs;
        else if (g.zzExtrem - kurs >= ALGO.ZONE * einheit) {
          merken(g.hochs, g.zzExtrem);
          g.letztesHoch = g.zzExtrem;
          g.zzRichtung = -1;
          g.zzExtrem = kurs;
        }
      } else if (kurs < g.zzExtrem) g.zzExtrem = kurs;
      else if (kurs - g.zzExtrem >= ALGO.ZONE * einheit) {
        merken(g.tiefs, g.zzExtrem);
        g.letztesTief = g.zzExtrem;
        g.zzRichtung = 1;
        g.zzExtrem = kurs;
      }
      for (const [liste, andere, r] of [[g.hochs, g.tiefs, 1], [g.tiefs, g.hochs, -1]]) {
        for (let i = liste.length - 1; i >= 0; i--) {
          const zo = liste[i];
          const abstand = r * (zo.preis - kurs);     // > 0: Kurs diesseits der Zone
          if (zo.drueber < 0) {
            if (abstand >= NAEHE_ZONE * einheit) zo.scharf = true;
            else if (zo.scharf && abstand <= ALGO.NAEHE * einheit) {
              zo.scharf = false;
              zo.beruehrt += 1;
              zo.beruehrtTakt = takt;
            }
            if (-abstand >= ALGO.ABHOLUNG * einheit) {
              zo.drueber = takt;
              zo.extrem = kurs;
            }
          } else if (takt - zo.drueber > ALGO.ABHOLUNG_TAKTE) {
            liste.splice(i, 1);
            merken(andere, zo.preis);
          } else if (abstand > 0) {
            liste.splice(i, 1);
            g.stich = { richtung: r, extrem: zo.extrem, zone: zo.preis };
            ereignisse.push({ code: "abholung", richtung: r > 0 ? "oben" : "unten", zone: aufCent(zo.preis) });
          } else if (r * (kurs - zo.extrem) > 0) zo.extrem = kurs;
        }
      }
    }

    // Stop nie knapp hinter eine Zone: Liegt eine Unterstuetzung (bei Long)
    // weniger als ZONE_PUFFER vom Stop entfernt, wandert der Stop ZONE_PUFFER
    // unter sie; bei Short spiegelbildlich
    function stopHinterZone(long, kurs, stop, einheit) {
      const puffer = ALGO.ZONE_PUFFER * einheit;
      for (const zo of long ? g.tiefs : g.hochs) {
        if (long && zo.preis < kurs && Math.abs(stop - zo.preis) < puffer) stop = Math.min(stop, zo.preis - puffer);
        if (!long && zo.preis > kurs && Math.abs(stop - zo.preis) < puffer) stop = Math.max(stop, zo.preis + puffer);
      }
      return aufCent(stop);
    }

    // Naechste Zone auf der Gegenseite (Widerstand bei Long, Unterstuetzung bei Short)
    function naechsteZone(long, kurs) {
      let beste = null;
      for (const zo of long ? g.hochs : g.tiefs) {
        if (long ? zo.preis > kurs : zo.preis < kurs) {
          if (beste === null || Math.abs(zo.preis - kurs) < Math.abs(beste - kurs)) beste = zo.preis;
        }
      }
      return beste;
    }

    function entscheiden(b) {
      const ereignisse = [];
      const schutz = [];

      // Eigene Preiswirkung herausrechnen: Der Algo misst den Markt, nicht sich
      // selbst. Er schaetzt sie aus den oeffentlichen Regeln (PREISWIRKUNG,
      // ABKLINGEN); die Wirkung fremder Orders bleibt im Kurs. Dazu gehoert
      // auch sein eigener ruhender Stop oder sein Ziel: Ist die Position seit
      // dem letzten Takt ohne eigene Order zu Ende, hat eine ruhende Order in
      // Schritt 2 dieses Takts glattgestellt, nach dem Abklingen.
      g.eigeneWirkung *= REGELN.ABKLINGEN;
      if (g.bestand !== 0 && b.position === 0) g.eigeneWirkung -= wirkung * g.bestand;
      const kurs = b.kurs - g.eigeneWirkung;

      // Gleitende Mittel, uebliche Bewegung, Bewegung der letzten Takte
      if (g.takte === 0) {
        g.schnell = kurs;
        g.langsam = kurs;
        g.schwankung = kurs * 0.0003;
        g.hektik = g.schwankung;
        g.zzExtrem = kurs;
      } else {
        const schritt = Math.abs(kurs - g.vorher);
        g.schnell += aSchnell * (kurs - g.schnell);
        g.langsam += aLangsam * (kurs - g.langsam);
        g.schwankung += aSchwankung * (schritt - g.schwankung);
        g.hektik += aHektik * (schritt - g.hektik);
      }
      const einheit = g.schwankung;
      const staerke = (g.schnell - g.langsam) / einheit;
      const hektisch = g.hektik / einheit > ALGO.HEKTIK;
      zonenLernen(b.takt, kurs, einheit, ereignisse);

      // Nachrichtensprung: Richtung merken und den Kurs danach
      if (b.seitNachricht === 0) {
        g.sprung = kurs >= g.vorher ? 1 : -1;
        g.nachSprung = kurs;
      }
      g.davor = g.takte === 0 ? kurs : g.vorher;   // Kurs des vorigen Takts
      g.vorher = kurs;
      g.takte += 1;

      if (g.imMarkt && b.position === 0) {
        g.imMarkt = false;
        if (g.art === "trend" || g.art === "nachricht") g.ruheBis = b.takt + ALGO.RUHE;
        g.art = null;
      }

      // Jede Antwort geht hier durch; der Algo merkt sich seine Position nach
      // der eigenen Order (glatt: 0, sonst die Menge dazu bzw. davon)
      const antwort = (order) => {
        g.bestand = !order ? b.position : order.aktion === "glatt" ? 0 : b.position + (order.aktion === "kauf" ? order.menge : -order.menge);
        return { order, schutz, ereignisse };
      };
      const glatt = (code, extra) => {
        ereignisse.push(Object.assign({ code }, extra));
        g.eigeneWirkung -= wirkung * b.position;
        return antwort({ aktion: "glatt", menge: Math.abs(b.position) });
      };
      const vorNachricht = (takte) => b.nachricht && b.nachricht.inTakten <= takte;

      // ----- Mit Position: aussteigen, Stop nachziehen, aufstocken -----
      if (b.position !== 0) {
        const long = b.position > 0;
        const richtung = long ? 1 : -1;
        if (vorNachricht(ALGO.FLACH_VOR)) return glatt("vor_nachricht", { thema: b.nachricht.thema });
        if (g.art === "trend" || g.art === "nachricht") {
          if (hektisch) return glatt("hektik", {});
          if (richtung * staerke <= -ALGO.TRENDENDE) return glatt("trendende", {});
        }

        // Stop je Kerze nachziehen: hinter den letzten Umkehrpunkt, mindestens
        // NACHZIEHEN hinter dem besten Kurs; nie zurueck und nie auf die
        // falsche Seite des Kurses (dann greift ohnehin die ruhende Order)
        g.bester = long ? Math.max(g.bester, kurs) : Math.min(g.bester, kurs);
        let stop = b.sl;
        const imGewinn = richtung * (kurs - g.einstiegKurs) >= ALGO.BREAKEVEN * einheit;
        if (g.art !== "zone" && g.art !== "abholung" && (b.takt % REGELN.KERZE_TAKTE === 0 || imGewinn)) {
          let ziel = g.bester - richtung * ALGO.NACHZIEHEN * einheit;
          // im Gewinn: mindestens auf den Einstand (plus eine halbe Bewegung)
          if (imGewinn) {
            const einstand = g.einstiegKurs + richtung * 0.5 * einheit;
            if (long ? einstand > ziel : einstand < ziel) ziel = einstand;
          }
          const umkehr = long ? g.letztesTief : g.letztesHoch;
          if (umkehr !== null) {
            const hinterUmkehr = umkehr - richtung * ALGO.ZONE_PUFFER * einheit;
            if (long ? hinterUmkehr > ziel : hinterUmkehr < ziel) ziel = hinterUmkehr;
          }
          ziel = stopHinterZone(long, kurs, ziel, einheit);
          const besser = stop === null || (long ? ziel > stop : ziel < stop);
          const gueltig = long ? ziel < b.geld : ziel > b.brief;
          if (besser && gueltig) {
            stop = ziel;
            schutz.push({ typ: "sl", preis: ziel });
          }
        }

        // Aufstocken: Mit dem Kapital waechst die Positionsgrenze. Erlaubt sie
        // mindestens NACHKAUF der Position zusaetzlich, kauft er nach -- nie
        // kurz vor einer Nachricht und nie so viel, dass der Stop der ganzen
        // Position mehr als RISIKO kostet.
        if (stop === null || vorNachricht(ALGO.KEIN_EINSTIEG_VOR)) return antwort(null);
        const bisStop = Math.abs(kurs - stop) * UNZEN;                 // Dollar je Kontrakt
        const nachRisiko = Math.floor((ALGO.RISIKO * b.kapital) / bisStop) - Math.abs(b.position);
        const zukauf = Math.min(long ? b.maxKauf : b.maxVerkauf, nachRisiko);
        if (zukauf < Math.max(1, ALGO.NACHKAUF * Math.abs(b.position))) return antwort(null);
        g.eigeneWirkung += wirkung * (long ? zukauf : -zukauf);
        ereignisse.push({ code: "nachkauf", menge: zukauf });
        return antwort({ aktion: long ? "kauf" : "verkauf", menge: zukauf });
      }

      // ----- Ohne Position: Einstiege -----
      if (g.takte < ALGO.AUFWAERMEN) return antwort(null);
      if (!g.bereit) {
        g.bereit = true;
        ereignisse.push({ code: "bereit" });
      }
      if (vorNachricht(ALGO.KEIN_EINSTIEG_VOR)) return antwort(null);

      // Einstieg: Richtung, Stop und (im Seitwaertsmarkt) Ziel; Menge so, dass
      // der Stop hoechstens RISIKO kostet und die Positionsgrenze haelt
      const einsteigen = (long, stop, ziel, art, grund) => {
        stop = stopHinterZone(long, kurs, stop, einheit);
        if (long ? stop >= b.geld : stop <= b.brief) return antwort(null);
        const abstand = Math.abs(kurs - stop);                          // Dollar je Unze
        const nachRisiko = Math.floor((ALGO.RISIKO * b.kapital) / (abstand * UNZEN));
        const menge = Math.min(nachRisiko, long ? b.maxKauf : b.maxVerkauf);
        if (menge < 1) return antwort(null);
        // Das Ziel muss auch nach der eigenen Preiswirkung der Order noch jenseits
        // des Kurses liegen (eine grosse Order verschiebt den Kurs um WIRKUNG je
        // Kontrakt); liegt es zu nah, rueckt es so weit hinaus
        if (ziel !== null) {
          const schub = wirkung * menge + einheit;
          ziel = long ? Math.max(ziel, b.brief + schub) : Math.min(ziel, b.geld - schub);
        }
        g.imMarkt = true;
        g.art = art;
        g.bester = kurs;
        g.einstiegKurs = kurs;
        g.eigeneWirkung += wirkung * (long ? menge : -menge);
        const e = { code: "einstieg", richtung: long ? "long" : "short", menge, stop, grund };
        if (ziel !== null) e.ziel = aufCent(ziel);
        ereignisse.push(e);
        schutz.push({ typ: "sl", preis: stop });
        if (ziel !== null) schutz.push({ typ: "tp", preis: aufCent(ziel) });
        return antwort({ aktion: long ? "kauf" : "verkauf", menge });
      };

      // 1. Abholung: gegen den Stich, Stop dahinter, Ziel ZIEL Bewegungen
      if (g.stich !== null) {
        const long = g.stich.richtung < 0;      // ein Tief wurde abgeholt -> long
        const stop = g.stich.extrem - (long ? 1 : -1) * ALGO.ABHOLUNG_PUFFER * einheit;
        const ziel = kurs + (long ? 1 : -1) * ALGO.ZIEL * einheit;
        return einsteigen(long, stop, ziel, "abholung", "abholung");
      }

      // 2. Nach einer Nachricht: laeuft der Kurs weiter in Sprungrichtung, mitgehen
      if (b.seitNachricht === ALGO.NACHRICHT_MIT && g.sprung !== 0) {
        const long = g.sprung > 0;
        if ((kurs - g.nachSprung) * g.sprung >= 0.3 * einheit) {
          const stop = kurs - (long ? 1 : -1) * ALGO.STOP * einheit;
          return einsteigen(long, stop, null, "nachricht", "nachricht");
        }
      }

      if (hektisch) return antwort(null);

      // 3. Trend: Stop hinter dem letzten Umkehrpunkt (STOP .. STOP_MAX Bewegungen);
      // nach dem Ende eines Trend-Trades erst RUHE Takte spaeter wieder
      if (Math.abs(staerke) >= ALGO.EINSTIEG && b.takt >= g.ruheBis) {
        const long = staerke > 0;
        const umkehr = long ? g.letztesTief : g.letztesHoch;
        let abstand = ALGO.STOP * einheit;
        if (umkehr !== null) {
          const bisUmkehr = (long ? kurs - umkehr : umkehr - kurs) + ALGO.ZONE_PUFFER * einheit;
          abstand = Math.min(Math.max(abstand, bisUmkehr), ALGO.STOP_MAX * einheit);
        }
        return einsteigen(long, kurs - (long ? 1 : -1) * abstand, null, "trend", "trend");
      }

      // 4. Seitwaertsmarkt: gegen eine gerade beruehrte Zone, bis zur
      // ABPRALLER-ten Beruehrung, wenn der Kurs von ihr wegdreht
      for (const [liste, long] of [[g.tiefs, true], [g.hochs, false]]) {
        for (const zo of liste) {
          if (zo.drueber >= 0 || zo.beruehrt === 0 || zo.beruehrt > ALGO.ABPRALLER) continue;
          if (b.takt - zo.beruehrtTakt > 3) continue;
          const richtung = long ? 1 : -1;
          if (richtung * (kurs - zo.preis) <= 0 || richtung * (kurs - zo.preis) > 3 * einheit) continue;
          if (richtung * (kurs - g.davor) <= 0) continue;           // dreht noch nicht weg
          const stop = zo.preis - richtung * ALGO.ZONE_STOP * einheit;
          let ziel = kurs + richtung * ALGO.ZIEL * einheit;
          const gegen = naechsteZone(long, kurs);
          if (gegen !== null) ziel = long ? Math.min(ziel, gegen - einheit) : Math.max(ziel, gegen + einheit);
          if (richtung * (ziel - kurs) < 4 * einheit) continue;
          return einsteigen(long, stop, ziel, "zone", "zone");
        }
      }
      return antwort(null);
    }

    return { entscheiden, phase };
  }

  // ---------- Ein Spiel ----------
  function neuesSpiel(saat) {
    if (!Number.isInteger(saat) || saat < 0 || saat > 4294967295) {
      throw new TypeError("saat: ganze Zahl von 0 bis 4294967295 erwartet");
    }
    // Der Zufallsgenerator gehoert allein dem Kursprozess
    const markt = erzeugeKursprozess(zufallsgenerator(saat));
    let wirkungCent = 0;                         // Preiswirkung beider Spieler, ganze Cent

    let takt = 0;
    let beendet = false;
    let sieger = null;
    let endgrund = null;

    const neuesKonto = () => ({
      bargeld: START_CENT,
      position: 0,
      einstand: null,          // Durchschnittskurs der offenen Position, Cent je Unze
      gebuehren: 0,
      trades: 0,
      kapitalEroeffnung: 0,    // Kapital vor dem Eroeffnen der offenen Position
      sl: null,                // ruhende Orders: Marke in ganzen Cent je Unze oder null
      tp: null
    });
    const du = neuesKonto();
    const algoKonto = neuesKonto();
    const algo = erzeugeAlgo();

    const kerzen = [];

    // ----- Kurse -----
    const halbeSpanne = () => (markt.weit(takt) ? HALBE_SPANNE_WEIT_CENT : HALBE_SPANNE_CENT);
    const mitte = () => Math.max(Math.round(markt.kurs()) + wirkungCent, HALBE_SPANNE_WEIT_CENT + 100);
    const geld = () => mitte() - halbeSpanne();
    const brief = () => mitte() + halbeSpanne();

    // ----- Konten -----
    // Kapital = Bargeld + Erloes, wenn die ganze Position jetzt glattgestellt
    // wuerde: Long zum Geldkurs, Short zum Briefkurs, jeweils samt der eigenen
    // Preiswirkung und der Gebuehr. Glattstellen aendert das Kapital deshalb
    // nicht, und eine Order kann den eigenen Kontostand nie hochtreiben.
    // oben: Geld- bzw. Briefkurs, zu dem gerechnet wird (Cent je Unze).
    function kapitalZu(k, oben) {
      const p = k.position;
      if (p > 0) return k.bargeld + UNZEN * p * oben - (UNZEN / 2) * WIRKUNG_CENT * p * p - GEBUEHR_CENT * p;
      if (p < 0) return k.bargeld - UNZEN * -p * oben - (UNZEN / 2) * WIRKUNG_CENT * p * p + GEBUEHR_CENT * p;
      return k.bargeld;
    }
    const kapital = (k) => kapitalZu(k, k.position > 0 ? geld() : brief());

    // Durchschnittskurs, zu dem die ganze Position jetzt glattgestellt wuerde
    // (samt eigener Preiswirkung, ohne Gebuehr), Cent je Unze
    function glattKurs(k) {
      const n = Math.abs(k.position);
      return k.position > 0 ? geld() - (WIRKUNG_CENT / 2) * n : brief() + (WIRKUNG_CENT / 2) * n;
    }

    // Positionsgrenze: Nennwert hoechstens HEBEL x Kapital (zum Mittelkurs)
    function grenze(k) {
      const kap = kapital(k);
      if (kap <= 0) return 0;
      return Math.floor((REGELN.HEBEL * kap) / (UNZEN * mitte()));
    }
    const maxKaufFuer = (k) => Math.max(0, grenze(k) - k.position);
    const maxVerkaufFuer = (k) => Math.max(0, grenze(k) + k.position);

    // Die eine Ausfuehrung fuer beide Spieler. Das Orderbuch ist linear: der
    // n-te Kontrakt einer Order kostet WIRKUNG * n mehr als der erste, danach
    // steht der Kurs um WIRKUNG * Menge verschoben und klingt ab.
    // Wechselt eine Order die Seite, rechnet sie in zwei Teilen: erst die alte
    // Position schliessen, dann den Rest eroeffnen. Bei linearer Preiswirkung
    // kostet das auf den Cent dasselbe wie ein Stueck (5c^2 + 10cn + 5n^2 =
    // 5(c+n)^2), aber Ergebnis, Einstand und Eroeffnungskapital gehoeren so
    // jeweils zur richtigen Position. Nach aussen bleibt es eine Order.
    function ausfuehren(k, wer, signiert) {
      const alt = k.position;
      const wechsel = alt !== 0 && Math.sign(signiert) !== Math.sign(alt) && Math.abs(signiert) > Math.abs(alt);
      const teile = wechsel ? [-alt, signiert + alt] : [signiert];
      let betrag = 0;
      let gebuehr = 0;
      let ergebnis = null;
      for (const teil of teile) {
        const t = teilAusfuehren(k, teil);
        betrag += t.betrag;
        gebuehr += t.gebuehr;
        if (t.ergebnis !== null) ergebnis = t.ergebnis;
      }
      k.trades += 1;

      const menge = Math.abs(signiert);
      const ereignis = {
        art: "trade",
        wer,
        takt,
        aktion: signiert > 0 ? "kauf" : "verkauf",
        menge,
        preis: Math.round(betrag / (UNZEN * menge)) / 100,
        betrag: dollar(betrag),
        gebuehr: dollar(gebuehr),
        position: k.position
      };
      if (ergebnis !== null) ereignis.ergebnis = dollar(ergebnis);
      return ereignis;
    }

    // Ein Teil einer Order: eroeffnet, vergroessert, verkleinert oder schliesst
    // die Position, wechselt aber nie die Seite. Liefert Betrag und Gebuehr in
    // Cent und das Ergebnis, wenn die Position damit endet: Kapitalveraenderung
    // seit ihrer Eroeffnung, alle Kosten eingerechnet.
    function teilAusfuehren(k, signiert) {
      const menge = Math.abs(signiert);
      const kaufen = signiert > 0;
      const kapitalVorher = kapital(k);
      const wirkung = (UNZEN / 2) * WIRKUNG_CENT * menge * menge;
      const betrag = kaufen ? UNZEN * menge * brief() + wirkung : UNZEN * menge * geld() - wirkung;
      const gebuehr = GEBUEHR_CENT * menge;
      k.bargeld += kaufen ? -betrag - gebuehr : betrag - gebuehr;
      k.gebuehren += gebuehr;

      const alt = k.position;
      const neu = alt + signiert;
      const schnitt = betrag / (UNZEN * menge);
      if (alt === 0) {
        k.einstand = schnitt;
        k.kapitalEroeffnung = kapitalVorher;
      } else if (Math.sign(alt) === Math.sign(signiert)) {
        k.einstand = (k.einstand * Math.abs(alt) + schnitt * menge) / (Math.abs(alt) + menge);
      } else if (neu === 0) {
        k.einstand = null;
      }
      k.position = neu;
      wirkungCent += WIRKUNG_CENT * signiert;
      return { betrag, gebuehr, ergebnis: alt !== 0 && neu === 0 ? kapital(k) - k.kapitalEroeffnung : null };
    }

    // Ruhende Orders eines Kontos verfallen (Position zu Ende, Seitenwechsel,
    // Spielende); je Order ein Ereignis
    function verfallen(k, wer, ereignisse) {
      for (const typ of ["sl", "tp"]) {
        if (k[typ] === null) continue;
        ereignisse.push({ art: "schutz", takt, wer, code: "verfallen", typ, preis: dollar(k[typ]) });
        k[typ] = null;
      }
    }

    // Prueft eine Order gegen dieselben Regeln fuer beide Spieler
    function pruefen(k, aktion, menge) {
      if (beendet) return "beendet";
      if (aktion === "glatt") return k.position === 0 ? "keine_position" : null;
      if (aktion !== "kauf" && aktion !== "verkauf") return "aktion_ungueltig";
      if (!Number.isInteger(menge) || menge < 1) return "menge_ungueltig";
      const max = aktion === "kauf" ? maxKaufFuer(k) : maxVerkaufFuer(k);
      return menge > max ? "grenze" : null;
    }

    function handeln(k, wer, aktion, menge) {
      const fehler = pruefen(k, aktion, menge);
      if (fehler) return { ok: false, fehler };
      const alt = k.position;
      const signiert = aktion === "glatt" ? -k.position : aktion === "kauf" ? menge : -menge;
      const ereignis = ausfuehren(k, wer, signiert);
      const ereignisse = [ereignis];
      if (alt !== 0 && Math.sign(k.position) !== Math.sign(alt)) verfallen(k, wer, ereignisse);
      kerzeFortschreiben();
      return { ok: true, ereignis, ereignisse };
    }

    // Ruhende Order setzen, verschieben oder entfernen -- dieselbe Pruefung
    // fuer beide Spieler
    function schutzSetzen(k, wer, typ, preis) {
      if (beendet) return { ok: false, fehler: "beendet" };
      if (typ !== "sl" && typ !== "tp") return { ok: false, fehler: "typ_ungueltig" };
      if (preis === null) {
        if (k[typ] === null) return { ok: true, ereignis: null };
        const ereignis = { art: "schutz", takt, wer, code: "entfernt", typ, preis: dollar(k[typ]) };
        k[typ] = null;
        return { ok: true, ereignis };
      }
      if (typeof preis !== "number" || !Number.isFinite(preis) || Math.round(preis * 100) <= 0) {
        return { ok: false, fehler: "preis_ungueltig" };
      }
      if (k.position === 0) return { ok: false, fehler: "keine_position" };
      const marke = Math.round(preis * 100);
      const long = k.position > 0;
      const richtig = typ === "sl" ? (long ? marke < geld() : marke > brief()) : long ? marke > geld() : marke < brief();
      if (!richtig) return { ok: false, fehler: "preis_seite" };
      const vorher = k[typ];
      k[typ] = marke;
      return {
        ok: true,
        ereignis: { art: "schutz", takt, wer, code: "gesetzt", typ, preis: dollar(marke), vorher: vorher === null ? null : dollar(vorher) }
      };
    }

    // Welche ruhende Order eines Kontos ist faellig, und wie weit hat der
    // Kurs ihre Marke ueberschritten (Cent je Unze)? Hoechstens eine je Konto:
    // SL und TP liegen auf verschiedenen Seiten des Kurses.
    function faellig(k) {
      if (k.position === 0) return null;
      const long = k.position > 0;
      if (k.sl !== null) {
        const ueber = long ? k.sl - geld() : brief() - k.sl;
        if (ueber >= 0) return { typ: "sl", ueber };
      }
      if (k.tp !== null) {
        const schnitt = glattKurs(k);
        const ueber = long ? schnitt - k.tp : k.tp - schnitt;
        if (ueber >= 0) return { typ: "tp", ueber };
      }
      return null;
    }

    // Schritt 2 eines Takts: ruhende Orders beider Spieler (Reihenfolge siehe
    // Kopf der Datei). Jede ausgeloeste Order schliesst eine Position; mehr
    // als zwei Ausfuehrungen kann es in einem Takt nicht geben.
    function schutzPruefen(ereignisse) {
      const reihe = takt % 2 === 0 ? [[du, "du"], [algoKonto, "algo"]] : [[algoKonto, "algo"], [du, "du"]];
      for (;;) {
        let wahl = null;
        for (const [k, wer] of reihe) {
          const f = faellig(k);
          if (f !== null && (wahl === null || f.ueber > wahl.ueber)) wahl = { k, wer, typ: f.typ, ueber: f.ueber };
        }
        if (wahl === null) return;
        const { k, wer, typ } = wahl;
        ereignisse.push({ art: "schutz", takt, wer, code: "ausgeloest", typ, preis: dollar(k[typ]) });
        k[typ] = null;
        const trade = ausfuehren(k, wer, -k.position);
        trade.schutz = typ;
        ereignisse.push(trade);
        verfallen(k, wer, ereignisse);
        kerzeFortschreiben();
      }
    }

    // ----- Beobachtung: das Einzige, was ein Spieler vom Markt erfaehrt -----
    function beobachtungFuer(k) {
      const gegner = k === du ? algoKonto : du;
      const nachricht = markt.nachricht();
      const letzte = markt.letzteNachricht();
      return Object.freeze({
        takt,
        kurs: dollar(mitte()),
        geld: dollar(geld()),
        brief: dollar(brief()),
        nachricht: nachricht
          ? Object.freeze({ thema: nachricht.thema, inTakten: nachricht.eintritt - takt })
          : null,
        seitNachricht: letzte === null ? null : takt - letzte,
        position: k.position,
        einstand: k.einstand === null ? null : Math.round(k.einstand) / 100,
        kapital: dollar(kapital(k)),
        bargeld: dollar(k.bargeld),
        maxKauf: maxKaufFuer(k),
        maxVerkauf: maxVerkaufFuer(k),
        sl: k.sl === null ? null : dollar(k.sl),
        tp: k.tp === null ? null : dollar(k.tp),
        gegner: Object.freeze({ position: gegner.position, kapital: dollar(kapital(gegner)) })
      });
    }

    // ----- Kerzen -----
    function kerzeFortschreiben() {
      const m = mitte();
      const beginn = takt - (takt % REGELN.KERZE_TAKTE);
      const letzte = kerzen[kerzen.length - 1];
      if (letzte && letzte.takt === beginn) {
        if (m > letzte.h) letzte.h = m;
        if (m < letzte.l) letzte.l = m;
        letzte.c = m;
        return;
      }
      kerzen.push({ takt: beginn, o: m, h: m, l: m, c: m });
      if (kerzen.length > REGELN.KERZEN_MAX) kerzen.shift();
    }

    // ----- Spielende -----
    // Feste Reihenfolge nach jedem Takt:
    //  1. Kapital beider Spieler zum selben Zeitpunkt feststellen.
    //  2. Hat einer 1.000.000 erreicht, gewinnt er. Beide zugleich: das hoehere
    //     Kapital gewinnt, bei Gleichstand unentschieden.
    //  3. Sonst: Ist einer unter 10.000, ist er pleite und der andere gewinnt.
    //     Beide zugleich: das hoehere Kapital gewinnt, Gleichstand unentschieden.
    //  4. Pleite Konten werden zwangsweise glattgestellt -- beide zu denselben
    //     Kursen, das Kapital aendert sich dabei nicht. Weil danach nicht mehr
    //     gehandelt wird, verschiebt diese Abrechnung den Kurs nicht mehr.
    //  5. Alle ruhenden Orders verfallen.
    function endePruefen(ereignisse) {
      const kDu = kapital(du);
      const kAlgo = kapital(algoKonto);
      const duZiel = kDu >= ZIEL_CENT;
      const algoZiel = kAlgo >= ZIEL_CENT;
      const duPleite = kDu < PLEITE_CENT;
      const algoPleite = kAlgo < PLEITE_CENT;
      const hoeher = () => (kDu > kAlgo ? "du" : kAlgo > kDu ? "algo" : "unentschieden");

      if (duZiel || algoZiel) {
        sieger = duZiel && algoZiel ? hoeher() : duZiel ? "du" : "algo";
        endgrund = "ziel";
      } else if (duPleite || algoPleite) {
        sieger = duPleite && algoPleite ? hoeher() : duPleite ? "algo" : "du";
        endgrund = "pleite";
      } else {
        return;
      }
      beendet = true;

      // Zwangsglattstellung, beide zu den Kursen des Spielendes
      const pleite = [];
      if (duPleite && du.position !== 0) pleite.push([du, "du"]);
      if (algoPleite && algoKonto.position !== 0) pleite.push([algoKonto, "algo"]);
      const wirkungEnde = wirkungCent;
      for (const [k, wer] of pleite) {
        const ereignis = ausfuehren(k, wer, -k.position);
        ereignis.zwang = true;
        ereignisse.push(ereignis);
        wirkungCent = wirkungEnde;
      }
      verfallen(du, "du", ereignisse);
      verfallen(algoKonto, "algo", ereignisse);

      ereignisse.push({
        art: "ende",
        takt,
        sieger,
        grund: endgrund,
        pleiteDu: duPleite,
        pleiteAlgo: algoPleite,
        kapitalDu: dollar(kDu),
        kapitalAlgo: dollar(kAlgo)
      });
    }

    // ----- Oeffentliche Methoden -----

    // Ein Takt in der festen Reihenfolge aus dem Kopf der Datei. Liefert die
    // Ereignisse dieses Takts (leere Liste, wenn nichts geschah).
    function schritt() {
      if (beendet) return [];
      takt += 1;
      const ereignisse = [];

      // 1. Kursprozess; die Preiswirkung klingt ab (ganze Cent, Richtung null)
      markt.schritt(takt, ereignisse);
      wirkungCent = Math.trunc(wirkungCent * REGELN.ABKLINGEN);
      kerzeFortschreiben();

      // 2. Ruhende Orders beider Spieler
      schutzPruefen(ereignisse);

      // 3. Der Algo: erst die Order, dann seine ruhenden Orders
      const b = beobachtungFuer(algoKonto);
      const antwort = algo.entscheiden(b);
      for (const e of antwort.ereignisse) ereignisse.push(Object.assign({ art: "algo", takt }, e));
      if (antwort.order) {
        const r = handeln(algoKonto, "algo", antwort.order.aktion, antwort.order.menge);
        if (!r.ok) throw new Error("JKHD-Algo: ungueltige Order (" + r.fehler + ")");
        ereignisse.push(...r.ereignisse);
      }
      for (const s of antwort.schutz) {
        const r = schutzSetzen(algoKonto, "algo", s.typ, s.preis);
        if (!r.ok) throw new Error("JKHD-Algo: ungueltige ruhende Order (" + r.fehler + ")");
        if (r.ereignis) ereignisse.push(r.ereignis);
      }

      // 4. Spielende
      kerzeFortschreiben();
      endePruefen(ereignisse);
      return ereignisse;
    }

    // Order des Menschen, sofort zum aktuellen Kurs samt Preiswirkung.
    // aktion: "kauf" | "verkauf" | "glatt" (glatt schliesst die ganze Position,
    // menge wird dann nicht gebraucht). menge: ganze Kontrakte >= 1.
    function order(aktion, menge) {
      return handeln(du, "du", aktion, menge);
    }

    // Ruhende Order des Menschen setzen, verschieben oder entfernen
    function schutz(typ, preis) {
      return schutzSetzen(du, "du", typ, preis);
    }

    // Ergebnis der ganzen Position, wenn die ruhende Order typ genau auf der
    // Marke preis ausgeloest wuerde (siehe Kopf der Datei)
    function ergebnisBei(typ, preis) {
      if (du.position === 0 || (typ !== "sl" && typ !== "tp")) return null;
      if (typeof preis !== "number" || !Number.isFinite(preis) || Math.round(preis * 100) <= 0) return null;
      const marke = Math.round(preis * 100);
      const n = Math.abs(du.position);
      // tp: Durchschnittskurs = Marke, also Geld- bzw. Briefkurs um die
      // halbe eigene Preiswirkung dahinter
      const oben = typ === "sl" ? marke : du.position > 0 ? marke + (WIRKUNG_CENT / 2) * n : marke - (WIRKUNG_CENT / 2) * n;
      return dollar(kapitalZu(du, oben) - du.kapitalEroeffnung);
    }

    function maxMenge(aktion) {
      if (beendet) return 0;
      return aktion === "verkauf" ? maxVerkaufFuer(du) : maxKaufFuer(du);
    }

    function kontoSicht(k) {
      return {
        kapital: dollar(kapital(k)),
        bargeld: dollar(k.bargeld),
        position: k.position,
        einstand: k.einstand === null ? null : Math.round(k.einstand) / 100,
        offen: k.position === 0 ? null : dollar(kapital(k) - k.kapitalEroeffnung),
        gebuehren: dollar(k.gebuehren),
        trades: k.trades,
        maxKauf: beendet ? 0 : maxKaufFuer(k),
        maxVerkauf: beendet ? 0 : maxVerkaufFuer(k),
        sl: k.sl === null ? null : dollar(k.sl),
        tp: k.tp === null ? null : dollar(k.tp)
      };
    }

    function zustand() {
      const algoSicht = kontoSicht(algoKonto);
      algoSicht.phase = algo.phase(beobachtungFuer(algoKonto));
      algoSicht.stop = algoSicht.sl;
      const nachricht = markt.nachricht();
      return {
        saat,
        takt,
        sekunden: (takt * REGELN.TAKT_MS) / 1000,
        kurs: dollar(mitte()),
        geld: dollar(geld()),
        brief: dollar(brief()),
        spanne: dollar(brief() - geld()),
        preiswirkung: dollar(wirkungCent),
        kerzen: kerzen.map((k) => ({ takt: k.takt, o: dollar(k.o), h: dollar(k.h), l: dollar(k.l), c: dollar(k.c) })),
        nachricht: nachricht
          ? {
              thema: nachricht.thema,
              inTakten: nachricht.eintritt - takt,
              inSekunden: Math.ceil(((nachricht.eintritt - takt) * REGELN.TAKT_MS) / 1000)
            }
          : null,
        du: kontoSicht(du),
        algo: algoSicht,
        beendet,
        sieger,
        grund: endgrund
      };
    }

    kerzeFortschreiben();

    return Object.freeze({
      saat,
      schritt,
      order,
      schutz,
      ergebnisBei,
      maxMenge,
      beobachtung: () => beobachtungFuer(du),
      zustand
    });
  }

  // Nur fuer die Messwerkzeuge (Node, Ordner JKHD-Spiel): der Kursprozess
  // einer Saat allein, ohne Spieler. Er liefert denselben Kurs ohne
  // Preiswirkung wie das Spiel mit dieser Saat -- das belegt die Pruefung,
  // dass der Markt die Orders der Spieler nicht sieht -- und zaehlt die
  // Reaktionen an den Zonen. Die Oberflaeche nutzt es nicht.
  function kursprozess(saat) {
    if (!Number.isInteger(saat) || saat < 0 || saat > 4294967295) {
      throw new TypeError("saat: ganze Zahl von 0 bis 4294967295 erwartet");
    }
    const markt = erzeugeKursprozess(zufallsgenerator(saat));
    let takt = 0;
    return Object.freeze({
      schritt: () => {
        takt += 1;
        const ereignisse = [];
        markt.schritt(takt, ereignisse);
        return ereignisse;
      },
      kurs: () => Math.round(markt.kurs()) / 100,
      statistik: markt.statistik,
      zonen: markt.zonen
    });
  }

  return { modul: Object.freeze({ REGELN, ALGO, neuesSpiel, zufallsSaat }), kursprozess };
});

# JKHD-Website — jkhd.de

Statische Webseite für JKHD (HTML/CSS/JS, keine Build-Tools nötig).
Design: monochrom Schwarz/Weiß, Serifen-Headlines (Playfair Display),
Markenzeichen (drei Balken), Hell/Dunkel-Umschaltung. Zweisprachig:
Deutsch in der Wurzel, Englisch unter `/en/`.

## Struktur

```
index.html         Startseite: Hero mit Marken-Lockup und zwei Knöpfen auf der Bühne der Universum-Animation (js/universum.js);
                   die Laufleiste ist seit 10.10.2026 weg
was-wir-machen.html  Was wir machen: „Kurz gesagt“ (ein Satz, ein Absatz, Bäcker-Kasten), „Weg einer Idee“ (6 Schritte),
                   „Sperren“ (4), Kontaktkasten
system.html        Die Grundarten — als Animation beim Scrollen (js/bildlauf.js + js/bilder-system.js): acht Grundarten
                   automatischer Handelssysteme, je ein Bild, das den Mechanismus und den Haken zeigt, dazu
                   „Und bei uns?“; je Bild zwei Sätze (11.10.2026; die Textfassung vom 23.09.2026 liegt in der Git-Historie)
pruefung.html      Wie wir das EIGENE System prüfen — als Animation beim Scrollen (js/bildlauf.js + js/bilder-pruefung.js):
                   5 Stufen, 6 Belastungsproben, die Grenze; je Bild drei Zeilen Text, am Ende
                   fliesst alles ins Zeichen mit dem Spruch (11.10.2026; die Textfassung vom
                   23.09.2026 mit Lehren und Empfehlung liegt in der Git-Historie)
sicherheit.html    Sicherheit am EIGENEN System — als Animation beim Scrollen (js/bildlauf.js + js/bilder-sicherheit.js):
                   7 Sperren am Geldweg, Spuren, Daten, „Was wir nicht vorweisen können"; je Bild drei
                   Zeilen Text, am Ende das Lockup aus Punkten (11.10.2026; die Textfassung vom
                   24.09.2026 mit allen Karten liegt in der Git-Historie)
simulation.html    Spiel „Sie gegen den JKHD-Algo“ (27.09.2026): erfundener Goldmarkt, beide
                   starten mit 100.000 $, wer zuerst 1.000.000 $ hat, gewinnt (siehe unten)
mathematik.html    Verfahren und Formeln, je mit Nutzen und Fallstrick
unternehmen.html   Seit 26.09.2026 ohne altes Angebot: Julians Satz als Überschrift, Profil +
                   Auf einen Blick, „Was JKHD nicht tut", Austausch, 4 Grundsätze (.creed),
                   Gründer, Kontakt; die leeren Bildkästen („Einblicke") sind weg
kontakt.html       Drei Kacheln (kontakt@ / service@ / info@) + Partnerzugang (siehe unten)
partnerzugang.html Partnerzugang als eigene Seite (26.09.2026): wofür, Mindestvoraussetzungen,
                   unten derselbe Anmeldekasten; im Menü hinter dem Knopf (breit) bzw. in
                   der Liste (Handy), in Fußzeile und Sitemap
partner.html       Partnerseite: nur nach Anmeldung, noindex, nicht im Menü (siehe unten)
impressum.html     Impressum (§ 5 DDG)
datenschutz.html   Datenschutzerklärung
404.html           Fehlerseite (zweisprachig)
ueber/leistungen/projekte/technologie/ansatz.html   Weiterleitungen auf die neuen Seiten
holding/           Alte Deckseite (bis 20.09.2026); seit 10.10.2026 nur noch Weiterleitungen auf Startseite, Impressum, Datenschutz
fehlerberichte/    Fehlerberichte zur Website, eine Datei je Fehler, auch direkt auf GitHub anlegbar (Regeln, Vorlage und
                   Pflege-Hinweis in fehlerberichte/README.md; behobene unter fehlerberichte/behoben/; per robots.txt nicht indexiert)

en/index.html      Englische Fassung der Startseite
en/system.html     "How a system tries to make money" (die Grundarten als Animation)
en/testing.html    "How we test our own system"
en/security.html   "There are no client files here"
en/simulation.html "You against the JKHD Algo"
en/mathematics.html
en/company.html
en/contact.html
en/partner-access.html
en/imprint.html    Servicefassung, deutsche Fassung ist maßgeblich
en/privacy.html    Servicefassung, deutsche Fassung ist maßgeblich

robots.txt         Suchmaschinen-Regeln (Sitemap-Verweis auf jkhd.de)
sitemap.xml        Sitemap inkl. hreflang-Paare DE/EN
assets/og-image.png  Vorschaubild für Link-Teilen
assets/fonts/      Self-hosted Schriften (DSGVO)
css/style.css      Gesamtes Design (Farben oben als CSS-Variablen)
js/main.js         Mobile-Nav, Hell/Dunkel, Fragen-Blase, Partnerzugang
js/spiel-motor.js  Spielmotor der Simulation (Regeln, Markt, Konten, JKHD-Algo), ohne DOM
js/spiel.js        Oberfläche der Simulation (nur auf simulation.html / en/simulation.html)
js/bildlauf.js     Der Motor fuer Seiten als Folge lebender Bilder beim Scrollen (Pruefungen, Sicherheit): klebende Buehne, je Bild Text + Zeichnung, die sich hereinschieben, aufbauen, lange stehen (und sich dabei weiter bewegen) und nach oben hinausschieben; am Ende steigen Punkte von unten auf und werden zum Lockup der Startseite; ohne JavaScript eine Liste (Julian, 11.10.2026)
js/bilder-pruefung.js   die Bilder der Pruefungen-Seite: Ueberschrift, fuenf Stufen, Belastungsproben, Grenze
js/bilder-sicherheit.js die Bilder der Sicherheitsseite: Ueberschrift, sieben Sperren, Spuren, Daten, "Ehrlich gesagt"
js/bilder-system.js     die Bilder der System-Seite: Ueberschrift, die acht Grundarten mit ihrem Haken, "Und bei uns?"
js/universum.js    Startseite: der Hero liegt auf der Buehne und wird beim Scrollen zu Punkten, die sich in die Milchstrasse drehen (Vorspann, 11.10.2026; seit 23.10.2026 2,5 Buehnenhoehen lang und weicher nachgefuehrt); dann der Flug in die Milchstrasse, mit waagerechter Kamera durch ein dichtes Sternfeld unter dem Band der Milchstrasse, weit auseinander an fest stehenden Planeten vorbei (Kugeln in WebGL, Karten aus Rauschen) zur Erde (WebGL, NASA-Bilder), der Zoom auf eine Stadt, in ein Rechenzentrum bis zum Computer, dessen Gehaeuse durchsichtig wird (Platine); der Monitor rechnet die Formeln durch, Zeile fuer Zeile beim Scrollen, dann erscheint dort das Zeichen, am Ende Schwarz und der Spruch der Fusszeile (nur index.html / en/index.html)
assets/erde/       Erdbilder der NASA fuer js/universum.js (Blue Marble Tag, Black Marble Nacht, Wolken; Welt, Europa, Oberrhein; *-k.jpg = kleine Fassung fuers Handy). Gemeinfrei, Bildnachweis im Impressum. Werden erst geladen, wenn jemand bis zur Animation scrollt (2,3 MB bzw. 0,7 MB)
favicon.svg        Browser-Tab-Icon (drei Balken)
```

## Zweisprachigkeit — was beim Ändern zu beachten ist

Es gibt keine Übersetzungsschicht: jede Seite existiert zweimal als echte
Datei. Wer einen Text ändert, ändert ihn in **beiden** Fassungen.

- **Die Kopfzeile verhält sich nach Breite unterschiedlich:**
  - **bis 1140 px:** alles hinter dem Menüknopf, das Feld klappt über die volle
    Breite auf — Seitenlinks, Sprache, Darstellung, Kontakt.
  - **ab 1141 px:** die Seitenlinks und der Kontakt-Knopf stehen offen in der
    Kopfzeile; hinter dem Menüknopf liegen nur noch Sprache und Darstellung,
    als 264-px-Feld bündig unter ihm (dafür ist `.nav-wrap` dort
    `position: relative`, das Feld hängt mit `right: 48px` am Innenabstand des
    Rahmens).
  Das Menü schließt per Escape und Klick daneben; ein Klick auf ein Segment
  darin lässt es offen.
- **Sprache und Darstellung** (`.nav-lang`, `.nav-theme`) stecken zusammen in
  `.nav-prefs` — nur dieser Behälter lässt sich auf breiten Schirmen aus der
  Menüzeile herauslösen. Jeweils Beschriftung links, Segmentpaar rechts:
  „Sprachen"/„Languages" und „Darstellung"/„Appearance".
- **Impressum und Datenschutz** stehen im Klappfeld als `.nav-legal` und sind
  **nur ab 1141 px sichtbar** — auf dem Handy führt sie die Fußzeile, das
  Menü bliebe sonst unnötig lang. In der Fußzeile hat beides eine eigene
  Spalte (`.footer-legal-nav`, „Rechtliches"/„Legal"); die schmale Zeile ganz
  unten trägt nur noch das Copyright. Die Rechtsseiten selbst
  (impressum/datenschutz/404) haben weiterhin ihre verkürzte Fußzeile mit
  `.footer-links`.
- **Sprachschalter** (`.nav-lang`): aktive Sprache als
  `<span class="lang-current">`, die andere ein Link auf das Gegenstück. Kein
  JavaScript, keine automatische Weiterleitung, keine Spracherkennung — und
  dadurch auch nichts, was gespeichert wird.
- **Hell/Dunkel** (`.nav-theme`): zwei Knöpfe mit `data-theme-set="light|dark"`,
  der geltende trägt `.is-on`. Gewählt wird in `localStorage` unter
  `jkhd-theme` gemerkt; ohne eigene Wahl folgt die Seite dem Betriebssystem.
- **Zwei Ebenen der Navigation:** In der offenen Kopfzeile stehen nur die
  Seiten, die zuerst gesehen werden sollen (derzeit Startseite, System,
  Prüfungen, Sicherheit, Simulation + Kontakt-Knopf). Alles Weitere liegt im Klappfeld: `<a>`-Zeilen als
  direkte Kinder von `.nav-prefs`, oberhalb von Sprache und Darstellung. Auf
  dem Handy ändert das nichts — dort steht ohnehin alles untereinander in
  derselben Reihenfolge.
- **Kommen neue Seitenlinks in die Kopfzeile**, wird sie ab 1141 px breiter —
  dann entweder einen Punkt ins Klappfeld verschieben oder die Schwelle im
  Block `@media (min-width: 1141px)` anheben, sonst schiebt die Zeile die
  Seite waagerecht hinaus. Stand 27.09.2026 (inkl. Simulation, gemessen im
  Browser mit Scrollleiste) bleiben bei 1141 px zwischen Marke und Leiste
  136 px (DE) bzw. 194 px (EN), davon 24 px fester Abstand; die Leiste bleibt
  von 1141 bis 1400 px einzeilig. Ein weiterer Eintrag (Text + 28 px Abstand)
  passt auf Deutsch nur, wenn er kürzer als etwa 80 px ist.
- **Inhaltliche Zusagen auf `sicherheit.html`** sind bewusst so formuliert,
  dass sie ohne Zertifikat haltbar sind: nichts zusagen, was nicht im eigenen
  Quelltext belegt ist, keine behaupteten Audits, und ein eigener Abschnitt
  „Was wir nicht vorweisen können" — dort steht seit dem 23.09.2026 auch, dass
  keine der Sperren je echtes Geld gehalten hat. Zweite Linie: **Prinzip statt
  Bauplan.** Keine Pfade, keine Fristen, keine Code-Formate, keine
  Ablagearten, keine Kopfzahl, kein Meldeweg, kein Betriebsort — eine
  Gegenprüfung aus der Sicht eines Angreifers hat am 23.09. genau dort vier
  Stellen gefunden. Beim Ändern diese Linie halten — eine Zusage zu viel fällt
  im Prüffall auf die Seite zurück. Sprache und
  Darstellung kosten dort keine Breite mehr, die liegen im Feld. Der Block ist
  von den übrigen 940-px-Umbrüchen getrennt.
- **Seitenpaare:** `was-wir-machen.html ↔ en/what-we-do.html`, `pruefung.html ↔ en/testing.html`,
  `sicherheit.html ↔ en/security.html`,
  `mathematik.html ↔ en/mathematics.html`, `mathematik-grundlagen.html ↔ en/mathematics-basics.html`,
  `unternehmen.html ↔ en/company.html`, `kontakt.html ↔ en/contact.html`,
  `partnerzugang.html ↔ en/partner-access.html`,
  `impressum.html ↔ en/imprint.html`, `datenschutz.html ↔ en/privacy.html`,
  `index.html`, `system.html` und `simulation.html` heißen in beiden Sprachen
  gleich.
- **hreflang:** drei `<link rel="alternate">` im `<head>` jeder Seite
  (de, en, x-default) — plus dieselben Paare in `sitemap.xml`. Bei einer neuen
  Seite beides mitziehen.
- **Texte aus dem JavaScript** (Fragen-Blase, Formular-Hinweise) stehen in `js/main.js` doppelt und werden über
  `T("deutsch", "english")` ausgewählt. Maßgeblich ist das `lang`-Attribut
  der Seite.
- **Anker-IDs bleiben deutsch** (`#leistungen`, `#anfrage`), damit
  Verweise in beiden Sprachen identisch funktionieren. Nicht umbenennen.
  Den Anker `#leistungen` gibt es seit 19.09.2026 nicht mehr: der Menüpunkt
  heißt „Was wir machen" und führt auf `was-wir-machen.html` (EN
  `en/what-we-do.html`); `leistungen.html` leitet dorthin weiter. Seit
  demselben Tag gibt es keine Preise und keinen Konfigurator mehr — JKHD
  bietet nichts zum Kauf an.
- **Nach Änderungen an `css/style.css` oder `js/main.js`** den Versionsstempel
  `?v=...` in allen HTML-Dateien hochzählen, sonst bekommen wiederkehrende
  Besucher die alte Datei aus dem Browser-Cache.
- **Die KI der Fragen-Blase kennt Texte dieser Website wörtlich** (Startseite,
  Was wir machen, System, Unternehmen, Partnerzugang, Kontakt, Impressum — je
  DE/EN — und die festen Antworten in `js/main.js`). Nach Textänderungen dort das
  Wissen im Repo JKHD-Partner-Server neu bauen (`pruefung/wissen_bauen.py`, siehe
  dessen README, Abschnitt „KI-Fragen") und `api/ki_wissen.md` hochladen — sonst
  antwortet die KI mit dem alten Stand.
- **`mathematik-grundlagen.html`, `en/mathematics-basics.html`, `quant-formelsammlung.html`
  und `monster-formelsammlung.html` werden gebaut**, ebenso die Formeln im Hintergrund des
  Seitenkopfs von `mathematik.html` / `en/mathematics.html` (zwischen den Marken
  `<!-- FORMELHINTERGRUND -->`) — nicht von Hand bearbeitet: Quellen und `bauen.js` liegen in `C:\Quant Arbeit\JKHD-Formeln`
  (README dort). Die Formeln sind mit KaTeX vorgerendert; `css/katex/` (Stil, woff2-
  Schriften, MIT-LICENSE) gehört dazu und wird vom Bau mitkopiert. Nach einem neuen
  Versionsstempel die beiden Seiten neu bauen (sie übernehmen Stempel, Kopf und Fuß aus
  `mathematik.html`). Nur Deutsch; `en/mathematics.html#formula-collections` verlinkt sie.

## Simulation — Spiel gegen den JKHD-Algo (27.09.2026)

Julians Wunsch: ein kleiner Markt, auf dem man Gold kauft und verkauft, und der
JKHD-Algo spielt mit. Beide starten mit 100.000 $; wer zuerst 1.000.000 $ hat,
gewinnt, wer unter 10.000 $ fällt, ist pleite und verliert. Kein Zeitlimit.
Eigene Seite `simulation.html` / `en/simulation.html`, im Menü nach
„Sicherheit“ und in der Fußnavigation.

- **`js/spiel-motor.js`** ist die einzige Stelle der Regeln: Markt (erfunden,
  mit Saat reproduzierbar), Konten, Ausführung und der JKHD-Algo. Er sieht je
  Takt nur, was auch der Mensch sieht, und handelt über dieselbe Ausführung.
  Schnittstelle im Kopf der Datei (`JKHDSpiel.neuesSpiel(saat)`, `REGELN`,
  `ALGO`, `schritt()`, `order()`, `zustand()`).
- **`js/spiel.js`** ist nur die Oberfläche: Takt über `requestAnimationFrame`,
  Chart auf `<canvas>` (Farben aus den CSS-Variablen), Tafeln, Handel, Protokoll
  des Algos, Start- und Endschicht. Beide Dateien werden nur auf den zwei
  Simulationsseiten geladen, nach `main.js`.
- **Zahlen im Regeltext** stehen in `<span data-sp-zahl="REGELN.…" data-sp-art="…">`
  und werden aus dem Motor neu gesetzt; der Text im HTML ist derselbe Wert für
  Besucher ohne JavaScript. Wer eine Regel im Motor ändert, zieht den Text im
  HTML mit — sonst sehen Besucher ohne JavaScript den alten Wert.
- **Tasten** (B, S, X, Leertaste) wirken nur, solange das Spiel den Fokus hat,
  nie beim Tippen in der Fragen-Blase oder mit Strg/Alt/Meta. Die Knöpfe im
  Spiel sind deshalb `aria-disabled` statt `disabled`.
- **Nachkaufen:** Die Positionsgrenze wächst mit dem Kapital, also kann man in
  einem laufenden Trend immer wieder „Max“ drücken. Der Algo tut das auch
  (`ALGO.NACHKAUF`, Protokoll „Stockt auf“) — solange er es nicht tat, gewann
  ein Mensch, der das macht, über 90 % der Spiele. Voreingestellt ist deshalb
  „Max“: Mit einer festen kleinen Menge gewinnt man praktisch nie.
- **Spielnummer (Saat)** erst auf der Ergebniskarte: Der Motor ist über
  `window.JKHDSpiel` erreichbar und rechnet mit gleicher Saat denselben Markt —
  wer die Nummer während des Spiels kennt, kann jede Nachricht vorab ausrechnen.
- **„Neues Spiel“** mitten im Spiel hält erst an und fragt nach („Wirklich
  neu?“), erst der zweite Druck verwirft das Spiel.
- **Zusagen:** Das Spiel speichert nichts im Browser (kein Cookie, kein
  Web-Speicher) und lädt nichts von fremden Servern; an api.jkhd.de gehen seit
  der Bestenliste (11.10.2026) nur die Spielmarke beim Start, seit der
  Statistik (14.10.2026) am Ende jeder zu Ende gespielten Partie Marke und
  Ergebnis (beim ersten Sieg seit dem Öffnen der Seite die Zahl der Partien)
  und – nach einem Sieg mit Eintrag – Spitzname, Spielzeit, Spielnummer und
  Tempo, wie auf `simulation.html` und in `datenschutz.html` beschrieben.
- **Universum, zwei Kanten** (Loop 2, A4/A8/4.3, 30.10.2026): die Punktkopie der Hero-Schrift sitzt jetzt auf der
  Grundlinie (textBaseline alphabetic + fontBoundingBoxAscent) statt 0,1 em zu hoch — kein Doppelbild mehr beim
  Auflösen; am Nordpol der Erde blenden Tag- und Wolkentextur ab 74° Breite auf eine längenunabhängige Farbe
  (keine Sternstreifen).
- **Hover und Druck je Bauteil** (Loop 2, A4/4.2, 30.10.2026; Messgerät `hover_messung.js`): Druck überall
  Skalierung 0,98 in 0,08 s (Knöpfe, Kacheln, Spielknöpfe, Menüknopf — vorher 0,99 / 0,97 / ohne), Links überall
  Deckkraft 0,7 in 0,08 s (vorher nur Fußzeilen-Navigation), Kopfzeilen-Knopf ohne Link-Deckkraft, Menüknopf
  mit Hover-Fläche.
- **Einblendungen** (Loop 2, A4/4.1, 30.10.2026): der Beobachter staffelt, was zusammen ins Bild kommt (70 ms je
  Stufe, höchstens fünf), ein Element allein erscheint sofort (vorher fester Versatz aus der Rasterreihenfolge);
  Seitenköpfe zeigen Kicker, Titel, Lead und Aktion nacheinander wie der Hero (80-ms-Stufen); Hero-Stufen
  0,08/0,16/0,24/0,32 s.
- **Englische Seiten gespiegelt geprüft** (Loop 2, 3.9, 30.10.2026): 14 Seiten × 4 Kombinationen, Typografie,
  Ruhe, Bildlauf (3 × 2) und Startseite ohne Befund; gefunden und behoben (DE wie EN): Formelkasten-Titel schmal
  15 statt 13 px, Witwe in zweizeiligen Kastentiteln (`text-wrap: balance`).
- **Impressum, Datenschutz, 404** (Loop 2, A2/A5/A6/3.8, 30.10.2026): Prose-h2 mit 48 px Luft (die erste ohne),
  404-Hero und -Fußzeile über Klassen statt Inline-Stilen (`.hero-404`, `.ohne-linie`), Marke `.pill` als 32-px-
  Element mit Gap 8.
- **Kontakt, Partnerzugang, Partnerseite im Raster** (Loop 2, A2/A5/3.7, 30.10.2026): Formular (Feld-Gap 8,
  Feldzeile 24, Textfeld 128, Auge-Icon 16), Kacheln 192 / 152, Schritt-Balken 24, Module und Dateien (Gaps 8,
  Abzeichen 1/8), Krone 32 × 24 wie ihr viewBox — vorher 15 Werte neben dem Raster.
- **Unternehmen** (Loop 2, A2/A5/A6/3.6, 30.10.2026): alle Mono-Auszeichnungen der Seite (Auf einen Blick,
  Rolle, Zwischentitel) im Label-Muster 11 / 600; Eckdaten-Kasten `--pad-panel`; Rollenzeile 8, Zwischentitel 24,
  Creed-Kostenlabel 8, Geisterziffer −16 (Raster); Profil-Lead schmal in h4-Größe statt h3.
- **Mathematik-Seiten** (Loop 2, A2/A5/A6/3.5, 30.10.2026): schmal maskiert eine senkrechte Maske die
  Hintergrundformeln des Kopfs hinter Kicker, Titel und Lead (oben bleiben sie klar; vorher liefen sie unter dem
  Titel hindurch); Inhaltskarte 32 px, Listenpunkte 8 px, Einstiegskarten `--pad-card`, Inhalts-Titel im
  Label-Muster. Formelkästen (Haarlinie, Mono-Titel, KaTeX) blieben wie seit Loop 1.
- **Simulation im Raster** (Loop 2, A2/A3/A5/3.4, 30.10.2026): Brett, Tafeln, Handel, SL/TP, Protokoll,
  Bestenliste, Podest und Statistik ohne Werte neben dem 4-px-Raster (vorher 41: 6, 20, 28, 46, 62, 76, 92 …),
  Brett-Innenabstand `--pad-card`, SL/TP-Fokusring wie jedes Feld, Start-/Ende-Schicht mit Schatten-3 + Kante,
  Podest 80 / 96 px mit Pokal 32 / 40.
- **Bildlauf-Seiten: eine Strichstärke je Rolle** (Loop 2, A8/3.3, 30.10.2026): in `js/bildlauf.js` und
  `js/bilder-*.js` nur noch 1 (Haarlinie), 1,5 (Kurve, Linie, Icon) und 2 (Rahmen) statt sieben Werten; der
  Prozess-Chip nimmt die Caption wie jede Beschriftung. Farben aus den Tokens, Beschriftungen skaliert, DPR ≤ 2.
- **Was wir machen** (Loop 2, A6/3.2, 30.10.2026): Seitentitel (`.statement-lead`) auf h1-Stufe wie jeder
  Seitenkopf (vorher h2-Stufe, so groß wie die Abschnitte darunter), Kicker 16 px; auf dem Handy steht die
  Schritt-Ziffer über dem Titel und der Text nimmt die volle Breite (vorher 235 px neben der 76-px-Spalte).
- **Startseite: Kopfzeile über dem All** (Loop 2, A6/3.1, 30.10.2026): sobald der Vorspann den Grund dunkel
  gemacht hat (`v ≥ 0,3`), setzt `js/universum.js` `html.ist-im-all`; Kopfzeile und Fragen-Blase tragen dann die
  Nacht-Töne (Tokens am Element, weich überblendet) statt als Papierbalken über dem Universum zu stehen;
  zurück, sobald der Abschnitt den Schirm verlässt. Marken-Lockups (Kopfzeile, Hero) und `.hero-sub` aus der
  Skala, Hero-Ränder aus dem Raster.
- **Fußzeile und Fragen-Blase** (Loop 2, A4/A5/2.8–2.9, 30.10.2026): Fußzeile als eigene ruhige Fläche
  (`--wash-1`), Links als Caption in 32-px-Zeilen, Rechtstext und Schlusszeile aus dem Raster, unten 96 px;
  schmal zwei Spalten statt einer 1.300 px langen. Fragen-Blase gleitet auf (400 ms, Auslauf) und zu (240 ms,
  Einlauf; `hidden` erst nach `transitionend`, bei reduzierter Bewegung sofort), Kopf 56 px mit 32-px-
  Schließen-Knopf, Eingabe aus der Skala, Senden wie jeder Primär-Knopf, FAQ-Link im Textlink-Muster.
- **Labels, Felder, Hinweiskästen** (Loop 2, A5/2.4–2.6, 30.10.2026): ein Label-Muster (Mono 11 px, 600, gesperrt,
  Großbuchstaben — auch die Fußzeilen-Titel und alle dt), Felder 48 px fest mit weichem Fokusring (3 px, Tinte 6 %),
  Hinweiskasten 16/24 aus dem Raster.
- **Menü gleitet** (Loop 2, A4/2.7, 30.10.2026): Menüfeld (schmal) und Klappfeld (breit) öffnen mit Deckkraft + 8 px
  in 400 ms (Auslauf-Kurve) und schließen mit Einlauf-Kurve, Schatten-3; unsichtbar = `visibility: hidden`
  (nicht fokussierbar), ohne JavaScript offen wie bisher. Kopfzeile bleibt 74 px — eine Verdichtung beim
  Scrollen würde die klebende Universum-Bühne und die Ankerziele verschieben.
- **Textlinks und Karten** (Loop 2, A5/2.2–2.3, 30.10.2026): ein Textlink-Muster (Unterstrich 1 px, 4 px Versatz,
  ruhige Linienfarbe, Hover Tinte; `.textlink` für neue Stellen) statt neun border-bottom-Regeln; Karten-
  Innenabstände `--pad-card` 24 px, `--pad-card-sm` 16 px, `--pad-panel` 32 px.
- **Knöpfe** (Loop 2, A5, 30.10.2026): drei Stufen (`.btn-primary`, `.btn-ghost`, `.btn-text`/`.partner-textknopf`)
  in zwei Größen (48 / 40 px feste Höhe), Icon 16 px, Hover 2 px + Schatten, Druck 0,98; Fragen-Knopf, Senden,
  Kopfzeile und Spiel-Knöpfe nehmen dieselben Höhen (vorher 15 Varianten, Höhen 36–54 px).
- **Feinheiten** (Loop 2, A7, 30.10.2026): Tap-Highlight aus, `scroll-margin-top` für Ankerziele, deutsche
  Silbentrennung im Fließtext (`:lang(de)`, nicht in Titeln/Knöpfen/Code), typografische Anführungszeichen für
  `<q>`, Tabellenziffern in Zahlenspalten, Safe-Area-Ränder (Container, Fragen-Blase), Touch-Ziele ≥ 44 px bei
  grobem Zeiger.
- **Bewegung** (Loop 2, A4, 30.10.2026): Dauern 160/240/400/700 ms (`--t-kurz/-mittel/-feld/-lang`), drei
  Kurven (`--ease`, `--ease-out` für Erscheinendes, `--ease-in` für Verschwindendes), Einblenden 16 px mit
  Auslauf-Kurve, Staffelung 70 ms, Druckzustand 0,98 auf Knöpfen/Kacheln/Spiel-Knöpfen (`:active`).
- **Flächen, Haarlinien, Schatten** (Loop 2, A3, 30.10.2026): `--line`/`--line-strong`, `--shadow-1…3` (zwei
  Lagen, je Modus), `--edge` (Lichtkante): Karten ruhen mit Haarlinie + Schatten-1, heben sich im Hover
  2 px mit Schatten-2 (vorher Tintenrahmen + 3 px); Knöpfe und Fragen-Blase ebenso. Radius bleibt 2 px.
- **Raster und Zeilenhöhen** (Loop 2, A1/A2, 30.10.2026): Abstands-Token `--s-1` … `--s-11` (4–160 px), alle
  padding/margin/gap-Werte auf das 8-px-Raster (21 Fremdwerte wie 10, 14, 18, 22, 26, 30, 44, 54, 90, 110 px
  gerundet), Zeilenhöhen und Laufweiten aus den Token der Skala (`--lh-*`, `--ls-*`, `--ls-wide`).
- **Typografie-Skala** (Loop 2, A1, 30.10.2026): zehn Größen als Token im `:root` (`--fs-display` … `--fs-label`,
  fließend 375–1920 px) mit Zeilenhöhen/Laufweiten je Rolle; alle `font-size`-Deklarationen nehmen ein Token
  (`design_inventar.js`: vorher 67 Schrift-Kombinationen auf dem Laptop). Ausgenommen Marken-Lockup, Geisterziffern,
  KaTeX, 16-px-Eingabefeld der Fragen-Blase.
- **Zeilenlängen** (Loop 29.10.2026, Punkt 4.1): Fließtext höchstens ~75 Zeichen je Zeile — `.step-row p`,
  `.founder-card p`, `.about-text p`, `.about-lead`, `.statement-more`, `.prose`, `.fs-absatz`/`.fs-liste`,
  `.sp-regel-algo` mit Maximalbreiten in ch (vorher 76–111 Zeichen, `typografie_messung.js`); Witwe
  „Hier liegen keine Kundenakten.“ mit geschütztem Leerzeichen.
- **Kontrast der Kaufen/Verkaufen-Unterzeile** (Loop 29.10.2026, Punkt 4.2): reines Weiß statt 85 % —
  vorher 4,0–4,4:1 auf Blau/Rot, jetzt ≥ 5:1 (`tastatur_messung.js`, 87 Ladungen: einziger echter
  Kontrastbefund; Tab-Weg, Fokusrahmen und Vorlesetexte überall in Ordnung).
- **Partnerkasten: Kopf je Zustand** (Loop 29.10.2026, Punkt 2.1): `kopfZustand()` in js/main.js — im
  Ruhezustand der Einleitungsabsatz, in den Schritten eine Zeile mit zwei Balken („Schritt 1 von 2 ·
  Ihre Adresse“ / „Schritt 2 von 2 · Code aus der E-Mail“), beim Fragebogen der Titel „Anfrage“
  (`.partner.is-schritt`, `.partner-schritt`). Zustände fotografiert mit `zustaende.js` +
  `partner_schritte.json` (nachgebauter Server als fetch-Stub) in JKHD-Pruefwerkzeuge.
- **Übergänge vereinheitlicht** (Loop 29.10.2026, Punkt 1.8): drei Dauern als Token (`--t-kurz` 0,2 s,
  `--t-mittel` 0,3 s, `--t-lang` 0,8 s) und überall die Hauskurve `--ease`; `.btn` nennt seine
  Eigenschaften statt `all`. Vorher 26 verschiedene Angaben.
- **Spielregeln gegliedert** (Loop 29.10.2026, Punkt 1.5): jede Regel trägt eine Mono-Nummer über dem
  Titel (CSS-Zähler `regel`, kein HTML), mehr Luft je Karte, Absatz mit Zeilenhöhe 1,65 — Texte
  unverändert.
- **Geisterziffern der Creed-Raster** (Loop 29.10.2026, Punkt 1.7): die Überschrift hält rechts den
  Platz der Ziffer frei (`padding-right` 5,2 rem, schmal 4 rem) — vorher lief sie auf dem Handy unter
  die Ziffer.
- **Formelkästen** (Loop 29.10.2026, Punkt 1.4): `.fs-box` mit Haarlinie und Mono-Titelzeile statt
  Tintenrahmen und gefülltem Kopfbalken — nur CSS, die vier Formelseiten bleiben unangetastet;
  Mathe in einem Titel bleibt ungesperrt (`.fs-box-titel .katex`).
- **Schluss des Universums** (Loop 29.10.2026, Punkt 1.3): Halle, Tisch, Monitor und Rechner mit
  Licht und Material; am Ende gehen erst die Formeln aus, dann das Zeichen; das Schwarz kommt
  von den Rändern her und der Schirm geht als Letztes aus, der Spruch erst auf Schwarz
  (`startseite_fotos.js`, Stellen q und e).
- **Brett von Anfang an sichtbar** (Loop 29.10.2026, Punkt 1.15): das Brett steht nicht mehr auf
  `hidden`, bis js/spiel.js läuft — sonst sprangen die Regeln beim ersten Bild um 16 % der
  Bildschirmhöhe (`ruhe_messung.js`). Ohne JavaScript versteckt es `html:not(.js) .sp`.
- **Statistik über der Bestenliste** (14.10.2026, Julian: „wie viele es
  schaffen, und wie viele Versuche man braucht“): zu Ende gespielte Partien,
  Siege mit Anteil und die mittlere Zahl der Anläufe bis zum ersten Sieg —
  Summen aus der Antwort von `bestenliste` (`statistik`), die der Server aus
  den Ergebnis-Meldungen (`bestenliste_ende`) zählt. Ohne Server oder ohne
  eine einzige Partie bleibt der Block (`.sp-besten-statistik`) verborgen.
  Die Anläufe zählen nur innerhalb eines Seitenaufrufs (nichts wird im
  Browser gespeichert), das Mittel ist also eher zu klein als zu groß.
- **Kein Vergleichssatz mit Simulationszahlen** (14.10.2026): Julian wollte erst
  1.000 simulierte Partien in der Statistik, dann den Satz wieder weg — unter der
  Statistik steht nichts Simuliertes. Erfundene Partien oder ausgedachte Gewinner
  kommen nicht in Statistik oder Liste (Messung dazu liegt in
  `C:\Quant Arbeit\JKHD-Spiel\messungen\`).
- **Gold, Silber, Bronze und Podest** (14.10.2026, Julian): die drei Schnellsten
  tragen in der Liste einen Pokal vor dem Rang in Gold, Silber oder Bronze
  (`--gold`, `--silber`, `--bronze`, Klassen `ist-gold` …); daneben steht ein
  Podest (`.sp-podest`, am Laptop rechts neben der Liste, am Handy darüber)
  mit Kranz, Pokal, Name und Zeit je Platz. Pokal und Kranz sind SVG-Symbole
  in `simulation.html` (`.sp-symbole`), eingesetzt über `use href`; ein Platz
  ohne Eintrag zeigt einen Strich, ohne jeden Eintrag bleibt das Podest
  verborgen. Das Podest ist für Vorleser ausgeblendet (die Liste sagt dasselbe). Die Texte sagen nicht,
  dass JKHD Gold oder einen anderen Markt handelt, und der Gegner ist
  ausdrücklich ein vereinfachter Spiel-Algorithmus, nicht das Handelssystem.
- **Messung und Abstimmung** liegen außerhalb dieses Repositorys in
  `C:\Quant Arbeit\JKHD-Spiel` (README dort): `balance.js` belegt mit
  Tausenden simulierten Runden, wie stark der Algo ist (seit 10.10.2026 fast
  unschlagbar: menschenaehnliche Strategien gewinnen im Mittel unter 3 %),
  `pruefung.js` prüft den Motor. Nach jeder Änderung am Motor beide laufen
  lassen, dann den Versionsstempel hochzählen.
- Die KI der Fragen-Blase kennt die Simulation seit 11.10.2026 (eigener
  Abschnitt im Wissen des Servers).

## Partnerzugang — Server läuft unter https://api.jkhd.de

Der Kasten „Nur für Partner" steht auf `partnerzugang.html` /
`en/partner-access.html` (eigene Seite seit 26.09.2026, unten nach
„Mindestvoraussetzungen") und weiter auf `kontakt.html` / `en/contact.html` —
beide Male dasselbe Markup, `js/main.js` bedient, was die Seite trägt. Wer schon
angemeldet ist, sieht statt „Anmelden" den Knopf „Zur Partnerseite". Der Kasten (ein
Knopf „Anmelden", in Tinte gesetzt) führt den Ablauf **E-Mail eingeben → Code
per E-Mail → Code eingeben → weiter auf `partner.html`**. Seit 25.09.2026 steht
im selben Formular ein freiwilliges Passwortfeld: leer = genau der Code-Weg von
vorher, gefüllt = `POST {api}/passwort_login`. „Passwort vergessen?" ist der
Code-Weg mit einem Merker (Modulvariable, kein Speicher), danach öffnet
`partner.html#neues-passwort` die Passwortkarte oben. Festlegen, ändern und
entfernen geschieht auf der Partnerseite (Karte „Anmeldung"); ohne das bisherige
Passwort nur in den ersten 15 Minuten nach einer Anmeldung per Code.
`partnerzugang.html#partner-passwort` öffnet den Kasten mit gesetztem Merker (dorthin
führt „Abmelden und Code anfordern" von der Partnerseite). Die Partnerseite
(`partner.html` / `en/partner.html`, `noindex`, nicht im Menü und nicht in der
Sitemap) zeigt die hinterlegten Daten und darunter in einem roten Kasten die
**VIP-E-Mail-Adresse** — verdeckt, bis der Partner sie aufdeckt. Die Adresse
steht in keiner Datei dieser Website; sie kommt nur vom Server an Angemeldete.
Dazwischen der **VIP-Bereich „Zugänge"**: der Katalog aus `api-daten/vip.json`
des Servers (je Modul `id`, `name`, `kurz`, `kurz_en`, `neu`, `status`
`anfrage`|`bald`, optional `link`), je Partner die `freigaben` aus
`partner.json`. Freigeschaltete Module zeigen „Öffnen" (wenn `link` gesetzt),
anforderbare ein Häkchen, `bald` nur den Status (`bald` schlägt eine Freigabe);
„Auswahl anfordern" öffnet per `mailto:` das E-Mail-Programm mit den gewählten
Modulen an die VIP-Adresse. Der Server gibt `link` nur für freigeschaltete
Module heraus.
Frontend: `js/main.js`, Abschnitte „Partnerzugang" und „Partnerseite".
Daneben „Anfrage": ein fester Fragebogen (Name, E-Mail, Rolle, Anliegen,
Profil, Nachricht — `FRAGEN()` in `js/main.js`). **Seit 24.09.2026 geht er an
den Server** (`POST {api}/anfrage`): der leitet die Anfrage an `service@`
weiter und schickt dem Einsender sofort eine Eingangsbestätigung mit der
Zusage von 24 Stunden (Julians Wunsch; Absender `service@`). Die Auswahlfelder
senden **stabile Schlüssel** (`quant|trader|firma|anderes` bzw.
`partnerschaft|austausch|zugang|anderes`), nicht die übersetzten
Beschriftungen — sonst könnte die Prüfung auf der englischen Seite nie
greifen. Der alte Weg über das E-Mail-Programm ist der **Rückfall**: ohne
`data-api`, bei Netzfehler, Zeitüberschreitung (12 s) oder `502` öffnet sich
wie früher das Mailprogramm mit dem fertigen Text, dazu ein „Text
kopieren"-Knopf — so verliert niemand, was er geschrieben hat. Die
Erfolgskachel behält den Kopier-Knopf und sagt ehrlich, ob eine Bestätigung
rausgegangen ist (der Server meldet `{"bestaetigung": true|false}`).
Der Server dazu liegt im eigenen (nicht veröffentlichten) Repo
`JKHD-Partner-Server` (PHP auf IONOS Webhosting) und ist als
`https://api.jkhd.de` angebunden (`data-api` am `.partner`-Element, seit
20.09.2026). Steht `data-api` leer, wird nichts gesendet und der Kasten sagt
das dem Besucher offen.

Schnittstelle (so gebaut, Stand 25.09.2026 — Einzelheiten im README des Server-Repos):

- `POST {api}/code` mit `{"email": "…"}` — prüft die Adresse gegen die
  Partnerliste, erzeugt einen kurzlebigen Code (z. B. 6 Ziffern, 10 Minuten,
  einmal gültig), schickt ihn von der Partner-Adresse und antwortet mit `204` —
  auch für unbekannte Adressen, damit niemand ausprobieren kann, wer Partner
  ist. Nur wenn die Grenze des eigenen Netzes voll ist: `429 {"grenze": "netz"}`
  (hängt nicht an der Adresse; die Seite sagt dann, dass auch kein Code käme).
- `POST {api}/login` mit `{"email": "…", "code": "…"}` — bei gültigem Code
  `200` mit `{"token": "…"}` (64 Hex-Zeichen, eine Stunde gültig), sonst `401`;
  `429`, wenn die IP-Grenze erreicht ist. Das Zeichen liegt im Browser nur im
  `sessionStorage` (`jkhd-partner`).
- `POST {api}/passwort_login` mit `{"email": "…", "passwort": "…"}` — `200`
  `{"token"}`; `401 {"fehler": "falsch"}` für unbekannte Adresse, Partner ohne
  Passwort und falsches Passwort gleichermaßen, `401 {"fehler": "bestaetigen"}`
  wenn die letzte Code-Anmeldung über 180 Tage her ist; `429 {"grenze": "netz" |
  "konto" | "last"}`. Außer bei `netz` bietet die Seite immer „Code per E-Mail
  schicken" an.
- `POST {api}/daten` mit `{"token": "…"}` — `200` mit `{"name": "…",
  "email": "…", "felder": [{"label": "…", "wert": "…"}, …], "vip": "…",
  "module": [...], "freigaben": ["…"], "dateien": [...], "ansicht": {...},
  "passwort": {"gesetzt", "seit", "ohne_altes_bis"} | null}`, sonst `401`; `429`, wenn unbekannte Zeichen die
  IP-Grenze erreicht haben. Was in `felder` und `freigaben` steht, pflegt
  Julian je Partner; `module` ist der Katalog aus `vip.json`.
- `POST {api}/passwort_setzen` mit `{"token", "passwort", "altes_passwort"?}` —
  `200 {"ok", "passwort"}`; `400 {"fehler": zu_kurz|zu_lang|zu_einfach|
  gleich_adresse|ungueltig}`, `403 {"fehler": neu_anmelden|altes_passwort_noetig|
  altes_passwort_falsch}`, `409 {"fehler": "geaendert"}`, `429 {"grenze":
  aenderung|konto|last|netz}`, `401`. `POST {api}/passwort_entfernen` mit
  `{"token", "altes_passwort"?}` — `200 {"entfernt", "passwort"}`, Fehler ebenso.
  Die Passwortregeln (10–128 Zeichen nach NFC, nicht nur Leerraum, nicht ein
  Zeichen wiederholt, nicht in der kleinen Liste, nicht die eigene Adresse)
  prüft `passwortRegel()` in `js/main.js` genau wie der Server.
- `POST {api}/abmelden` mit `{"token": "…"}` — `204`, Zeichen ist weg
  (`429` wie bei /daten).
- `POST {api}/anfrage` mit `{name, email, rolle, anliegen, profil, nachricht,
  sprache}` — `200` mit `{"ok": true, "bestaetigung": true|false}`, `400` bei
  fehlender Angabe, `429` wenn eine der vier Bremsen greift (Netz, Adresse,
  Mail-Domain, Gesamt), `403` ohne erlaubten `Origin`, `502` wenn die Anfrage
  nicht rausgeht. **Anders als /code antwortet diese Route ehrlich** — es gibt
  hier kein Geheimnis zu schützen, jeder darf anfragen. Nur die Bestätigung
  fällt still aus, wenn dieselbe Adresse in derselben Stunde schon eine
  bekommen hat (`bestaetigung: false`); sonst wäre die Antwort ein Messgerät
  für jemanden, der fremde Postfächer zumüllen will.
- CORS für `https://www.jkhd.de`, `https://jkhd.de` und die lokale Vorschau
  `http://localhost:8090`, sonst nichts.

Partner pflegen = `api-daten/partner.json` auf dem Webspace (siehe README des
Server-Repos). Die Datenschutzerklärung beschreibt die Verarbeitung im
Abschnitt „Partnerzugang".

## Schriften vorgeladen (29.10.2026)

Jede Seite lädt `Manrope-variabel.woff2` und `PlayfairDisplay-variabel.woff2` per
`<link rel="preload" as="font">` vor dem Schrift-Stylesheet — mit `font-display: swap` allein
kamen die Schriften nach dem ersten Bild und Texte rutschten um 2–31 px (Loop, Punkt 1.16,
gemessen mit `ruhe_messung.js`). Die kursive Playfair wird nicht vorgeladen (selten).

## Herkunft der Seiteninhalte (aus den Quelltext-Kommentaren hierher verschoben, 11.10.2026)

GitHub Pages liefert HTML-Kommentare mit aus; Arbeitsnotizen stehen deshalb hier und nicht
in den Seiten (Vollprüfung 11.10.2026, Bericht „interne-html-kommentare-oeffentlich“).

- **Startseite (Hero im Universum):** Julian, 11.10.2026: „nicht erst schwarz, sondern das
  Logo, der Text und die Vierecke im Hintergrund sollen sich in eine Galaxie verwandeln, und
  dann geht es weiter.“ Der Hero liegt seither auf der Bühne der Animation (js/universum.js).
  Julian, 23.10.2026: „diesen Übergang etwas länger machen, weil das geht zu schnell, und
  bitte bisschen smoother“ — seither zweieinhalb Bühnenhöhen Scrollweg statt einer
  (`VORSPANN_BUEHNEN`), der Abschnitt ist um diesen Weg länger, und im Vorspann folgt das
  Bild dem Scrollen weicher nach.
- **Prüfungen:** Julian, 11.10.2026: „alles wegmachen und stattdessen eine Animation, die beim
  Runterscrollen erklärt, was genau geprüft wird und wie — wenig Text, mehr Animation; ganz am
  Ende soll alles in Form des Zeichens und des Spruchs fließen.“ Texte je Bild: Überschrift,
  fünf Stufen, Belastungsproben, Grenze — die Textseite vom 23.09.2026, gekürzt.
- **Sicherheit:** Julian, 11.10.2026: „Kannst du dasselbe bei Sicherheit auch machen?“ Texte:
  die Seite vom 24.09.2026, gekürzt; Prinzip statt Bauplan (keine Pfade, Formate, Orte).
- **System:** Julian, 11.10.2026: „bei System auch sowas machen — dort eher weniger Text und
  eher mehr Animation.“ Texte: die Seite vom 23.09.2026, gekürzt; keine Anleitung, nur die Idee.
- **Unternehmen:** Die Überschrift ist Julians eigener Satz vom 19.09.2026 (Kehrtwende: JKHD
  verkauft nichts). Seit 26.09.2026 ohne das alte Angebot (Kunden, Leistungen, Aufträge) und
  ohne die leeren Bildkästen.
- **Impressum, zweiter Kontaktweg:** Neben der E-Mail verlangt § 5 Abs. 1 Nr. 2 DDG (EuGH
  C-298/07) einen zweiten schnellen Kontaktweg; das ist der Knopf „Anfrage“ im Kasten
  `#partner` auf kontakt.html. Wer den Kasten dort entfernt oder verschiebt, muss den Verweis
  im Impressum (und en/imprint.html) mitziehen (26.09.2026).
- **Partnerkasten (kontakt.html, partnerzugang.html, partner.html):** Ablauf E-Mail + Passwort
  → Anmeldung, ohne Passwort E-Mail → Code → Anmeldung; leeres `data-api` = kein Server, der
  Kasten sagt das offen. Die Partner-Adresse steht in keiner Datei der Website, sie erscheint
  erst auf der Partnerseite; die VIP-Adresse liefert nur der Server (Katalog `vip.json`,
  Freigaben `partner.json`). `#partner-passwort` öffnet den Kasten gleich zum Festlegen eines
  Passworts (dorthin führt „Passwort vergessen“). „Anfrage“ ist ein Fragebogen an den Server;
  nur wenn der nicht erreichbar ist, öffnet sich das E-Mail-Programm.

## Lokal ansehen

```
python -m http.server 8090 --directory "C:\Quant Arbeit\JKHD-Website"
```

Dann im Browser: http://localhost:8090

## Live seit 20.09.2026 — und der Offline-Schalter

**Stand: die Seite ist live** (`path: .` im Workflow). Vom 03.09. bis 20.09.2026 stand
unter `www.jkhd.de` nur ein Platzhalter; der Mechanismus bleibt im Repository,
damit die Seite jederzeit wieder abgeschaltet werden kann.

So ist das gemacht:

- `offline/index.html` — der Platzhalter. Eigenständig: Farben, Maße und
  Gestaltung der Website inline (seit 10.10.2026 im Stil der Website:
  Kopfzeile mit Lockup, Kicker, Kästen mit schwarzem Kopfbalken), kein
  Stylesheet und kein Skript von außen; die zwei Schriften (Manrope,
  Playfair Display) und das Favicon kommen über absolute Pfade vom eigenen
  Server. Enthält das Impressum nach § 5 DDG, damit die Pflichtangaben trotz
  abgeschalteter `impressum.html` erreichbar bleiben.
- `offline/robots.txt` — erlaubt Crawlen **absichtlich weiter**. Nur so lesen
  Suchmaschinen das `noindex` des Platzhalters und den 404 der alten Adressen
  und nehmen die Seite aus dem Index. Ein `Disallow: /` würde das verhindern
  und die alten Treffer länger stehen lassen.
- `.github/workflows/pages.yml` — lädt `./offline` hoch statt `.` und kopiert
  vorher `CNAME`, `favicon.svg`, die zwei Schriften und `index.html` →
  `404.html` hinein. Dadurch bleibt die Domain am Repository und jede
  beliebige Adresse zeigt den Platzhalter.

**Wieder offline:** im Workflow `path: .` auf `path: ./offline` setzen und davor
diesen Schritt einsetzen, dann auf `main` pushen:

```yaml
      - name: Platzhalter vervollstaendigen
        run: |
          cp CNAME       offline/CNAME          # Domain bleibt am Repository
          cp favicon.svg offline/favicon.svg
          mkdir -p offline/assets/fonts           # Schriften unter demselben Pfad wie live
          cp assets/fonts/Manrope-variabel.woff2 assets/fonts/PlayfairDisplay-variabel.woff2 offline/assets/fonts/
          cp offline/index.html offline/404.html  # jede Adresse zeigt den Platzhalter
```

**Wieder live:** den Schritt löschen, `path: .` — das ist alles. Der Ordner
`offline/` bleibt liegen (wird mit ausgeliefert, ist über keinen Link erreichbar
und trägt `noindex`).

Nicht vergessen: der Deploy hängt an Pushes auf `main`. Ein Commit auf einem
Arbeitsbranch ändert an der Live-Seite nichts, bis er in `main` liegt.

## Livegang: GitHub Pages + IONOS-Domain (jkhd.de)

Live seit 20.09.2026 (siehe Abschnitt oben). Repo
`juliankaiser313-ctrl/jkhd-website`, GitHub Pages auf Branch `main`, Custom
Domain `www.jkhd.de` (CNAME-Datei im Repo), IONOS-DNS zeigt auf GitHub.

Erledigt:
- [x] Impressum ausgefüllt (§ 5 DDG, Name + ladungsfähige Anschrift)
- [x] Datenschutzerklärung inkl. GitHub-Pages-Hosting
- [x] Fonts self-hosted (assets/fonts + css/fonts.css, DSGVO erledigt)
- [x] Englische Fassung unter /en/ mit hreflang

Offen:
- [ ] USt-IdNr. bzw. Wirtschafts-Identifikationsnummer (§ 139c AO) ins Impressum, SOBALD eine
      zugeteilt ist (§ 5 Abs. 1 Nr. 6 DDG) — Julian prüft ELSTER-Postfach/BZSt-Post; die W-IdNr.
      kommt ohne Antrag. Zweiter Kontaktweg steht seit 26.09.2026 (Anfrageformular)
- [ ] Fotos für die Unternehmensseite — der Platzhalter-Abschnitt „Einblicke" ist seit 26.09.2026 weg
- [x] `holding/` verwies auf `css/…` statt `../css/…` (ohne Design) und beschrieb das alte Modell — seit 10.10.2026 Weiterleitungen, 404.html und sitemap.xml dort entfernt

## Belege zur Datenschutzerklärung: KI-Fragen und Zugriffsprotokolle (26.09.2026)

Stand aus den früheren HTML-Kommentaren von `datenschutz.html` / `en/privacy.html` — hier statt
im Quelltext, weil GitHub Pages Kommentare öffentlich mit ausliefert. **Offen:** im Verzeichnis
`logs/` des IONOS-Webspace prüfen, ob die IP-Adressen dort wirklich gekürzt sind und wie weit die
Protokolle zurückreichen (der Text sagt „Laut IONOS“ und stützt sich auf deren Hilfeseite).

```
<!-- Zugriffsprotokolle von api.jkhd.de (Zweig ki-chat, 26.09.2026). Die
           Angaben stammen aus der IONOS-Hilfe „Datenverarbeitung durch Webhosting
           Produkte" (https://www.ionos.com/help/data-protection/data-processing-of-website-visitors-of-your-ionos-product/data-processing-by-web-hosting-products/,
           abgerufen 26.09.2026), nicht aus einer eigenen Messung. Vor dem
           Livegang im Verzeichnis logs/ des Webspace nachsehen, ob die
           IP-Adressen dort wirklich gekuerzt sind und wie weit die Protokolle
           zurueckreichen; weicht etwas ab, diesen Absatz und en/privacy.html
           anpassen. -->
```

```
<!-- Fragen an die KI (Stand 26.09.2026). Anbieter: OVHcloud AI Endpoints.
           Belege, alle abgerufen am 26.09.2026:
           - OVH GmbH, Oskar-Jaeger-Str. 173/K6, 50825 Koeln: AGB Stand 17.01.2025,
             Abschnitt „Vertragsgegenstand" und Widerrufsformular in 12.4
             (https://contract.eu.ovhapis.com/1.0/pdf/contrat_genServices-de.pdf).
           - Auftragsverarbeitung: AVV Version 17.10.2025
             (https://contract.eu.ovhapis.com/1.0/pdf/OVH_Data_Protection_Agreement-de.pdf),
             nach den AGB Teil jedes Vertrags.
           - Vertragsbedingungen: Besondere Vertragsbedingungen Public Cloud,
             Stand 26.08.2026, Anhang 10
             (https://contract.eu.ovhapis.com/1.0/pdf/Conditions_particulieres_OVH_Stack-de.pdf).
             Nr. 5 im Wortlaut: „OVHcloud hat keine Kenntnis von den Inputs und
             Outputs und verwendet diese in keiner Weise weiter. OVHcloud führt
             kein Backup der Inputs oder Outputs durch." Nr. 2 im Wortlaut:
             „Der AI Endpoints Dienst beinhaltet keine Backups oder Storages,
             auch nicht für kurze Zeit". Beides gilt nicht fuer die
             „AI Endpoint Batch API", die der Server nicht nutzt.
           - Weder gespeichert noch weitergegeben, Standort Gravelines:
             https://docs.ovhcloud.com/en/guides/public-cloud/ai-machine-learning/ai-endpoints-capabilities
             („Data is not stored or shared during or after model use";
             „Our infrastructure, located in Gravelines, France").
           - Nur Abrechnungsdaten, nie Training:
             https://www.ovhcloud.com/de/public-cloud/ai-endpoints/
           Weitere Hinweise: README des Repos JKHD-Partner-Server, Abschnitt
           „KI-Fragen". Jeder Satz hier haengt an api/index.php (Aktion frage,
           Repo JKHD-Partner-Server) und js/main.js -- wer dort etwas aendert,
           prueft diesen Abschnitt und en/privacy.html mit. -->
```

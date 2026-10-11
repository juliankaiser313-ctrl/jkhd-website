# Simulation: Kaufen- und Verkaufen-Knöpfe wachsen und schrumpfen mit den Zahlen

- **Seite:** https://jkhd.de/simulation.html (ebenso https://jkhd.de/en/simulation.html)
- **Datum:** 2026-10-11
- **Gemeldet von:** Julian (im Chat, mit Bildschirmfoto)
- **Gerät / Browser / Fenstergröße:** Laptop, Chrome, Darstellung ab 1141 px (rechte Spalte 380 px)
- **Sprache / Darstellung:** Deutsch, dunkel
- **Status:** behoben
- **Art:** Darstellung
- **Gewicht:** mittel

## Beschreibung

Die Knöpfe „Kaufen“ und „Verkaufen“ ändern ihre Höhe, sobald sich die Zahlen darin ändern
(Menge, Kurs „zu 2.150,99 $“, Höchstmenge „max. …“), also mit jedem Takt des Spiels. Julians
Wortlaut: „kannst du machen das der Kaufen und Verkaufen Button sich nicht vergrößert und
wieder verkleinert nur weil sich die Zahl innen drin ändert?“

## Messung vorher

Werkzeug `knopf_messung.js` (eigener http-Server, headless Chrome): je Breite 96 Kombinationen
aus Menge, Kurs und Höchstmenge in die Knöpfe geschrieben und die Knopfhöhe gemessen.

- 1141 bis 1920 px: Knopf 186 px breit, Höhe 54 px oder 73 px. Die Kurszeile brach bei
  vierstelliger Höchstmenge um („· max. 1.234“), und „Verkaufen 1.234 S“ füllte die Zeile
  auf den Pixel (162 von 162 px).
- 375 px: Höhe 103 oder 106 px je nach Menge (die Taste B/S rutschte in die nächste Zeile);
  360 px: 72 von 96 Kombinationen mit anderer Höhe.
- 900 px: stabil (66 px).

## Behebung

- **Wer, wann:** Claude, 11.10.2026
- **Ursache:** Die Zahlen standen in Fließtext mit Umbruch. Die Zeilenbreite hing damit von
  der Stellenzahl ab, und auf dem Laptop lagen beide Zeilen genau an der Knopfbreite.
- **Änderung:** Commit 9b8864a, Cache-Stempel 20261011p. `css/style.css`: Mengen-Span
  `min-width: 4.6ch`, Kurszeile als Flex-Paar (`.sp-order-wo-kurs`) mit `min-width` 13ch
  (Kurs) und 10ch (Höchstmenge), gleich breite Ziffern (`tabular-nums`), `white-space: nowrap`;
  Laptop: Innenrand 10 px statt 12 px, Abstand 6 px statt 8 px, damit „Verkaufen 1.234 S“
  (157 px) einzeilig bleibt. `simulation.html`, `en/simulation.html`: Klasse an der Kurszeile.
  `js/spiel.js`: Höchstmenge ohne Mittelpunkt davor („max. 474“ statt „· max. 474“), den
  Abstand gibt das Flex-Paar.
- **Geprüft mit:** `knopf_messung.js` nachher: 1141 bis 1920 px immer 54 px (nur mit
  fünfstelligem Kurs und fünfstelliger Höchstmenge 73 px; das gibt es im Spiel nicht, die
  Höchstmenge liegt bei 1 Mio. $ und Hebel 20 unter 2.000), 900 px 66 px, 375 und 360 px
  106 px, Englisch 54 px und 81 px. Je Breite genau eine Höhe. `pruefung_fehler.js` 29/29 OK.
  Fotos `knoepfe-1366x768-kurz.jpg` und `-lang.jpg`.

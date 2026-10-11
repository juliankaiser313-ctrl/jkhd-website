# js/main.js enthält Code für Bausteine, die es auf keiner Seite mehr gibt

- **Seite:** alle Seiten (`js/main.js`, 115 KB, wird überall geladen)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Quelltext
- **Sprache / Darstellung:** —
- **Status:** behoben
- **Art:** Verbesserung (Wartung, Ladezeit)
- **Gewicht:** niedrig

## Was auffällt

Folgende Abschnitte suchen Elemente, die in keiner der 41 HTML-Dateien vorkommen, und
kehren sofort zurück:

- „Daten-Hintergrund: rohes Time-&-Sales-Tape“ (`#dataviz`)
- „Tiefen-Raster: scrollgekoppelter Hintergrund“ (`#depthgrid`)
- „Scroll-Parallax + Fortschrittslinie“ (`#scrollProgress`, `[data-parallax]`)
- in der Scroll-Enthüllung die Klassen `.guards`, `.guard`, `.layer`, `.rail`,
  `.creed-close` (teils bewusst für einen Wiederaufbau behalten — dann wenigstens
  kommentieren)

Außerdem stimmt der Kommentar am Anfang des Navigations-Abschnitts nicht mehr („Die
Menuepunkte liegen auf jeder Bildschirmbreite hinter dem Menueknopf“ — ab 1141 px stehen
sie offen in der Kopfzeile).

## Was erwartet wird

Toten Code entfernen (oder klar als „für später“ markieren), damit die Datei kleiner und
übersichtlicher wird.

## Belege

Suche nach den Selektoren in allen HTML-Dateien: keine Treffer.

## Behebung

- **Wer, wann:** Claude, 11.10.2026
- **Ursache:** Reste früherer Fassungen der Startseite.
- **Änderung:** js/main.js: die Abschnitte „Daten-Hintergrund“, „Tiefen-Raster“ und „Scroll-Parallax + Fortschrittslinie“ entfernt; Reveal-Selektoren ohne .layer/.rail/.guard/.creed-close, Stagger ohne .guards; der Kommentar zur Navigation beschreibt jetzt beide Breiten. Datei 110 KB → 105 KB. Commit b1fda60, Cache-Stempel 20261011n.
- **Geprüft mit:** Suche nach den Selektoren in allen HTML-Dateien und in js/ (0 Treffer); node --check; pruefung_fehler.js „keine Skriptfehler“ auf acht Seiten, alle übrigen Prüfungen grün.

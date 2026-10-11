# js/main.js enthält Code für Bausteine, die es auf keiner Seite mehr gibt

- **Seite:** alle Seiten (`js/main.js`, 115 KB, wird überall geladen)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Quelltext
- **Sprache / Darstellung:** —
- **Status:** offen
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

## Behebung (wird beim Beheben ausgefüllt)

- **Wer, wann:**
- **Ursache:**
- **Änderung:** Commit …, Cache-Stempel …
- **Geprüft mit:**

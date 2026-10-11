# Dieselbe Schriftdatei wird unter drei bzw. zwei Namen geladen

- **Seite:** alle Seiten (`css/fonts.css`, `assets/fonts/`)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Dateien im Repository, Netzwerkmitschnitt Chrome 155
- **Sprache / Darstellung:** —
- **Status:** behoben
- **Art:** Verbesserung (Ladezeit)
- **Gewicht:** niedrig

## Was passiert

`Manrope-400.woff2`, `Manrope-600.woff2` und `Manrope-700.woff2` sind **byte-gleich**
(je 24.836 Bytes, gleiche SHA-256). Ebenso `PlayfairDisplay-500.woff2` =
`PlayfairDisplay-600.woff2` und `…-500-italic` = `…-600-italic`. Es sind variable
Schriften (eine Datei enthält alle Stärken); Google Fonts liefert sie unter mehreren
Namen aus, und beim Selbst-Hosten wurden sie dreifach abgelegt. Der Browser lädt
dieselben Daten trotzdem für jede benutzte Stärke einzeln (gemessen: Manrope 400 und 700
auf jeder Seite, auf breiten Schirmen auch 600) — rund 25–75 KB unnötig je erstem Besuch.

## Was erwartet wird

Je Schriftfamilie und Schnitt (normal/kursiv) eine Datei und eine `@font-face`-Regel mit
Bereich, z. B. `font-weight: 400 700;`.

## Belege

`sha256sum assets/fonts/*.woff2`; `document.fonts` im Browser.

## Behebung

- **Wer, wann:** Claude, 11.10.2026
- **Ursache:** Beim Herunterladen von Google Fonts wurde dieselbe variable Datei je Stärke abgelegt (Tabellenverzeichnis der WOFF2 gelesen: fvar vorhanden, also variabel).
- **Änderung:** assets/fonts: je Familie und Schnitt eine Datei (Manrope-variabel, PlayfairDisplay-variabel, PlayfairDisplay-variabel-italic), vier Dateien gelöscht; css/fonts.css mit `font-weight: 200 800` bzw. `400 900`; Verweise im Offline-Rezept der README und in offline/index.html angepasst. Commit b1fda60, Cache-Stempel 20261011n.
- **Geprüft mit:** pruefung_fehler.js, Prüfung „Schriften“ (Netzwerkmitschnitt auf system.html): vorher vier Dateien (Manrope 400, 600, 700 und Playfair 500), nachher zwei (Manrope 200–800, Playfair 400–900); Fotos der Seiten zeigen die gewohnten Stärken.

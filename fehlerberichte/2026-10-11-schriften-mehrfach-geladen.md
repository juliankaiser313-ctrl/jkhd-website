# Dieselbe Schriftdatei wird unter drei bzw. zwei Namen geladen

- **Seite:** alle Seiten (`css/fonts.css`, `assets/fonts/`)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Dateien im Repository, Netzwerkmitschnitt Chrome 155
- **Sprache / Darstellung:** —
- **Status:** offen
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

## Behebung (wird beim Beheben ausgefüllt)

- **Wer, wann:**
- **Ursache:**
- **Änderung:** Commit …, Cache-Stempel …
- **Geprüft mit:**

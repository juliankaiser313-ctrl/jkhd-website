# robots.txt sperrt Impressum und Datenschutz — dadurch sehen Suchmaschinen deren „noindex“ nicht

- **Seite:** https://jkhd.de/robots.txt, betrifft impressum.html und datenschutz.html (nicht aber en/imprint.html, en/privacy.html)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Quelltext und ausgelieferte Dateien
- **Sprache / Darstellung:** —
- **Status:** offen
- **Art:** Fehler (Suchmaschinen)
- **Gewicht:** niedrig

## Was passiert

`robots.txt` enthält `Disallow: /impressum.html` und `Disallow: /datenschutz.html`.
Beide Seiten tragen zusätzlich `<meta name="robots" content="noindex">`. Weil der Crawler
die gesperrten Seiten nicht abrufen darf, liest er das `noindex` nie. Die Adressen können
dann trotzdem im Index landen („Indexiert, obwohl durch robots.txt blockiert“) — nur ohne
Text. Das ist dieselbe Falle, die im README beim Offline-Platzhalter beschrieben und dort
richtig umgangen ist.

Außerdem uneinheitlich: die englischen Gegenstücke (`en/imprint.html`, `en/privacy.html`,
`noindex, follow`) stehen nicht in der robots.txt, die deutschen schon; die deutschen
tragen `noindex`, die englischen `noindex, follow`.

## Was erwartet wird

Eine Methode, nicht zwei: die `Disallow`-Zeilen für Impressum und Datenschutz streichen
und nur `noindex` (bzw. `noindex, follow` auf allen vier Seiten) verwenden. Ob die
Rechtsseiten überhaupt aus dem Index sollen, ist Geschmackssache — sichtbar im Index
schadet ein Impressum nicht.

## Schritte zum Nachstellen

1. https://jkhd.de/robots.txt öffnen.
2. Quelltext von https://jkhd.de/impressum.html: `<meta name="robots" content="noindex">`.

## Belege

Beide Dateien wie ausgeliefert.

## Behebung (wird beim Beheben ausgefüllt)

- **Wer, wann:**
- **Ursache:**
- **Änderung:** Commit …, Cache-Stempel …
- **Geprüft mit:**

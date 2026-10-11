# Die Treppe bei „Halteprämie“ wächst aus dem Bild

- **Seite:** https://jkhd.de/system.html, Bild „06 · Halteprämie“
- **Datum:** 2026-10-11
- **Gemeldet von:** Julian (Screenshot im Chat)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome, 1920×1050
- **Sprache / Darstellung:** Deutsch, dunkel
- **Status:** behoben

## Was passiert

Die Treppenlinie steigt nach wenigen Sekunden über den oberen Rand der Leinwand hinaus
und verschwindet hinter der Kopfzeile; die Beschriftungen bleiben zurück.

## Was erwartet wird

Das Diagramm bleibt dauerhaft innerhalb des Bildes, auch auf großen Bildschirmen.

## Schritte zum Nachstellen

1. system.html auf einem Bildschirm mit 1920×1050 öffnen.
2. Bis zum Bild „06 · Halteprämie“ scrollen und einige Sekunden stehen bleiben.

## Belege

Screenshot von Julian im Chat (nicht abgelegt).

## Behebung

- **Wer, wann:** Claude, 2026-10-11
- **Ursache:** Die Stufenhöhe war ein fester Anteil der Diagrammhöhe (0,045), die Zahl
  der Stufen hing von der Breite ab — bei 1.824 px Breite bis zu 65 Stufen, zusammen
  mehr als die Diagrammhöhe.
- **Änderung:** Stufenhöhe aus Diagrammhöhe und Stufenzahl je Runde abgeleitet, Verlauf
  über alle Runden ohne Sprung. Nebenbei im Bild „08 · Orderbuch“ zwei Beschriftungen aus
  Linie und Balken gerückt. Commit 91abfef (master) / 08b0e22 (release), Stempel 20261011l.
- **Geprüft mit:** Fotos der Ruhelage jeder Szene bei 1920×1050, 1280×760 und 390×844
  (headless Chrome); Live-Dateien byteweise gleich dem Release.

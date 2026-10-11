# System-Animation: Kurslinien laufen durch ihre Beschriftungen

- **Seite:** https://jkhd.de/system.html, Bild 04 „Rückkehr zum Mittel“ und Bild 07 „Ereignisse“ (ebenso en/system.html)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome 155, 1280×720 und 390×844
- **Sprache / Darstellung:** Deutsch; hell
- **Status:** behoben
- **Art:** Fehler (Darstellung)
- **Gewicht:** niedrig

## Was passiert

- Bild 07, rechts oben: die Kurslinie nach dem Sprung läuft quer durch die rote
  Beschriftung „wer die Nachricht erst liest, handelt die zweite Welle“ (1280×720) bzw.
  „gelesen: die zweite Welle“ (Handy).
- Bild 04, rechts: „das Mittel“ steht auf der Höhe der Mittellinie, die Schwingung läuft
  durch das Wort (deutlich am Handy).

Weil die Reihen „leben“, ist die Überdeckung mal stärker, mal schwächer — sie kommt aber
immer wieder.

## Was erwartet wird

Beschriftungen stehen im freien Raum (wie am 11.10. schon beim Orderbuch korrigiert) oder
haben einen schmalen Hintergrund in Seitenfarbe, damit die Linie sie nicht durchstreicht.

## Schritte zum Nachstellen

1. https://jkhd.de/system.html öffnen und bis Bild 07 („Der Kurs springt, wenn etwas
   Neues bekannt wird.“) scrollen.
2. Rechts oben die rote Beschriftung ansehen.

## Belege

Bildschirmfotos aus der Prüfung (nicht abgelegt; leicht nachzustellen).

## Behebung

- **Wer, wann:** Claude, 11.10.2026
- **Ursache:** Feste Positionen relativ zur Linie, die lebt.
- **Änderung:** js/bildlauf.js: neue Zeichenhilfe `textFrei` (Kasten in Seitenfarbe hinter dem Text) für „das Mittel“; Bild 07: die Beschriftung steht über dem höchsten Punkt der Linie in ihrer Breite (Laptop) bzw. unter der Linie rechts (Handy — darüber stieße sie an „Zahlen, Beschluss, Termin“). Commit b1fda60, Cache-Stempel 20261011n.
- **Geprüft mit:** Fotos 1280×760 und 390×844 zu je zwei Zeitpunkten (bildlauf_fotos.js): keine Linie mehr durch eine Beschriftung.

# Überschrift „Datenschutzerklärung“ wird auf schmalen Handys abgeschnitten

- **Seite:** https://jkhd.de/datenschutz.html
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome 155, Handy-Ansicht 320×640 und 360×760
- **Sprache / Darstellung:** Deutsch; hell und dunkel
- **Status:** offen
- **Art:** Fehler
- **Gewicht:** niedrig

## Was passiert

Das Wort „Datenschutzerklärung“ ist als Seitenüberschrift breiter als die Spalte und
wird nicht umbrochen, sondern rechts abgeschnitten:

- 360 px Breite (sehr verbreitet bei Android-Handys): Text 324 px, Platz 320 px — das „g“
  ist angeschnitten.
- 320 px Breite (kleine Handys, oder 200 % Zoom): Text 324 px, Platz 280 px — zu sehen
  ist „Datenschutzerklärun“.

Ab 375 px passt es. Andere Seiten sind bei denselben Breiten ohne Befund (geprüft:
impressum, en/privacy, Formelsammlungen, Grundlagen, Unternehmen, Partnerzugang, Kontakt,
Simulation, Was wir machen).

## Was erwartet wird

Die Überschrift ist vollständig zu sehen — notfalls getrennt („Datenschutz-erklärung“)
oder etwas kleiner.

## Schritte zum Nachstellen

1. https://jkhd.de/datenschutz.html in einem 320 px breiten Fenster öffnen
   (Entwicklerwerkzeuge → Geräteansicht).
2. Die Überschrift endet mit „…erklärun“.

## Belege

`2026-10-11-datenschutz-ueberschrift-auf-schmalen-handys-abgeschnitten-1.png` (320×640).

## Vorschlag

`hyphens: auto` für Überschriften (die Seite hat `lang="de"`, Chrome/Safari trennen dann
deutsch) oder `overflow-wrap: anywhere` für `.page-head h1`; alternativ ein weiches
Trennzeichen im Markup: `Datenschutz&shy;erklärung`.

## Behebung (wird beim Beheben ausgefüllt)

- **Wer, wann:**
- **Ursache:**
- **Änderung:** Commit …, Cache-Stempel …
- **Geprüft mit:**

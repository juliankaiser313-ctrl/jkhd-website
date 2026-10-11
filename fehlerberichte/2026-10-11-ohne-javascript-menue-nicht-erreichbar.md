# Ohne JavaScript lässt sich das Menü nicht öffnen

- **Seite:** alle Seiten, Fensterbreite unter 1141 px (auf breiten Schirmen nur die Einträge im Klappfeld)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome 155 mit abgeschaltetem JavaScript, 390×844 und 1280×720
- **Sprache / Darstellung:** Deutsch und Englisch
- **Status:** offen
- **Art:** Verbesserung
- **Gewicht:** niedrig

## Was auffällt

Die Seiten funktionieren ohne JavaScript bemerkenswert gut (Startseite, System,
Prüfungen, Sicherheit und Simulation zeigen dann ihre Text- bzw. Regelfassung). Nur der
Menüknopf ☰ tut ohne JavaScript nichts: auf dem Handy ist die ganze Navigation
unerreichbar, auf breiten Schirmen das Klappfeld (Mathematik, Unternehmen,
Partnerzugang, Impressum, Datenschutz). Es bleibt die Fußzeile — auf der Startseite steht
sie ohne JavaScript zum Glück direkt unter dem Hero.

## Was erwartet wird

Ohne JavaScript ist die Navigation sichtbar, z. B. per `<noscript><style>.site-nav{display:block}</style></noscript>`
oder indem das Menü erst durch das Skript eingeklappt wird (Klasse am `<html>`).

## Schritte zum Nachstellen

1. JavaScript im Browser abschalten, https://jkhd.de/unternehmen.html auf Handybreite öffnen.
2. ☰ antippen — nichts passiert.

## Behebung (wird beim Beheben ausgefüllt)

- **Wer, wann:**
- **Ursache:**
- **Änderung:** Commit …, Cache-Stempel …
- **Geprüft mit:**

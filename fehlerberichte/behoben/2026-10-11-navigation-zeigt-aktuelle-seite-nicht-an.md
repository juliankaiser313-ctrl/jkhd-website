# Navigation zeigt nicht an, auf welcher Seite man gerade ist

- **Seite:** alle Seiten (Kopfzeile und Handy-Menü)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome 155, 1280×720 und 390×844
- **Sprache / Darstellung:** Deutsch und Englisch; hell und dunkel
- **Status:** behoben
- **Art:** Verbesserung (Bedienung, Barrierefreiheit)
- **Gewicht:** niedrig

## Was auffällt

Auf „Prüfungen“ sieht der Menüpunkt „Prüfungen“ genauso aus wie alle anderen; im
Handy-Menü ebenso. Die Seiten tragen kein `aria-current="page"` am eigenen Menüpunkt
(nur der Sprachschalter hat `aria-current`). Besonders auf den Animationsseiten, wo der
Seitenkopf schnell aus dem Bild scrollt, hilft eine Markierung bei der Orientierung;
Bildschirmleser sagen dann „aktuelle Seite“.

## Was erwartet wird

Der Menüpunkt der aktuellen Seite ist hervorgehoben (z. B. Textfarbe `--text` statt
`--muted` oder ein Unterstrich) und trägt `aria-current="page"`.

## Belege

Quelltext der Kopfzeile auf allen Seiten.

## Behebung

- **Wer, wann:** Claude, 11.10.2026
- **Ursache:** Nie gebaut.
- **Änderung:** js/main.js setzt aria-current="page" am Menüpunkt der aktuellen Seite (Pfadvergleich, index.html = /); css/style.css: Textfarbe --text, ab 1141 px zusätzlich eine feine Unterstreichung; der Kontakt-Knopf ist ausgenommen. Commit b1fda60, Cache-Stempel 20261011n.
- **Geprüft mit:** pruefung_fehler.js, Prüfung „aktuelle Seite markiert“ auf pruefung.html: genau ein Eintrag „Prüfungen“, Farbe rgb(16, 16, 18); Fotos der Kopfzeile auf system.html mit Unterstrich unter „System“.

# Datenschutzerklärung zeigt nur die Überschrift, der Text bleibt schwarz

- **Seite:** https://jkhd.de/datenschutz.html (ebenso impressum.html, en/privacy.html, en/imprint.html)
- **Datum:** 2026-10-11
- **Gemeldet von:** Julian („die Datenschutzerklärung sind schwarz bei mir“, Screenshot im Chat)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome, 1920×1050
- **Sprache / Darstellung:** Deutsch, dunkel
- **Status:** behoben

## Was passiert

Unter der Überschrift „Datenschutzerklärung“ ist die Seite leer; die Bildlaufleiste
zeigt, dass Inhalt da ist. In kleineren Fenstern und am Handy bleibt der Text auch nach
dem Scrollen unsichtbar.

## Was erwartet wird

Der vollständige Text ist sofort lesbar.

## Schritte zum Nachstellen

1. datenschutz.html in einem Fenster mit 1280×720 oder am Handy öffnen.
2. Nach unten scrollen: der Text erscheint nicht.

## Belege

Screenshot von Julian im Chat (nicht abgelegt). Messung: der Block `.prose` hatte
Deckkraft 0 und bekam nie die Klasse `in`.

## Behebung

- **Wer, wann:** Claude, 2026-10-11
- **Ursache:** Die Scroll-Enthüllung in js/main.js verlangte, dass 12 % eines Blocks im
  Bild sind. Der Rechtstext ist EIN Block von 6.207 px Höhe (am Handy 10.721 px); 12 %
  davon passen in kein Fenster, der Block blieb bei Deckkraft 0. Er war mit dem
  KI-Abschnitt (26.09.) und dem Simulations-Abschnitt (10./11.10.) über die Grenze gewachsen.
- **Änderung:** Ein Block gilt als sichtbar, wenn 12 % davon ODER mindestens 120 px im Bild
  sind; der Beobachter meldet an mehreren Schwellen. Commit f17c148 (master) / c27d930
  (release), Stempel 20261011m.
- **Geprüft mit:** Werkzeug reveal_test.js (headless Chrome, 1280×720, 1920×1050, 390×844;
  vier Rechtsseiten): alter Code unsichtbar, neuer Code sofort sichtbar; danach dieselbe
  Prüfung gegen jkhd.de live.

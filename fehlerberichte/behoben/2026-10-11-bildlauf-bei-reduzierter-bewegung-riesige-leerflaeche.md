# Bei „Bewegung reduzieren“ folgen auf System, Prüfungen und Sicherheit 15.000–22.000 px leere Fläche

- **Seite:** https://jkhd.de/pruefung.html, https://jkhd.de/sicherheit.html, https://jkhd.de/system.html (ebenso en/testing.html, en/security.html, en/system.html)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome 155, 1280×720, Einstellung „prefers-reduced-motion: reduce“ (in Windows: Einstellungen → Barrierefreiheit → Animationseffekte aus; iPhone: Bewegung reduzieren)
- **Sprache / Darstellung:** Deutsch und Englisch; hell
- **Status:** behoben
- **Art:** Fehler
- **Gewicht:** hoch

## Was passiert

Wer im Betriebssystem Animationen abgeschaltet hat, bekommt auf den drei Bildlauf-Seiten
richtigerweise keine Animation, sondern das Schlussbild und darunter die Texte als Liste
(Klasse `ist-still`). Der Abschnitt `.bildlauf` behält aber seine Höhe für die Animation
(Prüfungen 2400vh = 17.280 px bei 720 px Fensterhöhe; Sicherheit 3300vh; System 3000vh).
Die Liste ist nach 2.500–3.600 px zu Ende — danach kommt **leere Seite**, bevor die
Fußzeile erscheint. Wer scrollt, sieht lange nur die Kopfzeile auf leerem Grund und hält
die Seite für kaputt.

Gemessen (Abschnitt `.bildlauf` mit den Klassen `bildlauf ist-aktiv ist-still`):

| Seite | Fenster | Seitenhöhe | Liste endet bei | Abschnittshöhe |
|---|---|---|---|---|
| pruefung.html | 1280×720 | 18.003 px | 2.489 px | 17.280 px |
| system.html | 1280×720 | 22.323 px | 3.133 px | 21.600 px |
| en/system.html | 1280×720 | 22.323 px | 3.051 px | 21.600 px |
| sicherheit.html | 1280×720 | 24.483 px | 3.591 px | 23.760 px |
| sicherheit.html | 390×844 | 26.487 px | 3.583 px | 25.320 px |

Nebenbei: In der Listenansicht steht unter der Überschrift weiterhin „Scrollen Sie.“ —
ohne Animation ist der Satz ohne Sinn.

## Was erwartet wird

Im stillen Zustand ist der Abschnitt nur so hoch wie Schlussbild plus Liste; danach folgt
direkt die Fußzeile — so wie auf der Startseite, wo derselbe Fall richtig gelöst ist
(Seitenhöhe dort 1.887 px).

## Schritte zum Nachstellen

1. Chrome → Entwicklerwerkzeuge → ⋮ → More tools → Rendering → „Emulate CSS media
   feature prefers-reduced-motion“ auf `reduce`.
2. https://jkhd.de/pruefung.html neu laden und nach unten scrollen.
3. Nach den Texten folgt eine sehr lange leere Fläche.

## Belege

`2026-10-11-bildlauf-bei-reduzierter-bewegung-riesige-leerflaeche-1.png` — sieben Stellen
der Seite von oben bis unten (0 %, 17 %, 33 %, 50 %, 67 %, 83 %, 100 %): ab der zweiten
Stelle leer bis zur Fußzeile.

Ursache im Quelltext nachgesehen (`css/style.css`, Abschnitt Bildlauf): `.bildlauf.ist-still`
setzt Bühne und Texte auf `position: static`, aber keine Regel nimmt
`.bildlauf.ist-aktiv { height: 2400vh }` bzw. die Höhen je `[data-bilder]` zurück.

## Vorschlag

`.bildlauf.ist-still, .bildlauf[data-bilder].ist-still { height: auto; }` (die zweite
Form ist nötig, weil `[data-bilder="…"].ist-aktiv` spezifischer ist), auch im
Handy-Block. „Scrollen Sie.“ im stillen Zustand ausblenden.

## Behebung

- **Wer, wann:** Claude, 11.10.2026
- **Ursache:** Wie im Bericht vermutet: keine Regel nahm die Scrollhöhe (2400–3300vh) im stillen Zustand zurück.
- **Änderung:** css/style.css: `.bildlauf.ist-aktiv.ist-still, .bildlauf[data-bilder].ist-aktiv.ist-still { height: auto; }` (spezifischer als die Höhen je data-bilder, auch im Handy-Block). „Scrollen Sie.“ / „Scroll.“ steht in den sechs Seiten in `<span class="nur-bewegt">` und ist ohne Bewegung und ohne JavaScript ausgeblendet. Commit b1fda60, Cache-Stempel 20261011n.
- **Geprüft mit:** pruefung_fehler.js, Prüfung „reduzierte Bewegung“ (prefers-reduced-motion: reduce, 1280×720): Leerfläche zwischen Listenende und Fußzeile vorher 14.865 / 20.243 / 18.541 px (Prüfungen / Sicherheit / System), nachher 72 px; der Hinweis „Scrollen Sie.“ ist unsichtbar.

# Deutsche Texte: uneinheitliche Schreibweisen und ein paar holprige Stellen

- **Seite:** mehrere, siehe Liste
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Text der ausgelieferten Seiten, Chrome 155
- **Sprache / Darstellung:** Deutsch
- **Status:** in Arbeit
- **Art:** Verbesserung (Sprache)
- **Gewicht:** niedrig

## Was auffällt

1. **Not-Aus / Notaus:** „Not-Aus“ auf was-wir-machen.html und sicherheit.html (3×),
   „Notaus“ auf unternehmen.html (3×). Eine Schreibweise wählen.
2. **Webseite / Website:** 25× „Webseite“ (u. a. Fußzeile, Impressum, Datenschutz),
   3× „Website“ (sicherheit.html „Diese Website speichert …“, datenschutz.html). Eine
   Schreibweise wählen.
3. **Punkt hinter Hauptüberschriften:** fast alle Seitenüberschriften enden mit Punkt
   („Quantitative Systeme.“, „Wie wir unser eigenes System prüfen.“, „Womit wir
   rechnen.“) — „Sprechen wir direkt“ (kontakt.html, EN „Let's talk directly“) nicht.
4. **sicherheit.html, Bild 01:** „Gezogen entstehen keine neuen Einstiege, offene Trades
   laufen aus.“ — „Gezogen“ bezieht sich grammatisch auf die Einstiege. Besser: „Ist er
   gezogen, entstehen keine neuen Einstiege …“ (was-wir-machen.html hat es so).
5. **pruefung.html, Bild 01:** „Wer das Feld in der Aufgabenliste leer lässt …“ — für
   Besucher ist unklar, welches Feld und welche Aufgabenliste gemeint ist. Einen halben
   Satz Erklärung ergänzen oder allgemeiner formulieren.
6. **Begriffe für dasselbe:** Einstieg / Trade / Position / Order wechseln auf den Seiten
   Sicherheit und Was wir machen (z. B. „keine neuen Einstiege, offene Trades laufen
   aus“). Für Laien wäre ein Begriff je Sache leichter.
7. **„Wiederholungs-Stop“** (Prüfungen, Bild 04) mischt Bindestrich-Schreibung mit dem
   englischen „Stop“; im Deutschen „Wiederholungsstopp“ (oder „Wiederholungssperre“).
8. **Unternehmen, Werdegang:** „Ausbildung im Elektrotechniker-Handwerk“ — üblich ist
   die Zusammenschreibung „Elektrotechnikerhandwerk“ oder kürzer „im Elektrohandwerk“.
   (Text ist von Julian freigegeben — nur als Hinweis.)

## Was erwartet wird

Einheitliche Schreibweisen über alle Seiten; Wortlaut entscheidet Julian.

## Schritte zum Nachstellen

Die genannten Seiten lesen; bei den Animationsseiten bis zum jeweiligen Bild scrollen.

## Belege

Volltextsuche über alle ausgelieferten Texte.

## Hinweis (Claude, 11.10.2026)

Offen und Julians Entscheidung: 2 Webseite/Website (25 : 3 — welche Schreibweise?), 5 pruefung.html Bild 01 „Feld in der Aufgabenliste“ (halber Satz Erklärung von ihm), 6 ein Begriff je Sache (Einstieg/Trade/Position/Order), 8 „Elektrotechniker-Handwerk“ (freigegebener Text).

## Behebung

- **Wer, wann:** Claude, 11.10.2026
- **Ursache:** Texte aus mehreren Wochen und mehreren Händen.
- **Änderung:** Erledigt: 1 „Not-Aus“ überall (unternehmen.html 3×); 3 „Sprechen wir direkt.“ / „Let’s talk directly.“ mit Punkt; 4 „Ist er gezogen, entstehen keine neuen Einstiege …“; 7 „Wiederholungsstopp“ (pruefung.html, js/bilder-pruefung.js). Commit 20321ce, Cache-Stempel 20261011o.
- **Geprüft mit:** Diff gelesen; Regressionslauf pruefung_fehler.js.

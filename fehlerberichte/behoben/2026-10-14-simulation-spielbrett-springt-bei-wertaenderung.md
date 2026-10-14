# Simulation: Das Spielbrett springt, sobald sich ein Wert ändert

- **Seite:** https://jkhd.de/simulation.html (ebenso https://jkhd.de/en/simulation.html)
- **Datum:** 2026-10-14
- **Gemeldet von:** Julian (im Chat, mit Bildschirmfoto)
- **Gerät / Browser / Fenstergröße:** Laptop, Chrome/Edge, Darstellung ab 1141 px
- **Sprache / Darstellung:** Deutsch, dunkel
- **Status:** behoben
- **Art:** Darstellung
- **Gewicht:** mittel

## Beschreibung

Während einer Partie verschiebt sich im Spielbrett ständig etwas: Der Chart wird neu hoch,
die Knöpfe und das SL/TP-Feld rutschen, nur weil irgendwo ein Wert dazukommt oder länger
wird. Julians Wortlaut: „dass sich nicht die ganze Zeit etwas ändert, also dass die ganze
Zeit der Chart verschoben wird oder sonst was, nur weil ein Wert irgendwo neu dazukommt oder
größer wurde“.

## Messung vorher

Werkzeug `brett_messung.js`: eine echte Partie bei Tempo 2× mit ständigem Drehen der Position
(Max) und „SL auf Einstand“; ein Intervall in der Seite tastet alle 200 ms Lage und Größe von
29 Bausteinen ab und notiert jede Änderung mit dem Text, der gerade dort stand.

- 1920 × 1050: 18 Bausteine unruhig. Die Meldung unter den Knöpfen wechselte zwischen 17, 22
  und 44 px Höhe (1 bis 2 Zeilen, längste Texte 3), damit wuchs die rechte Spalte und der
  Chart daneben (370 → 397 → 376 px), die SL/TP-Zeilen rutschten um 27 px. Die Wertezeilen
  der Tafeln sprangen von einer auf zwei Reihen (84 → 107 px), sobald aus „keine“ ein
  „Long 53“ wurde; dann rutschten Nachricht, Knöpfe und Chart um 23 px. Die Kapitalzahl
  wechselte zwischen 86 und 97 px Breite, der Balken daneben verschob sich entsprechend.
- 1366 × 768: dieselben Ursachen, dazu brach der Tafelkopf des Algos um (Kapital und Balken
  5 px tiefer).
- 375 × 812: die Meldung wechselte zwischen 23, 48 und 72 px (1 bis 3 Zeilen, längste 4);
  Legende, Knöpfe und SL/TP rutschten mit.

`texte_messung.js` ermittelte je Breite, wie viele Zeilen die längsten Texte brauchen
(Meldung: 3 ab 1141 px, 2 dazwischen, 4 bis 560 px; SL/TP-Hinweis am Handy 2) und wie breit
die Kapitalzahl höchstens wird („1.000.000 $“ = 11 Zeichen).

## Behebung

- **Wer, wann:** Claude, 14.10.2026
- **Ursache:** Mehrere Bausteine hatten eine Höhe oder Breite, die vom gerade angezeigten
  Wert abhing: die Meldung (ein bis vier Zeilen), die Wertezeilen der Tafeln (Fließzeile mit
  Umbruch), die Kapitalzahl und der Tastenhinweis. Weil der Chart so hoch ist wie die rechte
  Spalte, wurde er mit jeder Meldung neu hoch.
- **Änderung:** Commit 3e94a1c, Cache-Stempel 20261014b, nur `css/style.css`: Meldung mit
  fester Mindesthöhe in Zeilen (`3lh` ab 1141 px, `2lh` dazwischen, `4lh` bis 560 px, jeweils
  mit em-Rückfall), SL/TP-Hinweis am Handy `2lh`; Wertezeilen ab 1141 px als Raster mit immer
  zwei Reihen zu drei Werten, Werte und Bezeichner ohne Umbruch, Ziffern gleich breit;
  Kapitalzahl `min-width: 11ch`; Tastenhinweis `min-width: 35ch`.
- **Geprüft mit:** `brett_messung.js` nachher an 1920, 1366 und 375 px über ganze Partien:
  „RUHIG: kein Baustein hat sich bewegt oder seine Größe geändert“, nur das Protokoll unter
  dem Brett wächst (gewollt). `texte_messung.js`: alle längsten Texte passen in die
  reservierten Zeilen, Wertezeilen überall konstant, Kapital 119 px bei jedem Wert.
  `pruefung_fehler.js` 29/29 OK. Fotos `brett-1366x768-foto.jpg`, `brett-375x812-foto.jpg`.

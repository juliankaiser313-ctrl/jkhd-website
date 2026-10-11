# Formelsammlungen: zwei falsche Geschichtsangaben, eine unvollständige Formel, zwei kleine Ungenauigkeiten

- **Seite:** https://jkhd.de/monster-formelsammlung.html und https://jkhd.de/quant-formelsammlung.html
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website; alle 438 Formeln beider Sammlungen und die Erklärtexte durchgesehen)
- **Gerät / Browser / Fenstergröße:** Text der ausgelieferten Seiten
- **Sprache / Darstellung:** Deutsch
- **Status:** behoben
- **Art:** Fehler (Inhalt)
- **Gewicht:** mittel

Beide Seiten werden aus `C:\Quant Arbeit\JKHD-Formeln\quellen\*.json` gebaut — dort ändern,
dann neu bauen. Fast alles in den Sammlungen ist richtig (u. a. Funktionalgleichung,
explizite Formel, Ramanujan- und Chudnovsky-Reihe, Black-Scholes samt Greeks, PSR,
Avellaneda-Stoikov, Almgren-Chriss, Girsanov, Feynman-Kac, Kelly ↔ Shannon). Gefunden:

## 1. Ramanujans 1/π-Reihe: bewiesen 1987, nicht 1985 (monster, Abschnitt 2)

Dort steht: „bewiesen wurde sie erst 1985 (Borwein-Brüder)“. 1985 hat R. W. Gosper die
Reihe für 17 Millionen Stellen von π **benutzt** — ohne dass sie bewiesen war. Den Beweis
lieferten Jonathan und Peter Borwein **1987** (Buch „Pi and the AGM“).
Vorschlag: „1985 rechnete Gosper damit 17 Millionen Stellen, bewiesen haben sie die
Borwein-Brüder erst 1987.“

## 2. Mandelbrot: die Reihenfolge ist umgekehrt (monster, Abschnitt 9, Navier-Stokes)

Dort steht: „Mandelbrot kam von der Turbulenz zu den Märkten.“ Es war andersherum: seine
Arbeit über Baumwollpreise erschien 1963, mit Turbulenz befasste er sich ab Ende der
1960er/Anfang der 1970er und stellte dann fest, dass seine Werkzeuge für Preise und
Turbulenz verwandt sind. Vorschlag: „Mandelbrot kam von den Märkten (Baumwollpreise,
1963) zur Turbulenz — und fand dort dieselben Werkzeuge.“

## 3. Kalman-Filter ohne Kovarianz-Update (quant, Abschnitt 6)

Die Formel zeigt Prediction (x̂, P) und im Update nur K und x̂. Es fehlt die Zeile, ohne
die die Rekursion nicht weiterläuft:
`P_t = (I - K_t H) P_{t|t-1}`. Ohne sie ist der Algorithmus nicht vollständig.

## 4. Ornstein-Uhlenbeck: Varianz als σ²/2θ geschrieben (monster, Abschnitt 10)

„die stationäre Verteilung N(μ, σ²/2θ)“ — streng gelesen heißt das (σ²/2)·θ. Gemeint ist
σ²/(2θ). Klammern setzen.

## 5. Querverweis ins Leere (monster, Abschnitt 10, HJB)

„Sie ist die stochastische Schwester der Hamilton-Jacobi-Gleichung der Mechanik
(Abschnitt 4)“ — Abschnitt 4 enthält Euler-Lagrange, Hamilton-Formalismus und Noether,
aber nicht die Hamilton-Jacobi-Gleichung. Entweder dort ergänzen oder den Verweis
anpassen („… der Hamilton-Mechanik, Abschnitt 4“).

## Kleinigkeiten

- quant, Abschnitt 7: „VPIN … stieg vor dem Flash Crash 2010 stark an“ — die Aussage
  stammt von den VPIN-Autoren selbst und ist in der Literatur umstritten (u. a. Andersen &
  Bondarenko). Ein „laut den Autoren“ würde reichen.
- quant: „Ito-Korrektur“ (Abschnitt 5) neben „Itôs Lemma“ — einheitlich „Itô“.

## Belege

Text der ausgelieferten Seiten; zu 1. und 2. öffentliche Quellen (Borwein/Borwein 1987,
„Pi and the AGM“; Mandelbrot 1963, „The Variation of Certain Speculative Prices“).

## Behebung

- **Wer, wann:** Claude, 11.10.2026
- **Ursache:** Abschrift aus den PDF-Sammlungen; die Fehler standen schon in der Vorlage bzw. entstanden beim Kürzen.
- **Änderung:** Im Repo JKHD-Formeln (Commit fdb3139): Ramanujan-Reihe „1985 rechnete Gosper damit 17 Millionen Stellen von π, bewiesen haben sie die Borwein-Brüder erst 1987“; Mandelbrot „von den Märkten (Baumwollpreise, 1963) zur Turbulenz“; Kalman-Filter mit der Zeile $P_t = (I - K_t H) P_{t|t-1}$; OU-Varianz als $\sigma^2/(2\theta)$; HJB-Querverweis auf den Hamilton-Formalismus in Abschnitt 4; VPIN „laut den Autoren … in der Literatur umstritten“; „Itô-Korrektur“. Seiten mit node bauen.js neu gebaut. Commit 20321ce, Cache-Stempel 20261011o.
- **Geprüft mit:** node pruefe.js: 27 Dateien, 430 Formeln, 0 Fehler; die gebauten Seiten enthalten die neuen Stellen (grep „1987“, „Itô-Korrektur“); Kopf der gebauten Seiten unverändert bis auf den Stempel.

# Simulation, Regeltext: „1 Bewegungen“ / „1 moves“ und „the 1. touch“

- **Seite:** https://jkhd.de/simulation.html und https://jkhd.de/en/simulation.html, Abschnitt „So spielt der JKHD-Algo“ / „How the JKHD Algo plays“
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome 155, 1280×720
- **Sprache / Darstellung:** Deutsch und Englisch; hell
- **Status:** offen
- **Art:** Fehler (Text)
- **Gewicht:** niedrig

## Was passiert

Die Zahlen im Regeltext kommen aus dem Spielmotor (`data-sp-zahl`). Wo der Wert 1 ist,
passt das Hauptwort nicht:

- DE: „… und steigt sofort dagegen ein, Stop **1 Bewegungen** hinter dem Stich, Ziel wie an der Zone.“
- EN: „… enters against it at once, stop **1 moves** behind the spike, target as at a zone.“
- EN: „… it trades against the zone as soon as the price turns away from it – up to **the
  1. touch**, …“ — „1.“ ist die deutsche Schreibweise der Ordnungszahl; englisch „1st“
  (oder „the first touch“).

## Was erwartet wird

„1 Bewegung“, „1 move“, „the 1st touch“ bzw. „the first touch“.

## Schritte zum Nachstellen

1. https://jkhd.de/simulation.html öffnen, zum Abschnitt „So spielt der JKHD-Algo“.
2. Im Absatz „Sticht der Kurs um mindestens 1 Bewegung durch eine Zone …“ steht
   „Stop 1 Bewegungen hinter dem Stich“.

## Belege

Text der ausgelieferten Seite (DE und EN), siehe Zitate oben.

## Vorschlag

Einzahl/Mehrzahl beim Einsetzen der Zahl berücksichtigen (z. B. `data-sp-art` um eine
Mehrzahl-Regel ergänzen) oder die betroffenen Sätze so formulieren, dass die Zahl ohne
Hauptwort steht; für Englisch Ordinalzahlen mit Endung (1st, 2nd, 3rd …). Daran denken:
der Text im HTML ist auch die Fassung ohne JavaScript.

## Behebung (wird beim Beheben ausgefüllt)

- **Wer, wann:**
- **Ursache:**
- **Änderung:** Commit …, Cache-Stempel …
- **Geprüft mit:**

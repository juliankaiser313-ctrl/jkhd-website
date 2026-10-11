# Englische Fassung: einige Übersetzungen sagen etwas anderes als das Deutsche

- **Seite:** https://jkhd.de/en/testing.html, https://jkhd.de/en/security.html, https://jkhd.de/en/company.html, https://jkhd.de/en/simulation.html
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Text der ausgelieferten Seiten, Chrome 155
- **Sprache / Darstellung:** Englisch
- **Status:** behoben
- **Art:** Fehler (Text)
- **Gewicht:** niedrig

## Was passiert

| Seite | Englisch | Deutsch | Problem / Vorschlag |
|---|---|---|---|
| en/testing.html, Stress tests | „Six failures, **brought forward** on purpose“ | „vorher herbeigeführt“ | „brought forward“ heißt „vorverlegt“. Besser: „Six failures, caused deliberately in advance“. |
| en/testing.html, 05 | „**The clock** writes its own sign of life.“ | „Der Takt schreibt …“ | „Takt“ meint hier den Arbeitszyklus, nicht eine Uhr. Besser: „Each cycle writes its own heartbeat.“ |
| en/testing.html, 03 (+ Zeichnung) | „over series with **no link left**“ | „Reihen ohne Zusammenhang“ | ungewöhnlich; besser „series with no relationship left“ / „shuffled series“. |
| en/testing.html, 03 (+ Zeichnung) | „The **edge zone** is dropped“ | „Die Randzone fällt heraus“ | „edge“ bedeutet in diesem Fach „Vorteil“ — Verwechslungsgefahr. Besser „the boundary zone (embargo) is dropped“. |
| en/security.html, 06 | „**Close entries**, prove nothing is open …“ | „Einstiege sperren“ | „close entries“ liest sich wie „Positionen schließen“. Besser „Block new entries“. Ebenso in der Zeichnung („close entries“). |
| en/security.html, 03 | „trading starts with **entries closed**“ | „mit geschlossenen Einstiegen“ | gleiches Missverständnis; „with new entries blocked“. |
| en/company.html | Zwischenüberschrift „**Exchange**“ | „Austausch“ | auf einer Trading-Seite liest man „Börse“. Besser „Exchange of ideas“ / „Talking shop“. |
| en/simulation.html | „up to **the 1. touch**“, „stop **1 moves**“ | „1. Berührung“, „1 Bewegungen“ | siehe eigener Bericht `2026-10-11-simulation-zahlen-im-regeltext-falsch-gebeugt.md`. |

## Was erwartet wird

Die englische Fassung sagt dasselbe wie die deutsche, ohne Fachbegriffe, die im Englischen
etwas anderes bedeuten.

## Schritte zum Nachstellen

1. Die genannten Seiten öffnen (bei den Animationsseiten bis zum jeweiligen Bild scrollen
   oder ohne JavaScript ansehen — dann steht der Text als Liste da).

## Belege

Text der ausgelieferten Seiten; die Zeichnungen stehen in `js/bilder-pruefung.js` und
`js/bilder-sicherheit.js`.

## Behebung

- **Wer, wann:** Claude, 11.10.2026
- **Ursache:** Wort-für-Wort-Übersetzungen, bei denen ein Fachbegriff im Englischen etwas anderes bedeutet.
- **Änderung:** en/testing.html: „boundary zone (embargo) is dropped“, „shuffled series with no relationship left“, „Each cycle writes its own heartbeat.“, „caused deliberately in advance“; js/bilder-pruefung.js: „boundary zone dropped“, „no relationship left“. en/security.html: „trading starts with new entries blocked“, „Block new entries, prove nothing is open“; js/bilder-sicherheit.js: „block new entries“. en/company.html: „Exchange of ideas“. Die Zahlen im Regeltext der Simulation (1 move, 1st touch) sind seit Runde A richtig. Commit 20321ce, Cache-Stempel 20261011o.
- **Geprüft mit:** Text der geänderten Seiten im Diff gelesen; node --check für beide Bilddateien; Regressionslauf pruefung_fehler.js.

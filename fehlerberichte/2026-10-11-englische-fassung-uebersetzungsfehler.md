# Englische Fassung: einige Übersetzungen sagen etwas anderes als das Deutsche

- **Seite:** https://jkhd.de/en/testing.html, https://jkhd.de/en/security.html, https://jkhd.de/en/company.html, https://jkhd.de/en/simulation.html
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Text der ausgelieferten Seiten, Chrome 155
- **Sprache / Darstellung:** Englisch
- **Status:** offen
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

## Behebung (wird beim Beheben ausgefüllt)

- **Wer, wann:**
- **Ursache:**
- **Änderung:** Commit …, Cache-Stempel …
- **Geprüft mit:**

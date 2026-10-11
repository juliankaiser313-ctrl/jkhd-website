# README der Website beschreibt an mehreren Stellen einen alten Stand

- **Seite:** https://github.com/juliankaiser313-ctrl/jkhd-website (README.md; wird auch unter https://jkhd.de/README.md ausgeliefert)
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** —
- **Sprache / Darstellung:** Deutsch
- **Status:** behoben
- **Art:** Fehler (Dokumentation)
- **Gewicht:** niedrig

## Was auffällt

| Stelle in der README | dort steht | heute |
|---|---|---|
| Struktur, `index.html` | „Hero mit Marken-Lockup und zwei Knöpfen, leere Laufleiste“ | Laufleiste seit 10.10. weg; Hero liegt in der Universum-Animation |
| Struktur, `was-wir-machen.html` | „ein Satz, ein Absatz …, Bäcker-Kasten, Kontaktkasten“ | Seite hat zusätzlich „Weg einer Idee“ (6 Schritte) und „Sperren“ (4) |
| Simulation, „Zusagen“ | „Das Spiel speichert nichts …, sendet nichts und lädt nichts von fremden Servern“ | seit der Bestenliste gehen Spielmarke und ggf. Spitzname an api.jkhd.de |
| Simulation, letzter Punkt | „Die KI der Fragen-Blase kennt diese Seite noch nicht“ | seit 11.10. kennt sie die Simulation (getestet: richtige Antwort) |
| Livegang | „Live seit August 2026 (siehe Abschnitt oben — derzeit ausgesetzt)“ | live seit 20.09.2026 |
| Zweisprachigkeit, Seitenpaare | Liste der Paare | es fehlen `was-wir-machen.html ↔ en/what-we-do.html` und `mathematik-grundlagen.html ↔ en/mathematics-basics.html` |

## Was erwartet wird

README auf den heutigen Stand bringen — andere Menschen oder KI-Systeme, die Fehler
melden oder beheben, lesen zuerst dort.

## Behebung

- **Wer, wann:** Claude, 11.10.2026
- **Ursache:** Die README wuchs mit, die Einleitung nicht.
- **Änderung:** Alle sechs Stellen: Startseite (Hero auf der Universum-Bühne, Laufleiste seit 10.10. weg), was-wir-machen (Kurz gesagt, Weg einer Idee, Sperren), Zusagen der Simulation (Spielmarke und Bestenlisten-Eintrag an api.jkhd.de), KI kennt die Simulation seit 11.10., „Live seit 20.09.2026“, Seitenpaare um was-wir-machen ↔ what-we-do und mathematik-grundlagen ↔ mathematics-basics ergänzt. Dazu der neue Abschnitt „Herkunft der Seiteninhalte“ (siehe Bericht interne-html-kommentare). Commit 20321ce, Cache-Stempel 20261011o.
- **Geprüft mit:** README im Diff gelesen.

# KI-Assistent: die Frage „Handelt JKHD schon mit echtem Geld?“ bekommt „Dazu habe ich keine Angaben“

- **Seite:** Fragen-Blase unten rechts, z. B. auf https://jkhd.de/kontakt.html
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome 155, 1280×720
- **Sprache / Darstellung:** Deutsch; hell
- **Status:** in Arbeit
- **Art:** Verbesserung
- **Gewicht:** niedrig

## Was passiert

Drei Testfragen gestellt:

1. „Was macht JKHD genau?“ → passende KI-Antwort nach 13,6 s.
2. „Is the game on the simulation page the real JKHD trading system?“ (englische Seite) →
   richtige KI-Antwort nach 3,5 s.
3. „Handelt JKHD schon mit echtem Geld an der Börse?“ → nach 0,5 s die feste
   **„Automatische Antwort“**: „Dazu habe ich keine Angaben. Einen Menschen erreichen Sie
   über die Kontaktseite oder per E-Mail an kontakt@jkhd.de.“

Die Website beantwortet Frage 3 selbst klar („An unserem System hängt noch kein echter
Broker“, „keine Sperre hat je echtes Geld gehalten“). Die Sperre gegen Anlagefragen greift
hier offenbar zu breit und lässt die Blase ausweichend wirken — genau bei einer Frage, die
Besucher naheliegend stellen.

Kleinigkeit: In der festen Antwort ist „Kontaktseite“ kein Link (die Adresse schon).

## Was erwartet wird

Eine Antwort im Sinne der Website („Nein, bisher nicht — an das System ist noch kein
Broker angeschlossen.“), oder wenigstens ein Hinweis auf die Seite „Sicherheit“.

## Schritte zum Nachstellen

1. Auf einer beliebigen Seite unten rechts „Fragen“ öffnen.
2. „Handelt JKHD schon mit echtem Geld an der Börse?“ senden.

## Belege

Antworttexte wie zitiert (Kennzeichnung „KI-Antwort“ bzw. „Automatische Antwort“ ist
korrekt vorhanden).

## Behebung

- **Wer, wann:** Claude, 11.10.2026
- **Ursache:** Zwei Dinge: (1) „Kontaktseite“ in den festen Antworten war reiner Text — die Antworten kommen vom Server, der Client zeigte sie unverändert. (2) Die Sperre gegen Anlagefragen prüft auf dem Server (api/index.php) auf ein Finanzinstrument plus eine Handels- oder Ratform; „Handelt JKHD … an der Börse“ trifft beides.
- **Änderung:** Teil 1 erledigt: js/main.js wandelt in festen Antworten das erste Vorkommen von „Kontaktseite“ / „contact page“ in einen Link auf die Kontaktseite (Funktion verlinken). Commit b1fda60, Cache-Stempel 20261011n. Teil 2 offen: die Sperre auf dem Server braucht eine Ausnahme für Fragen, ob JKHD selbst mit echtem Geld handelt (ohne Instrument, ohne Rat) — Änderung am Server, Upload nur über den IONOS-Webspace.
- **Geprüft mit:** Teil 1: node --check und Prüfung „keine Skriptfehler“; die Verlinkung greift nur bei art = sperre. Teil 2: noch nicht.

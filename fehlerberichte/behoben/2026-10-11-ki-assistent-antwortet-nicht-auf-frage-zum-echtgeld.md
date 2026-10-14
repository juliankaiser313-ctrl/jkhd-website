# KI-Assistent: die Frage „Handelt JKHD schon mit echtem Geld?“ bekommt „Dazu habe ich keine Angaben“

- **Seite:** Fragen-Blase unten rechts, z. B. auf https://jkhd.de/kontakt.html
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome 155, 1280×720
- **Sprache / Darstellung:** Deutsch; hell
- **Status:** behoben
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

- **Wer, wann:** Claude, 11.10.2026 (Teil 1) und 14.10.2026 (Teil 2 live)
- **Ursache:** Zwei Dinge: (1) „Kontaktseite“ in den festen Antworten war reiner Text — die Antworten kommen vom Server, der Client zeigte sie unverändert. (2) Die Sperre gegen Anlagefragen prüft auf dem Server (api/index.php) auf ein Finanzinstrument plus eine Handels- oder Ratform; „Handelt JKHD … an der Börse“ trifft beides.
- **Änderung:** Teil 1 erledigt: js/main.js wandelt in festen Antworten das erste Vorkommen von „Kontaktseite“ / „contact page“ in einen Link auf die Kontaktseite (Funktion verlinken). Commit b1fda60, Cache-Stempel 20261011n. Teil 2 vorbereitet (Repo JKHD-Partner-Server, Commit 23763df): neues Muster `markt_allgemein` (Börse, Aktienmarkt, the market …); `ki_sperre_vorher` lässt eine Echtgeld-Frage ans Modell, wenn nach dem Herausnehmen dieser Wörter kein bestimmtes Instrument in Frage oder Verlauf bleibt — „Handeln Sie MNQ mit echtem Geld?“ bleibt eine Marktfrage. Das Wissen beantwortet die Frage („keine Gegenseite angeschlossen“), die Sperre nach dem Modell fängt eine falsche Behauptung ab. Hochgeladen am 14.10.2026 (zusammen mit der Statistik der Bestenliste, Server-Commit a6a1997); die Datei wurde zurückgelesen, SHA-256 gleich.
- **Geprüft mit:** Teil 1: node --check und Prüfung „keine Skriptfehler“; die Verlinkung greift nur bei art = sperre. Teil 2: Python-Nachbau der Sperren (pruefung/ki_filter_nachbau.py) mit fünf neuen Fragen und einem Verlauf als Fälle — alter Code 3 Abweichungen, neuer Code ALLES OK, auch mit `--pcre` (15.119 Auswertungen, 0 Abweichungen). Live am 14.10.2026: „Handelt JKHD schon mit echtem Geld an der Börse?“ dreimal an api.jkhd.de gestellt, dreimal Status 200 mit der Antwort aus dem Wissen: „Es ist keine Gegenseite angeschlossen, über die echtes Geld bewegt werden könnte. Die Bereitschaftsprüfung sagt deshalb immer nein.“ Kein Ausweichen mehr auf „Dazu habe ich keine Angaben“.

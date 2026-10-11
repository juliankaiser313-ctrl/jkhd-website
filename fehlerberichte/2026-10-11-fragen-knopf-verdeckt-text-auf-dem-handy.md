# Der Knopf der Fragen-Blase verdeckt auf dem Handy die letzten Wörter der Bildlauf-Texte

- **Seite:** https://jkhd.de/system.html, https://jkhd.de/pruefung.html, https://jkhd.de/sicherheit.html (und die englischen Gegenstücke); in kleinerem Maß auch andere Seiten
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome 155, Handy-Ansicht 390×844
- **Sprache / Darstellung:** Deutsch und Englisch; hell und dunkel
- **Status:** offen
- **Art:** Fehler
- **Gewicht:** mittel

## Was passiert

Auf den drei Bildlauf-Seiten steht der Text jedes Bildes fest unten links auf der
klebenden Bühne. Der schwarze Knopf der Fragen-Blase (unten rechts, ca. 50×50 px) liegt
genau über dem Ende der letzten Textzeile. Weil der Text beim Scrollen nicht mitwandert,
lässt sich das verdeckte Stück auch durch Scrollen nicht freilegen. Beispiele bei 390×844:

- System, 04 · Rückkehr zum Mittel: „… dann wächst der Verlust mit jedem Nachlege[n.]“
- Prüfungen, 05: „… startet ihn erst im nächsten Durchgang neu[.]“
- Sicherheit, 07 · Zwei Grenzen: Zeilenende unter dem Knopf
- System, Titelbild: „… Scrollen Sie.“ läuft unter den Knopf

## Was erwartet wird

Der Text ist vollständig lesbar — der Knopf liegt nicht über Inhalt, der sich nicht
wegscrollen lässt.

## Schritte zum Nachstellen

1. https://jkhd.de/system.html auf dem Handy öffnen.
2. Bis zu Bild 04 („Ein Ausschlag geht meist wieder zurück.“) scrollen.
3. Das letzte Wort des Textes liegt unter dem runden Fragen-Knopf.

## Belege

`2026-10-11-fragen-knopf-verdeckt-text-auf-dem-handy-1.png` (System, Bild 04, 390×844).

## Vorschlag

Auf schmalen Schirmen den Texten der Bildlauf-Bühne rechts so viel Innenabstand geben,
wie der Knopf breit ist (z. B. `.bildlauf-text { right: 84px }` unter 700 px), oder den
Textblock höher setzen (`bottom` größer als Knopfhöhe + Abstand).

## Behebung (wird beim Beheben ausgefüllt)

- **Wer, wann:**
- **Ursache:**
- **Änderung:** Commit …, Cache-Stempel …
- **Geprüft mit:**

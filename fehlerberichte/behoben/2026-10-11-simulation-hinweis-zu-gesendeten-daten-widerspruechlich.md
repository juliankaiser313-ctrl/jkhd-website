# Simulation: zwei Stellen derselben Seite sagen Verschiedenes darüber, was an den Server geht

- **Seite:** https://jkhd.de/simulation.html und https://jkhd.de/en/simulation.html
- **Datum:** 2026-10-11
- **Gemeldet von:** Claude (Vollprüfung der Website)
- **Gerät / Browser / Fenstergröße:** Windows 11, Chrome 155, 1280×720
- **Sprache / Darstellung:** Deutsch und Englisch; hell
- **Status:** behoben
- **Art:** Fehler (Text, Datenschutz-Transparenz)
- **Gewicht:** mittel

## Was passiert

Abschnitt **Bestenliste**:
> „Dafür gehen Spitzname und Spielzeit an unseren Server, mehr nicht (siehe Datenschutzerklärung).“
> EN: „For that, nickname and game time go to our server, nothing more …“

Kasten **am Seitenende** (und die Datenschutzerklärung, Abschnitt „Bestenliste der Simulation“):
> „An unseren Server (api.jkhd.de) gehen nur die Bestenliste beim Öffnen der Seite, beim
> Start eine zufällige Spielmarke und – wenn Sie nach einem Sieg einen Spitznamen
> eintragen – dieser Spitzname mit Spielzeit, Spielnummer und Tempo …“

„Mehr nicht“ stimmt also nicht: es gehen zusätzlich Spielnummer, Tempo und die Spielmarke
mit (die Datenschutzerklärung nennt das korrekt). Für einen Satz, der ausdrücklich „mehr
nicht“ verspricht, ist das heikel.

Kleinigkeit im selben Kasten: „An unseren Server gehen nur **die Bestenliste** beim Öffnen
der Seite“ — die Bestenliste geht nicht an den Server, sie wird von dort **geholt**.

## Was erwartet wird

Beide Stellen nennen dasselbe, z. B. „Dafür gehen Spitzname, Spielzeit, Spielnummer und
Tempo an unseren Server, mehr nicht“; und „Beim Öffnen holt die Seite die Bestenliste von
unserem Server; an ihn gehen nur …“.

## Schritte zum Nachstellen

1. https://jkhd.de/simulation.html öffnen.
2. Den Satz unter „Die schnellsten Siege gegen den JKHD-Algo“ mit dem Kasten ganz unten
   („Ein Spiel. Markt und Kurse sind erfunden …“) vergleichen.

## Belege

Zitate oben aus der ausgelieferten Seite; Abgleich mit `js/spiel.js`
(`bestenAnfrage("bestenliste_eintrag", { marke, name, sekunden, saat, tempo })`).

## Behebung

- **Wer, wann:** Claude, 11.10.2026
- **Ursache:** Der Satz stammte aus der Zeit vor Spielnummer und Tempo; der Kasten verwechselte Holen und Senden.
- **Änderung:** simulation.html und en/simulation.html: der Bestenlisten-Satz nennt Spitzname, Spielzeit, Spielnummer, Tempo und die Spielmarke; der Kasten sagt „Beim Öffnen holt die Seite die Bestenliste …; an ihn gehen nur …“. Die Datenschutzerklärung war schon vollständig und bleibt. Commit b1fda60, Cache-Stempel 20261011n.
- **Geprüft mit:** pruefung_fehler.js, Prüfung „Simulation DE/EN Texte“ (Seitentext nach dem Laden): beide Sätze vorhanden.
